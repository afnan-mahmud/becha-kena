# 📱 Becha-Kena Mobile App — Step-by-Step Development Prompts

> **Tech Stack:** Expo SDK 57 + React Native 0.86 + TypeScript + Expo Router (file-based routing, `src/app/`)
> **Backend:** Express.js + MongoDB + Socket.io (already built, in `backend/`) — Base URL: `/api/v1`
> **Setup Folder:** `mobile-app/`
> **Goal:** Build a production-ready mobile app from scratch (0 → store) by feeding these prompts to an AI coding assistant one by one.
>
> ✅ Every endpoint, field name, enum value and socket event in this file has been checked against the code in `backend/src`. If something in a prompt disagrees with the backend, **the backend wins** — see the [API Contract](#-api-contract-source-of-truth) section.

---

## 🧭 How to use this guide (read first)

1. **Run your AI assistant from the repository root** (the folder that contains `backend/`, `frontend/`, `mobile-app/`, `docs/`). Then the AI can open `backend/src/...` and this file whenever it needs to double-check an API.
2. Feed **one prompt at a time**. After each prompt: run the app, test it, fix errors, commit. Then go to the next prompt.
3. Each prompt is inside a grey code block — copy everything inside the block (code inside a prompt is part of the prompt).
4. `mobile-app/AGENTS.md` tells the AI to read the **SDK 57 docs** before touching any Expo API. Keep that rule — Expo APIs change every SDK.
5. Always install Expo packages with `npx expo install <pkg>` (it picks versions compatible with SDK 57). Plain JS libraries (zustand, axios, socket.io-client) can also be installed with `npx expo install`.

### Running the backend for mobile development

```bash
# Terminal 1 — backend (needs backend/.env, see backend/.env.example)
cd backend
npm install
npm run dev              # http://localhost:5000/api/v1/health

# Terminal 2 — mobile app
cd mobile-app
npm install
npx expo start
```

- **OTP during development:** no real SMS is sent yet. The OTP is printed in the backend terminal:
  `[SMS Gateway Mock] Sending OTP 123456 to +8801XXXXXXXXX`
- **Which URL should the phone use?** A phone/emulator cannot reach your laptop's `localhost`.
  - Physical phone (Expo Go / dev build) → your laptop's LAN IP, e.g. `http://192.168.0.105:5000`
  - Android emulator → `http://10.0.2.2:5000`
  - iOS simulator → `http://localhost:5000`
- **KYC approval:** verification is reviewed **manually by an admin** in the web admin panel (`/admin/kyc-queue`). To test the full app, log in to the web app with an admin account (create one with `backend/src/scripts/seedAdmin.ts`) and approve your test user.
- **Ad approval:** new ads are `pending` until an admin/moderator approves them at `/admin/moderation`.

---

## 🔖 Table of Contents

| Phase | Scope | Prompts | Class |
|-------|-------|---------|-------|
| **Phase 0** | Project Foundation & Architecture Setup | Prompt 1-3 | Lesson 8.4 |
| **Phase 1** | Authentication System (OTP Login) | Prompt 4-7 | Lesson 8.4 |
| **Phase 2** | KYC / NID Verification | Prompt 8-11 | Lesson 8.5 |
| **Phase 3** | Home Feed & Listing Browse | Prompt 12-15 | Lesson 8.5 |
| **Phase 4** | Search, Filter & Location | Prompt 16-18 | Lesson 8.6 |
| **Phase 5** | Ad Creation & Management | Prompt 19-23 | Lesson 8.6 |
| **Phase 6** | Listing Detail Page & Public Profile | Prompt 24-26 | Lesson 8.7 |
| **Phase 7** | Real-time Chat System | Prompt 27-31 | Lesson 8.7 |
| **Phase 8** | User Profile & Reviews | Prompt 32-35 | Lesson 8.8 |
| **Phase 9** | Notifications (In-App + Push Token) | Prompt 36-38 | Lesson 8.8 |
| **Phase 10** | Reports | Prompt 39-40 | Lesson 8.8 |
| **Phase 11** | Settings & Account Management | Prompt 41-43 | Lesson 8.8 |
| **Phase 12** | Polish, Animations & UX | Prompt 44-46 | Lesson 8.9 |
| **Phase 13** | Testing & Bug Fixes | Prompt 47-49 | Lesson 8.9 |
| **Phase 14** | Production Build & Deployment | Prompt 50-52 | Lesson 8.9 |

Detailed class notes for each lesson live in [`docs/classes/`](./classes/).

---

## 📘 API Contract (source of truth)

> Give this section to the AI whenever it is unsure about an endpoint. It reflects `backend/src/routes`, `controllers`, `services`, `models` and `sockets`.

### Envelope & errors

```jsonc
// success
{ "success": true, "message": "optional text", "data": { /* payload */ } }
// error
{ "success": false, "error": "Human readable message", "code": "MACHINE_CODE", "details": ["optional", "list"] }
```

- Every Mongo document is returned with **both `id` and `_id`** (same string). Use `id` in the app.
- Dates are ISO strings.
- Common error codes: `TOKEN_MISSING`, `INVALID_TOKEN`, `TOKEN_EXPIRED` (401) · `ACCOUNT_SUSPENDED`, `VERIFICATION_REQUIRED`, `ACCESS_DENIED` (403) · `NOT_FOUND`, `ROUTE_NOT_FOUND` (404) · `VALIDATION_FAILED`, `INVALID_ID`, `BAD_REQUEST` (400) · `DUPLICATE_ENTRY` (409) · `RATE_LIMIT_EXCEEDED` (429) · `INTERNAL_ERROR` (500).
- **`VERIFICATION_REQUIRED` (403)** is returned when an unverified user calls an endpoint that needs NID verification (post ad, chat, review, report…).

### Authentication (mobile = Bearer token)

The web app uses httpOnly cookies; **the mobile app uses the tokens from the response body** and sends `Authorization: Bearer <accessToken>`.

| Method | Path | Auth | Body | `data` on success |
|---|---|---|---|---|
| POST | `/auth/request-otp` | – | `{ phoneNumber }` (`01XXXXXXXXX`, `8801…` or `+8801…`) | `{ expiresIn: 180 }` |
| POST | `/auth/verify-otp` | – | `{ phoneNumber, otpCode }` (`otpCode` = **string** of 6 digits) | `{ user, accessToken, refreshToken }` |
| POST | `/auth/refresh` | – | `{ refreshToken }` | `{ accessToken }` |
| POST | `/auth/logout` | Bearer | – | – (invalidates **all** tokens of the user) |

- Access token lives **15 minutes**, refresh token **7 days** (refresh token is not rotated).
- Errors: `request-otp` → 400 `INVALID_PHONE`, 429 `RATE_LIMIT_EXCEEDED` (5 requests/hour per IP). `verify-otp` → 401 `INVALID_OTP`, 401 `OTP_EXPIRED`, 429 `OTP_ATTEMPTS_EXCEEDED` (5 wrong tries burns the code), 403 `ACCOUNT_SUSPENDED`.
- `refresh` → 401 `INVALID_TOKEN` / `TOKEN_EXPIRED` → log the user out.

### User

```ts
interface User {
  id: string; phoneNumber: string;            // "+8801712345678"
  displayName: string;                         // nickname, 1-30 chars (default "User5678")
  verifiedName: string | null;                 // legal name, set by admin on KYC approval
  isVerified: boolean;
  ageGroup: 'adult' | 'minor' | null;
  role: 'user' | 'moderator' | 'admin';
  status: 'active' | 'suspended' | 'inactive';
  averageRating: number; totalReviews: number;
  lastLoginDate: string; deletionRequestedAt: string | null; createdAt: string;
}
```

| Method | Path | Auth | Notes |
|---|---|---|---|
| GET | `/users/me` | Bearer | `data` = `User` |
| PUT | `/users/me` | Bearer | body `{ displayName?, fcmToken? }` → updated `User`. HTML is stripped. **There is no avatar/photo field.** |
| DELETE | `/users/me` | Bearer | Soft delete: archives the user's ads, revokes all tokens. PII is purged after 30 days unless the user logs in again. |
| GET | `/users/:id` | – | Public profile: `{ id, displayName, verifiedName, isVerified, averageRating, totalReviews, createdAt }` |

### KYC / NID verification (`/kyc`, Bearer)

| Method | Path | Body | `data` |
|---|---|---|---|
| POST | `/kyc/verify-adult` | `{ nidNumber, dob, selfieUrl }` | `{ verificationStatus: "pending_review" }` |
| POST | `/kyc/verify-minor` | `{ parentNidNumber, dob, parentSelfieUrl, consentConfirmed: true }` | `{ verificationStatus: "pending_review" }` |
| GET | `/kyc/status` | – | `{ status: VerificationLog \| null }` |

- `nidNumber` = 10, 13 or 17 digits. `dob` = `"YYYY-MM-DD"` (the **user's** date of birth in both flows). Adults must be 18+, minor flow must be under 18.
- Only **one selfie URL** is sent. The backend does **not** accept NID card photos.
- Every submission goes to **manual review**; `isVerified` becomes `true` only after an admin approves. Poll `GET /kyc/status` / `GET /users/me` to detect approval.
- `VerificationLog`: `{ id, verificationType: 'adult'|'minor', verificationStatus: 'pending_review'|'approved'|'rejected', manualReviewReason: string|null, selfieUrl, createdAt }`.
- Errors: `INVALID_NID`, `INVALID_DOB`, `INVALID_SELFIE`, `UNDERAGE`, `NOT_A_MINOR`, `CONSENT_REQUIRED` (400) · `NID_BANNED`, `PARENT_NID_LIMIT` (403, max 3 minors per parent NID) · `ALREADY_VERIFIED`, `KYC_PENDING` (409) · `KYC_LIMIT_REACHED` (429, 3 attempts/day).

### Media upload (`/media`, Bearer)

`POST /media/presigned-url` body `{ fileName, fileType, folder }` → `{ uploadUrl, fileUrl }`

- `fileType` ∈ `image/jpeg` · `image/png` · `image/webp`. `folder` ∈ `listings` · `kyc` · `avatars`.
- Then `PUT uploadUrl` with the raw file bytes and header `Content-Type: <same fileType>`. The URL expires in **5 minutes**.
- Save `fileUrl` — that is the public image URL you send to other endpoints.

### Listings (`/listings`)

```ts
type Condition = 'new' | 'like_new' | 'used';
type ListingStatus = 'pending' | 'active' | 'sold' | 'archived';
interface SellerSummary { id: string; displayName: string; verifiedName: string | null; isVerified: boolean;
  averageRating: number; totalReviews: number; createdAt: string; phoneNumber?: string | null }
interface Listing {
  id: string;
  sellerId: string | SellerSummary;   // populated object on public endpoints, plain id on /listings/my
  title: string; description: string; price: number;
  category: string; condition: Condition; images: string[]; hidePhoneNumber: boolean;
  location: { type: 'Point'; coordinates: [number, number] /* [lng, lat] */;
              division?: string; district?: string; thana?: string; addressLine?: string };
  status: ListingStatus; soldToBuyerId: string | null;
  moderationFlags?: { flagType: 'keyword'|'image'|'report'|'manual'|null; flagReason: string|null };
  distance?: number;                  // meters, only for lat/lng searches
  expiresAt: string; createdAt: string; updatedAt: string;
}
```

| Method | Path | Auth | Notes |
|---|---|---|---|
| GET | `/listings` | – | Only `active` ads. Query: `page`, `limit` (max 50), `search`, `category`, `condition`, `minPrice`, `maxPrice`, `division`, `district`, `thana`, `sellerId`, `sort` (`newest` · `oldest` · `price_low` · `price_high`), `lat`+`lng`+`radius` (meters; results sorted by distance). → `{ listings, total, page, limit, totalPages }` |
| GET | `/listings/my` | Bearer | Query `status?`, `page`, `limit` → same shape (`sellerId` is a plain string) |
| GET | `/listings/:id` | optional Bearer | Full ad with populated `sellerId`. `sellerId.phoneNumber` is `null` unless the viewer is verified **and** `hidePhoneNumber` is false. Pending/archived ads → 404 for everyone except the owner. |
| POST | `/listings` | Bearer + verified | body below → **201**, ad starts as `pending` |
| PUT | `/listings/:id` | Bearer + verified | partial body; only `active`/`pending` ads; a new title or >20% price change sends the ad back to `pending` |
| PATCH | `/listings/:id/sell` | Bearer + verified | `{ buyerId? }` — buyer must have a chat room for this ad (`NO_CHAT_HISTORY`); omit `buyerId` for "sold outside the app" |
| PATCH | `/listings/:id/renew` | Bearer + verified | +30 days; also re-activates `archived` ads (not rejected ones → `LISTING_REJECTED`) |
| DELETE | `/listings/:id` | Bearer + verified | soft delete → status `archived` |

**Create body** (`POST /listings`):

```json
{
  "title": "iPhone 13 Pro 128GB — fresh condition",
  "description": "20-1000 characters …",
  "price": 68000,
  "category": "Mobile",
  "condition": "used",
  "images": ["https://…/listings/<userId>/<uuid>_photo.jpg"],
  "hidePhoneNumber": false,
  "location": { "coordinates": [90.4125, 23.8103], "division": "ঢাকা", "district": "ঢাকা", "thana": "ধানমন্ডি", "addressLine": "Road 7" }
}
```

Rules: title 10-80 chars · description 20-1000 chars · price number ≥ 0 · 1-10 images · `coordinates` = **[longitude, latitude]**. Ads auto-expire (archived) 30 days after posting. A **rejected** ad = `status: "archived"` + `moderationFlags.flagType: "manual"` + `moderationFlags.flagReason`.

**Category values** (must match the web app exactly):

| value (send to API) | Bangla label | emoji |
|---|---|---|
| `Mobile` | মোবাইল | 📱 |
| `Electronics` | ইলেকট্রনিক্স | 💻 |
| `Vehicles` | গাড়ি ও বাইক | 🏍️ |
| `Furniture` | আসবাবপত্র | 🛋️ |
| `Cycles` | সাইকেল | 🚲 |
| `Fashion` | ফ্যাশন | 👗 |
| `Health & Beauty` | স্বাস্থ্য ও সৌন্দর্য | 💄 |
| `Food & Restaurant` | খাবার | 🍛 |
| `Travel` | ভ্রমণ | 🧳 |
| `Sports & Outdoors` | খেলাধুলা | 🏏 |
| `Other` | অন্যান্য | 📦 |

**Locations:** division / district / thana are stored as **Bangla strings**, exactly like `frontend/src/utils/locations.ts` (copy that file). Division centre coordinates `[lng, lat]`: ঢাকা `[90.4125, 23.8103]` · চট্টগ্রাম `[91.7832, 22.3569]` · রাজশাহী `[88.6042, 24.3745]` · খুলনা `[89.5403, 22.8456]` · বরিশাল `[90.3535, 22.701]` · সিলেট `[91.8687, 24.8949]` · রংপুর `[89.2752, 25.7439]` · ময়মনসিংহ `[90.4203, 24.7471]`.

### Chat (`/chat`, Bearer + verified)

| Method | Path | Notes |
|---|---|---|
| GET | `/chat/rooms` | `ChatRoom[]`, newest activity first |
| POST | `/chat/rooms` | `{ listingId }` → existing or new `ChatRoom` (errors `SELF_CHAT_NOT_ALLOWED`, `INACTIVE_LISTING`) |
| GET | `/chat/rooms/:roomId/messages` | `?page=1&limit=50` (max 100) → `{ messages, total, page, totalPages }` — **newest first**; also marks the other person's messages as read |

```ts
interface UserPreview { id: string; displayName: string; verifiedName: string | null; isVerified: boolean }
interface Message { id: string; roomId: string; senderId: string; sender: UserPreview | null;
  messageText: string; readStatus: boolean; createdAt: string }
interface ChatRoom {
  id: string; listingId: string; buyerId: string; sellerId: string;
  listing: { id: string; title: string; images: string[]; price: number; status: ListingStatus;
             soldToBuyerId: string | null; sellerId: string } | null;
  buyer: UserPreview | null; seller: UserPreview | null;
  lastMessage: Message | null; unreadCount: number; latestActivity: string; createdAt: string; updatedAt: string;
}
```

The "other person" in a room = `room.sellerId === me.id ? room.buyer : room.seller`.

### Socket.io (real-time chat)

- Connect: `io(`${SOCKET_URL}/chat`, { auth: { token: accessToken }, transports: ['websocket'] })` — `SOCKET_URL` is the server origin **without** `/api/v1`.
- Only **verified** users can connect. Failures arrive as `connect_error` with messages like `Authentication failed: Token revoked` / `Verified account required`. An expired access token also fails → refresh the token, then reconnect.

| Direction | Event | Payload |
|---|---|---|
| client → server | `join_room` | `{ roomId }`, ack `{ success, roomId?, error? }` |
| client → server | `leave_room` | `{ roomId }` |
| client → server | `send_message` | `{ roomId, messageText }` (≤ 1000 chars), ack `{ success: true, data: { message, warnings } }` or `{ success: false, error }` |
| client → server | `typing` | `{ roomId }` (only relayed after `join_room`) |
| client → server | `mark_read` | `{ roomId }` |
| server → client | `room_joined` | `{ roomId }` |
| server → client | `new_message` | `Message` — sent to **both participants** even if they have not joined the room (use it to update the chat list + unread badge) |
| server → client | `user_typing` | `{ roomId, userId }` |
| server → client | `messages_read` | `{ roomId, readBy }` |
| server → client | `message_warning` | `{ roomId, messageId, warnings: string[] }` |
| server → client | `chat_error` | `{ message, code }` |

The server **sanitises** every message: links become `[link removed]`, Bangladeshi phone numbers become `***** *****`, and "advance payment" scams trigger a warning. There is **no online/offline presence** event.

### Reviews (`/reviews`)

| Method | Path | Auth | Notes |
|---|---|---|---|
| POST | `/reviews` | Bearer + verified | `{ listingId, rating, reviewText }` — `rating` integer 1-5, `reviewText` required (≤ 500). Only the buyer the ad was sold to (`soldToBuyerId`) can review, a chat room must exist, one review per ad (409 `DUPLICATE_ENTRY`). |
| GET | `/reviews/user/:userId` | – | `?page` → `{ reviews, total, page, totalPages, averageRating }`; each review has `reviewerId: { id, displayName, isVerified }` and `listingId: { id, title, images, price }` populated |

### Reports (`/reports`)

| Method | Path | Auth | Notes |
|---|---|---|---|
| POST | `/reports` | Bearer + verified | `{ targetType: 'Listing' \| 'User', targetId, reason, description }` — `reason` ∈ `scam` · `harassment` · `misrepresentation` · `inappropriate` · `other`; `description` **required** (1-1000). Errors: `DUPLICATE_REPORT` (409), cannot report yourself / your own ad. |
| GET | `/reports/my` | Bearer | `{ reports, total, page, totalPages }`; `status` ∈ `pending` · `reviewed` · `resolved` · `dismissed`, plus `resolution` text; `targetId` populated with `{ id, title }` or `{ id, displayName }` |

### Notifications

The backend **stores** device push tokens (`PUT /users/me { fcmToken }`) but **does not send push notifications yet** (sending is marked TODO in `admin.service.ts` and `scheduler.service.ts`). In the app, real-time alerts come from the socket (`new_message`) and from polling (`/kyc/status`, `/listings/my`).

---

## ⚙️ Phase 0: Project Foundation & Architecture Setup

### ✅ Prompt 1 — Project Cleanup & Folder Structure Setup

````
Set up a clean project structure in the `mobile-app/` folder for our Becha-Kena mobile app (a Bangladeshi, NID-verified second-hand marketplace). It is an existing Expo SDK 57 + React Native 0.86 + TypeScript + Expo Router project. Routes live in `src/app/`, and the `@/*` path alias points to `src/*` (see tsconfig.json). Read mobile-app/AGENTS.md first and follow it.

Remove the default boilerplate (src/app/explore.tsx, components/animated-icon*, app-tabs*, hint-row, web-badge, external-link, collapsible, themed-* and their imports) and create this production-grade structure:

src/
├── app/                        # Expo Router routes ONLY
│   ├── _layout.tsx             # Root Stack + providers (QueryClient, GestureHandler, SafeArea), auth bootstrap
│   ├── index.tsx               # Redirect: not logged in → (auth)/welcome or login; logged in → (app)/(tabs)/home
│   ├── (auth)/
│   │   ├── _layout.tsx         # Stack, headerShown false; redirect to home if already logged in
│   │   ├── welcome.tsx         # Onboarding slides
│   │   ├── login.tsx           # Phone number input
│   │   └── verify-otp.tsx      # OTP verification
│   ├── (app)/
│   │   ├── _layout.tsx         # Stack; redirect to login if not logged in
│   │   ├── (tabs)/
│   │   │   ├── _layout.tsx     # Bottom tabs
│   │   │   ├── home.tsx
│   │   │   ├── search.tsx
│   │   │   ├── post.tsx
│   │   │   ├── chat.tsx
│   │   │   └── profile.tsx
│   │   ├── listing/[id].tsx
│   │   ├── listing/edit/[id].tsx
│   │   ├── my-listings.tsx
│   │   ├── chat/[roomId].tsx
│   │   ├── user/[id].tsx
│   │   ├── kyc/index.tsx       # KYC landing
│   │   ├── kyc/adult.tsx
│   │   ├── kyc/minor.tsx
│   │   ├── kyc/status.tsx
│   │   └── settings/
│   │       ├── index.tsx
│   │       ├── edit-profile.tsx
│   │       ├── notifications.tsx
│   │       ├── my-reports.tsx
│   │       └── about.tsx
│   └── +not-found.tsx
├── components/{ui,auth,listing,chat,kyc,common}/
├── services/                   # api.ts + one file per backend module
│   ├── api.ts, auth.service.ts, user.service.ts, kyc.service.ts, media.service.ts,
│   ├── listing.service.ts, chat.service.ts, review.service.ts, report.service.ts
├── store/                      # Zustand: auth.store.ts, chat.store.ts, ui.store.ts
├── hooks/                      # useSocket.ts, useLocation.ts, useImagePicker.ts, useRequireVerified.ts
├── lib/                        # socket.ts, storage.ts, validators.ts, format.ts
├── constants/                  # theme.ts, api.ts, categories.ts, locations.ts
└── types/                      # user.types.ts, listing.types.ts, chat.types.ts, api.types.ts

Create every route file with a minimal placeholder screen (title text) so the app runs and all routes resolve. Keep app.json, tsconfig.json and package.json. Make sure `npx tsc --noEmit` passes and `npx expo start` shows the placeholder screens.
````

---

### ✅ Prompt 2 — Design System & Theme Configuration

````
Create the design system for the Becha-Kena mobile app in `src/constants/theme.ts`. It must look like the Becha-Kena web app (frontend/src/styles/variables.css): a modern Bangladeshi marketplace — Bangladesh-flag green as primary, flag red as accent, marigold yellow highlights, warm off-white background.

1. Colors (light + dark):
   - primary #00704A, primaryDark #00563A, primaryDarker #003D29, primarySoft #E3F3EC
   - accent (flag red) #E63946, accentSoft #FDECEE
   - secondary (marigold) #F4B400, secondarySoft #FFF5D6
   - success #16A34A, warning #D97706, error #DC2626, info #2563EB, verified #0E9F6E
   - background #F7F5F0 (dark #0F1A15), surface #FFFFFF (dark #17241E)
   - text #1B2420 / textSecondary #5B6660 / textMuted #8F9892 (provide dark equivalents)
   - border #E7E3DA
   - chat bubbles: mine = primary with white text, theirs = surface with border
2. Typography — Bangla-first. Load "Hind Siliguri" (400/500/600/700) with expo-font + @expo-google-fonts/hind-siliguri, fall back to the system font:
   heading1 28/bold, heading2 22/semibold, heading3 18/semibold, body 16/regular, bodySmall 14, caption 12, button 16/semibold, price 20/bold.
   Keep the splash screen visible until fonts are loaded (expo-splash-screen is already configured).
3. Spacing scale: 4, 8, 12, 16, 20, 24, 32, 40, 48, 64
4. Radius: sm 6, md 10, lg 14, xl 20, xxl 28, full 9999
5. Shadows: sm / md / lg (iOS shadow* + Android elevation)
6. Dark mode: export `useTheme()` that returns the right palette using useColorScheme(), plus a manual override (system / light / dark) stored later in the UI store.

Also create reusable primitives in src/components/ui/: AppText (variants above), Button (primary / accent / outline / ghost / danger, sizes sm/md/lg, loading spinner, disabled, full width), Card, Badge (green/yellow/red/blue/neutral), Chip (selectable), Input (label, error, left icon, character counter), Screen (SafeAreaView + background + optional scroll + KeyboardAvoidingView).

Everything must be compatible with StyleSheet.create() and typed.
````

---

### ✅ Prompt 3 — API Client, Storage & Core Utilities

````
Create the core infrastructure layer for the Becha-Kena mobile app. Read the "API Contract" section of docs/mobile-app-prompts.md and backend/src/routes before writing code.

1. Environment (`mobile-app/.env`, add `.env` to .gitignore and create `.env.example`):
   EXPO_PUBLIC_API_URL=http://192.168.0.105:5000/api/v1   # your laptop LAN IP; Android emulator: http://10.0.2.2:5000/api/v1
   EXPO_PUBLIC_SOCKET_URL=http://192.168.0.105:5000        # server origin, NO /api/v1
   `src/constants/api.ts` reads them and exports API_URL, SOCKET_URL and an ENDPOINTS map:
   AUTH: /auth/request-otp, /auth/verify-otp, /auth/refresh, /auth/logout
   USER: /users/me (GET/PUT/DELETE), /users/:id
   KYC: /kyc/verify-adult, /kyc/verify-minor, /kyc/status
   MEDIA: /media/presigned-url
   LISTINGS: /listings, /listings/my, /listings/:id, /listings/:id/sell, /listings/:id/renew
   CHAT: /chat/rooms, /chat/rooms/:roomId/messages
   REVIEWS: /reviews, /reviews/user/:userId
   REPORTS: /reports, /reports/my

2. Secure storage (`src/lib/storage.ts`): expo-secure-store for accessToken + refreshToken; @react-native-async-storage/async-storage for non-sensitive data (onboarding flag, recent searches, preferences, cached user). Helpers: saveTokens({accessToken, refreshToken}), getAccessToken(), getRefreshToken(), clearTokens(), saveUser(), getUser(), clearAll().

3. API client (`src/services/api.ts`) with axios:
   - baseURL = API_URL, timeout 15s, JSON headers.
   - Request interceptor: `Authorization: Bearer <accessToken>` from SecureStore.
   - Response interceptor:
     • 401 on any request except /auth/* → call POST /auth/refresh with `{ refreshToken }` (only ONE refresh at a time; queue other failed requests), save the new accessToken, retry the original request once. If refresh fails → clear tokens, reset the auth store and router.replace('/(auth)/login').
     • Convert errors into a typed ApiError: `{ message: data.error, code: data.code, status, details }`. Network errors → message "ইন্টারনেট সংযোগ পরীক্ষা করুন", code "NETWORK_ERROR".
     • 403 ACCOUNT_SUSPENDED → log out and show a "account suspended" alert. 403 VERIFICATION_REQUIRED → navigate to /(app)/kyc.
   - Types: `ApiResponse<T> = { success: boolean; message?: string; data: T }`, `ApiErrorBody = { success: false; error: string; code: string; details?: string[] }`.
   - Remember: every document has `id` (and `_id`). Use `id`.

4. Validators (`src/lib/validators.ts`):
   - BD phone regex `^(?:\+88|88)?(01[3-9]\d{8})$`; normalizePhone() → `+8801XXXXXXXXX`; the UI collects 11 digits starting with 01.
   - OTP: exactly 6 digits (send as a string).
   - NID: 10, 13 or 17 digits.
   - Listing: title 10-80, description 20-1000, price number ≥ 0, images 1-10.
   - Display name 1-30 chars, strip HTML tags.

5. Formatters (`src/lib/format.ts`): formatPrice(68000) → "৳৬৮,০০০" (Bangla digits, Indian grouping via Intl 'bn-BD', with a manual fallback if Intl is missing), relative time in Bangla ("৫ মিনিট আগে") using date-fns + bn locale, formatDate, chat time ("১০:৩০ AM" / "গতকাল" / "১২ অক্টো"), maskPhone("+8801712345678") → "017•••••678".

Install: npx expo install expo-secure-store @react-native-async-storage/async-storage axios date-fns
````

---

## 🔐 Phase 1: Authentication System (OTP Login)

### ✅ Prompt 4 — Auth State Management (Zustand Store)

````
Create the authentication store for Becha-Kena with Zustand (`src/store/auth.store.ts`). Use the User type from the API Contract in docs/mobile-app-prompts.md (id, phoneNumber, displayName, verifiedName, isVerified, ageGroup, role, status, averageRating, totalReviews, createdAt).

State: user | null, isAuthenticated, isBootstrapping (true until the startup check finishes), hasOnboarded.

Actions:
- login({ user, accessToken, refreshToken }) → save both tokens in SecureStore, save user, set state. This is called with the `data` of POST /auth/verify-otp.
- logout() → call POST /auth/logout (ignore errors), disconnect the socket, clear SecureStore + cached user + chat store, reset state, router.replace('/(auth)/login').
- localLogout() → same but WITHOUT calling the API (used after account deletion or when refresh fails).
- setUser(user) / refreshUser() → GET /users/me and update.
- bootstrap() → on app start: read hasOnboarded + tokens; if a refresh token exists, call GET /users/me (the axios interceptor refreshes an expired access token automatically); on success set the user, on failure localLogout(). Always end with isBootstrapping = false.
- setOnboarded() → AsyncStorage flag.

Persistence: tokens ONLY in SecureStore; the user object may be cached in AsyncStorage (zustand persist) so the UI renders instantly, but always re-validate with /users/me.

Wire it up:
- Root `_layout.tsx` calls bootstrap() once and keeps the splash screen until isBootstrapping is false.
- `src/app/index.tsx` redirects: not onboarded → /(auth)/welcome, not authenticated → /(auth)/login, authenticated → /(app)/(tabs)/home.
- `(app)/_layout.tsx` redirects unauthenticated users to login; `(auth)/_layout.tsx` redirects authenticated users to home (use <Redirect /> from expo-router).
- Create `src/hooks/useRequireVerified.ts`: returns a function guard(actionName) that returns true if user.isVerified, otherwise shows an alert "এই কাজের জন্য NID দিয়ে যাচাই প্রয়োজন" and navigates to /(app)/kyc.

Install: npx expo install zustand
````

---

### ✅ Prompt 5 — Welcome / Onboarding Screen

````
Create the Welcome/Onboarding screen (`src/app/(auth)/welcome.tsx`) for Becha-Kena, styled with our theme (flag green, red accent, marigold highlights, Bangla text).

Design:
- 3 horizontally swipeable slides (FlatList with pagingEnabled or react-native-reanimated scroll handler):
  1. Logo + "বেচা-কেনা" + tagline "পুরনো জিনিস, নতুন ঠিকানা" — "বাংলাদেশের NID-যাচাইকৃত সেকেন্ড-হ্যান্ড মার্কেটপ্লেস"
  2. Shield illustration — "১০০% ভেরিফাইড ইউজার" — "প্রত্যেক বিক্রেতা জাতীয় পরিচয়পত্র দিয়ে যাচাইকৃত"
  3. Chat illustration — "নিরাপদ চ্যাট, সহজ ডিল" — "নম্বর না দিয়েই চ্যাট করুন, সামনাসামনি দেখে কিনুন"
  (Use @expo/vector-icons — Ionicons is bundled with Expo — inside large tinted circles if you don't have illustrations. Use @expo/vector-icons for ALL icons in this app.)
- Animated dot indicators (active dot widens), "পরবর্তী" button, "শুরু করুন" on the last slide, "স্কিপ" top-right.
- Animations with react-native-reanimated (already installed): parallax of the illustration, fade/translate of the text, smooth indicator width interpolation.

Logic: "শুরু করুন" / "স্কিপ" → setOnboarded() → router.replace('/(auth)/login'). Returning users never see this screen (handled in index.tsx).
````

---

### ✅ Prompt 6 — Phone Login Screen (OTP Request)

````
Create the Phone Login screen (`src/app/(auth)/login.tsx`).

Design:
- Small logo + heading "লগইন বা নতুন অ্যাকাউন্ট" + subtitle "মোবাইল নম্বর দিন — আমরা ৬ ডিজিটের কোড পাঠাব। পাসওয়ার্ড লাগবে না।"
- Phone field with a fixed "🇧🇩 +88" prefix, numeric keyboard, max 11 digits, placeholder "01XXXXXXXXX", auto-focus.
- Live validation with `^01[3-9]\d{8}$`; invalid → red border + "সঠিক ১১ ডিজিটের মোবাইল নম্বর দিন".
- Full-width primary button "OTP পাঠান" (disabled until valid, spinner while loading), haptic feedback (expo-haptics) on press.
- Footer: "চালিয়ে যাওয়ার মাধ্যমে আপনি আমাদের শর্তাবলিতে সম্মত হচ্ছেন".
- KeyboardAvoidingView + ScrollView (keyboardShouldPersistTaps="handled").

API: POST /auth/request-otp with `{ phoneNumber }` (send the 11-digit number; the backend normalises it).
- Success (`data.expiresIn` = 180) → router.push({ pathname: '/(auth)/verify-otp', params: { phone, expiresIn } }).
- Errors → show `error.message` from the API; 429 RATE_LIMIT_EXCEEDED → "অনেকবার চেষ্টা করেছেন, এক ঘণ্টা পর আবার চেষ্টা করুন"; NETWORK_ERROR → connection message.

Development tip shown only in __DEV__: "OTP ব্যাকএন্ড টার্মিনালে প্রিন্ট হয়".

Install: npx expo install expo-haptics
````

---

### ✅ Prompt 7 — OTP Verification Screen

````
Create the OTP Verification screen (`src/app/(auth)/verify-otp.tsx`).

Design:
- Back button "নম্বর পরিবর্তন", heading "কোডটি লিখুন", subtitle "+88 01XXXXXXXXX নম্বরে পাঠানো ৬ ডিজিটের কোড দিন" (phone from route params).
- 6 separate boxes (component `src/components/auth/OtpInput.tsx`): auto-focus next box, backspace moves back, paste/SMS autofill of all 6 digits (textContentType="oneTimeCode", autoComplete="sms-otp").
- Countdown from `expiresIn` (180s) shown as ৩:০০ → ০:০০. When it reaches 0 show "কোড পাননি? আবার পাঠান".
- Auto-submit when 6 digits are entered; also a "যাচাই করুন" button.

API: POST /auth/verify-otp with `{ phoneNumber, otpCode }` — otpCode must be a STRING.
- Success: `data` = `{ user, accessToken, refreshToken }` → authStore.login(data). Then:
  • user.isVerified === true → router.replace('/(app)/(tabs)/home')
  • otherwise → router.replace('/(app)/(tabs)/home') and show a one-time banner/alert inviting the user to verify with NID (unverified users can still browse).
- Errors (use `code`):
  • INVALID_OTP → "ভুল কোড" + shake animation + red boxes + clear input
  • OTP_EXPIRED → "কোডের মেয়াদ শেষ, নতুন কোড নিন"
  • OTP_ATTEMPTS_EXCEEDED → "অনেকবার ভুল হয়েছে, নতুন কোড নিন" (enable resend)
  • ACCOUNT_SUSPENDED → "আপনার অ্যাকাউন্ট স্থগিত করা হয়েছে"

Resend: POST /auth/request-otp again, restart the timer, allow max 3 resends on this screen (backend also limits 5 requests/hour/IP).

Animations (react-native-reanimated): box scale on focus, horizontal shake on error, all boxes turn green on success.
````

---

## 🪪 Phase 2: KYC / NID Identity Verification

> Backend facts: one selfie + NID number + date of birth. **No NID card photos.** Every submission becomes `pending_review` and an admin approves it from the web admin panel. See "KYC / NID verification" in the API Contract.

### ✅ Prompt 8 — KYC Service, Landing Page & Guard

````
Build the KYC entry point for Becha-Kena.

1. `src/services/kyc.service.ts`:
   - submitAdult({ nidNumber, dob, selfieUrl }) → POST /kyc/verify-adult
   - submitMinor({ parentNidNumber, dob, parentSelfieUrl, consentConfirmed: true }) → POST /kyc/verify-minor
   - getStatus() → GET /kyc/status → returns `data.status` (VerificationLog | null)
   Both submit endpoints return `data.verificationStatus === "pending_review"`.

2. `src/app/(app)/kyc/index.tsx` — KYC landing:
   - Purpose: without verification users cannot post ads, chat, review, report or see seller phone numbers.
   - Hero: shield icon + "আপনার পরিচয় যাচাই করুন" + "বিজ্ঞাপন দিতে, চ্যাট করতে ও বিক্রেতার নম্বর দেখতে একবার NID দিয়ে যাচাই করুন।"
   - Trust chips: "🔒 তথ্য এনক্রিপ্টেড" · "⏱ মাত্র ২ মিনিট" · "✅ একবার যাচাই, সবসময় ভেরিফাইড"
   - Two cards: "আমার বয়স ১৮+" (own NID) → /kyc/adult, "আমার বয়স ১৮-এর কম" (parent/guardian NID + consent) → /kyc/minor
   - Note: "আপনার NID নম্বর আমরা সরাসরি সংরক্ষণ করি না — শুধু এনক্রিপ্টেড হ্যাশ রাখা হয়।"
   - Guard on focus: if user.isVerified → replace to home. If getStatus() returns pending_review → replace to /kyc/status.
````

---

### ✅ Prompt 9 — Adult NID Verification Screen

````
Create the Adult verification flow (`src/app/(app)/kyc/adult.tsx`) — 3 steps with an animated progress bar (১/৩, ২/৩, ৩/৩).

Step 1 — NID information
- NID number input (numeric, 10, 13 or 17 digits; show an error otherwise).
- Date of birth picker (use @react-native-community/datetimepicker via `npx expo install`; maximumDate = today). The user must be 18+ (compute age; if under 18 suggest the minor flow).
- "পরবর্তী"

Step 2 — Live selfie
- Request camera permission with expo-camera (CameraView, facing="front"). If denied, offer expo-image-picker (launchCameraAsync, front camera) as a fallback and a button to open settings.
- Oval face guide overlay + text "মুখ ডিম্বাকৃতির ভেতরে রাখুন, ভালো আলোতে, চশমা/মাস্ক ছাড়া".
- Capture → preview → "আবার তুলুন" / "এটাই ঠিক আছে".

Step 3 — Review & submit
- Summary (masked NID like ••••••1234, DOB, selfie thumbnail) + privacy note.
- Submit: 1) upload the selfie with media.service uploadImage(uri, 'kyc') (Prompt 20 — create a minimal version now if it does not exist: compress to JPEG, POST /media/presigned-url { fileName, fileType: 'image/jpeg', folder: 'kyc' }, PUT the bytes to uploadUrl with Content-Type image/jpeg, return fileUrl). 2) POST /kyc/verify-adult { nidNumber, dob: 'YYYY-MM-DD', selfieUrl }.
- Loading overlay "জমা দেওয়া হচ্ছে…".
- Success (verificationStatus "pending_review") → router.replace('/(app)/kyc/status').
- Errors by code: KYC_LIMIT_REACHED → "আজ ৩ বার চেষ্টা হয়ে গেছে, আগামীকাল আবার চেষ্টা করুন"; KYC_PENDING → go to status screen; ALREADY_VERIFIED → refreshUser() and go home; NID_BANNED → "এই NID নিষিদ্ধ"; INVALID_NID / INVALID_DOB / UNDERAGE → show message on the right step.

Install: npx expo install expo-camera expo-image-picker expo-image-manipulator @react-native-community/datetimepicker
Add the camera/photo permission texts to app.json (expo-camera and expo-image-picker config plugins).
````

---

### ✅ Prompt 10 — Minor Verification Screen

````
Create the Minor (under 18) flow (`src/app/(app)/kyc/minor.tsx`). Reuse the step components from adult.tsx (move them to src/components/kyc/).

Steps:
1. Parent/guardian NID number (10/13/17 digits) + the USER'S own date of birth (must be under 18).
2. Parent/guardian live selfie (same camera component, instructions addressed to the parent).
3. Consent checkbox: "আমি নিশ্চিত করছি যে আমার অভিভাবক এই অ্যাকাউন্ট ব্যবহারে সম্মতি দিয়েছেন এবং প্রদত্ত NID তাঁর।" — submit disabled until checked.

Submit: upload the selfie (folder 'kyc') → POST /kyc/verify-minor { parentNidNumber, dob, parentSelfieUrl, consentConfirmed: true } → status screen.
Extra errors: PARENT_NID_LIMIT → "এই অভিভাবকের NID দিয়ে ইতিমধ্যে ৩টি অ্যাকাউন্ট খোলা হয়েছে"; NOT_A_MINOR → suggest the adult flow; CONSENT_REQUIRED.
````

---

### ✅ Prompt 11 — KYC Status Screen & Banner

````
1. `src/app/(app)/kyc/status.tsx`: shows the latest VerificationLog from GET /kyc/status.
   - null → "কোনো আবেদন নেই" + button to /kyc
   - pending_review → clock icon, "রিভিউ চলছে…", "সাধারণত ১২ ঘণ্টার মধ্যে ফলাফল জানানো হয়", submitted date, type (adult/minor)
   - approved → success animation "অভিনন্দন! আপনি এখন ভেরিফাইড 🎉" + "প্রথম বিজ্ঞাপন দিন" button
   - rejected → red, show manualReviewReason, "আবার আবেদন করুন" → /kyc
   - Poll every 60 seconds while pending (and on screen focus / pull-to-refresh). When it becomes approved call authStore.refreshUser() so isVerified becomes true across the app.

2. Reusable `src/components/kyc/KYCStatusBanner.tsx`:
   Props: none — it reads the auth store and (only for unverified users) GET /kyc/status (cache it with a 60s stale time).
   - verified → render nothing (or a small "✅ ভেরিফাইড" badge when `showVerifiedBadge` prop is true)
   - no log → yellow banner "আপনার অ্যাকাউন্ট যাচাই হয়নি। এখনই যাচাই করুন →" → /kyc
   - pending_review → blue banner "যাচাই চলছে, ফলাফল শীঘ্রই জানানো হবে" → /kyc/status
   - rejected → red banner "যাচাই বাতিল হয়েছে, আবার চেষ্টা করুন →" → /kyc
   Use it on Home, Profile and inside the Post tab guard.
````

---

## 🏠 Phase 3: Home Feed & Listing Browse

### ✅ Prompt 12 — Bottom Tab Navigation

````
Create the bottom tab navigator (`src/app/(app)/(tabs)/_layout.tsx`) with a custom animated tab bar (react-native-reanimated):

1. হোম — home icon — /home
2. খুঁজুন — search icon — /search
3. বিজ্ঞাপন দিন — raised circular center button in ACCENT red (#E63946) with a white "+" — /post
4. চ্যাট — chat bubble icon — /chat — red unread badge with the total unread count (from the chat store, Prompt 28; show 0 until then)
5. প্রোফাইল — person icon — /profile

Design: active = primary green + filled icon, inactive = muted + outline icon; white background (dark: surface); respect the bottom safe area; small scale/bounce animation on the active icon.

Guards (use useRequireVerified from Prompt 4): pressing "বিজ্ঞাপন দিন" or "চ্যাট" as an unverified user shows the alert and navigates to /kyc instead of opening the tab (use the tab press listener and e.preventDefault()).
````

---

### ✅ Prompt 13 — Listing Service & Home Feed Screen

````
1. `src/services/listing.service.ts` (read the Listings part of the API Contract):
   - getListings(params) → GET /listings with page, limit, search, category, condition, minPrice, maxPrice, division, district, thana, sellerId, sort, lat, lng, radius. Returns `data` = { listings, total, page, limit, totalPages }. Drop undefined/empty params.
   - getListing(id) → GET /listings/:id
   - getMyListings(status?, page?) → GET /listings/my
   - createListing(body) → POST /listings
   - updateListing(id, partial) → PUT /listings/:id
   - markAsSold(id, buyerId?) → PATCH /listings/:id/sell (send {} when buyerId is undefined)
   - renewListing(id) → PATCH /listings/:id/renew
   - deleteListing(id) → DELETE /listings/:id
   Helper `getSeller(listing)` returns `listing.sellerId` when it is an object, else null.

2. Install TanStack Query (`npx expo install @tanstack/react-query`) and wrap the app in QueryClientProvider in the root layout. Use useInfiniteQuery for feeds.

3. Home screen (`src/app/(app)/(tabs)/home.tsx`):
   - Header: "বেচা-কেনা" logo text (left), location chip showing the selected division (default "সারা বাংলাদেশ", tap opens the LocationPicker from Prompt 17 — placeholder for now) and a notification bell (right, opens the in-app notification list later).
   - Search pill "কী খুঁজছেন?" → navigates to the Search tab.
   - <KYCStatusBanner />
   - CategoryScroll (Prompt 15) → tapping a category opens the Search tab with that category pre-selected.
   - "সর্বশেষ বিজ্ঞাপন" — 2-column grid of ListingCard (Prompt 14), useInfiniteQuery on GET /listings?sort=newest&limit=20 (+ division filter if chosen); next page = page + 1 while page < totalPages.
   - Pull-to-refresh, infinite scroll (onEndReached), skeleton cards while loading, empty state "এই এলাকায় এখনো কোনো বিজ্ঞাপন নেই", error state with "আবার চেষ্টা করুন".
````

---

### ✅ Prompt 14 — ListingCard Component (Reusable)

````
Create `src/components/listing/ListingCard.tsx` with two variants.

Props: listing (Listing type from the API Contract), variant: 'grid' | 'list', onPress?.

1. Grid card (home feed, 2 columns): 4:3 image (first image, placeholder if none), condition pill on the image (নতুন = green, প্রায় নতুন = marigold, ব্যবহৃত = white), "+N" photo count, price below in bold green ("৳৬৮,০০০"), title (2 lines), location "ধানমন্ডি, ঢাকা" + relative time ("২ ঘণ্টা আগে"), seller display name with a green check icon if seller.isVerified and the rating if > 0. Sold ads show a dark "বিক্রি হয়ে গেছে" overlay.
2. List card (search results): 110px square thumbnail left; price, title, condition + category badges, location, time on the right.

Notes: seller info is `listing.sellerId` (populated object on GET /listings). Condition labels: new → নতুন, like_new → প্রায় নতুন, used → ব্যবহৃত. Category labels come from src/constants/categories.ts.

Use expo-image (already installed) with a placeholder + transition and cachePolicy="memory-disk". Press-in scale animation (Pressable + Reanimated, 0.97). Wrap in React.memo. Tap → router.push(`/listing/${listing.id}`).
Also export ListingCardSkeleton (shimmer) for both variants.
````

---

### ✅ Prompt 15 — Categories Data & CategoryScroll

````
1. `src/constants/categories.ts` — the `value` strings MUST match the backend/web exactly:

```typescript
export const CATEGORIES = [
  { value: 'Mobile', label: 'মোবাইল', emoji: '📱', tint: '#E7F6EF' },
  { value: 'Electronics', label: 'ইলেকট্রনিক্স', emoji: '💻', tint: '#E8F0FE' },
  { value: 'Vehicles', label: 'গাড়ি ও বাইক', emoji: '🏍️', tint: '#FDECEC' },
  { value: 'Furniture', label: 'আসবাবপত্র', emoji: '🛋️', tint: '#FFF4DB' },
  { value: 'Cycles', label: 'সাইকেল', emoji: '🚲', tint: '#E9F7F6' },
  { value: 'Fashion', label: 'ফ্যাশন', emoji: '👗', tint: '#FCE9F3' },
  { value: 'Health & Beauty', label: 'স্বাস্থ্য ও সৌন্দর্য', emoji: '💄', tint: '#F3ECFD' },
  { value: 'Food & Restaurant', label: 'খাবার', emoji: '🍛', tint: '#FFF0E3' },
  { value: 'Travel', label: 'ভ্রমণ', emoji: '🧳', tint: '#E6F4FB' },
  { value: 'Sports & Outdoors', label: 'খেলাধুলা', emoji: '🏏', tint: '#EEF6E4' },
  { value: 'Other', label: 'অন্যান্য', emoji: '📦', tint: '#F1F1EE' },
] as const;

export const CONDITIONS = [
  { value: 'new', label: 'নতুন' },
  { value: 'like_new', label: 'প্রায় নতুন' },
  { value: 'used', label: 'ব্যবহৃত' },
] as const;
```
   plus helpers getCategoryLabel(value) and getConditionLabel(value).

2. `src/components/common/CategoryScroll.tsx`: horizontal FlatList, first item "সব" (resets), each item = rounded tile with the tint background + emoji + label below. Selected = green border + green label, animated scale. Props: selected?: string, onSelect(value | undefined).
````

---

## 🔍 Phase 4: Search, Filter & Location

### ✅ Prompt 16 — Search Screen

````
Create the Search screen (`src/app/(app)/(tabs)/search.tsx`).

Layout:
- Search bar (auto-focus when opened from the home search pill), clear (X) button, placeholder "যেমন: iPhone 13, Yamaha FZ…".
- Filter chips row (horizontal): ক্যাটাগরি · দাম · এলাকা · অবস্থা · সাজান. Active filters are filled green and show their value; each opens the FilterBottomSheet (Prompt 18) on the right section.
- Result count "২৫০টি বিজ্ঞাপন পাওয়া গেছে" (from `total`).
- Results: ListingCard list variant, infinite scroll, pull-to-refresh.

API: GET /listings with search, category, condition (new|like_new|used), minPrice, maxPrice, division, district, thana, sort (newest|oldest|price_low|price_high), page, limit=20. If the user chose "আমার কাছাকাছি" send lat, lng and radius (meters, e.g. 10000) instead of division — results then come sorted by distance and include `distance` (show "২.৪ কিমি দূরে").

Behaviour:
- 500ms debounce on typing; cancel the previous request (TanStack Query handles this via the query key).
- Recent searches: last 10 in AsyncStorage, shown as chips when the input is focused and empty, with "সব মুছুন".
- Route params: accept `category` from the home screen.
- Empty: "কোনো বিজ্ঞাপন পাওয়া যায়নি — অন্য কিওয়ার্ড দিয়ে চেষ্টা করুন বা ফিল্টার কমান।"
````

---

### ✅ Prompt 17 — Location Data, Picker & useLocation

````
1. `src/constants/locations.ts`: copy DIVISIONS, DISTRICTS and THANAS from frontend/src/utils/locations.ts (Bangla strings — the backend stores and filters these exact strings) and DIVISION_COORDINATES ([lng, lat] for the 8 division centres, also in that file). Add a map from English division names to Bangla for reverse geocoding: Dhaka→ঢাকা, Chittagong/Chattogram→চট্টগ্রাম, Rajshahi→রাজশাহী, Khulna→খুলনা, Barisal/Barishal→বরিশাল, Sylhet→সিলেট, Rangpur→রংপুর, Mymensingh→ময়মনসিংহ.

2. `src/components/common/LocationPicker.tsx`: 3-step cascading picker inside a bottom sheet / modal — বিভাগ → জেলা → থানা, search box in each step, breadcrumb "ঢাকা › ঢাকা › ধানমন্ডি", back between steps, optional "সারা বাংলাদেশ" reset. onSelect returns { division, district?, thana?, coordinates } where coordinates = DIVISION_COORDINATES[division].

3. `src/hooks/useLocation.ts` with expo-location: request foreground permission, getCurrentPositionAsync (balanced accuracy), reverseGeocodeAsync → map `region` to a Bangla division (strip " Division"). Returns { coords: { latitude, longitude }, division, loading, error, request() }. If permission is denied, the UI falls back to the manual picker.

Install: npx expo install expo-location — and add the location permission text to app.json.
````

---

### ✅ Prompt 18 — Filter Bottom Sheet

````
Create `src/components/common/FilterBottomSheet.tsx`.

Use @gorhom/bottom-sheet (npx expo install @gorhom/bottom-sheet; it needs react-native-gesture-handler + reanimated, both installed — wrap the root in GestureHandlerRootView and BottomSheetModalProvider). If the installed version is not compatible with Reanimated 4 in SDK 57, build the same UI with a React Native Modal + Reanimated slide-up instead.

Sheet: drag handle, snap points 60% / 90%, tappable backdrop.

Sections:
1. ক্যাটাগরি — grid of CATEGORIES (single select).
2. দাম — two numeric inputs "সর্বনিম্ন ৳" / "সর্বোচ্চ ৳" + quick presets: ৳০-৫,০০০ · ৳৫,০০০-২০,০০০ · ৳২০,০০০-১,০০,০০০ · ৳১,০০,০০০+.
3. অবস্থা — pills: সব · নতুন · প্রায় নতুন · ব্যবহৃত (values new/like_new/used).
4. সাজান — radio: নতুন আগে (newest) · দাম কম থেকে বেশি (price_low) · দাম বেশি থেকে কম (price_high) · পুরনো আগে (oldest) · আমার কাছাকাছি (uses useLocation → lat/lng/radius).
5. এলাকা — embedded LocationPicker.

Footer: "রিসেট" (clears everything) and "ফলাফল দেখুন" (applies and closes). Props: value: SearchFilters, onApply(filters), initialSection?.
````

---

## 📝 Phase 5: Ad Creation & Management

### ✅ Prompt 19 — Create Ad Screen (Multi-step Form)

````
Create the ad posting form (`src/app/(app)/(tabs)/post.tsx`). Put the form itself in `src/components/listing/ListingForm.tsx` so the edit screen (Prompt 22) can reuse it with `initial` values. Use react-hook-form (npx expo install react-hook-form).

Guard: unverified → KYCStatusBanner + "বিজ্ঞাপন দিতে আগে NID দিয়ে যাচাই করুন" button (do not show the form).

Steps (progress bar ১/৪ … ৪/৪, keep values when going back):
1. ক্যাটাগরি ও অবস্থা — category tiles (CATEGORIES) + condition pills (new/like_new/used). Both required.
2. বিবরণ ও দাম — title (10-80, live counter), description (20-1000, live counter, multiline), price "৳" (numeric, ≥ 0, show the formatted value under the input).
3. ছবি — ImagePickerGrid (Prompt 20): 1-10 photos, first = cover ("কভার" tag, long-press another to make it cover), upload starts immediately after picking; "পরের ধাপ" disabled while uploads are running or no photo uploaded.
4. লোকেশন ও প্রকাশ — LocationPicker (division, district, thana all required) or "বর্তমান লোকেশন" (useLocation → division only, then pick district/thana), optional addressLine with hint "পুরো বাসার ঠিকানা দেবেন না", toggle "ফোন নম্বর লুকিয়ে রাখুন" (hidePhoneNumber, default false), and a live preview card.

Submit → POST /listings with exactly:
{ title, description, price: Number(price), category, condition, images: uploadedUrls, hidePhoneNumber,
  location: { coordinates: DIVISION_COORDINATES[division] /* [lng, lat] */, division, district, thana, addressLine } }
