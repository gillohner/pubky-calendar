"use client";

import { useRouter } from "next/navigation";
import { TrendingUpIcon, LogOut, User } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { useState, useEffect } from "react";

export default function Header({ onShowLoginModal, onShowCreateModal } = {}) {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [avatarUrl, setAvatarUrl] = useState(null);
  const [avatarLoading, setAvatarLoading] = useState(false);

  const handleLogout = () => {
    logout();
  };

  // Fetch user avatar when user is authenticated
  useEffect(() => {
    const fetchUserAvatar = async () => {
      if (!user?.pubkey) {
        setAvatarUrl(null);
        return;
      }

      try {
        setAvatarLoading(true);

        // Use the Nexus avatar endpoint
        const avatarEndpoint = `https://nexus.pubky.app/static/avatar/${user.pubkey}`;
        console.log("🖼️ Loading header avatar:", avatarEndpoint);

        const response = await fetch(avatarEndpoint);

        if (response.ok) {
          setAvatarUrl(avatarEndpoint);
          console.log("✅ Header avatar loaded successfully");
        } else {
          console.log("⚠️ Header avatar failed:", response.status);
          setAvatarUrl(null);
        }
      } catch (error) {
        console.error("❌ Error loading header avatar:", error);
        setAvatarUrl(null);
      } finally {
        setAvatarLoading(false);
      }
    };

    fetchUserAvatar();
  }, [user?.pubkey]);

  return (
    <header className="border-b border-slate-200 dark:border-slate-700 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-4">
          <div
            className="flex items-center space-x-3 cursor-pointer"
            onClick={() => router.push("/")}
          >
            <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
              <TrendingUpIcon className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
                Pubky Calendar
              </h1>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Vote for the future of Pubky ecosystem
              </p>
            </div>
          </div>

          {/* Navigation Links */}
          <div className="hidden md:flex items-center space-x-8">
            <button
              onClick={() => router.push("/how-it-works")}
              className="text-slate-700 dark:text-slate-300 hover:text-purple-600 dark:hover:text-purple-400 font-medium transition-all duration-200 hover:scale-105"
            >
              HOW IT WORKS
            </button>
          </div>

          {/* User Actions */}
          {user ? (
            <div className="flex items-center gap-3">
              <button
                onClick={() => router.push("/profile")}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-4 py-2 rounded-lg font-medium transition-all duration-200 shadow-lg flex items-center gap-2"
              >
                <User className="w-4 h-4" />
                My Profile
              </button>
              <button
                onClick={() => router.push("/admin")}
                className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white px-4 py-2 rounded-lg font-medium transition-all duration-200 shadow-lg"
              >
                My Events
              </button>
              <button
                onClick={handleLogout}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium transition-all duration-200 shadow-lg flex items-center gap-2"
              >
                <LogOut className="w-4 h-4" />
                Logout
              </button>

              {/* User Avatar */}
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm overflow-hidden border-2 border-white/30">
                {avatarLoading ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt="User Avatar"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      // Hide the image and show the UserIcon fallback
                      e.currentTarget.style.display = "none";
                      const parent = e.currentTarget.parentElement;
                      if (parent) {
                        const fallbackIcon =
                          parent.querySelector(".fallback-icon");
                        if (fallbackIcon) {
                          fallbackIcon.style.display = "block";
                        }
                      }
                    }}
                  />
                ) : null}
                <User
                  className={`w-5 h-5 text-white fallback-icon ${
                    avatarUrl && !avatarLoading ? "hidden" : "block"
                  }`}
                />
              </div>
            </div>
          ) : (
            <button
              onClick={onShowLoginModal}
              className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:from-purple-700 hover:to-blue-700 transition-all shadow-lg hover:shadow-xl"
            >
              🔐 Connect with Pubky Ring
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
