"use client";

import { useState, useEffect } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { useRouter } from "next/navigation";
import Header from "../../components/Header";
import LoginModal from "../../components/LoginModal";
import CreateEventModal from "../../components/CreateEventModal";

export default function AdminPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showEventModal, setShowEventModal] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  useEffect(() => {
    if (!user?.pubkey) {
      router.push("/");
      return;
    }
    loadMyEvents();
  }, [user, refreshTrigger]);

  const loadMyEvents = async () => {
    if (!user?.pubkey) return;
    try {
      setLoading(true);
      const res = await fetch("/api/events");
      const json = await res.json();
      if (json.success) {
        const my = (json.events || []).filter(
          (e) => e.author_pubkey === user.pubkey
        );
        my.sort((a, b) => new Date(a.DTSTART) - new Date(b.DTSTART));
        setEvents(my);
        setError(null);
      } else {
        setError(json.error || "Failed to load");
      }
    } catch (e) {
      console.error("Error loading my events:", e);
      setError(e.message || "Failed to load");
    } finally {
      setLoading(false);
    }
  };

  if (!user?.pubkey) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <Header onShowLoginModal={() => setShowLoginModal(true)} />

      {showLoginModal && (
        <LoginModal
          isOpen={showLoginModal}
          onClose={() => setShowLoginModal(false)}
        />
      )}

      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-slate-900 dark:text-white mb-2">
            My Events
          </h1>
          <p className="text-xl text-slate-600 dark:text-slate-300 mb-8">
            Manage your calendar events
          </p>
          <button
            onClick={() => setShowEventModal(true)}
            className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:from-purple-700 hover:to-blue-700 transition-all shadow-lg hover:shadow-xl"
          >
            ➕ New Event
          </button>
        </div>
      </section>

      <section className="py-8 bg-slate-100 dark:bg-slate-800">
        <div className="max-w-6xl mx-auto px-4">
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
              <span className="ml-2 text-slate-600 dark:text-slate-300">
                Loading your events...
              </span>
            </div>
          ) : error ? (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6 text-center">
              <p className="text-red-600 dark:text-red-400 mb-4">❌ {error}</p>
              <button
                onClick={loadMyEvents}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
              >
                Retry
              </button>
            </div>
          ) : events.length === 0 ? (
            <div className="text-center py-12 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700">
              <p className="text-slate-600 dark:text-slate-300 text-lg">
                No events found
              </p>
              <p className="text-slate-500 dark:text-slate-400 text-sm mt-2 mb-4">
                You haven't created any events yet.
              </p>
            </div>
          ) : (
            <div className="grid gap-6">
              {events.map((ev) => (
                <div
                  key={ev.UID}
                  className="bg-white dark:bg-slate-900 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700"
                >
                  <div className="p-6">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="text-xl font-semibold text-slate-900 dark:text-white">
                        {ev.SUMMARY}
                      </h3>
                      <code className="text-xs bg-slate-200 dark:bg-slate-800 px-2 py-1 rounded">
                        {ev.UID}
                      </code>
                    </div>
                    <div className="text-sm text-slate-600 dark:text-slate-300">
                      {new Date(ev.DTSTART).toLocaleString()} —{" "}
                      {new Date(ev.DTEND).toLocaleString()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {showEventModal && (
        <CreateEventModal
          isOpen={showEventModal}
          onClose={() => setShowEventModal(false)}
          onEventCreated={() => setRefreshTrigger((v) => v + 1)}
        />
      )}
    </div>
  );
}