- 201 → show AdSubmitSuccess (Prompt 23), invalidate "my-listings" queries, reset the form.
- VALIDATION_FAILED → show `details` and jump to the step that contains the bad field.
````

---

### ✅ Prompt 20 — Image Upload Service

````
Create `src/services/media.service.ts` and `src/components/listing/ImagePickerGrid.tsx`.

media.service.ts:
1. getPresignedUrl(fileName, fileType, folder) → POST /media/presigned-url { fileName, fileType, folder } → { uploadUrl, fileUrl }. fileType must be image/jpeg, image/png or image/webp; folder is 'listings' | 'kyc' | 'avatars'.
2. compressImage(uri, { maxWidth = 1280, quality = 0.75 }) with expo-image-manipulator (check the SDK 57 docs — use the current ImageManipulator context API: manipulate(uri).resize(...).renderAsync() then saveAsync({ compress, format: SaveFormat.JPEG })). Always output JPEG (works on every platform and is accepted by the backend).
3. putToS3(localUri, uploadUrl, contentType): read the file as a Blob (`await (await fetch(localUri)).blob()`) or bytes via expo-file-system's File API, then fetch(uploadUrl, { method: 'PUT', headers: { 'Content-Type': contentType }, body }). Throw if !res.ok. The presigned URL expires in 5 minutes, so request it right before uploading.
4. uploadImage(localUri, folder) = compress → presign (fileName like `photo_<timestamp>.jpg`, fileType 'image/jpeg') → put → return fileUrl. Retry network failures up to 3 times with exponential backoff (1s, 2s, 4s).
5. uploadMany(uris, folder, onProgress(done, total)) → uploads in parallel (max 3 at a time) and returns the fileUrls in the same order.

