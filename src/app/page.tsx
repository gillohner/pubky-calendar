"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { TrendingUpIcon } from "lucide-react";
import Header from "../components/Header";
import LoginModal from "../components/LoginModal";
import CreateEventModal from "../components/CreateEventModal";
import EventList from "../components/EventList";
import { useAuth } from "../contexts/AuthContext";

// Mock data removed - will be replaced with real data from backend

export default function Home() {
  const { user, login, logout } = useAuth();
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showEventModal, setShowEventModal] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const router = useRouter();

  const handleLogin = (session: any) => {
    login(session);
    setShowLoginModal(false);
  };

  const handleFeatureCreated = (feature: any) => {
    // Déclencher le rafraîchissement de la liste
    setRefreshTrigger((prev) => prev + 1);
  };

  const handleEventCreated = (_event: any) => {
    setRefreshTrigger((prev) => prev + 1);
  };

  const handleLogout = () => {
    logout();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      {/* Header partagé */}
      <Header
        onShowLoginModal={() => setShowLoginModal(true)}
        onShowCreateModal={() => setShowCreateModal(true)}
      />

      {/* Hero Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <h2 className="text-4xl sm:text-5xl font-bold text-slate-900 dark:text-white mb-6">
            Pubky iCalendar
            <span className="bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
              {" "}
              Proof of Concept
            </span>
          </h2>
          <p className="text-xl text-slate-600 dark:text-slate-300 mb-8 max-w-3xl mx-auto">
            Simple proof of concept based on Pubky Calendar to showcase
            iCalendar.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => router.push("/how-it-works")}
              className="border border-purple-300 dark:border-purple-600 text-purple-700 dark:text-purple-300 hover:bg-purple-50 dark:hover:bg-purple-900/20 px-8 py-3 rounded-lg font-semibold transition-colors"
            >
              How it works?
            </button>
          </div>
        </div>
      </section>

      {/* Section Events */}
      <section className="py-16 bg-slate-100 dark:bg-slate-800">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex justify-between items-center mb-12">
            <h2 className="text-3xl font-bold text-slate-900 dark:text-white">
              My Calendar Events
            </h2>
            {user && (
              <button
                onClick={() => setShowEventModal(true)}
                className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white px-8 py-3 rounded-lg font-semibold transition-all duration-200 flex items-center justify-center gap-2 shadow-lg"
              >
                ➕ New Event
              </button>
            )}
          </div>
          <EventList refreshTrigger={refreshTrigger} />
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-slate-900 dark:bg-slate-950">
        <div className="max-w-4xl mx-auto text-center">
          <h3 className="text-3xl font-bold text-white mb-4">
            Join the Pubky Ecosystem
          </h3>
          <p className="text-xl text-slate-300 mb-8">
            Participate in the decentralized web revolution. Contribute to Pubky
            development and shape the future of the internet.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            {user ? (
              <button
                onClick={() => router.push("/admin")}
                className="bg-white text-slate-900 hover:bg-slate-100 px-8 py-3 rounded-lg font-semibold transition-colors"
              >
                My Events
              </button>
            ) : (
              <button
                onClick={() => setShowLoginModal(true)}
                className="bg-white text-slate-900 hover:bg-slate-100 px-8 py-3 rounded-lg font-semibold transition-colors"
              >
                Connect with Pubky Ring
              </button>
            )}
            <button
              onClick={() => router.push("/how-it-works")}
              className="border border-slate-600 text-white hover:bg-slate-800 px-8 py-3 rounded-lg font-semibold transition-colors"
            >
              🔧 How it works
            </button>
          </div>

          {/* Get Pubky Token Button */}
          <div className="flex justify-center mt-6">
            <a
              href="https://t.me/pubkycore"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-8 py-3 rounded-lg font-semibold transition-all duration-200 flex items-center gap-3 shadow-lg hover:shadow-xl"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
              </svg>
              Get a Pubky Token
            </a>
          </div>

          {/* External Links */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mt-8">
            <a
              href="https://pubky.org"
              target="_blank"
              rel="noopener noreferrer"
              className="text-slate-300 hover:text-white underline transition-colors"
            >
              🌐 Visit Pubky.org
            </a>
            <a
              href="https://pubky.app"
              target="_blank"
              rel="noopener noreferrer"
              className="text-slate-300 hover:text-white underline transition-colors"
            >
              📱 Try Pubky.app
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-700 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center space-x-3 mb-4 md:mb-0">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                <TrendingUpIcon className="w-5 h-5 text-white" />
              </div>
              <span className="text-lg font-semibold text-slate-900 dark:text-white">
                Pubky Calendar
              </span>
            </div>
            <div className="flex items-center space-x-6 text-sm text-slate-600 dark:text-slate-400">
              <a
                href="#"
                className="hover:text-slate-900 dark:hover:text-white transition-colors"
              >
                About
              </a>
              <a
                href="#"
                className="hover:text-slate-900 dark:hover:text-white transition-colors"
              >
                Contact
              </a>
              <a
                href="#"
                className="hover:text-slate-900 dark:hover:text-white transition-colors"
              >
                Privacy Policy
              </a>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-slate-200 dark:border-slate-700 text-center text-sm text-slate-500 dark:text-slate-400">
            2024 Pubky Calendar. Built with ❤️ for the Pubky community.
          </div>
        </div>
      </footer>

      {/* Modal de connexion */}
      {showLoginModal && (
        <LoginModal
          isOpen={showLoginModal}
          onClose={() => setShowLoginModal(false)}
          onLogin={handleLogin}
        />
      )}

      {/* Modal de création d'événement */}
      {showEventModal && (
        <CreateEventModal
          isOpen={showEventModal}
          onClose={() => setShowEventModal(false)}
          onEventCreated={handleEventCreated}
        />
      )}
    </div>
  );
}
