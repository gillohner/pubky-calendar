// Service Pubky côté frontend (inspiré de l'app Picky)
// Le client Pubky ne peut être initialisé que côté client (navigateur)

// Configuration (même que Picky)
const TESTNET = process.env.NEXT_PUBLIC_TESTNET?.toLowerCase() === "false";
const RAW_HTTP_RELAY =
  process.env.NEXT_PUBLIC_HTTP_RELAY || "https://httprelay.pubky.app/link";
const HTTP_RELAY = (() => {
  let r = RAW_HTTP_RELAY.replace(/\/+$/, "");
  if (!/\/link$/.test(r)) r = `${r}/link`;
  return r;
})();
const PKARR_RELAYS = process.env.NEXT_PUBLIC_PKARR_RELAYS
  ? JSON.parse(process.env.NEXT_PUBLIC_PKARR_RELAYS)
  : ["https://pkarr.pubky.app", "https://pkarr.pubky.org"];
const CAPABILITIES = "/pub/roadky-app/:rw".trim();

// Variable globale pour le client
let client = null;

// Initialise le client uniquement côté client (exactement comme Picky)
const initClient = async () => {
  if (typeof window === "undefined") {
    throw new Error("Pubky client can only be initialized on client side");
  }

  if (!client) {
    const { Client } = await import("@synonymdev/pubky");
    client = new Client({
      pkarr: {
        relays: PKARR_RELAYS,
        requestTimeout: null,
      },
      userMaxRecordAge: null,
    });
  }

  return client;
};

// Helper: obtenir un homeserver pour un utilisateur (comme Picky)
async function getHomeserverFor(session) {
  const clientInstance = await initClient();
  const { PublicKey } = await import("@synonymdev/pubky");
  const userPk = PublicKey.from(session.pubkey || session);
  return clientInstance.getHomeserver(userPk);
}

/**
 * Service Pubky pour la gestion des fonctionnalités côté frontend
 */
export class PubkyService {
  /** Helper: format ISO or local date string to ICS UTC (YYYYMMDDTHHMMSSZ) */
  static toIcsDate(value) {
    const d = new Date(value || Date.now());
    const pad = (n) => String(n).padStart(2, "0");
    const yyyy = d.getUTCFullYear();
    const mm = pad(d.getUTCMonth() + 1);
    const dd = pad(d.getUTCDate());
    const hh = pad(d.getUTCHours());
    const mi = pad(d.getUTCMinutes());
    const ss = pad(d.getUTCSeconds());
    return `${yyyy}${mm}${dd}T${hh}${mi}${ss}Z`;
  }