ImagePickerGrid: "+" tile opens an action sheet: "ছবি তুলুন" (expo-image-picker launchCameraAsync) / "গ্যালারি থেকে" (launchImageLibraryAsync, allowsMultipleSelection, selectionLimit = remaining slots, mediaTypes images). Each tile shows the local preview, an uploading spinner, an error state with "আবার চেষ্টা", an X to remove; the first tile has a "কভার" tag. Props: value: UploadItem[], onChange, max = 10. Expose `isUploading` and `uploadedUrls`.
````

---

### ✅ Prompt 21 — Listing Store & Query Hooks

````
We fetch server data with TanStack Query, so do NOT duplicate listings in Zustand. Create `src/hooks/useListings.ts` with typed hooks built on listing.service.ts:

- useListingsFeed(filters) → useInfiniteQuery(['listings', filters]) on GET /listings (getNextPageParam: page < totalPages ? page + 1 : undefined)
- useListing(id) → useQuery(['listing', id])
- useMyListings(status?) → useQuery(['my-listings', status]) on GET /listings/my
- useCreateListing / useUpdateListing / useMarkAsSold / useRenewListing / useDeleteListing → useMutation, each invalidates ['my-listings'] and ['listings'] (and ['listing', id] where relevant) on success.

Also create `src/store/ui.store.ts` (Zustand) for app-wide UI state: themeMode ('system' | 'light' | 'dark', persisted), selectedDivision (persisted), and the in-app notification queue (used in Prompt 37).
````

