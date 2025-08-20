import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'

// In-memory store for challenges (nonce -> { challenge, expiresAt })
const store = new Map<string, { challenge: string; expiresAt: number; domain: string; audience: string }>()

function genNonce() {
  return Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2)
}

export async function POST(_req: NextRequest) {
  try {
    const now = Date.now()
    const ttlMs = 2 * 60 * 1000 // 2 minutes
    const expiresAt = now + ttlMs

    const domain = typeof process !== 'undefined' && process.env.PUBLIC_DOMAIN
      ? String(process.env.PUBLIC_DOMAIN)
      : 'roadky.local'
    const audience = 'roadky-web'

    const nonce = genNonce()
    const ts = new Date(now).toISOString()
    const challenge = `pubky-roadky:login|domain=${domain}|aud=${audience}|ts=${ts}|nonce=${nonce}`

    // GC old entries
    for (const [k, v] of store.entries()) {
      if (v.expiresAt <= now) store.delete(k)
    }

    store.set(nonce, { challenge, expiresAt, domain, audience })

    // Build Pubky Ring auth URL from env
    const appId = process.env.NEXT_PUBLIC_PUBKY_APP_ID || 'roadky-app'
    const relay = process.env.NEXT_PUBLIC_PUBKY_RING_RELAY_URL || ''
    const callback = process.env.NEXT_PUBLIC_PUBKY_RING_CALLBACK_URL || ''

    // Construct the Pubky Ring deeplink URL (scheme: pubkyring://)
    const serverAuthUrl = `${relay}?app=${encodeURIComponent(appId)}&callback=${encodeURIComponent(callback)}&nonce=${encodeURIComponent(nonce)}`
    const authUrl = `pubkyring://${serverAuthUrl}`

    return NextResponse.json({ challenge, nonce, authUrl, expiresAt: new Date(expiresAt).toISOString() })
  } catch (err) {
    console.error('challenge error', err)
    return NextResponse.json({ error: 'Failed to create challenge' }, { status: 500 })
  }
}

// Export a helper getter so verify route can import the store if needed
export function getChallenge(nonce: string) {
  return store.get(nonce)
}
export function consumeChallenge(nonce: string) {
  const val = store.get(nonce)
  if (val) store.delete(nonce)
  return val
}