  /** Helper: convert ICS UTC date (YYYYMMDDTHHMMSSZ) to ISO */
  static icsToIso(value) {
    if (!value) return "";
    const m = String(value).match(
      /^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})Z$/
    );
    if (!m) return value;
    const [_, y, mo, d, h, mi, s] = m;
    const iso = `${y}-${mo}-${d}T${h}:${mi}:${s}.000Z`;
    return iso;
  }

  /** Helper: build minimal VCALENDAR with single VEVENT */
  static buildIcsEvent({ UID, SUMMARY, DTSTART, DTEND, DTSTAMP }) {
    const lines = [
      "BEGIN:VCALENDAR",
      "PRODID:-//calky-poc//1.0//EN",
      "VERSION:2.0",
      "CALSCALE:GREGORIAN",
      "METHOD:PUBLISH",
      "BEGIN:VEVENT",
      `UID:${UID}`,
      `SUMMARY:${SUMMARY}`,
      `DTSTAMP:${this.toIcsDate(DTSTAMP || new Date().toISOString())}`,
      `DTSTART:${this.toIcsDate(DTSTART)}`,
      `DTEND:${this.toIcsDate(DTEND)}`,
      "END:VEVENT",
      "END:VCALENDAR",
    ];
    return lines.join("\r\n");
  }

  /** Helper: parse a minimal single VEVENT ICS into a plain object */
  static parseIcs(text) {
    if (!text) return null;
    // Unfold lines (join lines starting with space)
    const raw = String(text).replace(/\r/g, "");
    const lines = raw.split("\n");
    const unfolded = [];
    for (const line of lines) {
      if (line.startsWith(" ") && unfolded.length) {
        unfolded[unfolded.length - 1] += line.slice(1);
      } else {
        unfolded.push(line);
      }
    }
    const pick = (key) => {
      const pref = `${key.toUpperCase()}:`;
      const L = unfolded.find((l) => l.toUpperCase().startsWith(pref));
      return L ? L.slice(pref.length).trim() : "";
    };
    const UID = pick("UID");
    const SUMMARY = pick("SUMMARY");
    const dtstamp = pick("DTSTAMP");
    const dtstart = pick("DTSTART");
    const dtend = pick("DTEND");
    return {
      UID,
      SUMMARY,
      DTSTAMP: this.icsToIso(dtstamp),
      DTSTART: this.icsToIso(dtstart),
      DTEND: this.icsToIso(dtend),
    };
  }

  /**
   * Sauvegarde une fonctionnalité sur le homeserver Pubky de l'utilisateur
   */
  static async saveFeatureToPubky(userPubkey, featureData) {
    try {
      if (typeof window === "undefined") {
        throw new Error("PubkyService can only be used on client side");
      }

      const clientInstance = await initClient();
      const pubkyPath = `/pub/roadky-app/features/${featureData.id}.json`;
      const url = `pubky://${userPubkey}${pubkyPath}`;

      // Structure de la feature pour Pubky
      const pubkyFeature = {
        id: featureData.id,
        title: featureData.title,
        description: featureData.description,
        category: featureData.category || "general",
        status: featureData.status || "idea",
        priority: featureData.priority || "medium",
        created_at: featureData.created_at,
        updated_at: featureData.updated_at || new Date().toISOString(),
        author_pubkey: userPubkey,
        // Métadonnées Roadky
        app: "roadky",
        version: "1.0",
      };

      console.log(`🚀 Attempting to save feature via client.fetch: ${url}`);

      // Sauvegarder sur le homeserver (comme Picky)
      const jsonBlob = new Blob([JSON.stringify(pubkyFeature, null, 2)], {
        type: "application/json",
      });
      const response = await clientInstance.fetch(url, {
        method: "PUT",
        headers: new Headers({ "Content-Type": "application/json" }),
        body: jsonBlob,
        credentials: "include",
      });

      if (!response.ok) {
        if (response.status === 404) {
          console.log(
            "⚠️ Feature PUT failed with 404, creating /pub/ and /pub/roadky-app/ then retry..."
          );

          // Créer les dossiers nécessaires
          const pubFolderUrl = `pubky://${userPubkey}/pub/`;
          const appFolderUrl = `pubky://${userPubkey}/pub/roadky-app/`;

          // Créer /pub/
          const mkdirPub = await clientInstance.fetch(pubFolderUrl, {
            method: "PUT",
            headers: new Headers({ "Content-Type": "application/x-directory" }),
            body: "",
            credentials: "include",
          });
          if (!mkdirPub.ok && mkdirPub.status !== 409) {
            throw new Error(
              `Failed to create /pub/ directory, status: ${mkdirPub.status}`
            );
          }

          // Créer /pub/roadky-app/
          const mkdirApp = await clientInstance.fetch(appFolderUrl, {
            method: "PUT",
            headers: new Headers({ "Content-Type": "application/x-directory" }),
            body: "",
            credentials: "include",
          });
          if (!mkdirApp.ok && mkdirApp.status !== 409) {
            throw new Error(
              `Failed to create /pub/roadky-app/ directory, status: ${mkdirApp.status}`
            );
          }

          console.log("✅ Required folders created. Retrying feature save...");

          // Retry la sauvegarde
          const retryBody = new Blob([JSON.stringify(pubkyFeature, null, 2)], {
            type: "application/json",
          });
          const retryResponse = await clientInstance.fetch(url, {
            method: "PUT",
            headers: new Headers({ "Content-Type": "application/json" }),
            body: retryBody,
            credentials: "include",
          });

          if (!retryResponse.ok) {
            if (retryResponse.status === 401) {
              throw new Error(
                "Unauthorized (401) after mkdir. Please re-login to grant /pub/roadky-app/:rw"
              );
            }
            throw new Error(
              `Direct PUT error after retry (${retryResponse.status})`
            );
          }
        } else if (response.status === 401) {
          throw new Error(
            "Unauthorized (401). Please re-login to grant /pub/roadky-app/:rw"
          );
        } else {
          throw new Error(`Direct PUT error (${response.status})`);
        }
      }

      console.log(
        `✅ Feature ${featureData.id} sauvegardée sur homeserver Pubky`
      );
      return {
        success: true,
        pubky_path: url,
      };
    } catch (error) {
      console.error("❌ Erreur sauvegarde Pubky:", error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Récupère une fonctionnalité depuis un homeserver Pubky
   */
  static async getFeatureFromPubky(userPubkey, featureId) {
    try {
      if (typeof window === "undefined") {
        throw new Error("PubkyService can only be used on client side");
      }

      const homeserver = await getHomeserverFor(userPubkey);
      const pubkyPath = `/pub/roadky-app/features/${featureId}.json`;

      const data = await homeserver.get(pubkyPath);
      if (!data) {
        return { success: false, error: "Feature not found" };
      }

      const feature = JSON.parse(data);
      console.log(`✅ Feature ${featureId} récupérée depuis homeserver Pubky`);

      return {
        success: true,
        feature,
      };
    } catch (error) {
      console.error("❌ Erreur récupération Pubky:", error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Liste toutes les fonctionnalités d'un utilisateur sur son homeserver
   */
  static async listUserFeatures(userPubkey) {
    try {
      if (typeof window === "undefined") {
        throw new Error("PubkyService can only be used on client side");
      }

      const homeserver = await getHomeserverFor(userPubkey);
      const basePath = "/pub/roadky-app/features/";

      // Lister les fichiers dans le dossier features
      const files = await homeserver.list(basePath);
      const features = [];

      for (const file of files) {
        if (file.endsWith(".json")) {
          try {
            const data = await homeserver.get(`${basePath}${file}`);
            const feature = JSON.parse(data);
            features.push(feature);
          } catch (error) {
            console.warn(`⚠️ Erreur lecture feature ${file}:`, error.message);
          }
        }
      }

      console.log(
        `✅ ${features.length} features récupérées depuis homeserver Pubky`
      );
      return {
        success: true,
        features,
      };
    } catch (error) {
      console.error("❌ Erreur listage features Pubky:", error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Récupère un fichier (image, etc.) depuis un homeserver Pubky
   */
  static async getFileFromPubky(userPubkey, filePath) {
    try {
      if (typeof window === "undefined") {
        throw new Error("PubkyService can only be used on client side");
      }

      const clientInstance = await initClient();
      const url = `pubky://${userPubkey}${filePath}`;

      console.log(`📁 Fetching file via client.fetch: ${url}`);

      // Récupérer le fichier depuis le homeserver (comme dans Picky)
      const response = await clientInstance.fetch(url, {
        method: "GET",
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error(`File fetch failed with status: ${response.status}`);
      }

      // Pour les fichiers binaires (images), utiliser arrayBuffer
      const fileData = await response.arrayBuffer();

      console.log(`✅ File ${filePath} retrieved from Pubky homeserver`);
      return fileData;
    } catch (error) {
      console.error("❌ Error fetching file from Pubky:", error);
      throw error;
    }
  }

  /**
   * Supprime une fonctionnalité du homeserver Pubky
   */
  static async deleteFeatureFromPubky(userPubkey, featureId) {
    try {
      if (typeof window === "undefined") {
        throw new Error("PubkyService can only be used on client side");
      }

      const clientInstance = await initClient();
      const pubkyPath = `/pub/roadky-app/features/${featureId}.json`;
      const url = `pubky://${userPubkey}${pubkyPath}`;

      console.log(`🗑️ Attempting to delete feature via client.fetch: ${url}`);

      // Supprimer du homeserver (comme pour la sauvegarde)
      const response = await clientInstance.fetch(url, {
        method: "DELETE",
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error(`Delete failed with status: ${response.status}`);
      }

      console.log(`✅ Feature ${featureId} supprimée du homeserver Pubky`);
      return { success: true };
    } catch (error) {
      console.error("❌ Erreur suppression Pubky:", error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Save an event to the user's Pubky homeserver at /pub/ics/events/{UID}.json
   */
  static async saveEventToPubky(userPubkey, eventData) {
    try {
      if (typeof window === "undefined") {
        throw new Error("PubkyService can only be used on client side");
      }

      const clientInstance = await initClient();
      const uid = eventData.UID;
      if (!uid) throw new Error("UID is required");
      const pubkyPath = `/pub/ics/events/${uid}.ics`;
      const url = `pubky://${userPubkey}${pubkyPath}`;

      const icsText = this.buildIcsEvent({
        UID: uid,
        SUMMARY: eventData.SUMMARY,
        DTSTART: eventData.DTSTART,
        DTEND: eventData.DTEND,
        DTSTAMP: eventData.DTSTAMP,
      });

      const response = await clientInstance.fetch(url, {
        method: "PUT",
        headers: new Headers({ "Content-Type": "text/calendar" }),
        body: new Blob([icsText], { type: "text/calendar" }),
        credentials: "include",
      });

      if (!response.ok) {
        if (response.status === 403 || response.status === 401) {
          throw new Error(
            "Forbidden/Unauthorized. Please re-login and grant /pub/ics/:rw in Pubky Ring."
          );
        }
        if (response.status === 404) {
          const pubFolderUrl = `pubky://${userPubkey}/pub/`;
          const icsFolderUrl = `pubky://${userPubkey}/pub/ics/`;
          const eventsFolderUrl = `pubky://${userPubkey}/pub/ics/events/`;

          const mkdirPub = await clientInstance.fetch(pubFolderUrl, {
            method: "PUT",
            headers: new Headers({ "Content-Type": "application/x-directory" }),
            body: "",
            credentials: "include",
          });
          if (!mkdirPub.ok && mkdirPub.status !== 409) {
            throw new Error(
              `Failed to create /pub/ directory, status: ${mkdirPub.status}`
            );
          }

          const mkdirIcs = await clientInstance.fetch(icsFolderUrl, {
            method: "PUT",
            headers: new Headers({ "Content-Type": "application/x-directory" }),
            body: "",
            credentials: "include",
          });
          if (!mkdirIcs.ok && mkdirIcs.status !== 409) {
            throw new Error(
              `Failed to create /pub/ics/ directory, status: ${mkdirIcs.status}`
            );
          }

          const mkdirEvents = await clientInstance.fetch(eventsFolderUrl, {
            method: "PUT",
            headers: new Headers({ "Content-Type": "application/x-directory" }),
            body: "",
            credentials: "include",
          });
          if (!mkdirEvents.ok && mkdirEvents.status !== 409) {
            throw new Error(
              `Failed to create /pub/ics/events/ directory, status: ${mkdirEvents.status}`
            );
          }

          const retryResponse = await clientInstance.fetch(url, {
            method: "PUT",
            headers: new Headers({ "Content-Type": "text/calendar" }),
            body: new Blob([icsText], { type: "text/calendar" }),
            credentials: "include",
          });

          if (!retryResponse.ok) {
            if (retryResponse.status === 401 || retryResponse.status === 403) {
              throw new Error(
                "Unauthorized/Forbidden after mkdir. Re-login and grant /pub/ics/:rw"
              );
            }
            throw new Error(
              `Direct PUT error after retry (${retryResponse.status})`
            );
          }
        } else {
          throw new Error(`Direct PUT error (${response.status})`);
        }
      }

      return { success: true, pubky_path: url };
    } catch (error) {
      console.error("❌ Error saving event to Pubky:", error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get a single event by UID from Pubky
   */
  static async getEventFromPubky(userPubkey, uid) {
    try {
      if (typeof window === "undefined") {
        throw new Error("PubkyService can only be used on client side");
      }
      const clientInstance = await initClient();
      const path = `/pub/ics/events/${uid}.ics`;
      const url = `pubky://${userPubkey}${path}`;
      const res = await clientInstance.fetch(url, {
        method: "GET",
        credentials: "include",
      });
      if (!res.ok) return { success: false, error: `HTTP ${res.status}` };
      const text = await res.text();
      const parsed = this.parseIcs(text);
      if (!parsed) return { success: false, error: "Parse error" };
      return { success: true, event: parsed };
    } catch (error) {
      console.error("❌ Error fetching event from Pubky:", error);
      return { success: false, error: error.message };
    }
  }

  /**
   * List all events for a user from Pubky
   */
  static async listUserEvents(userPubkey) {
    try {
      if (typeof window === "undefined") {
        throw new Error("PubkyService can only be used on client side");
      }
      const clientInstance = await initClient();
      const baseUrl = `pubky://${userPubkey}/pub/ics/events/`;
      const listRes = await clientInstance.fetch(baseUrl, {
        method: "GET",
        headers: new Headers({ Accept: "application/json" }),
        credentials: "include",
      });

      if (listRes.status === 404) {
        return { success: true, events: [] };
      }
      if (!listRes.ok) {
        throw new Error(`List failed with status: ${listRes.status}`);
      }

      let listing = null;
      try {
        listing = await listRes.json();
      } catch {
        listing = null;
      }

      let files = [];
      if (Array.isArray(listing)) {
        files = listing;
      } else if (listing && Array.isArray(listing.items)) {
        files = listing.items.map((i) => i.name || i);
      } else if (listing && Array.isArray(listing.files)) {
        files = listing.files.map((i) => i.name || i);
      } else if (listing && typeof listing === "object") {
        files = Object.keys(listing);
      }

      files = files
        .filter((f) => typeof f === "string")
        .filter((name) => name.endsWith(".ics"));

      const events = [];
      for (const name of files) {
        try {
          const fileUrl = `${baseUrl}${name}`;
          const fileRes = await clientInstance.fetch(fileUrl, {
            method: "GET",
            credentials: "include",
          });
          if (!fileRes.ok) continue;
          const text = await fileRes.text();
          const ev = this.parseIcs(text);
          if (ev && ev.UID) {
            ev.author_pubkey = userPubkey;
            events.push(ev);
          }
        } catch (e) {
          console.warn("Failed to fetch event file:", name, e);
        }
      }

      return { success: true, events };
    } catch (error) {
      console.error("❌ Error listing events from Pubky:", error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Delete an event by UID
   */
  static async deleteEventFromPubky(userPubkey, uid) {
    try {
      if (typeof window === "undefined") {
        throw new Error("PubkyService can only be used on client side");
      }
      const clientInstance = await initClient();
      const path = `/pub/ics/events/${uid}.ics`;
      const url = `pubky://${userPubkey}${path}`;
      const response = await clientInstance.fetch(url, {
        method: "DELETE",
        credentials: "include",
      });
      if (!response.ok)
        throw new Error(`Delete failed with status: ${response.status}`);
      return { success: true };
    } catch (error) {
      console.error("❌ Error deleting event from Pubky:", error);
      return { success: false, error: error.message };
    }
  }
}

export default PubkyService;
