import { NextResponse } from "next/server";
import EventService from "../../../services/eventService.js";

const eventService = new EventService();

export async function GET() {
  try {
    const events = await eventService.getAllEvents();
    return NextResponse.json({ success: true, events });
  } catch (error) {
    console.error("Erreur API GET /api/events:", error);
    return NextResponse.json(
      { success: false, error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { userPubkey, SUMMARY, DTSTART, DTEND, UID, DTSTAMP } = body;

    if (!userPubkey)
      return NextResponse.json(
        { success: false, error: "userPubkey is required" },
        { status: 400 }
      );
    if (!SUMMARY || !DTSTART || !DTEND)
      return NextResponse.json(
        { success: false, error: "SUMMARY, DTSTART, DTEND are required" },
        { status: 400 }
      );

    const result = await eventService.createEvent(userPubkey, {
      SUMMARY,
      DTSTART,
      DTEND,
      UID,
      DTSTAMP,
    });

    if (!result.success) return NextResponse.json(result, { status: 400 });

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error("Erreur API POST /api/events:", error);
    return NextResponse.json(
      { success: false, error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}
