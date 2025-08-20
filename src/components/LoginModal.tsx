"use client";

import { useState, useEffect } from "react";
import { X, Copy, Check } from "lucide-react";
import QRCode from "qrcode";
import { generateAuthUrl, loginWithAuthUrl } from "../services/pubky.js";

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLogin: (session: any) => void;
}

export default function LoginModal({
  isOpen,
  onClose,
  onLogin,
}: LoginModalProps) {
  const [authUrl, setAuthUrl] = useState("");
  const [qrCodeUrl, setQrCodeUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState("Generating auth URL...");
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (isOpen) {
      handleGenerateAuthUrl();
    }
  }, [isOpen]);

  const handleGenerateAuthUrl = async () => {
    try {
      setIsLoading(true);
      setError("");
      setStatus("Generating auth URL...");

      const result = await generateAuthUrl();
      if (!result) {
        throw new Error("Failed to generate auth URL");
      }

      const { url, promise } = result;
      setAuthUrl(url);
      setStatus("Auth URL generated. Waiting for connection...");

      const qrUrl = await QRCode.toDataURL(url, {
        width: 256,
        margin: 2,
        color: {
          dark: "#1e293b",
          light: "#f8fafc",
        },
      });
      setQrCodeUrl(qrUrl);

      console.log("Waiting for auth request response...");
      const response = await promise;
      console.log("Auth response received:", response);

      const extractedPubkey = response.z32();
      console.log("Extracted pubkey:", extractedPubkey);

      const loginResult = await loginWithAuthUrl(extractedPubkey);

      if (loginResult.success && loginResult.session) {
        setStatus("✅ Successfully connected! Redirecting...");
        onLogin(loginResult.session);
        onClose();
      } else {
        throw new Error(loginResult.error || "Login failed");
      }
    } catch (error: any) {
      console.error("Auth error:", error);
      setError(`Authentication error: ${error.message}`);
      setStatus("Authentication failed.");
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(authUrl).then(
      () => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      },
      (err) => {
        console.error("Could not copy text: ", err);
        alert("Error while copying the URL.");
      }
    );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-slate-900 rounded-2xl max-w-md w-full p-6 border border-slate-700">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-white">
            Connexion Pubky Ring
          </h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-6">
          <div className="text-center">
            <div className="bg-white p-4 rounded-xl inline-block mb-4">
              {qrCodeUrl ? (
                <img src={qrCodeUrl} alt="QR Code" className="w-48 h-48" />
              ) : (
                <div className="w-48 h-48 flex items-center justify-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
                </div>
              )}
            </div>
            <p className="text-slate-300 text-sm mb-4">
              Scannez ce QR code avec l'application Pubky Ring
            </p>

            {/* Status */}
            <div className="bg-slate-800 p-3 rounded-lg text-sm mb-4">
              <p className={`${error ? "text-red-400" : "text-slate-300"}`}>
                {error || status}
              </p>
            </div>

            {/* Copy URL button */}
            {authUrl && (
              <button
                onClick={copyToClipboard}
                className="flex items-center gap-2 mx-auto text-sm text-slate-400 hover:text-white transition-colors"
              >
                {copied ? (
                  <Check className="w-4 h-4" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
                {copied ? "URL copiée !" : "Copier l'URL d'auth"}
              </button>
            )}
          </div>

          {/* Retry button if error */}
          {error && (
            <button
              onClick={handleGenerateAuthUrl}
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 disabled:from-slate-600 disabled:to-slate-600 text-white py-3 px-4 rounded-lg transition-all duration-200 font-medium"
            >
              {isLoading ? "Génération..." : "Réessayer"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
