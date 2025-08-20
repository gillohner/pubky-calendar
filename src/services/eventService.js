import fs from "fs/promises";
import path from "path";
import { v4 as uuidv4 } from "uuid";

class EventService {
  constructor() {
    this.dataDir = path.join(process.cwd(), "data", "events");
    this.ensureDataDir();
  }

  async ensureDataDir() {
    try {
      await fs.mkdir(this.dataDir, { recursive: true });
    } catch (error) {
      console.error("Erreur création dossier data/events:", error);
    }
  }

  async createEvent(userPubkey, eventData) {
    const author = String(userPubkey || "").trim();
    const uid = String(eventData.UID || "").trim() || uuidv4();
    const now = new Date().toISOString();

    const summary = (eventData.SUMMARY || "").toString().trim();
    const dtstart = (eventData.DTSTART || "").toString().trim();
    const dtend = (eventData.DTEND || "").toString().trim();
    const dtstamp = (eventData.DTSTAMP || now).toString().trim();

    if (!author) {
      return { success: false, error: "author_pubkey is required" };
    }
    if (!summary || !dtstart || !dtend) {
      return {
        success: false,
        error: "SUMMARY, DTSTART and DTEND are required",
      };
    }

    const localEvent = {
      UID: uid,
      SUMMARY: summary,
      DTSTART: dtstart,
      DTEND: dtend,
      DTSTAMP: dtstamp,
      created_at: now,
      updated_at: now,
      author_pubkey: author,
      pubky_path: `/pub/ics/events/${uid}.ics`,
    };

    try {
      await this.saveLocalEvent(localEvent);
      console.log(`✅ Event ${uid} created in local cache`);
      return { success: true, event: localEvent };
    } catch (error) {
      console.error("Erreur création event:", error);
      return { success: false, error: error.message };
    }
  }

  async saveLocalEvent(localEvent) {
    const filePath = path.join(this.dataDir, `${localEvent.UID}.json`);
    await fs.writeFile(filePath, JSON.stringify(localEvent, null, 2));
  }

  async getAllEvents() {
    try {
      const files = await fs.readdir(this.dataDir);
      const events = [];
      for (const file of files) {
        if (!file.endsWith(".json")) continue;
        try {
          const filePath = path.join(this.dataDir, file);
          const content = await fs.readFile(filePath, "utf8");
          if (content.trim()) {
            events.push(JSON.parse(content));
          }
        } catch (e) {
          console.warn(`⚠️ Erreur lecture event ${file}:`, e.message);
        }
      }
      return events;
    } catch (error) {
      console.error("Erreur récupération events:", error);
      return [];
    }
  }

  async getEventByUID(uid) {
    try {
      const filePath = path.join(this.dataDir, `${uid}.json`);
      const content = await fs.readFile(filePath, "utf8");
      if (!content.trim()) return null;
      return JSON.parse(content);
    } catch (error) {
      console.error(`Event ${uid} non trouvé:`, error);
      return null;
    }
  }
}

export default EventService;
