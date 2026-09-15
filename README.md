# SmartU Transport

A comprehensive University Transport Management System frontend for **FAST NUCES — Chiniot-Faisalabad Campus (CFD)**.

This is a **frontend-only** application. All backend behavior — database, auth, and real-time GPS/Socket.IO events — is simulated locally using Zustand state, `setTimeout`/`setInterval`, and `localStorage`. No server is required.

## Tech Stack

- React 18 + Vite
- Tailwind CSS + hand-built shadcn/ui-style components (Radix UI primitives)
- React Router DOM v6
- Zustand (mock database, auth, sockets, map state)
- React-Leaflet + OpenStreetMap (no API key needed)
- `html5-qrcode` (conductor camera scanning) + `qrcode.react` (student QR passes)
- `next-themes` (dark/light mode)

## Getting Started

```bash
npm install
npm run dev
```

Then open the printed local URL (typically `http://localhost:5173`).

To build for production:

```bash
npm run build
npm run preview
```

## Demo Accounts

There is no self-registration — all accounts are pre-provisioned, exactly as a real deployment would work.

| Role | Login ID | Password |
|---|---|---|
| Admin | `admin` | `admin123` |
| Day Scholar | `22F-3082` | `student123` |
| Hostelite | `22F-3091` | `student123` |
| Conductor | `conductor_1` | `conductor123` |
| Driver | `driver_1` | `driver123` |

Roll numbers follow the pattern `##[A-Z]{1,4}-####` (e.g. `22F-1111`, `21K-0234`, `23CFD-1021`).

## Module Guide

- **Admin** (`/admin`) — desktop-optimized dashboard: analytics, student CRUD with fine/fee sheet, staff CRUD with emergency reassignment, fleet CRUD with forced-replacement maintenance workflow, route/schedule builder, and a live announcement broadcaster.
- **Student** (`/student`) — mobile-first: live map tracking with a simulated moving bus, hostelite seat booking (calendar + full/half fare), a 30-second self-refreshing QR boarding pass, a wallet for fines/challans, and a floating mock AI chatbot.
- **Conductor** (`/conductor`) — high-contrast full-screen camera scanner using `html5-qrcode`, continuous scanning with green/red flash feedback, and an offline queueing system that syncs when connectivity returns.
- **Driver** (`/driver`) — dark-mode-by-default cockpit view: `watchPosition` GPS broadcasting, Screen Wake Lock, and one-tap emergency status broadcasts (Traffic Delay / Breakdown / On Schedule).

## Notes

- Camera and geolocation features require the browser to grant permissions, and (outside `localhost`) generally require HTTPS.
- All data resets on a full page reload except the logged-in session, which persists via `localStorage`.
