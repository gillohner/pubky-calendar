# Pubky Calendar (ICS)

A minimal calendar proof of concept that creates, stores, and lists events using standard .ics files on a Pubky homeserver.

## 🚀 Features

- Login with Pubky Ring (grants capability: /pub/ics/:rw)
- Create events (SUMMARY, DTSTART, DTEND, UID)
- Store each event as a valid .ics file at:
  - pubky://{pubkey}/pub/ics/events/{UID}.ics
- Front feed: shows all locally cached events (no login required)
- Admin area: shows only your events and lets you create new ones
- Local cache for indexing at data/events

## 🏗️ Architecture

- Homeserver storage
  - One .ics file per event at /pub/ics/events/{UID}.ics
  - ICS is a VCALENDAR containing a single VEVENT (VERSION:2.0, CALSCALE:GREGORIAN, METHOD:PUBLISH)
- Local cache
  - JSON mirror of events under data/events used for quick listing and backfill
- Authentication
  - Pubky Ring login; capability required: /pub/ics/:rw

## 🛠️ Tech Stack

- Frontend: Next.js 14, React 18, TypeScript
- Styling: Tailwind CSS
- Auth: Pubky Ring capabilities
- Storage: Pubky homeserver (.ics) + local JSON cache
- Deployment: Docker

## 📦 Installation

### Prerequisites

- Node.js 18+
- pnpm (recommended)
- Pubky Ring mobile app

### Development Setup

```bash
pnpm install
pnpm dev
```

Open http://localhost:3000 in your browser.

## 🎯 Usage

### Creating Events

1. Login with Pubky Ring
2. Click “New Event”
3. Fill in SUMMARY, DTSTART, DTEND (UID is auto-filled)
4. The app saves a .ics file to your homeserver at /pub/ics/events/{UID}.ics

### Listing Events

- Homepage shows all events from the local cache
- If the cache is empty and you are logged in, it backfills from your homeserver

### Admin Area

- Shows only your events (from local cache)
- Create new events via the modal

## 🏗️ Project Structure

```
src/
├── app/
│   ├── page.tsx            # Homepage with event feed
│   ├── admin/              # User events management
│   └── api/
│       └── events/         # Events API (local cache)
├── components/
│   ├── EventList.jsx       # Event list (front feed)
│   ├── CreateEventModal.jsx# Create event modal
│   ├── Header.jsx          # Navigation header
│   └── LoginModal.jsx      # Authentication modal
├── contexts/
│   └── AuthContext.js      # Authentication state
└── services/
    ├── pubkyService.js     # Pubky client (.ics read/write)
    └── eventService.js     # Local cache service
```

Note: Legacy “feature” files remain in the repo for reference but are not used by the UI.

## 🔧 API Endpoints

- GET /api/events – List all cached events
- POST /api/events – Create/cache an event locally

## 🚀 Deployment

### Docker

```bash
docker build -t pubky-calendar .
docker run -p 3000:3000 pubky-calendar
```

### Environment Variables

Create .env.local (optional):

```env
NEXT_PUBLIC_APP_NAME="Pubky Calendar (ICS)"
```

## 📄 License

MIT License - see LICENSE

## 🔗 Links

- https://pubky.org
- https://pubky.app
- https://docs.pubky.org
