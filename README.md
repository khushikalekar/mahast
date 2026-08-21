# MahaST – Smart Maharashtra Bus 🚌

A modern full-stack public transportation application for Maharashtra, India.

> ⚠️ **This is a prototype using simulated GPS data. It does NOT connect to real MSRTC live GPS or official schedules.**

---

## Quick Start

```bash
cd mahast
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### Demo Credentials

| Role | Email | Password |
|------|-------|----------|
| Passenger | passenger@mahast.demo | passenger123 |
| Admin | admin@mahast.demo | admin123 |

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 16 (App Router), React 19, TypeScript |
| Styling | Tailwind CSS v4, CSS custom properties |
| State | Zustand (persist) |
| Data Fetching | TanStack Query, Axios |
| Database | LibSQL (SQLite-compatible, in-process) |
| Auth | JWT (jsonwebtoken + bcryptjs) |
| Maps | Leaflet + OpenStreetMap (no API key needed) |
| Charts | Recharts |
| GPS | Simulated provider (abstracted for real integration) |

---

## Application Structure

```
src/
├── app/
│   ├── page.tsx              # Home - search + quick actions
│   ├── search/               # Bus search results
│   ├── trip/[tripId]/        # Trip details + live tracking
│   ├── live/                 # Live fleet overview
│   ├── nearby/               # Nearby buses by location
│   ├── favourites/           # Saved routes/buses
│   ├── ai/                   # AI Travel Assistant
│   ├── emergency/            # SOS + safety features
│   ├── complaints/new/       # Report a problem
│   ├── feedback/new/         # Rate a journey
│   ├── share/[code]/         # Shared journey view
│   ├── profile/              # User settings + language
│   ├── login/ register/      # Auth pages
│   ├── admin/                # Admin dashboard
│   │   ├── buses/            # Bus management
│   │   ├── fleet/            # Live fleet monitor
│   │   ├── complaints/       # Complaints management
│   │   └── feedback/         # Feedback review
│   └── api/                  # All API routes
├── components/
│   ├── layout/               # Navbar, BottomNav, DemoBanner
│   ├── live-map.tsx          # Leaflet map component
│   └── providers.tsx         # React Query + dark mode
└── lib/
    ├── db.ts                 # LibSQL database
    ├── seed.ts               # Demo data seeder
    ├── auth.ts               # JWT utilities
    ├── gps-provider.ts       # GPS abstraction layer ⭐
    ├── i18n.ts               # English/Marathi/Hindi translations
    ├── store.ts              # Zustand global state
    ├── utils.ts              # Helpers
    └── init.ts               # DB + GPS bootstrap
```

---

## GPS Provider Architecture

The application separates GPS data from business logic. See [`src/lib/gps-provider.ts`](src/lib/gps-provider.ts):

```
GPSProvider (interface)
├── SimulatedGPSProvider  ← currently active (moves buses every 5s)
└── RealGPSProvider       ← implement this for live MSRTC data
```

To integrate a real GPS source:
1. Create a class implementing `GPSProvider` in `gps-provider.ts`
2. Call `initialize()` with real trip/location data
3. Set `NEXT_PUBLIC_GPS_PROVIDER=real` in `.env.local`

---

## Demo Routes

| Route | Type | Stops |
|-------|------|-------|
| Ahmednagar → Pune | Ordinary, Semi-Luxury, Luxury | Shrirampur, Sangamner, Alephata, Chakan, Pimpri |
| Pune → Ahmednagar | Ordinary, Semi-Luxury | Pimpri, Chakan, Alephata, Sangamner, Shrirampur |
| Pune → Nashik | Ordinary, Luxury | Alephata, Sangamner, Sinnar |
| Nashik → Pune | Ordinary | Sinnar, Sangamner, Alephata |
| Mumbai → Pune | Semi-Luxury, Luxury | Panvel, Khopoli, Lonavala, Pimpri |
| Ahmednagar → Shirdi | Ordinary | Kopargaon |

---

## Features

### Passenger
- 🔍 Bus search (From → To, date, type filter)
- 🗺️ Live tracking with animated bus marker (Leaflet + OSM)
- 📍 Nearby buses (real or demo GPS location)
- 🔔 "Don't Miss My Stop" stop alerts
- ❤️ Favourite routes and buses
- 🤖 AI Travel Assistant (English + मराठी + हिंदी)
- 🚨 Emergency SOS panel
- 📝 Feedback & complaint submission
- 🔗 Journey sharing (temporary link with 24h expiry)
- 🌙 Dark/light mode
- 🌐 Multilingual (EN/MR/HI)

### Admin
- 📊 Dashboard with charts (route usage, complaint categories)
- 🚌 Bus management (add/edit/deactivate)
- 🗺️ Live fleet monitor
- 🛠️ Complaints management with responses
- ⭐ Feedback review

---

## Environment Variables

```env
# .env.local
JWT_SECRET=your-secret-here
NEXT_PUBLIC_GPS_PROVIDER=simulated

# Future: real MSRTC GPS integration
# MSRTC_GPS_API_URL=https://api.msrtc.example.com/gps
# MSRTC_GPS_API_KEY=your_key
```

---

## Database

SQLite (via LibSQL) — file stored at `mahast.db` in the project root.
Auto-initialized and seeded on first run.

To reset demo data: delete `mahast.db` and restart the dev server.

---

## Maps

Uses [Leaflet](https://leafletjs.com) with [OpenStreetMap](https://www.openstreetmap.org) tiles — **no API key required**.

---

Built as a prototype. Not affiliated with MSRTC.