---

### ✅ Prompt 22 — My Listings (Seller Dashboard) & Edit Ad

````
1. `src/app/(app)/my-listings.tsx` (opened from Profile → "আমার বিজ্ঞাপন"):
   - Segmented tabs: সব · সক্রিয় (active) · রিভিউতে (pending) · বিক্রিত (sold) · আর্কাইভড (archived) → GET /listings/my?status=…
   - Card: thumbnail, title, price, status badge (🟢 সক্রিয় · 🟡 রিভিউতে · 🔵 বিক্রিত · ⚫ আর্কাইভড · 🔴 বাতিল), posted date, expiry date, "N দিন বাকি" when ≤ 5 days.
     A REJECTED ad = status "archived" + moderationFlags.flagType "manual" → show "বাতিল" + moderationFlags.flagReason.
   - Actions (buttons or long-press menu):
     • active → "বিক্রি হয়েছে" (Mark as Sold flow below), "এডিট", "সরান"; "মেয়াদ বাড়ান" when ≤ 5 days left (PATCH /renew)
     • pending → "এডিট", "সরান"
     • archived (not rejected) → "নবায়ন" (PATCH /renew re-activates it for 30 days)
     • sold → view only
   - "সরান" → confirm dialog → DELETE /listings/:id (soft delete → archived).
   - Pull-to-refresh, empty state per tab "এখানে কোনো বিজ্ঞাপন নেই" + "বিজ্ঞাপন দিন" button.

