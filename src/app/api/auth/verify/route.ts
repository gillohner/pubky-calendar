import { NextRequest, NextResponse } from 'next/server'
import * as ed25519 from '@noble/ed25519'
import { consumeChallenge } from '../challenge/route'

export const runtime = 'nodejs'

function extractNonce(challenge: string): string | null {
  // challenge format: ...|nonce=XYZ
  const parts = challenge.split('|')
  for (const p of parts) {
    const [k, v] = p.split('=')
    if (k === 'nonce' && v) return v
  }
  return null
}

// z-base-32 alphabet used by Pubky ("z32")
const Z32_ALPHABET = 'ybndrfg8ejkmcpqxot1uwisza345h769'
const Z32_MAP: Record<string, number> = Object.fromEntries(
  Array.from(Z32_ALPHABET).map((ch, i) => [ch, i])
)

function decodeZ32(input: string): Uint8Array {
  if (!input || typeof input !== 'string') throw new Error('Invalid z32 input')
  const clean = input.trim().toLowerCase().replace(/[^a-z0-9]/g, '')
  let bits = 0
  let value = 0
  const out: number[] = []
  for (const ch of clean) {
    const v = Z32_MAP[ch]
    if (v === undefined) throw new Error('Invalid z32 character')
    value = (value << 5) | v
    bits += 5
    if (bits >= 8) {
      bits -= 8
      out.push((value >>> bits) & 0xff)
    }
  }
  return new Uint8Array(out)
}

function ensureLen(name: string, bytes: Uint8Array, expected: number) {
  if (bytes.length !== expected) {
    throw new Error(`${name} length invalid: got ${bytes.length}, expected ${expected}`)
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const challenge: string = body.challenge
    const pubkeyStr: string = body.publicKey || body.pubkey
    const signatureStr: string = body.signature

    if (!challenge || !pubkeyStr || !signatureStr) {
      return NextResponse.json(
        { error: 'Missing required fields: challenge, pubkey(publicKey), signature' },
        { status: 400 }
      )
    }

    const nonce = extractNonce(challenge)
    if (!nonce) {
      return NextResponse.json({ error: 'Invalid challenge: missing nonce' }, { status: 400 })
    }

    const stored = consumeChallenge(nonce)
    if (!stored) {
      return NextResponse.json({ error: 'Challenge not found or already used' }, { status: 400 })
    }

    const now = Date.now()
    if (stored.expiresAt < now) {
      return NextResponse.json({ error: 'Challenge expired' }, { status: 400 })
    }

    if (stored.challenge !== challenge) {
      return NextResponse.json({ error: 'Challenge mismatch' }, { status: 400 })
    }

    const publicKeyBytes = decodeZ32(pubkeyStr)
    const signatureBytes = decodeZ32(signatureStr)
    ensureLen('pubkey', publicKeyBytes, 32)
    ensureLen('signature', signatureBytes, 64)
    const challengeBytes = new TextEncoder().encode(challenge)

    const isValid = await ed25519.verify(signatureBytes, challengeBytes, publicKeyBytes)

    if (!isValid) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
    }

    // TODO: Set secure HttpOnly session cookie here

    return NextResponse.json({ success: true, pubkey: body.publicKey || body.pubkey, message: 'Authentication successful' })
  } catch (error) {
    console.error('Signature verification error:', error)
    return NextResponse.json({ error: 'Internal server error during signature verification' }, { status: 500 })
  }
}

// Optional GET support for relay callbacks that use query params
export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url)
    const challenge = url.searchParams.get('challenge') || ''
    const pubkeyStr = url.searchParams.get('pubkey') || url.searchParams.get('publicKey') || ''
    const signatureStr = url.searchParams.get('signature') || ''

    if (!challenge || !pubkeyStr || !signatureStr) {
      return NextResponse.json(
        { error: 'Missing required query params: challenge, pubkey(publicKey), signature' },
        { status: 400 }
      )
    }

    const nonce = extractNonce(challenge)
    if (!nonce) return NextResponse.json({ error: 'Invalid challenge: missing nonce' }, { status: 400 })

    const stored = consumeChallenge(nonce)
    if (!stored) return NextResponse.json({ error: 'Challenge not found or already used' }, { status: 400 })

    const now = Date.now()
    if (stored.expiresAt < now) return NextResponse.json({ error: 'Challenge expired' }, { status: 400 })
    if (stored.challenge !== challenge) return NextResponse.json({ error: 'Challenge mismatch' }, { status: 400 })

    const publicKeyBytes = decodeZ32(pubkeyStr)
    const signatureBytes = decodeZ32(signatureStr)
    ensureLen('pubkey', publicKeyBytes, 32)
    ensureLen('signature', signatureBytes, 64)
    const challengeBytes = new TextEncoder().encode(challenge)

    const isValid = await ed25519.verify(signatureBytes, challengeBytes, publicKeyBytes)
    if (!isValid) return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })

    // TODO: Set secure HttpOnly session cookie here
    return NextResponse.json({ success: true, pubkey: pubkeyStr, message: 'Authentication successful' })
  } catch (error) {
    console.error('Signature verification GET error:', error)
    return NextResponse.json({ error: 'Internal server error during signature verification' }, { status: 500 })
  }
}
