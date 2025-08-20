// Load config from Next.js environment variables (same as picky)
const TESTNET = process.env.NEXT_PUBLIC_TESTNET?.toLowerCase() === "true";
// Normalize relay: remove trailing slashes and ensure '/link' suffix
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
const CAPABILITIES = "/pub/ics/:rw";

const HTTP_NEXUS =
  process.env.NEXT_PUBLIC_HTTP_NEXUS || "https://nexus.pubky.app/";

// Global client variable
let client = null;

// Initialize client only on client side
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

// Client initialization function for compatibility
export function initPubkyClient() {
  return initClient();
}

// Helper: get a homeserver-scoped client from a user pubkey
async function getHomeserverFor(session) {
  const clientInstance = await initClient();
  const { PublicKey } = await import("@synonymdev/pubky");
  const userPk = PublicKey.from(session.pubkey);

  try {
    const homeserver = await clientInstance.getHomeserver(userPk);
    if (!homeserver) {
      throw new Error("No homeserver found for this pubkey");
    }

    let addresses = [];
    let port = null;

    try {
      if (typeof homeserver.getAddresses === "function") {
        addresses = await homeserver.getAddresses();
      }
      if (!addresses.length && typeof homeserver.addr === "string") {
        addresses = [homeserver.addr];
      }
      if (typeof homeserver.port === "number") {
        port = homeserver.port;
      }
      if (!port && typeof homeserver.getPort === "function") {
        port = await homeserver.getPort();
      }
    } catch (e) {
      console.warn("Homeserver address probing failed softly:", e);
    }

    return {
      success: true,
      homeserverKey: homeserver.z32(),
      pkarrRelays: PKARR_RELAYS,
      addresses,
      port,
    };
  } catch (error) {
    console.error("❌ Error resolving homeserver:", error);
    return { success: false, error: error.message };
  }
}

// Quick existence check for the roadky-app folder for the authenticated user
export async function checkRoadkyFolderExists(session) {
  if (!session || !session.pubkey) {
    return { success: false, error: "Invalid session or missing pubkey." };
  }
  try {
    const clientInstance = await initClient();
    const url = `pubky://${session.pubkey}/pub/roadky-app/`;
    const urlWithTs = `${url}?t=${Date.now()}`;
    const response = await clientInstance.fetch(urlWithTs, {
      method: "GET",
      headers: new Headers({
        Accept: "application/json",
        "Cache-Control": "no-cache",
      }),
      credentials: "include",
    });
    if (response.status === 404) {
      return { success: true, exists: false };
    }
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return { success: true, exists: true };
  } catch (error) {
    console.error("❌ Error checking roadky folder existence:", error);
    return { success: false, error: error.message };
  }
}

// ==========================
// Authentication Functions
// ==========================

// Simplified generateAuthUrl (same as picky)
export async function generateAuthUrl() {
  try {
    console.log("🚀 Creating auth request with relay:", HTTP_RELAY);
    console.log("🔑 Using capabilities:", CAPABILITIES || "[EMPTY]");

    const clientInstance = await initClient();
    const authRequest = clientInstance.authRequest(HTTP_RELAY, CAPABILITIES);
    const url = String(authRequest.url());

    console.log("🔗 Generated auth URL:", url);

    return {
      url,
      promise: authRequest.response(),
    };
  } catch (error) {
    console.error("❌ Error generating auth URL:", error);
    throw error;
  }
}

export async function loginWithAuthUrl(pubkey) {
  try {
    console.log("🔐 Starting login process for pubkey:", pubkey);

    // Create a minimal session object with just the pubkey
    const session = {
      pubkey,
      capabilities: CAPABILITIES,
      obtainedAt: Date.now(),
      lastSync: Date.now(),
      roadkyAppExists: undefined,
    };

    localStorage.setItem("session", JSON.stringify(session));
    console.log("✅ Login successful, complete session created:", session);

    return { success: true, session };
  } catch (error) {
    console.error("❌ Login error:", error);
    return { success: false, error: error.message };
  }
}

export async function createRoadkyFolder(session) {
  if (!session || !session.pubkey) {
    return { success: false, error: "Invalid session or missing pubkey." };
  }

  const homeserver = await getHomeserverFor(session);
  const url = `pubky://${session.pubkey}/pub/roadky-app/`;
  console.log(`🚀 Attempting to create folder via client: ${url}`);

  try {
    const clientInstance = await initClient();
    const response = await clientInstance.fetch(url, {
      method: "PUT",
      headers: new Headers({ "Content-Type": "application/json" }),
      credentials: "include",
      body: JSON.stringify({
        created_at: Date.now(),
        app_version: "1.0.0",
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    console.log("✅ Roadky folder created successfully");
    return { success: true };
  } catch (error) {
    console.error("❌ Error creating roadky folder:", error);
    return { success: false, error: error.message };
  }
}

// ==========================
// Feature Management Functions
// ==========================

export async function saveFeature(session, feature) {
  if (!session || !session.pubkey) {
    return { success: false, error: "Invalid session or missing pubkey." };
  }

  try {
    const clientInstance = await initClient();
    const featureId = feature.id || `feature_${Date.now()}`;
    const url = `pubky://${session.pubkey}/pub/roadky-app/features/${featureId}.json`;

    const featureData = {
      ...feature,
      id: featureId,
      created_at: feature.created_at || Date.now(),
      updated_at: Date.now(),
    };

    const response = await clientInstance.fetch(url, {
      method: "PUT",
      headers: new Headers({ "Content-Type": "application/json" }),
      credentials: "include",
      body: JSON.stringify(featureData),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    console.log("✅ Feature saved successfully");
    return { success: true, feature: featureData };
  } catch (error) {
    console.error("❌ Error saving feature:", error);
    return { success: false, error: error.message };
  }
}

export async function loadFeatures(session) {
  if (!session || !session.pubkey) {
    return { success: false, error: "Invalid session or missing pubkey." };
  }

  try {
    const clientInstance = await initClient();
    const url = `pubky://${session.pubkey}/pub/roadky-app/features/`;

    const response = await clientInstance.fetch(url, {
      method: "GET",
      headers: new Headers({ Accept: "application/json" }),
      credentials: "include",
    });

    if (response.status === 404) {
      return { success: true, features: [] };
    }

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const features = await response.json();
    console.log("✅ Features loaded successfully");
    return { success: true, features: features || [] };
  } catch (error) {
    console.error("❌ Error loading features:", error);
    return { success: false, error: error.message };
  }
}

export async function deleteFeature(session, featureId) {
  if (!session || !session.pubkey) {
    return { success: false, error: "Invalid session or missing pubkey." };
  }

  try {
    const clientInstance = await initClient();
    const url = `pubky://${session.pubkey}/pub/roadky-app/features/${featureId}.json`;

    const response = await clientInstance.fetch(url, {
      method: "DELETE",
      credentials: "include",
    });

    if (!response.ok && response.status !== 404) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    console.log("✅ Feature deleted successfully");
    return { success: true };
  } catch (error) {
    console.error("❌ Error deleting feature:", error);
    return { success: false, error: error.message };
  }
}
