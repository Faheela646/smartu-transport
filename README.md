# SmartU Transport — merged web portal

One React 18/Vite application for Admin, Day Scholar, Hostelite, Conductor, and Driver accounts. Project A's Admin theme, layouts, Day Scholar features, Driver module, route/fleet data, shared UI components, and existing attendance QR behavior remain the baseline. FAST CFD's hostelite trip booking, single-use ticket pass, conductor trip lifecycle, and violation penalty flow are integrated into that application. Day Scholars retain Project A's original ticket page; the new admin-approved, trip-bound booking page is shown only to Hostelites.

## Run locally

```powershell
npm install
Copy-Item .env.example .env
npm run dev
```

Vite serves HTTPS for camera and GPS testing. Open its local URL on the development machine. On a phone on the same Wi-Fi, use the HTTPS Network URL and accept the development certificate warning. Camera and geolocation require permission; on production they require HTTPS.

Build and preview:

```powershell
npm run build
npm run preview
```

By default, `VITE_USE_MOCK=true` uses the persisted Zustand/localStorage mock store. Persisted workflow, roster, and notification state is shared between tabs with `BroadcastChannel` and storage events; each tab keeps its own signed-in actor. To use a backend, set `VITE_USE_MOCK=false` and `VITE_API_BASE_URL=/api`; `VITE_PROXY_TARGET` controls the optional Vite `/api` proxy target.

## Demo accounts

| Role | Login ID | Password |
|---|---|---|
| Admin | `admin` | `admin123` |
| Day Scholar | `22F-3082` | `3082@fast` |
| Hostelite | `22F-3091` | `3091@fast` |
| Conductor | `conductor_1` | `conductor123` |
| Driver | `driver_1` | `driver123` |

## Hostelite ticket lifecycle

1. Sign in as `22F-3091`, open **Hostelite Tickets**, choose date, route, trip, searchable drop-off stop, and full/half fare; submit the request.
2. Sign in as `admin`, open **Booking Requests**, select a matching bus/trip and seated/standing type, then approve and issue the pass (or reject with a reason). Bulk approval is also available.
3. The hostelite's ticket list updates live. An issued pass displays its QR code, route, stop, bus, trip time, status, and expiry countdown.
4. Sign in as `conductor_1`, start the assigned trip, and open **Start Scanning**. A first valid pass scan changes it to **USED** and records the scan. A repeated scan displays **Already used** in red. Ending a trip expires its unused issued passes.
5. The hostelite can submit another request after the previous request has reached a terminal state. Unpaid fees or fines block new requests.

## Conductor violation test

From the active trip, choose **Notify Admin**, enter a registered roll number (for example `22F-3091`), select a violation, and submit. The first report adds Rs. 1,000 to the fine sheet; the second adds Rs. 5,000; the third and later reports are referred to the Disciplinary Committee. Admin receives a notification and can resolve, waive, or escalate the report under **Violations**.

## End-to-end test script

1. Log in as **Hostelite** (`22F-3091` / `3091@fast`).
2. Request a trip for today: choose **D-Ground — Susan Road Route**, select a departure and stop, then submit.
3. Log out and log in as **Admin** (`admin` / `admin123`). Open **Booking Requests** and approve the new request, leaving the assigned bus/trip and seat type valid.
4. Log back in as the Hostelite; confirm the QR pass and its trip details appear.
5. Open a separate browser profile/tab and sign in as **Conductor** (`conductor_1` / `conductor123`). Start today's assigned trip and start scanning. Present the hostelite QR; expect green **Boarded** feedback.
6. Present the same QR again; expect red **Already used**. In Admin, open **Scan Logs & Attendance** and verify both outcomes.
7. As Conductor, open **Notify Admin**, report `22F-3091`, and submit a violation. As Admin, verify the notification and record in **Violations** and **Notification Center**.

## Backend API contract

The Axios adapter in `src/api/transportService.js` uses the following `/api` endpoints when mock mode is disabled:

| Method | Endpoint | Purpose |
|---|---|---|
| `GET` | `/api/tickets?studentId={id}` | List a student's tickets and pass states |
| `GET` | `/api/trips?date={YYYY-MM-DD}` | List routes' scheduled trips and capacity |
| `POST` | `/api/tickets` | Create a `REQUESTED` ticket |
| `POST` | `/api/tickets/{ticketId}/approve` | Approve, assign bus/trip/seat type, and issue a pass |
| `POST` | `/api/tickets/{ticketId}/reject` | Reject with a reason |
| `POST` | `/api/scans` | Validate and consume a pass or record a scan |
| `POST` | `/api/scans/sync` | Reconcile offline scans and report conflicts |
| `GET` | `/api/scans?tripId={id}` | Retrieve scan logs |
| `POST` | `/api/violations` | Create a violation and penalty |
| `GET` | `/api/violations` | List Admin violation records |
| `PATCH` | `/api/violations/{id}` | Resolve, waive, or escalate a violation |
| `GET` | `/api/notifications` | List notifications visible to the signed-in actor |
| `POST` | `/api/notifications/read` | Mark the actor's notifications as read |
| `PATCH` | `/api/trips/{tripId}/bus` | Reassign a trip bus and its approved tickets |

The backend must enforce ticket state transitions, trip capacity, account status, dues, and QR nonce single-use atomically. UI code can be switched to this adapter without replacing the existing theme or route tree.

## Notes and assumptions

- Project A's five routes/buses/stops remain the canonical fleet. For a route contact, the assigned conductor and phone are displayed because Project A has no separate authorized-person field.
- Approval and pass issuance occur together in the Admin action; the ticket history records both `APPROVED` and `PASS_ISSUED`.
- Demo trip inventory covers today and the next two days. Fare demo values are Rs. 250 (full) and Rs. 125 (half).
- The frontend mock persists data in this browser only. A backend is required for authoritative, cross-device offline reconciliation and production identity/payment processing.
