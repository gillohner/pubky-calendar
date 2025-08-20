"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Header from "../../components/Header";
import LoginModal from "../../components/LoginModal";
import { useAuth } from "../../contexts/AuthContext";

export default function HowItWorksPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [showLoginModal, setShowLoginModal] = useState(false);

  const handleLogin = (session) => {
    login(session);
    setShowLoginModal(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      {/* Shared Header */}
      <Header
        onShowLoginModal={() => setShowLoginModal(true)}
        onShowCreateModal={() => {}} // Not used on this page
      />

      <div className="max-w-4xl mx-auto px-4 py-12">
        {/* Page Header */}
        <div className="text-center mb-16">
          <h1 className="text-4xl font-bold text-slate-900 dark:text-white mb-6">
            🔧 How does it work?
          </h1>
          <p className="text-xl text-slate-600 dark:text-slate-300 max-w-2xl mx-auto">
            Discover the decentralized architecture of Pubky Calendar and how your calendar events are managed securely and transparently.
          </p>
        </div>

        {/* Architecture Overview */}
        <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-8 mb-8">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6 flex items-center">
            🏠️ Decentralized Architecture
          </h2>
          <div className="grid md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-purple-600 dark:text-purple-400">
                Frontend (Your Browser)
              </h3>
              <ul className="space-y-2 text-slate-600 dark:text-slate-300">
                <li className="flex items-start">
                  <span className="text-green-500 dark:text-green-400 mr-2">
                    ✓
                  </span>
                  Next.js user interface with Tailwind CSS
                </li>
                <li className="flex items-start">
                  <span className="text-green-500 dark:text-green-400 mr-2">
                    ✓
                  </span>
                  Pubky WASM client for direct interaction with your homeserver
                </li>
                <li className="flex items-start">
                  <span className="text-green-500 dark:text-green-400 mr-2">
                    ✓
                  </span>
                  Pubky Ring authentication (QR code + cryptographic signature)
                </li>
                <li className="flex items-start">
                  <span className="text-green-500 dark:text-green-400 mr-2">
                    ✓
                  </span>
                  Automatic backup of your calendar events to your personal homeserver
                </li>
              </ul>
            </div>
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-blue-600 dark:text-blue-400">
                Backend (Roadky Server)
              </h3>
              <ul className="space-y-2 text-slate-600 dark:text-slate-300">
                <li className="flex items-start">
                  <span className="text-green-400 mr-2">✓</span>
                  Node.js API for aggregation and public display
                </li>
                <li className="flex items-start">
                  <span className="text-green-400 mr-2">✓</span>
                  Local JSON cache for event metadata
                </li>
                <li className="flex items-start">
                  <span className="text-green-400 mr-2">✓</span>
                  Periodic synchronization with homeservers
                </li>
                <li className="flex items-start">
                  <span className="text-green-400 mr-2">✓</span>
                  No storage of sensitive user data
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Authentication Flow */}
        <div className="bg-gray-800 rounded-lg border border-gray-700 p-8 mb-8">
          <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
            🔐 Pubky Ring Authentication
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">📱</span>
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">
                1. Scan QR Code
              </h3>
              <p className="text-gray-300 text-sm">
                Scan the QR code with the Pubky Ring app or copy the challenge manually
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">✍️</span>
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">
                2. Cryptographic Signature
              </h3>
              <p className="text-gray-300 text-sm">
                Your Ed25519 private key securely signs the challenge
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">🔓</span>
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">
                3. Verification & Access
              </h3>
              <p className="text-gray-300 text-sm">
                The signature is verified and you access your secure session
              </p>
            </div>
          </div>
        </div>

        {/* Data Storage */}
        <div className="bg-gray-800 rounded-lg border border-gray-700 p-8 mb-8">
          <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
            💾 Data Storage
          </h2>
          <div className="space-y-6">
            <div className="bg-gray-700 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-purple-400 mb-3">
                🏠 Your Pubky Homeserver
              </h3>
              <p className="text-gray-300 mb-3">
                Every calendar event you create is saved on your personal homeserver at:
              </p>
              <code className="bg-gray-900 text-green-400 px-3 py-1 rounded text-sm">
                /pub/ics/events/[event-uid].ics
              </code>
              <ul className="mt-3 space-y-1 text-gray-300 text-sm">
                <li>• You retain full control of your data</li>
                <li>• You can modify or delete your events at any time</li>
                <li>• Direct access via the <code className="text-purple-400">pubky://</code> protocol</li>
              </ul>
            </div>

            <div className="bg-gray-700 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-blue-400 mb-3">
                🌐 Roadky Local Cache
              </h3>
              <p className="text-gray-300 mb-3">
                The Roadky server maintains a local cache for public display containing:
              </p>
              <ul className="space-y-1 text-gray-300 text-sm">
                <li>• Event metadata (summary, start/end time, UID)</li>
                <li>• References to the original homeservers</li>
                <li>• Synchronization timestamps</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Event Lifecycle */}
        <div className="bg-gray-800 rounded-lg border border-gray-700 p-8 mb-8">
          <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
            🔄 Calendar Event Lifecycle
          </h2>
          <div className="space-y-4">
            <div className="flex items-start space-x-4">
              <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                <span className="text-white text-sm font-bold">1</span>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white">Creation</h3>
                <p className="text-gray-300">
                  You create a calendar event via the interface. It is automatically saved to your Pubky homeserver <b>and</b> added to the local cache for public display.
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-4">
              <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                <span className="text-white text-sm font-bold">2</span>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white">
                  Synchronization
                </h3>
                <p className="text-gray-300">
                  If you modify an event on your homeserver, it will be automatically synchronized during the next update.
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-4">
              <div className="w-8 h-8 bg-orange-600 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                <span className="text-white text-sm font-bold">3</span>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white">
                  Manage via Admin Area
                </h3>
                <p className="text-gray-300">
                  Access your personal admin area to see all your created events and manage them easily.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Technical Details */}
        <div className="bg-gray-800 rounded-lg border border-gray-700 p-8 mb-8">
          <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
            ⚙️ Technical Details
          </h2>
          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <h3 className="text-lg font-semibold text-purple-400 mb-3">
                Technologies Used
              </h3>
              <ul className="space-y-2 text-gray-300">
                <li>
                  <strong>Frontend:</strong> Next.js 14, React, Tailwind CSS
                </li>
                <li>
                  <strong>Backend:</strong> Node.js, Next.js API Routes
                </li>
                <li>
                  <strong>Pubky:</strong> WASM Client, Homeserver Protocol
                </li>
                <li>
                  <strong>Crypto:</strong> Ed25519, SHA-256, BIP39
                </li>
                <li>
                  <strong>Storage:</strong> Local JSON + Pubky Homeserver (.ics)
                </li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-blue-400 mb-3">
                Security & Privacy
              </h3>
              <ul className="space-y-2 text-gray-300">
                <li>• Strong cryptographic authentication</li>
                <li>• No passwords, only keys</li>
                <li>• Your data stays on your homeserver</li>
                <li>• Open source and auditable code</li>
                <li>• Decentralized Pubky protocol</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Call to Action */}
        <div className="text-center bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg p-8">
          <h2 className="text-2xl font-bold text-white mb-4">
            🚀 Ready to join the Pubky ecosystem?
          </h2>
          <p className="text-purple-100 mb-6">
            Log in with Pubky Ring and start managing your calendar events in a decentralized way!
          </p>
          <button
            onClick={() => router.push("/")}
            className="px-8 py-3 bg-white text-purple-600 font-semibold rounded-lg hover:bg-gray-100 transition-colors"
          >
            🏠 Back to Home
          </button>
        </div>
      </div>
    </div>
  );
}
