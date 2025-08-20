"use client";

import { useEffect, useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { PubkyService } from "../services/pubkyService";

function formatDateTime(iso) {
  try {
    if (!iso) return "";
    return new Date(iso).toLocaleString();
  } catch {
    return iso || "";
  }
}

export default function EventList({ refreshTrigger }) {
  const { user } = useAuth();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadEvents = async () => {
    try {
      setLoading(true);
      setError(null);

      // Always load all events from local cache
      let mine = [];
      try {
        const res = await fetch("/api/events");
        const json = await res.json();
        if (json.success) {
          mine = json.events || [];
        }
      } catch (e) {
        console.warn("Local cache fetch failed:", e);
      }

      // If local empty and user is logged in, backfill from their homeserver
      if (!mine.length && user?.pubkey) {
        const remote = await PubkyService.listUserEvents(user.pubkey);
        if (remote.success) {
          const remoteEvents = remote.events || [];
          mine = remoteEvents;
          try {
            await Promise.all(
              remoteEvents
                .filter((ev) => ev && ev.UID)
                .map((ev) =>
                  fetch("/api/events", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      userPubkey: user.pubkey,
                      SUMMARY: ev.SUMMARY,
                      DTSTART: ev.DTSTART,
                      DTEND: ev.DTEND,
                      UID: ev.UID,
                      DTSTAMP:
                        ev.DTSTAMP ||
                        ev.created_at ||
                        ev.updated_at ||
                        new Date().toISOString(),
                    }),
                  }).catch(() => null)
                )
            );
          } catch (bfErr) {
            console.warn("Backfill to local cache partially failed:", bfErr);
          }
        } else {
          console.warn("Remote list error:", remote.error);
        }
      }

      const byUid = new Map();
      for (const ev of mine) {
        if (ev && ev.UID) byUid.set(ev.UID, ev);
      }
      const merged = Array.from(byUid.values());

      const sorted = merged.sort((a, b) => {
        const tA = new Date(a.DTSTART || 0).getTime();
        const tB = new Date(b.DTSTART || 0).getTime();
        return tA - tB;
      });
      setEvents(sorted);
    } catch (e) {
      console.error("Error loading events:", e);
      setError(e.message || "Failed to load events");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEvents();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.pubkey, refreshTrigger]);

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
        <span className="ml-2 text-gray-600">Loading your events...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-md p-4">
        <p className="text-red-800">❌ {error}</p>
        <button
          onClick={loadEvents}
          className="mt-2 text-red-600 hover:text-red-800 underline"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Toolbar */}
      <div className="bg-gray-900 p-4 rounded-lg shadow-lg border border-gray-700">
        <div className="flex flex-wrap gap-4 items-center">
          <div className="ml-auto">
            <button
              onClick={loadEvents}
              className="px-3 py-1 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white rounded-md text-sm transition-all"
            >
              🔄 Refresh
            </button>
          </div>
        </div>
      </div>

      {/* List */}
      {events.length === 0 ? (
        <div className="text-center py-12 bg-gray-900 rounded-lg border border-gray-700">
          <p className="text-gray-300 text-lg">No events found</p>
          <p className="text-gray-400 text-sm mt-2">
            Create your first event to see it here
          </p>
        </div>
      ) : (
        <div className="grid gap-6">
          {events.map((ev) => (
            <div
              key={ev.UID}
              className="bg-gray-900 rounded-lg shadow-lg border border-gray-700 hover:shadow-xl hover:border-purple-500/50 transition-all"
            >
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold text-white mb-1">
                      {ev.SUMMARY || "Untitled event"}
                    </h3>
                    <div className="text-sm text-gray-400">
                      <span className="mr-2">From:</span>
                      <span className="text-gray-300">
                        {formatDateTime(ev.DTSTART)}
                      </span>
                      <span className="mx-2">•</span>
                      <span className="mr-2">To:</span>
                      <span className="text-gray-300">
                        {formatDateTime(ev.DTEND)}
                      </span>
                    </div>
                  </div>
                  <div className="text-xs text-gray-400 ml-4">
                    UID:{" "}
                    <code className="bg-gray-800 border border-gray-700 px-1 py-0.5 rounded">
                      {ev.UID}
                    </code>
                  </div>
                </div>
                <div className="text-xs text-gray-500">
                  DTSTAMP: {formatDateTime(ev.DTSTAMP)}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
