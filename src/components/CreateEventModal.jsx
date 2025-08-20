"use client";

import { useState, useMemo } from "react";
import { useAuth } from "../contexts/AuthContext";
import { PubkyService } from "../services/pubkyService";

export default function CreateEventModal({ isOpen, onClose, onEventCreated }) {
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const defaultUID = useMemo(
    () =>
      typeof crypto !== "undefined" && crypto.randomUUID
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random().toString(36).slice(2)}`,
    []
  );
  const nowLocal = useMemo(() => new Date(), []);

  const toLocalInput = (d) => {
    const pad = (n) => String(n).padStart(2, "0");
    const yyyy = d.getFullYear();
    const mm = pad(d.getMonth() + 1);
    const dd = pad(d.getDate());
    const hh = pad(d.getHours());
    const min = pad(d.getMinutes());
    return `${yyyy}-${mm}-${dd}T${hh}:${min}`;
  };

  const [formData, setFormData] = useState({
    SUMMARY: "",
    DTSTART: toLocalInput(nowLocal),
    DTEND: toLocalInput(new Date(nowLocal.getTime() + 60 * 60 * 1000)),
    UID: defaultUID,
    DTSTAMP: toLocalInput(nowLocal),
  });

  if (!isOpen) return null;

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const toISO = (local) => {
    // Convert yyyy-MM-ddTHH:mm (local) to ISO string
    try {
      if (!local) return "";
      const dt = new Date(local);
      return dt.toISOString();
    } catch {
      return local;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!user?.pubkey) {
      alert("You must be connected to create an event");
      return;
    }

    if (!formData.SUMMARY.trim()) {
      alert("SUMMARY is required");
      return;
    }

    if (!formData.DTSTART || !formData.DTEND) {
      alert("DTSTART and DTEND are required");
      return;
    }

    setIsSubmitting(true);

    try {
      const payload = {
        userPubkey: user.pubkey,
        SUMMARY: formData.SUMMARY.trim(),
        DTSTART: toISO(formData.DTSTART),
        DTEND: toISO(formData.DTEND),
        UID: (formData.UID || defaultUID).trim(),
        DTSTAMP: toISO(formData.DTSTAMP) || new Date().toISOString(),
      };

      // 1) Create locally via backend
      const response = await fetch("/api/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = await response.json();
      if (!result.success)
        throw new Error(result.error || "Local event creation failed");

      // 2) Push to Pubky from client
      const pubkyResult = await PubkyService.saveEventToPubky(
        user.pubkey,
        payload
      );
      if (!pubkyResult.success) {
        console.warn("⚠️ Pubky save failed:", pubkyResult.error);
      }

      // Reset and close
      setFormData({
        SUMMARY: "",
        DTSTART: toLocalInput(new Date()),
        DTEND: toLocalInput(new Date(Date.now() + 60 * 60 * 1000)),
        UID:
          typeof crypto !== "undefined" && crypto.randomUUID
            ? crypto.randomUUID()
            : `${Date.now()}-${Math.random().toString(36).slice(2)}`,
        DTSTAMP: toLocalInput(new Date()),
      });

      onClose();
      alert(
        pubkyResult.success
          ? "✅ Event created and saved to Pubky!"
          : "✅ Event created locally (Pubky save pending)"
      );
      if (onEventCreated) onEventCreated(result.event);
    } catch (err) {
      console.error("Error creating event:", err);
      alert(`❌ Error: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-slate-200 dark:border-slate-700">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
              📅 Create a New Event
            </h2>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300 text-2xl hover:bg-slate-100 dark:hover:bg-slate-700 w-8 h-8 rounded-full flex items-center justify-center transition-colors"
              disabled={isSubmitting}
            >
              ×
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* SUMMARY */}
            <div>
              <label
                htmlFor="SUMMARY"
                className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2"
              >
                SUMMARY (Title) *
              </label>
              <input
                type="text"
                id="SUMMARY"
                name="SUMMARY"
                value={formData.SUMMARY}
                onChange={handleInputChange}
                required
                maxLength={200}
                placeholder="Team Sync Meeting"
                className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-colors"
                disabled={isSubmitting}
              />
            </div>

            {/* DTSTART / DTEND */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="DTSTART"
                  className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2"
                >
                  DTSTART (Start) *
                </label>
                <input
                  type="datetime-local"
                  id="DTSTART"
                  name="DTSTART"
                  value={formData.DTSTART}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-colors"
                  disabled={isSubmitting}
                />
              </div>
              <div>
                <label
                  htmlFor="DTEND"
                  className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2"
                >
                  DTEND (End) *
                </label>
                <input
                  type="datetime-local"
                  id="DTEND"
                  name="DTEND"
                  value={formData.DTEND}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-colors"
                  disabled={isSubmitting}
                />
              </div>
            </div>

            {/* UID / DTSTAMP */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="UID"
                  className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2"
                >
                  UID (Unique ID) *
                </label>
                <input
                  type="text"
                  id="UID"
                  name="UID"
                  value={formData.UID}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-colors"
                  disabled={isSubmitting}
                />
              </div>
              <div>
                <label
                  htmlFor="DTSTAMP"
                  className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2"
                >
                  DTSTAMP (Timestamp) *
                </label>
                <input
                  type="datetime-local"
                  id="DTSTAMP"
                  name="DTSTAMP"
                  value={formData.DTSTAMP}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-colors"
                  disabled={isSubmitting}
                />
              </div>
            </div>

            {/* Storage Information */}
            <div className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 p-4 rounded-lg border border-purple-200 dark:border-purple-800">
              <h3 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 flex items-center">
                🏠 Storage Information
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                This event will be saved on your Pubky homeserver
                <code className="ml-1 bg-purple-100 dark:bg-purple-900/50 text-purple-800 dark:text-purple-300 px-2 py-1 rounded font-mono text-xs">
                  /pub/ics/events/
                </code>
                and indexed locally if needed.
              </p>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">
                👤 Author:{" "}
                <code className="bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 px-2 py-1 rounded font-mono text-xs">
                  {user?.pubkey
                    ? `${user.pubkey.slice(0, 8)}...${user.pubkey.slice(-8)}`
                    : "Not connected"}
                </code>
              </p>
            </div>

            {/* Buttons */}
            <div className="flex justify-end space-x-4 pt-6 border-t border-slate-200 dark:border-slate-700">
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-3 text-slate-700 dark:text-slate-300 bg-slate-200 dark:bg-slate-700 rounded-lg hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors font-medium"
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-8 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed font-medium shadow-lg hover:shadow-xl"
                disabled={
                  isSubmitting ||
                  !formData.SUMMARY.trim() ||
                  !formData.DTSTART ||
                  !formData.DTEND
                }
              >
                {isSubmitting ? (
                  <span className="flex items-center">
                    <svg
                      className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    Creating...
                  </span>
                ) : (
                  "Create Event"
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
