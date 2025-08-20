# Pubky Calendar

A decentralized voting platform for the Pubky ecosystem, built with Next.js and Pubky Ring authentication.

## 🚀 Features

- **🔐 Decentralized Authentication**: Login with Pubky Ring mobile app via QR code
- **🗳️ Cryptographic Voting**: Secure voting with Ed25519 signatures
- **🏠 Homeserver Storage**: Features stored on user's Pubky homeserver
- **📱 Responsive Design**: Modern dark theme with mobile support
- **⚡ Real-time Updates**: Dynamic feature list with instant vote updates

## 🏗️ Architecture

### Dual Storage System

- **Homeserver**: User features stored at `pubky://{pubkey}/pub/roadky-app/features/{id}.json`
- **Local Cache**: Vote counts and metadata cached locally for performance

### Authentication Flow

1. User scans QR code with Pubky Ring mobile app
2. App generates challenge and signature
3. Server verifies Ed25519 signature
4. Session established with user's public key

## 🛠️ Tech Stack

- **Frontend**: Next.js 14, React 18, TypeScript
- **Styling**: Tailwind CSS with dark theme
- **Authentication**: Pubky Ring with Ed25519 signatures
- **Storage**: Pubky homeserver + local JSON cache
- **Deployment**: Docker with production optimizations

## 📦 Installation

### Prerequisites

- Node.js 18+
- pnpm (recommended)
- Pubky Ring mobile app for testing

### Development Setup

```bash
# Install dependencies
pnpm install

# Start development server
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

### Testing Authentication

1. Install Pubky Ring mobile app
2. Click "Login with Pubky Ring" on the homepage
3. Scan the QR code with the mobile app
4. Complete the authentication challenge

## 🎯 Usage

### Creating Features

1. Login with Pubky Ring
2. Click "Create Feature" on the homepage
3. Fill in title, description, and category
4. Feature is saved to your homeserver and displayed publicly

### Voting

- Click vote buttons on any feature
- Votes are cryptographically signed
- Vote counts update in real-time

### Managing Your Features

- Access "My Features" from the navigation
- Edit or delete your submitted features
- Changes sync with your homeserver

## 🏗️ Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── page.tsx           # Homepage with feature list
│   ├── profile/           # User profile page
│   ├── admin/             # Feature management
│   ├── how-it-works/      # Documentation page
│   └── api/               # API endpoints
├── components/            # React components
│   ├── FeatureList.jsx   # Main feature display
│   ├── LoginModal.jsx    # Authentication modal
│   └── Header.jsx        # Navigation header
├── contexts/             # React contexts
│   └── AuthContext.js   # Authentication state
├── services/            # Business logic
│   ├── pubkyService.js  # Pubky homeserver client
│   └── featureService.js # Feature management
└── styles/              # Global styles
```

## 🔧 API Endpoints

- `GET /api/features` - List all features with vote counts
- `POST /api/features` - Create new feature (authenticated)
- `PUT /api/features/[id]` - Update feature (authenticated)
- `DELETE /api/features/[id]` - Delete feature (authenticated)
- `POST /api/features/[id]/vote` - Vote on feature
- `POST /api/auth/verify` - Verify Pubky Ring signature

## 🚀 Deployment

### Docker

```bash
# Build and run
docker build -t pubky-calendar .
docker run -p 3000:3000 pubky-calendar
```

### Environment Variables

Create `.env.local`:

```env
# Optional: Custom configuration
NEXT_PUBLIC_APP_NAME="Pubky Calendar"
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test with Pubky Ring authentication
5. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details

## 🔗 Links

- [Pubky Ecosystem](https://pubky.org)
- [Pubky Ring App](https://pubky.app)
- [Pubky Documentation](https://docs.pubky.org)
