'use client'

import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { UserIcon, KeyIcon, ShieldIcon, CopyIcon } from 'lucide-react'
import { useState } from 'react'
import Header from '../../components/Header'
import LoginModal from '../../components/LoginModal'

export default function ProfilePage() {
  const { isAuthenticated, pubkey, user } = useAuth()
  const router = useRouter()
  const [copied, setCopied] = useState(false)
  const [showLoginModal, setShowLoginModal] = useState(false)
  const [profileData, setProfileData] = useState<any>(null)
  const [profileLoading, setProfileLoading] = useState(false)
  const [profileError, setProfileError] = useState<string | null>(null)
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [imageLoading, setImageLoading] = useState(false)

  // Fetch image from Pubky using correct Nexus avatar endpoint
  const fetchPubkyImage = async (pubkyUrl: string) => {
    try {
      setImageLoading(true)
      console.log('🖼️ Loading Pubky avatar:', pubkyUrl)
      
      // Extract user pubkey from pubky:// URL
      const path = pubkyUrl.replace('pubky://', '')
      const [userPubkey] = path.split('/')
      
      // Use the correct Nexus avatar endpoint
      const avatarUrl = `https://nexus.pubky.app/static/avatar/${userPubkey}`
      console.log('📡 Trying Nexus avatar endpoint:', avatarUrl)
      
      // Test if the avatar loads
      const response = await fetch(avatarUrl)
      
      if (response.ok) {
        setImageUrl(avatarUrl)
        console.log('✅ Avatar loaded successfully via Nexus')
      } else {
        console.log('⚠️ Nexus avatar failed:', response.status)
        // Fallback: try original image URL as direct link
        setImageUrl(pubkyUrl.startsWith('http') ? pubkyUrl : null)
      }
      
    } catch (error) {
      console.error('❌ Failed to load Pubky avatar:', error)
      // No image will be displayed, fallback to UserIcon
      setImageUrl(null)
    } finally {
      setImageLoading(false)
    }
  }

  // Fetch profile data from Nexus API
  const fetchProfileData = async () => {
    const userPubkey = user?.pubkey || pubkey
    if (!userPubkey) {
      console.log('No pubkey available for profile fetch')
      return
    }
    
    console.log('Fetching profile for pubkey:', userPubkey)
    setProfileLoading(true)
    setProfileError(null)
    
    try {
      const response = await fetch(`https://nexus.pubky.app/v0/user/${userPubkey}`)
      
      if (!response.ok) {
        throw new Error(`Profile not found (${response.status})`)
      }
      
      const data = await response.json()
      console.log('Profile data received:', data)
      setProfileData(data)
      
      // If there's a Pubky image, fetch it
      if (data.details?.image && data.details.image.startsWith('pubky://')) {
        await fetchPubkyImage(data.details.image)
      }
    } catch (error) {
      console.error('Error fetching profile:', error)
      setProfileError(error instanceof Error ? error.message : 'Unknown error occurred')
    } finally {
      setProfileLoading(false)
    }
  }

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/')
    } else if (user?.pubkey || pubkey) {
      fetchProfileData()
    }
  }, [isAuthenticated, router, pubkey, user])

  const copyToClipboard = async () => {
    if (pubkey) {
      try {
        await navigator.clipboard.writeText(pubkey)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
      } catch (err) {
        console.error('Failed to copy:', err)
      }
    }
  }

  if (!isAuthenticated || !pubkey) {
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      {/* Header Global */}
      <Header 
        onShowLoginModal={() => setShowLoginModal(true)} 
        onShowCreateModal={() => {}} 
      />

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
          {/* Profile Header */}
          <div className="bg-gradient-to-r from-purple-600 to-blue-600 px-8 py-12">
            <div className="flex items-center gap-6">
              <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm overflow-hidden">
                {imageLoading ? (
                  <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (imageUrl || (profileData?.details?.image && !profileData.details.image.startsWith('pubky://'))) ? (
                  <img 
                    src={imageUrl || profileData.details.image} 
                    alt="Profile" 
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      // Hide the image and show the UserIcon fallback
                      e.currentTarget.style.display = 'none'
                      const parent = e.currentTarget.parentElement
                      if (parent) {
                        const fallbackIcon = parent.querySelector('.fallback-icon') as HTMLElement
                        if (fallbackIcon) {
                          fallbackIcon.style.display = 'block'
                        }
                      }
                    }}
                  />
                ) : null}
                <UserIcon 
                  className={`w-10 h-10 text-white fallback-icon ${
                    (imageUrl || (profileData?.details?.image && !profileData.details.image.startsWith('pubky://'))) && !imageLoading ? 'hidden' : 'block'
                  }`} 
                />
              </div>
              <div className="flex-1">
                <h2 className="text-3xl font-bold text-white mb-2">
                  {profileData?.details?.name || profileData?.name || profileData?.username || 'Pubky User'}
                </h2>
                <p className="text-purple-100 text-lg mb-2">
                  {profileData?.details?.bio || profileData?.bio || 'Connected via Pubky Ring'}
                </p>
                {profileData?.details?.status && (
                  <p className="text-purple-200 text-sm flex items-center gap-1">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {profileData.details.status}
                  </p>
                )}
                {profileData?.location && (
                  <p className="text-purple-200 text-sm flex items-center gap-1">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    {profileData.location}
                  </p>
                )}
                {profileLoading && (
                  <p className="text-purple-200 text-sm mt-1">Loading profile...</p>
                )}
                {profileError && (
                  <p className="text-red-200 text-sm mt-1">Profile not found on Nexus</p>
                )}
              </div>
            </div>
          </div>

          {/* Profile Details */}
          <div className="p-8">
            <div className="space-y-8">
              {/* Public Key Section */}
              <div className="border border-slate-200 dark:border-slate-700 rounded-lg p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center">
                    <KeyIcon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Public Key</h3>
                    <p className="text-sm text-slate-600 dark:text-slate-400">Your unique identifier in the Pubky ecosystem</p>
                  </div>
                </div>
                
                <div className="bg-slate-50 dark:bg-slate-900 rounded-lg p-4 border border-slate-200 dark:border-slate-700">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-mono text-slate-900 dark:text-white break-all">
                        {pubkey}
                      </p>
                    </div>
                    <button
                      onClick={copyToClipboard}
                      className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg text-sm font-medium transition-colors flex-shrink-0"
                    >
                      <CopyIcon className="w-4 h-4" />
                      {copied ? 'Copied!' : 'Copy'}
                    </button>
                  </div>
                </div>
              </div>

              {/* Profile Information */}
              {profileData && (
                <div className="border border-slate-200 dark:border-slate-700 rounded-lg p-6">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/20 rounded-lg flex items-center justify-center">
                      <UserIcon className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Profile Information</h3>
                      <p className="text-sm text-slate-600 dark:text-slate-400">Data from your Pubky Nexus profile</p>
                    </div>
                  </div>
                  

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {profileData.details?.name && (
                      <div className="bg-slate-50 dark:bg-slate-900 rounded-lg p-4 border border-slate-200 dark:border-slate-700">
                        <h4 className="font-medium text-slate-900 dark:text-white mb-1">Name</h4>
                        <p className="text-sm text-slate-600 dark:text-slate-400">{profileData.details.name}</p>
                      </div>
                    )}
                    {profileData.details?.id && (
                      <div className="bg-slate-50 dark:bg-slate-900 rounded-lg p-4 border border-slate-200 dark:border-slate-700">
                        <h4 className="font-medium text-slate-900 dark:text-white mb-1">User ID</h4>
                        <p className="text-sm text-slate-600 dark:text-slate-400 font-mono break-all">{profileData.details.id}</p>
                      </div>
                    )}
                    {profileData.details?.status && (
                      <div className="bg-slate-50 dark:bg-slate-900 rounded-lg p-4 border border-slate-200 dark:border-slate-700">
                        <h4 className="font-medium text-slate-900 dark:text-white mb-1">Status</h4>
                        <p className="text-sm text-slate-600 dark:text-slate-400">{profileData.details.status}</p>
                      </div>
                    )}
                    {profileData.details?.links && profileData.details.links.length > 0 && (
                      <div className="bg-slate-50 dark:bg-slate-900 rounded-lg p-4 border border-slate-200 dark:border-slate-700">
                        <h4 className="font-medium text-slate-900 dark:text-white mb-2">Links</h4>
                        <div className="space-y-1">
                          {profileData.details.links.map((link: any, index: number) => (
                            <a key={index} href={link.url} target="_blank" rel="noopener noreferrer" className="block text-sm text-blue-600 dark:text-blue-400 hover:underline">
                              {link.title || link.url}
                            </a>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {profileData.details?.bio && (
                    <div className="mt-4 bg-slate-50 dark:bg-slate-900 rounded-lg p-4 border border-slate-200 dark:border-slate-700">
                      <h4 className="font-medium text-slate-900 dark:text-white mb-2">Biography</h4>
                      <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed whitespace-pre-line">{profileData.details.bio}</p>
                    </div>
                  )}
                  
                  {/* Show stats if available */}
                  {profileData.counts && (
                    <div className="mt-4 bg-slate-50 dark:bg-slate-900 rounded-lg p-4 border border-slate-200 dark:border-slate-700">
                      <h4 className="font-medium text-slate-900 dark:text-white mb-3">Activity Stats</h4>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="text-center">
                          <div className="text-lg font-bold text-slate-900 dark:text-white">{profileData.counts.posts}</div>
                          <div className="text-xs text-slate-600 dark:text-slate-400">Posts</div>
                        </div>
                        <div className="text-center">
                          <div className="text-lg font-bold text-slate-900 dark:text-white">{profileData.counts.followers}</div>
                          <div className="text-xs text-slate-600 dark:text-slate-400">Followers</div>
                        </div>
                        <div className="text-center">
                          <div className="text-lg font-bold text-slate-900 dark:text-white">{profileData.counts.following}</div>
                          <div className="text-xs text-slate-600 dark:text-slate-400">Following</div>
                        </div>
                        <div className="text-center">
                          <div className="text-lg font-bold text-slate-900 dark:text-white">{profileData.counts.friends}</div>
                          <div className="text-xs text-slate-600 dark:text-slate-400">Friends</div>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {/* Show tags if available */}
                  {profileData.tags && profileData.tags.length > 0 && (
                    <div className="mt-4 bg-slate-50 dark:bg-slate-900 rounded-lg p-4 border border-slate-200 dark:border-slate-700">
                      <h4 className="font-medium text-slate-900 dark:text-white mb-3">Community Tags</h4>
                      <div className="flex flex-wrap gap-2">
                        {profileData.tags.slice(0, 10).map((tag: any, index: number) => (
                          <span key={index} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-300">
                            {tag.label}
                            <span className="ml-1 text-purple-600 dark:text-purple-400">({tag.taggers_count})</span>
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Nexus Profile Link */}
              <div className="border border-slate-200 dark:border-slate-700 rounded-lg p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/20 rounded-lg flex items-center justify-center">
                    <svg className="w-5 h-5 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.1m0 0l4-4a4 4 0 105.656-5.656l-1.1 1.102m-2.828 2.828l4 4" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Nexus API</h3>
                    <p className="text-sm text-slate-600 dark:text-slate-400">Raw JSON data from Pubky Nexus</p>
                  </div>
                </div>
                
                <div className="bg-slate-50 dark:bg-slate-900 rounded-lg p-4 border border-slate-200 dark:border-slate-700">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-mono text-slate-900 dark:text-white break-all">
                        https://nexus.pubky.app/v0/user/{user?.pubkey || pubkey}
                      </p>
                    </div>
                    <a
                      href={`https://nexus.pubky.app/v0/user/${user?.pubkey || pubkey}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-3 py-2 rounded-lg text-sm font-medium transition-colors flex-shrink-0"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                      View JSON
                    </a>
                  </div>
                </div>
              </div>

              {/* Security Info */}
              <div className="border border-slate-200 dark:border-slate-700 rounded-lg p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-green-100 dark:bg-green-900/20 rounded-lg flex items-center justify-center">
                    <ShieldIcon className="w-5 h-5 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Security</h3>
                    <p className="text-sm text-slate-600 dark:text-slate-400">Information about your authentication</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-slate-50 dark:bg-slate-900 rounded-lg p-4 border border-slate-200 dark:border-slate-700">
                    <h4 className="font-medium text-slate-900 dark:text-white mb-1">Authentication Method</h4>
                    <p className="text-sm text-slate-600 dark:text-slate-400">Pubky Ring (Ed25519)</p>
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-900 rounded-lg p-4 border border-slate-200 dark:border-slate-700">
                    <h4 className="font-medium text-slate-900 dark:text-white mb-1">Status</h4>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <p className="text-sm text-green-600 dark:text-green-400">Connected</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-col sm:flex-row gap-4">
                <button
                  onClick={() => router.push('/admin')}
                  className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white px-6 py-3 rounded-lg font-medium transition-all duration-200 shadow-lg"
                >
                  Access My Features
                </button>
                <button
                  onClick={() => router.push('/')}
                  className="border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 px-6 py-3 rounded-lg font-medium transition-colors"
                >
                  Back to Home
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
      
      {/* Login Modal */}
      {showLoginModal && (
        <LoginModal 
          isOpen={showLoginModal} 
          onClose={() => setShowLoginModal(false)}
          onLogin={() => setShowLoginModal(false)}
        />
      )}
    </div>
  )
}