2. Mark as Sold flow (bottom sheet):
   - Load GET /chat/rooms and keep rooms where room.listingId === listing.id AND room.sellerId === me.id → list their `buyer` (avatar initial, displayName, last message text).
   - Extra option "বেচা-কেনার বাইরে বিক্রি করেছি" → buyerId undefined.
   - Confirm → PATCH /listings/:id/sell with { buyerId } (or {}) → toast "বিক্রিত! ক্রেতা এখন রিভিউ দিতে পারবেন" (only when a buyer was chosen). Error NO_CHAT_HISTORY → explain.

3. `src/app/(app)/listing/edit/[id].tsx`: load GET /listings/:id, only allow when listing.status is active/pending and the seller is me, render ListingForm with initial values (existing image URLs count as already uploaded), submit PUT /listings/:id. If the response status is "pending" while it was "active" → tell the user "বড় পরিবর্তনের কারণে বিজ্ঞাপনটি আবার রিভিউতে গেছে".
````

---

### ✅ Prompt 23 — Ad Submitted Success & Moderation Badge

````
1. `src/components/listing/AdSubmitSuccess.tsx` (full-screen modal after POST /listings):
   - Animated checkmark (Reanimated: circle scale + check stroke) + confetti-like dots in brand colours.
   - "বিজ্ঞাপন জমা হয়েছে! 🎉" / "আমাদের টিম দ্রুত রিভিউ করবে। অনুমোদনের পর সবাই দেখতে পাবে এবং ৩০ দিন সক্রিয় থাকবে।"
   - Buttons: "আমার বিজ্ঞাপন দেখুন" → /my-listings?tab=pending, "আরেকটি বিজ্ঞাপন দিন" (reset form), "হোমে যান".

2. `src/components/listing/ModerationBadge.tsx`: props listing → pending: amber "রিভিউতে আছে"; active: green "সক্রিয়"; sold: blue "বিক্রিত"; archived: grey "আর্কাইভড"; rejected (archived + flagType 'manual'): red "বাতিল — কারণ: {flagReason}".
````

---

## 📄 Phase 6: Listing Detail Page & Public Profile

### ✅ Prompt 24 — Listing Detail Screen

````
Create the Listing Detail screen (`src/app/(app)/listing/[id].tsx`) using GET /listings/:id (send the Bearer token when logged in — the backend uses it to decide whether to reveal the phone number).

Layout (ScrollView + fixed bottom bar):
1. ImageCarousel (Prompt 25) full width, overlay buttons: back (top-left), share + report (top-right), counter "২/৫". Sold → "বিক্রি হয়ে গেছে" overlay.
2. Price "৳৬৮,০০০" (large, bold, primary), title, condition badge, category chip (emoji + Bangla label), "📍 ধানমন্ডি, ঢাকা" and "৩ দিন আগে".
3. Details card: ক্যাটাগরি · অবস্থা · এলাকা (thana, district, division) · পোস্টের তারিখ, then the description (collapse after ~200 chars with "আরো দেখুন").
4. Seller card — seller = listing.sellerId (populated object): initial avatar, displayName, "NID ভেরিফাইড" badge if isVerified, "আইনগত নাম: {verifiedName}" if present, ⭐ averageRating (totalReviews রিভিউ) or "এখনো রিভিউ নেই", "সদস্য: জুন ২০২৫" from seller.createdAt, button "প্রোফাইল দেখুন" → /user/{seller.id}.
5. Location: approximate area only (the stored point is the division centre) — show a static card with the area text, NOT an exact pin.
6. Safety banner: "⚠️ জনবহুল জায়গায় দেখা করুন। পণ্য না দেখে বিকাশ/নগদে অগ্রিম টাকা পাঠাবেন না।"
7. "একই ধরনের বিজ্ঞাপন" — horizontal list from GET /listings?category=…&limit=6 (exclude this id).

Bottom bar (only when listing.status === 'active' and I am not the seller):
- "💬 চ্যাট করুন" → requires verification (useRequireVerified) → POST /chat/rooms { listingId } → router.push(`/chat/${room.id}`). Handle SELF_CHAT_NOT_ALLOWED / INACTIVE_LISTING.
- "📞 কল করুন":
  • listing.hidePhoneNumber → hide the button and show "🔒 বিক্রেতা শুধু চ্যাটে যোগাযোগ করতে চান"
  • viewer not verified → button goes to the KYC flow ("নম্বর দেখতে যাচাই করুন")
  • otherwise use seller.phoneNumber (e.g. "+8801712345678") → Linking.openURL(`tel:${phone}`)
If I am the seller: show "এডিট" and "আমার বিজ্ঞাপন" buttons instead. Pending/archived ads are only returned to their owner — show a notice "এই বিজ্ঞাপনটি রিভিউতে আছে / আর্কাইভড".

Share: React Native Share API with title, price and a link (https://<web-domain>/listings/{id}).
Errors: 404 → "বিজ্ঞাপনটি পাওয়া যায়নি (মুছে ফেলা হয়েছে বা রিভিউতে আছে)".
````

---

### ✅ Prompt 25 — Image Carousel Component

````
Create `src/components/ui/ImageCarousel.tsx`.

Props: images: string[], height = 300, showCounter = true, onImagePress?(index).

- Horizontal paging FlatList with expo-image (placeholder + 200ms transition, cachePolicy memory-disk).
- Animated dot indicators (Reanimated, active dot wider) + counter "১/৫" top-right.
- Tap → full-screen viewer (Modal): black background, close (X), swipe left/right, double-tap and pinch to zoom (react-native-gesture-handler + Reanimated), swipe down to dismiss.
- No images → branded placeholder.
````

---

### ✅ Prompt 26 — Public User Profile Screen

````
Create `src/app/(app)/user/[id].tsx`.

APIs:
- GET /users/:id → { id, displayName, verifiedName, isVerified, averageRating, totalReviews, createdAt }
- GET /listings?sellerId=:id&limit=20 → the user's ACTIVE ads (infinite scroll)
- GET /reviews/user/:id?page=1 → { reviews, total, page, totalPages, averageRating }

Layout:
- Green patterned header, large initial avatar, displayName, "NID ভেরিফাইড" badge, "আইনগত নাম: …", ⭐ 4.8 (12 রিভিউ), "সদস্য: …".
- Top-right "🚩 রিপোর্ট" (hidden on my own profile) → ReportModal (Prompt 39) with targetType 'User'.
- Tabs: "বিজ্ঞাপন (N)" grid of ListingCard · "রিভিউ (N)" list using ReviewsList (Prompt 35).
- Each review shows reviewer name (review.reviewerId.displayName), stars, text, "কেনা পণ্য: {review.listingId.title}" and date.
````

---

## 💬 Phase 7: Real-time Chat System

### ✅ Prompt 27 — Socket.io Client Singleton

````
Create `src/lib/socket.ts` (singleton) and `src/hooks/useSocket.ts`. Read the Socket.io part of the API Contract in docs/mobile-app-prompts.md and backend/src/sockets/chatSocket.ts.

Setup:
- Install: npx expo install socket.io-client
- connectSocket(): io(`${SOCKET_URL}/chat`, { auth: { token: <accessToken from SecureStore> }, transports: ['websocket'], reconnection: true, reconnectionDelay: 1000, reconnectionDelayMax: 10000 }).
- Only connect when the user is logged in AND verified (unverified users are rejected by the server).
- Before every (re)connect attempt read the latest access token (socket.auth = { token }), because the token changes after refresh.
- connect_error handling: message contains "Token" / "Authentication failed" → call the refresh flow from api.ts once; if refresh works reconnect, otherwise authStore.localLogout(). "Verified account required" → do not retry.
- AppState: disconnect when the app goes to background for > 30s, reconnect on foreground.
- Expose: connectSocket(), disconnectSocket(), getSocket(), and typed emit helpers:
  joinRoom(roomId) → emit 'join_room' { roomId } with ack
  leaveRoom(roomId) → 'leave_room' { roomId }
  sendMessage(roomId, text) → 'send_message' { roomId, messageText } and resolve/reject from the ack ({ success, data: { message, warnings } } | { success: false, error })
  sendTyping(roomId) → 'typing' { roomId } (throttle to once per 1.5s)
  markRead(roomId) → 'mark_read' { roomId }
- Server events to listen for: 'new_message' (Message), 'user_typing' { roomId, userId }, 'messages_read' { roomId, readBy }, 'message_warning' { roomId, messageId, warnings }, 'chat_error' { message, code }. There is NO online-presence event.

Connect after login/bootstrap when user.isVerified, disconnect on logout.
````

---

### ✅ Prompt 28 — Chat Store (Zustand)

````
Create `src/store/chat.store.ts`. Types from the API Contract (ChatRoom, Message, UserPreview) go in src/types/chat.types.ts and src/services/chat.service.ts:
- getRooms() → GET /chat/rooms (ChatRoom[])
- createRoom(listingId) → POST /chat/rooms { listingId } → ChatRoom
- getMessages(roomId, page) → GET /chat/rooms/:roomId/messages?page=…&limit=30 → { messages (NEWEST FIRST), total, page, totalPages }

State:
- rooms: ChatRoom[] (sorted by latest activity)
- messagesByRoom: Record<roomId, Message[]> (stored oldest → newest for display)
- pageByRoom / hasMoreByRoom
- typingByRoom: Record<roomId, boolean>
- activeRoomId: string | null
- isConnected: boolean
- totalUnread (derived: sum of room.unreadCount)

Actions: fetchRooms(), fetchMessages(roomId) (first page), fetchOlder(roomId), addMessage(message) (de-duplicate by id, append, update that room's lastMessage + move it to the top, increment unreadCount if message.senderId !== me && roomId !== activeRoomId), markRoomRead(roomId) (unreadCount = 0 + socket markRead), setTyping(roomId, bool, auto-clear after 3s), setActiveRoom(id | null), setConnected(bool), reset().

setupSocketListeners(): register handlers once — 'new_message' → addMessage; 'user_typing' → setTyping(roomId, true) when userId !== me; 'messages_read' → mark my messages in that room as readStatus true when readBy !== me; 'message_warning' → show the warnings as an in-app toast; 'connect'/'disconnect' → setConnected. If a 'new_message' arrives for a room that is not in `rooms`, call fetchRooms().

Hook the tab bar badge (Prompt 12) to totalUnread.
````

---

### ✅ Prompt 29 — Chat List Screen

````
Create the Chats tab (`src/app/(app)/(tabs)/chat.tsx`).

Guard: unverified → KYC banner + explanation instead of the list.

Layout:
- Header "মেসেজ" + small connection dot (green when connected, grey "সংযোগ হচ্ছে…" otherwise).
- Search input "নাম বা বিজ্ঞাপন খুঁজুন" (filters locally by other user's name and listing title).
- FlatList of rooms from the chat store (fetchRooms on focus + pull-to-refresh).

Room row:
- other = room.sellerId === me.id ? room.buyer : room.seller
- Left: initial avatar with a tiny listing thumbnail (room.listing.images[0]) at the bottom-right.
- Middle: other.displayName + verified tick; a small "ক্রেতা"/"বিক্রেতা" tag + listing title; last message preview ("আপনি: …" when I sent it), or "টাইপ করছে…" with animated dots when typing.
- Right: time (h:mm a today / "গতকাল" / "১২ অক্টো") and the red unread badge (room.unreadCount).
- Unread rows have bold text.

Real-time: new messages arrive via the store listeners (the server sends 'new_message' to both participants even when they are not inside the room), so the list re-sorts automatically.
Empty: "এখনো কোনো চ্যাট নেই। কোনো বিজ্ঞাপন থেকে বিক্রেতার সাথে চ্যাট শুরু করুন।"
````

---

### ✅ Prompt 30 — Chat Conversation Screen

````
Create `src/app/(app)/chat/[roomId].tsx`.

Header: back, other user's avatar + name + verified badge + role ("বিক্রেতা"/"ক্রেতা"). Below it a ListingHeader (Prompt 31) for room.listing — tap → listing detail.

Banners (below the header):
- Safety (dismissible): "⚠️ জনবহুল জায়গায় দেখা করুন। পণ্য না দেখে অগ্রিম টাকা পাঠাবেন না।"
- Review prompt: if I am the buyer AND room.listing.status === 'sold' AND room.listing.soldToBuyerId === me.id → "আপনি পণ্যটি কিনেছেন! বিক্রেতাকে রিভিউ দিন" + button → ReviewModal (Prompt 34).
- If room.listing.status !== 'active' → small grey note "বিজ্ঞাপনটি আর সক্রিয় নেই".

Messages:
- Inverted FlatList (newest at the bottom). Load page 1 on mount (GET …/messages — this also marks messages read on the server), "load older" when scrolling to the top (fetchOlder until hasMore is false).
- ChatBubble (Prompt 31): mine right/green, theirs left/white; time; ✓ (sent) / ✓✓ in marigold (readStatus true).
- Date separators ("আজ", "গতকাল", "১২ অক্টোবর ২০২৬") between days.
- TypingIndicator when typingByRoom[roomId].

Socket:
- On mount: setActiveRoom(roomId), joinRoom(roomId), markRoomRead(roomId). On unmount: leaveRoom(roomId), setActiveRoom(null).
- When a 'new_message' for this room arrives from the other user → markRead(roomId) immediately.
- Send: trim, max 1000 chars, sendMessage(roomId, text); clear the input right away and show the message when the server echoes 'new_message' (or from the ack). On ack failure show the error and restore the text.
- While typing → sendTyping(roomId) (throttled).
- Note: the server replaces links with "[link removed]" and masks phone numbers; show the 'message_warning' warnings as a toast. Optionally warn before sending if the text contains a link or a BD phone number.

Keyboard: KeyboardAvoidingView (behavior 'padding' on iOS, 'height' on Android) + correct keyboardVerticalOffset; input auto-grows up to 4 lines.
````

---

### ✅ Prompt 31 — Chat UI Components

````
Create in src/components/chat/:

1. ChatBubble.tsx — props { message: Message, isMine }. Mine: right, primary green background, white text, radius 16/16/4/16. Theirs: left, surface background with border, dark text, radius 16/16/16/4. Bottom-right time (small, 70% opacity) + ✓/✓✓ (mine only). Long messages wrap (selectable text). Slide-in + fade animation on mount. React.memo.
2. ChatInput.tsx — props { onSend(text), onTyping(), disabled }. Multiline TextInput (max 4 lines auto-grow, maxLength 1000), counter appears after 800 chars (orange > 900, red at 1000), circular send button (disabled when empty, scale animation on press), placeholder "মেসেজ লিখুন…".
3. TypingIndicator.tsx — three bouncing dots inside a "theirs" bubble.
4. DateSeparator.tsx — centered pill with "আজ" / "গতকাল" / formatted date.
5. ListingHeader.tsx — compact card: thumbnail, title (1 line), price, status badge if not active; tap → /listing/[id].
````

---

## 👤 Phase 8: User Profile & Reviews

### ✅ Prompt 32 — Profile Tab Screen

````
Create the Profile tab (`src/app/(app)/(tabs)/profile.tsx`).

Data: auth store user (refresh with GET /users/me on focus + pull-to-refresh). Note: the backend has NO profile photo — always use an initial-letter avatar with a colour derived from the name.

Layout:
- Header card (green patterned cover): avatar initial, displayName, "NID ভেরিফাইড" badge or the KYCStatusBanner, "আইনগত নাম: {verifiedName}", ⭐ rating (totalReviews রিভিউ), masked phone "017•••••678", "সদস্য: …".
- Stats row: সক্রিয় বিজ্ঞাপন (GET /listings/my?status=active&limit=1 → total) | বিক্রিত (status=sold → total) | রিভিউ (user.totalReviews).
- Menu:
  1. 📋 আমার বিজ্ঞাপন → /my-listings
  2. ⭐ আমার রিভিউ → /user/{me.id} (reviews tab)
  3. 🚩 আমার রিপোর্ট → /settings/my-reports
  4. 🔔 নোটিফিকেশন → /settings/notifications
  5. ⚙️ সেটিংস → /settings
  6. ℹ️ বেচা-কেনা সম্পর্কে → /settings/about
  7. 🚪 লগআউট → confirm "আপনি কি লগআউট করতে চান?" → authStore.logout()
````

---

### ✅ Prompt 33 — Edit Profile Screen

````
Create `src/app/(app)/settings/edit-profile.tsx`.

Fields:
- Display name (1-30 chars, HTML tags not allowed) with the note "এটি আপনার ডাকনাম। আইনগত নাম (NID অনুযায়ী) পরিবর্তন করা যায় না।"
- Phone number (read-only, masked)
- Verified legal name (read-only, only if verified)
(No avatar upload — the backend has no avatar field.)

Save: PUT /users/me { displayName } → response `data` is the updated user → authStore.setUser(data) → toast "প্রোফাইল আপডেট হয়েছে" → router.back(). Show API validation errors under the field.
````

---

### ✅ Prompt 34 — Review Submission Flow

````
Create `src/components/listing/ReviewModal.tsx` and `src/components/ui/StarRating.tsx`.

When it appears: in the chat conversation for the BUYER when room.listing.status === 'sold' and room.listing.soldToBuyerId === me.id (the seller picked this buyer in "Mark as Sold"). Also offer it on the listing detail screen in the same situation.

ReviewModal (bottom sheet): listing thumbnail + title, seller name, StarRating (1-5, required), review text (required, max 500, counter), "রিভিউ জমা দিন".
API: POST /reviews { listingId, rating (integer), reviewText } (review.service.ts).
- 201 → "ধন্যবাদ! আপনার রিভিউ জমা হয়েছে ✅", close, invalidate the seller's reviews query.
- 409 DUPLICATE_ENTRY → "এই বিজ্ঞাপনের জন্য আপনি আগেই রিভিউ দিয়েছেন" (hide the prompt afterwards — remember reviewed listing ids in AsyncStorage).
- 403 ACCESS_DENIED / 400 NO_CHAT_HISTORY / BAD_REQUEST (not sold) → show the API message.

StarRating: props value, onChange?, size, readOnly. Whole stars only, spring fill animation (gray → marigold #F4B400), haptic tick on change.
````

---

### ✅ Prompt 35 — Reviews List Component

````
Create `src/components/listing/ReviewsList.tsx`.

Props: userId, limit? (preview mode shows the first N with "সব রিভিউ দেখুন").
API: GET /reviews/user/:userId?page=… → { reviews, total, page, totalPages, averageRating } (useInfiniteQuery).

Top summary: big "৪.৮" + stars + "১২টি রিভিউ". Optional distribution bars (5★ … 1★) calculated from the loaded reviews.
Review item: reviewer initial avatar + review.reviewerId.displayName + verified tick, stars, text, "কেনা পণ্য: {review.listingId.title}" (tap → listing), date (formatDate).
Infinite scroll / "আরো দেখুন". Empty: "এখনো কোনো রিভিউ নেই".
````

---

## 🔔 Phase 9: Notifications (In-App + Push Token)

> The backend saves push tokens (`PUT /users/me { fcmToken }`) but **does not send push notifications yet**. So: (1) register the token now so the app is ready, (2) generate **in-app** and **local** notifications from socket events and polling.

### ✅ Prompt 36 — Notification Setup (Permissions, Token, Local Notifications)

````
Set up notifications with expo-notifications (read the SDK 57 docs first).

1. Install: npx expo install expo-notifications expo-device. Add the expo-notifications config plugin in app.json (Android channel "default", notification icon/colour #00704A). Remote push needs a development build (it does not work in Expo Go on Android) and an EAS projectId.
2. `src/hooks/useNotifications.ts`:
   - After login, ask for permission (explain first with a small pre-permission sheet).
   - If granted and Device.isDevice: get the Expo push token (getExpoPushTokenAsync({ projectId })) and save it with PUT /users/me { fcmToken: token } (the backend field is called fcmToken; it keeps a list of tokens). Re-send when the token changes (addPushTokenListener).
   - Configure setNotificationHandler (show alert + sound in foreground for local notifications).
3. Local notifications (because the server does not push yet):
   - Chat: when 'new_message' arrives for a room that is not open AND the app is in background/inactive → scheduleNotificationAsync with title = sender name, body = message text, data = { type: 'chat', roomId }.
   - KYC: while the user is unverified and has a pending request, poll GET /kyc/status on app foreground; when it changes to approved/rejected → local notification { type: 'kyc' }.
   - Ads: on app foreground compare GET /listings/my statuses with the last saved snapshot (AsyncStorage); pending → active = "আপনার বিজ্ঞাপন অনুমোদিত হয়েছে!", → rejected = "বিজ্ঞাপন বাতিল হয়েছে"; ads expiring in ≤ 3 days = reminder { type: 'listing', id }.
4. Notification tap (addNotificationResponseReceivedListener + getLastNotificationResponseAsync for cold start): chat → /chat/[roomId], kyc → /kyc/status, listing → /my-listings.
5. Respect the preferences from Prompt 38 before showing anything.
````

---

### ✅ Prompt 37 — In-App Notification Banner

````
Create `src/components/common/NotificationBanner.tsx` and mount it once in the root layout.

- Driven by the queue in ui.store.ts: showNotification({ type: 'chat' | 'success' | 'warning' | 'error' | 'info', title, body?, avatarName?, onPress? }).
- Slides down from the top (under the status bar) with Reanimated, auto-dismiss after 4s, swipe up to dismiss, tap → onPress then dismiss. One at a time; the next one appears after the current hides.
- Variants: chat (initial avatar + name + preview, white card), success (green), warning (amber), error (red), info (blue).
- Use it for: new chat messages while the user is in the app but not inside that conversation ("রাকিব: দাম কি কমানো যাবে?" → opens the chat), KYC approved, ad approved/rejected, message_warning from the socket, network errors.
````

---

### ✅ Prompt 38 — Notification Preferences Screen

````
Create `src/app/(app)/settings/notifications.tsx` (stored locally in AsyncStorage — the backend has no preference API).

Toggles: 💬 চ্যাট মেসেজ · 📢 বিজ্ঞাপনের আপডেট (approval / rejection / expiry) · 🪪 ভেরিফিকেশন আপডেট · 🔕 সব বন্ধ (overrides everything).
Quiet hours: toggle + start time (default ১১:০০ PM) + end time (default ৭:০০ AM) using the date-time picker.
Also a row showing the OS permission state with a button to open system settings when denied.

Export `shouldNotify(type)` used by Prompts 36 and 37 (checks the toggles + quiet hours; in-app banners are still allowed during quiet hours, only sounds/local pushes are muted).
````

---

## 🚩 Phase 10: Reports

### ✅ Prompt 39 — Report User / Listing Flow

````
Create `src/components/common/ReportModal.tsx` and `src/services/report.service.ts`.

Entry points: listing detail ("🚩 রিপোর্ট", hidden on my own ad) and public profile ("🚩 রিপোর্ট", hidden on my own profile). Reporting requires a verified account (useRequireVerified).

Props: targetType: 'Listing' | 'User' (capitalised exactly like this), targetId, visible, onClose.

Steps:
1. Reason (radio list) — send the value:
   - প্রতারণা / স্ক্যাম → scam
   - হয়রানি বা খারাপ আচরণ → harassment
   - ভুল দাম বা ভুল বর্ণনা → misrepresentation
   - অনুপযুক্ত কন্টেন্ট → inappropriate
   - অন্যান্য → other
2. Description — REQUIRED by the backend (1-1000 chars), placeholder "কী ঘটেছে সংক্ষেপে লিখুন…".
3. Confirm: "মিথ্যা রিপোর্ট করলে আপনার অ্যাকাউন্টের বিরুদ্ধে ব্যবস্থা নেওয়া হতে পারে। জমা দেবেন?"

API: POST /reports { targetType, targetId, reason, description }.
- 201 → ReportSuccess (Prompt 40).
- 409 DUPLICATE_REPORT → "আপনি এটি আগেই রিপোর্ট করেছেন, আমাদের টিম দেখছে।"
- 400 "cannot report yourself / your own listing" → show message.
````

---

### ✅ Prompt 40 — Report Confirmation & My Reports

````
1. ReportSuccess (inside the modal): "✅ রিপোর্ট জমা হয়েছে", short report id (last 6 chars of data.id), "আমাদের টিম ২৪ ঘণ্টার মধ্যে দেখবে।", "ঠিক আছে".
2. `src/app/(app)/settings/my-reports.tsx`: GET /reports/my?page=… → { reports, total, page, totalPages }.
   Each card: target type icon (বিজ্ঞাপন / ব্যবহারকারী) + target name (report.targetId.title or report.targetId.displayName, "মুছে ফেলা হয়েছে" if null), reason label, description, submitted date, status badge: pending → "অপেক্ষমাণ", reviewed → "দেখা হয়েছে", resolved → "ব্যবস্থা নেওয়া হয়েছে", dismissed → "বাতিল"; show report.resolution when present.
   Pull-to-refresh, infinite scroll, empty state.
````

---

## ⚙️ Phase 11: Settings & Account Management

### ✅ Prompt 41 — Settings Screen

````
Create `src/app/(app)/settings/index.tsx` with grouped sections, chevrons for navigation rows, switches for toggles and red destructive rows.

অ্যাকাউন্ট: 👤 প্রোফাইল এডিট → /settings/edit-profile · 🪪 NID ভেরিফিকেশন (status text; → /kyc or /kyc/status) · 🚩 আমার রিপোর্ট
পছন্দ: 🔔 নোটিফিকেশন → /settings/notifications · 📍 ডিফল্ট এলাকা (LocationPicker → ui.store selectedDivision) · 🌙 থিম (সিস্টেম / লাইট / ডার্ক → ui.store themeMode) · 🌐 ভাষা (বাংলা — English "শীঘ্রই আসছে")
তথ্য: 📜 শর্তাবলি · 🔒 গোপনীয়তা নীতি (expo-web-browser openBrowserAsync to the web pages) · ℹ️ বেচা-কেনা সম্পর্কে → /settings/about
বিপজ্জনক: 🗑️ অ্যাকাউন্ট মুছুন (Prompt 42) · 🚪 লগআউট
````

---

### ✅ Prompt 42 — Account Deletion Flow

````
Create the account deletion flow (a screen or bottom sheet opened from Settings).

Step 1 — Warning: "আপনি কি সত্যিই অ্যাকাউন্ট মুছে ফেলতে চান?"
- আপনার সব সক্রিয় ও রিভিউতে থাকা বিজ্ঞাপন সাথে সাথে আর্কাইভ হবে
- সব ডিভাইস থেকে লগআউট হয়ে যাবে
- ৩০ দিন পর আপনার ব্যক্তিগত তথ্য স্থায়ীভাবে মুছে যাবে
- ৩০ দিনের মধ্যে আবার লগইন করলে মুছে ফেলার অনুরোধ বাতিল হয়ে যাবে

Step 2 — Type "DELETE" to confirm; the red "অ্যাকাউন্ট মুছুন" button is enabled only when it matches.

API: DELETE /users/me. The backend revokes ALL tokens immediately, so after success do NOT call /auth/logout — call authStore.localLogout() (clear SecureStore + AsyncStorage + stores, disconnect socket), show a toast "অ্যাকাউন্ট মুছে ফেলার অনুরোধ নেওয়া হয়েছে" and router.replace('/(auth)/welcome').
````

---

### ✅ Prompt 43 — About Screen & One-time Disclaimer

````
1. `src/app/(app)/settings/about.tsx`: logo, app version from expo-constants (Constants.expoConfig?.version), "বাংলাদেশের সবচেয়ে নিরাপদ সেকেন্ড-হ্যান্ড মার্কেটপ্লেস", "১০০% NID-যাচাইকৃত ইউজার — নিরাপদ, প্রতারণামুক্ত কেনা-বেচা", how it works in 3 steps, links (Terms, Privacy via expo-web-browser), support email (mailto:support@bechakena.com), social links.
2. One-time disclaimer modal shown after the first successful login (flag in AsyncStorage):
   "সব লেনদেন ক্রেতা ও বিক্রেতার নিজ দায়িত্বে সামনাসামনি সম্পন্ন হয়। বেচা-কেনা কোনো আর্থিক লেনদেনের নিশ্চয়তা দেয় না।" + "বুঝেছি" button.
````

---

## ✨ Phase 12: Polish, Animations & UX

### ✅ Prompt 44 — Loading, Empty & Error States

````
Create consistent loading / empty / error states and use them on EVERY screen.

1. src/components/ui/Skeleton.tsx — shimmer block (Reanimated gradient sweep or opacity pulse); presets SkeletonListingCard (grid + list), SkeletonChatRow, SkeletonProfile.
2. src/components/ui/FullScreenLoader.tsx — centered spinner + "লোড হচ্ছে…" (+ translucent overlay variant for submits).
3. Button loading state (spinner replaces the label, button disabled) — already in our Button, make sure every API submit uses it.
4. Pull-to-refresh with the brand colour (tintColor / colors = primary).
5. src/components/ui/EmptyState.tsx — big emoji/icon in a tinted circle, title, subtitle, optional action button. Variants: noListings, noChats, noReviews, noResults, noReports, error (with "আবার চেষ্টা করুন" → refetch).
6. Audit: home, search, listing detail, my listings, chat list, conversation, profile, public profile, reviews, my reports, KYC status. Each must handle loading, empty, error and offline (Prompt 46).
````

---

### ✅ Prompt 45 — Micro-Animations & Transitions

````
Add micro-animations with react-native-reanimated (+ expo-haptics) for a premium feel. Respect "Reduce Motion" (useReducedMotion) — skip non-essential animations when it is on.

1. Navigation: Stack screens slide from right (default), modals (ReportModal, ReviewModal, filters) slide from bottom (presentation: 'modal' / 'formSheet'), tabs crossfade.
2. Lists: listing cards fade/slide in with a small stagger on first load only (entering={FadeInDown.delay(index * 40)} capped at 10 items); chat bubbles slide in; reviews fade in.
3. Pressables: scale 0.97 on press + light haptic on primary actions.
4. Tab bar: active icon bounce; unread badge pops when the count changes.
5. Toast / NotificationBanner: slide down + fade, slide up on dismiss.
6. StarRating: spring fill, gray → marigold.
7. OTP input: focus scale, shake on error, all boxes turn green on success.
8. Success moments: animated checkmark (ad submitted, KYC approved, review submitted).
````

---

### ✅ Prompt 46 — Error Handling & Offline State

````
1. Install: npx expo install @react-native-community/netinfo. Create src/hooks/useNetworkStatus.ts (isConnected && isInternetReachable).
2. src/components/common/OfflineBanner.tsx — red/amber bar under the status bar: "আপনি অফলাইনে আছেন। কিছু ফিচার কাজ নাও করতে পারে।" Slide down on disconnect, slide up on reconnect; mount in the root layout.
3. TanStack Query: onlineManager.setEventListener with NetInfo (pauses queries offline, refetches on reconnect) + focusManager with AppState (refetch on app foreground).
4. Global API error messages (in api.ts / a toast helper), keyed by status or code:
   - 401 → (handled by refresh) "আবার লগইন করুন"
   - 403 VERIFICATION_REQUIRED → open KYC; 403 ACCOUNT_SUSPENDED → force logout with message
   - 404 → "খুঁজে পাওয়া যায়নি"
   - 409 → show the API message (duplicate review/report, KYC already pending…)
   - 429 → "অনেকবার চেষ্টা করেছেন, কিছুক্ষণ পর আবার চেষ্টা করুন"
   - 500 / 503 → "সার্ভারে সমস্যা হয়েছে, আবার চেষ্টা করুন"
   - NETWORK_ERROR → "ইন্টারনেট সংযোগ পরীক্ষা করুন"
5. Error boundary: wrap the root Stack (export ErrorBoundary from the root _layout.tsx — Expo Router supports a route-level ErrorBoundary export) showing "কিছু একটা সমস্যা হয়েছে" + "আবার চেষ্টা করুন" (retry).
6. Retry: every error state has a retry button; socket reconnects automatically (Prompt 27).
````

---

## 🧪 Phase 13: Testing & Bug Fixes

### ✅ Prompt 47 — TypeScript Types & Interfaces

````
Finalize all shared types in src/types/ so they match the backend EXACTLY (see the API Contract in docs/mobile-app-prompts.md and backend/src/models). Every document has `id` (string) — use it everywhere; never rely on `_id`.

1. user.types.ts
```typescript
export interface User {
  id: string;
  phoneNumber: string;
  displayName: string;
  verifiedName: string | null;
  isVerified: boolean;
  ageGroup: 'adult' | 'minor' | null;
  role: 'user' | 'moderator' | 'admin';
  status: 'active' | 'suspended' | 'inactive';
  averageRating: number;
  totalReviews: number;
  lastLoginDate: string;
  deletionRequestedAt: string | null;
  createdAt: string;
}
export type PublicUser = Pick<User, 'id' | 'displayName' | 'verifiedName' | 'isVerified' | 'averageRating' | 'totalReviews' | 'createdAt'>;
export interface SellerSummary extends PublicUser { phoneNumber?: string | null }
export interface VerificationLog {
  id: string;
  verificationType: 'adult' | 'minor';
  verificationStatus: 'pending_review' | 'approved' | 'rejected';
  manualReviewReason: string | null;
  selfieUrl: string;
  createdAt: string;
}
```

2. listing.types.ts
```typescript
export type ListingCondition = 'new' | 'like_new' | 'used';
export type ListingStatus = 'pending' | 'active' | 'sold' | 'archived';
export interface ListingLocation {
  type: 'Point';
  coordinates: [number, number]; // [longitude, latitude]
  addressLine?: string;
  division?: string;
  district?: string;
  thana?: string;
}
export interface Listing {
  id: string;
  sellerId: string | SellerSummary; // object on public endpoints, string on /listings/my
  title: string;
  description: string;
  price: number;
  category: string;
  condition: ListingCondition;
  images: string[];
  hidePhoneNumber: boolean;
  location: ListingLocation;
  soldToBuyerId: string | null;
  status: ListingStatus;
  moderationFlags?: { flagType: 'keyword' | 'image' | 'report' | 'manual' | null; flagReason: string | null };
  distance?: number;
  expiresAt: string;
  createdAt: string;
  updatedAt: string;
}
export interface ListingsPage { listings: Listing[]; total: number; page: number; limit: number; totalPages: number }
export interface Review {
  id: string;
  listingId: { id: string; title: string; images: string[]; price: number } | string;
  reviewerId: { id: string; displayName: string; isVerified: boolean } | string;
  revieweeId: string;
  rating: number;
  reviewText: string;
  createdAt: string;
}
export interface ReviewsPage { reviews: Review[]; total: number; page: number; totalPages: number; averageRating: number }
export interface Report {
  id: string;
  targetType: 'Listing' | 'User';
  targetId: { id: string; title?: string; displayName?: string } | null;
  reason: 'scam' | 'harassment' | 'misrepresentation' | 'inappropriate' | 'other';
  description: string;
  status: 'pending' | 'reviewed' | 'resolved' | 'dismissed';
  resolution: string | null;
  createdAt: string;
}
```

3. chat.types.ts — UserPreview, Message (id, roomId, senderId: string, sender, messageText, readStatus, createdAt), ChatRoom (id, listingId, listing, buyerId, buyer, sellerId, seller, lastMessage, unreadCount, latestActivity, createdAt, updatedAt) and MessagesPage { messages; total; page; totalPages } — copy them from the API Contract. Socket payload types: TypingEvent { roomId; userId }, ReadEvent { roomId; readBy }, WarningEvent { roomId; messageId; warnings: string[] }.

4. api.types.ts
```typescript
export interface ApiResponse<T> { success: boolean; message?: string; data: T }
export interface ApiErrorBody { success: false; error: string; code: string; details?: string[] }
export class ApiError extends Error { code: string; status?: number; details?: string[] }
export interface AuthPayload { user: User; accessToken: string; refreshToken: string }
```

Replace every `any` in services, stores and screens with these types. `npx tsc --noEmit` must pass with zero errors.
````

---

### ✅ Prompt 48 — End-to-End Flow Testing

````
Run the backend (cd backend && npm run dev) and the app on a real device, then test every flow below and fix all bugs you find. Read OTPs from the backend terminal. Use the web admin panel (/admin) to approve KYC requests and ads.

1. Auth: fresh install → onboarding → login → OTP → home · wrong OTP (shake + INVALID_OTP) · 5 wrong OTPs (OTP_ATTEMPTS_EXCEEDED) · expired OTP · resend · kill & reopen app (auto-login via refresh token) · wait > 15 min (access token refresh is silent) · logout.
2. KYC: unverified user is blocked from post/chat/phone/report with a clear message · adult flow → status "pending_review" → approve in the web admin → app shows verified (status screen polling / refreshUser) · rejected flow shows the reason · minor flow with consent · daily limit (KYC_LIMIT_REACHED).
3. Listings: create ad (all 4 steps, 1-10 photos, location) → "রিভিউতে" in My Listings → approve in admin → appears on Home/Search · edit (title change → back to pending) · renew · delete · filters (category, condition, price, division/district/thana, sort, near me) · public profile shows only active ads.
4. Chat: start chat from a listing (second verified test account) · send/receive in real time on two devices · typing indicator · read ticks · unread badge on the tab and list · link/phone in a message gets sanitised + warning · app in background → local notification → tap opens the chat.
5. Sell & review: seller marks the ad sold to the chatting buyer → buyer sees "রিভিউ দিন" in the conversation → submits a review → seller's rating updates on the profile · duplicate review blocked · "sold outside" option.
6. Reports: report an ad and a user → appears in My Reports → resolve in admin → status updates · duplicate report blocked.
7. Profile & settings: edit display name · theme switch · notification preferences · account deletion (then logging in again within 30 days restores the account).
8. Edge cases: airplane mode (offline banner, retry), server down, empty states, very long titles/descriptions, Bangla text rendering everywhere, small (iPhone SE) and large screens, Android back button, dark mode.

Write the results as a checklist in mobile-app/TESTING.md.
````

---

### ✅ Prompt 49 — Performance Optimization

````
Optimize the Becha-Kena app:

1. Images: expo-image everywhere with cachePolicy "memory-disk", fixed aspect ratios, placeholder + transition, recyclingKey in lists. Upload size is already reduced by compressImage (max 1280px JPEG 0.75).
2. Lists: FlatList (or @shopify/flash-list via npx expo install) with keyExtractor = item.id, getItemLayout for fixed-height rows, removeClippedSubviews, windowSize 7, maxToRenderPerBatch 10, initialNumToRender 8, stable renderItem with useCallback.
3. Memoization: React.memo on ListingCard, ChatBubble, room rows, review items; select narrow slices from Zustand (useStore(s => s.x)) to avoid re-renders. (The React Compiler is enabled in app.json — do not fight it with unnecessary useMemo.)
4. Network: TanStack Query staleTime (feeds 60s, listing detail 30s, profile 5 min), keepPreviousData for search pagination, prefetch listing detail on card press-in, debounce search (500ms), limit=20 pages.
5. Socket: one connection for the whole app, listeners registered once, disconnect after 30s in background, typing events throttled.
6. Bundle: remove unused packages/imports, import icons from a single family, check `npx expo export` size, lazy-load heavy screens if needed.
7. Measure: React DevTools profiler on Home scroll and Conversation; fix anything above 16ms/frame.
````

---

## 🚀 Phase 14: Production Build & Deployment

### ✅ Prompt 50 — App Configuration for Production

````
Configure the Becha-Kena app for production builds (read the SDK 57 + EAS docs first).

1. app.json (or app.config.ts so env vars can be read):
   - name: "বেচা-কেনা" (display name; or "Becha-Kena"), slug: "becha-kena", version: "1.0.0", scheme: "bechakena" (replace "mobileapp" and update deep links)
   - ios.bundleIdentifier and android.package: "com.bechakena.app"
   - orientation portrait, userInterfaceStyle automatic
   - splash (expo-splash-screen plugin): backgroundColor "#00704A", white logo
   - adaptive icon backgroundColor "#00704A"
   - permissions / plugin texts (Bangla + English): camera (NID selfie), photo library (ad photos), location (nearby ads), notifications
   - plugins: expo-router, expo-splash-screen, expo-camera, expo-image-picker, expo-location, expo-notifications, expo-secure-store, expo-font
   - extra.eas.projectId (from `eas init`)
2. Environment variables (EXPO_PUBLIC_* are embedded in the bundle — never put secrets there):
   - .env (development): EXPO_PUBLIC_API_URL=http://<LAN-IP>:5000/api/v1, EXPO_PUBLIC_SOCKET_URL=http://<LAN-IP>:5000
   - preview/staging and production values are set per build profile in eas.json (or EAS environment variables)
   - Production MUST use HTTPS (Android blocks cleartext HTTP in release builds).
3. eas.json:
```json
{
  "cli": { "version": ">= 16.0.0", "appVersionSource": "remote" },
  "build": {
    "development": { "developmentClient": true, "distribution": "internal",
      "env": { "EXPO_PUBLIC_API_URL": "http://192.168.0.105:5000/api/v1", "EXPO_PUBLIC_SOCKET_URL": "http://192.168.0.105:5000" } },
    "preview": { "distribution": "internal", "android": { "buildType": "apk" },
      "env": { "EXPO_PUBLIC_API_URL": "https://staging-api.bechakena.com/api/v1", "EXPO_PUBLIC_SOCKET_URL": "https://staging-api.bechakena.com" } },
    "production": { "autoIncrement": true,
      "env": { "EXPO_PUBLIC_API_URL": "https://api.bechakena.com/api/v1", "EXPO_PUBLIC_SOCKET_URL": "https://api.bechakena.com" } }
  },
  "submit": {
    "production": {
      "ios": { "appleId": "your@email.com", "ascAppId": "YOUR_ASC_APP_ID" },
      "android": { "serviceAccountKeyPath": "./google-service-account.json", "track": "internal" }
    }
  }
}
```
4. Backend production notes (do not change backend code, just document in mobile-app/README.md): the API must be served over HTTPS with WebSocket upgrade enabled on the reverse proxy (Nginx `proxy_set_header Upgrade $http_upgrade; proxy_set_header Connection "upgrade";` for /socket.io/), and the S3 bucket objects under listings/ must be publicly readable so images load.

Use the EAS CLI as `npx eas-cli@latest …` (see mobile-app/AGENTS.md).
````

---

### ✅ Prompt 51 — App Icons, Splash Screen & Assets

````
Create and configure production assets for Becha-Kena (replace the default Expo/React assets in mobile-app/assets/):

1. App icon: the same mark as the web logo (frontend/public/favicon.svg) — white "exchange arrows" on a flag-green (#00704A) rounded square with a small red (#E63946) dot.
   - iOS: 1024×1024 PNG, no transparency (or update assets/expo.icon)
   - Android adaptive: foreground 1024×1024 with the mark inside the safe zone, background colour #00704A, monochrome variant
2. Splash: green #00704A background, white mark centred (expo-splash-screen config in app.json).
3. In-app assets: onboarding illustrations (3), empty-state illustrations, KYC illustrations (or keep icon-in-circle designs), notification icon (white, transparent, Android).
4. Fonts: Hind Siliguri (Bangla) via @expo-google-fonts/hind-siliguri loaded with expo-font; system font fallback.
5. Remove unused default assets (react-logo*, expo-badge*, tutorial-web.png) and their references. Compress all PNGs.
````

---

### ✅ Prompt 52 — Build, Test & Store Submission

````
Prepare the final build and store submission.

1. Pre-build checklist (fix everything before building):
   - [ ] `npx tsc --noEmit` → 0 errors, `npx expo lint` clean, `npx expo-doctor` passes
   - [ ] All flows in mobile-app/TESTING.md pass on Android + iOS
   - [ ] Production API URL is HTTPS and reachable; Socket.io connects over wss
   - [ ] Images upload (presigned URL) and display from S3
   - [ ] Bangla text renders correctly on every screen; dark mode works
   - [ ] Loading / empty / error / offline states everywhere
   - [ ] Deep links (bechakena://listing/<id>, notification taps) work
   - [ ] KeyboardAvoidingView on all input screens; Android back button behaves
2. Builds:
```bash
npx eas-cli@latest login
npx eas-cli@latest init                                   # once, writes projectId
npx eas-cli@latest build --profile development --platform android   # dev client for testing native modules
npx eas-cli@latest build --profile preview --platform android       # APK for testers
npx eas-cli@latest build --profile production --platform all        # store builds (AAB + IPA)
```
3. Submit:
```bash
npx eas-cli@latest submit --profile production --platform android
npx eas-cli@latest submit --profile production --platform ios
```
4. Store listing: name "বেচা-কেনা — Verified Marketplace", subtitle "নিরাপদ সেকেন্ড-হ্যান্ড কেনা-বেচা", Bangla + English description, screenshots (6.7", 6.5" iPhone, Android phone), category Shopping, keywords "second hand, buy sell, bangladesh, verified, marketplace, NID", privacy policy URL, support URL, age rating 12+.
   Play Store: content rating questionnaire; Data safety — phone number, government ID number (hashed), photos (selfie for verification, ad photos), approximate location, messages; data encrypted in transit; account deletion supported (in-app + web).
5. After launch: crash reporting (Sentry `npx expo install @sentry/react-native` or EAS Insights), OTA hotfixes with `npx eas-cli@latest update --channel production`, analytics (optional).
````

---

## 📌 Quick Reference — Package Install Summary

```bash
cd mobile-app

# Storage, networking, state, data fetching
npx expo install expo-secure-store @react-native-async-storage/async-storage axios zustand @tanstack/react-query socket.io-client date-fns

# Forms & pickers
npx expo install react-hook-form @react-native-community/datetimepicker

# Camera, media & location
npx expo install expo-camera expo-image-picker expo-image-manipulator expo-file-system expo-location

# Notifications & device
npx expo install expo-notifications expo-device expo-haptics

# UI
npx expo install @gorhom/bottom-sheet @react-native-community/netinfo

# Fonts
npx expo install expo-font @expo-google-fonts/hind-siliguri

# Already installed by the template: expo-image, expo-router, react-native-reanimated,
# react-native-gesture-handler, react-native-safe-area-context, expo-splash-screen,
# expo-constants, expo-linking, expo-web-browser, @expo/vector-icons (via expo)

# EAS (no global install needed)
npx eas-cli@latest --version
```

---

## 🎯 Development Order Recommendation

| Priority | Phase | Estimated Time | Why this order |
|----------|-------|-----------------|----------------|
| 🔴 P0 | Phase 0 (Foundation) | 1 day | Everything depends on the API client + theme |
| 🔴 P0 | Phase 1 (Auth) | 2 days | Every protected endpoint needs a Bearer token |
| 🔴 P0 | Phase 3 (Home Feed) | 2 days | Public browsing works without verification |
| 🔴 P0 | Phase 6 (Listing Detail) | 1 day | |
| 🟡 P1 | Phase 2 (KYC) | 2 days | Required before posting / chatting |
| 🟡 P1 | Phase 5 (Ad Creation) | 3 days | Needs KYC + media upload |
| 🟡 P1 | Phase 4 (Search/Filter) | 2 days | |
| 🟡 P1 | Phase 7 (Chat) | 3 days | Needs two verified accounts to test |
| 🟢 P2 | Phase 8 (Profile/Reviews) | 2 days | Reviews need a sold ad + chat |
| 🟢 P2 | Phase 9 (Notifications) | 1 day | |
| 🟢 P2 | Phase 10 (Reports) | 1 day | |
| 🟢 P2 | Phase 11 (Settings) | 1 day | |
| 🔵 P3 | Phase 12 (Polish) | 2 days | |
| 🔵 P3 | Phase 13 (Testing) | 2 days | |
| 🔵 P3 | Phase 14 (Production) | 2 days | |
| | **Total** | **~27 days** | |

---

## 📝 What was corrected in this version (vs. the first draft)

These issues would have broken the app if the original prompts were used as-is:

| Area | First draft said | Reality / fix |
|---|---|---|
| Auth | Bearer token, but the backend only read cookies and never returned tokens | Backend now accepts `Authorization: Bearer` and returns `accessToken` + `refreshToken`; refresh takes `{ refreshToken }` in the body |
| IDs | `id` everywhere | Backend now returns both `id` and `_id`; chat payloads were raw `_id` objects — now normalised |
| KYC | Upload NID front/back photos, response `status: "approved"` | Backend only takes `selfieUrl`; every request is `pending_review` until an admin approves |
| Listings | `GET /listings?sellerId=me`, `sort`, `condition` filters | My ads = `GET /listings/my`; `sellerId`, `sort`, `condition`, division/district/thana filters were added to the backend |
| Listing shape | `listing.seller` | Seller is the populated `listing.sellerId` object |
| Description | 20-1000 (validation) but the DB model required 50-500 | Model fixed to 20-1000 |
| Categories | `mobile`, `laptop`, `bikes`, `property`… | Must use the web values: `Mobile`, `Electronics`, `Vehicles`, … (see table) |
| Locations | English names, coordinates from nowhere | Bangla strings from `frontend/src/utils/locations.ts` + division centre coordinates `[lng, lat]` |
| Reviews | `GET /reviews?revieweeId=` | `GET /reviews/user/:userId`; review text is required |
| Reports | description optional; reasons rejected by the API | description required; reason enum fixed in the backend (`scam`, `harassment`, …) |
| Socket | `typing` / `message_read` / `user_online` events | Server emits `user_typing`, `messages_read`; no presence; `leave_room` added; `new_message` now reaches both participants |
| Mark as sold | buyer required | `buyerId` optional ("sold outside the app") |
| Profile | avatar upload | Backend has no avatar field → initial-letter avatars |
| Push | FCM pushes for NT-1/2/3 | Backend stores tokens but never sends → local + in-app notifications |
| Account deletion | logout after delete | Tokens are revoked by DELETE → clear locally, do not call /auth/logout |
| Installs | `npm install` for some packages | Always `npx expo install` (SDK-compatible versions) |

---

> **💡 Usage Instructions:** Feed each prompt individually to your AI (Claude Code / Cursor / ChatGPT / Antigravity) from the repository root. Implement the output of each prompt, test it thoroughly on a device against the running backend, commit, and then proceed to the next prompt. Do not skip steps — follow the sequential order!
