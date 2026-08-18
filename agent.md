# Becha-Kena — AI Agent Instructions

> **Read this file FIRST before writing any code.** This document is the single source of truth for any AI coding assistant working on the Becha-Kena project. It contains the project context, architecture, coding conventions, critical business rules, and absolute constraints that must never be violated.

---

## 1. Project Identity

| Field | Value |
|-------|-------|
| **Project Name** | Becha-Kena (বেচা-কেনা) |
| **Type** | Peer-to-Peer (C2C) Classified Marketplace |
| **Domain** | Second-hand goods buying/selling in Bangladesh |
| **Core Differentiator** | Mandatory NID (National ID) verification for all users — zero anonymous accounts |
| **Tagline** | "The simplicity of Bikroy, with 100% verified users." |

---

## 2. Tech Stack (Do NOT Deviate)

| Layer | Technology | Notes |
|-------|-----------|-------|
| **Runtime** | Node.js | LTS version |
| **Backend Framework** | Express.js | With TypeScript |
| **Language** | TypeScript | Strict mode enabled |
| **Database** | MongoDB Atlas | NoSQL document store |
| **ODM** | Mongoose | All DB operations go through Mongoose models |
| **Real-time** | Socket.io | WebSocket chat on `/chat` namespace |
| **Auth** | JWT (jsonwebtoken) | Access + Refresh tokens via HTTP-only cookies |
| **Password/OTP Hashing** | bcryptjs | 10 salt rounds |
| **NID Hashing** | SHA-256 (crypto) | With static salt + pepper from env vars |
| **File Storage** | AWS S3 | Pre-signed URLs for upload/download |
| **Scheduler** | node-cron | Background jobs (ad expiry, cleanup, etc.) |
| **Linting** | ESLint + Prettier | Enforce consistent code style |

### Packages You Must Use
```
express, mongoose, dotenv, cors, helmet, cookie-parser, jsonwebtoken, bcryptjs,
express-rate-limit, xss-clean, socket.io, @aws-sdk/client-s3, node-cron
```

### Packages You Must NOT Introduce Without Explicit Approval
- No ORM other than Mongoose (no Prisma, no TypeORM, no Sequelize)
- No Passport.js (we use custom JWT middleware)
- No GraphQL (REST only for this project)
- No Redis (unless explicitly approved for BullMQ queues)
- No external validation libraries like Joi or Zod (we use a custom lightweight validator — see `src/middlewares/validate.ts`)

---

## 3. Architecture: Layered Monolith

This is a **layered monolith**, NOT microservices. All code lives in a single Express.js application organized by technical layers. Never split this into separate services/deployments.

### Directory Structure (Strict — Do Not Change)
```
backend/
├── src/
│   ├── config/             # DB connection, S3 config, env loader
│   │   ├── db.ts
│   │   ├── env.ts
│   │   └── s3.ts
│   ├── controllers/        # HTTP request handlers (thin — delegate to services)
│   │   ├── admin.controller.ts
│   │   ├── auth.controller.ts
│   │   ├── ad.controller.ts
│   │   ├── chat.controller.ts
│   │   ├── media.controller.ts
│   │   ├── review.controller.ts
│   │   ├── report.controller.ts
│   │   ├── user.controller.ts
│   │   └── verification.controller.ts
│   ├── middlewares/         # Express middlewares
│   │   ├── auth.ts          # JWT authenticate + optionalAuth
│   │   ├── authorize.ts     # Role-based access (RBAC)
│   │   ├── requireVerified.ts # NID verification gate
│   │   ├── rateLimiter.ts
│   │   ├── validate.ts      # Input validation factory
│   │   ├── errorHandler.ts  # Global error handler
│   │   └── notFound.ts      # 404 catch-all
│   ├── models/              # Mongoose schemas (data layer)
│   │   ├── User.ts
│   │   ├── TemporaryOtp.ts
│   │   ├── VerificationLog.ts
│   │   ├── BannedNid.ts
│   │   ├── Listing.ts
│   │   ├── ChatRoom.ts
│   │   ├── Message.ts
│   │   ├── Review.ts
│   │   └── Report.ts
│   ├── routes/              # Express router definitions
│   │   ├── auth.routes.ts
│   │   ├── user.routes.ts
│   │   ├── verification.routes.ts
│   │   ├── media.routes.ts
│   │   ├── ad.routes.ts
│   │   ├── chat.routes.ts
│   │   ├── review.routes.ts
│   │   ├── report.routes.ts
│   │   └── admin.routes.ts
│   ├── services/            # Business logic (ALL logic lives here)
│   │   ├── auth.service.ts
│   │   ├── user.service.ts
│   │   ├── verification.service.ts
│   │   ├── s3.service.ts
│   │   ├── ad.service.ts
│   │   ├── chat.service.ts
│   │   ├── review.service.ts
│   │   ├── report.service.ts
│   │   ├── admin.service.ts
│   │   ├── notification.service.ts
│   │   └── scheduler.service.ts
│   ├── sockets/             # WebSocket handlers
│   │   ├── chatSocket.ts
│   │   └── scheduler.init.ts
│   ├── utils/               # Pure helper functions
│   │   ├── AppError.ts
│   │   ├── response.ts
│   │   ├── phone.ts
│   │   ├── otp.ts
│   │   ├── jwt.ts
│   │   ├── nidHash.ts
│   │   ├── keywords.ts
│   │   ├── sanitize.ts
│   │   └── chatFilters.ts
│   ├── validations/         # Request validation schemas
│   │   ├── auth.validation.ts
│   │   ├── listing.validation.ts
│   │   ├── review.validation.ts
│   │   └── report.validation.ts
│   ├── app.ts               # Express app setup (middlewares + routes)
│   └── server.ts            # Server bootstrap (DB connect, Socket.io, cron)
├── tests/
├── package.json
├── tsconfig.json
└── .env
```

### Layer Rules (CRITICAL)

| Layer | Responsibility | Can Call | Cannot Call |
|-------|---------------|----------|-------------|
| **Controller** | Parse HTTP request, call service, send response | Services, Utils | Models directly, other Controllers |
| **Service** | All business logic, validation rules, transactions | Models, Utils, other Services | Controllers, `res` object |
| **Model** | Mongoose schema definition, indexes, hooks | Nothing (passive data layer) | Services, Controllers |
| **Middleware** | Cross-cutting concerns (auth, validation, rate-limit) | Models (for auth check), Utils | Services, Controllers |
| **Utils** | Pure functions, no side effects | Nothing external | Everything |

> **NEVER put business logic in controllers.** Controllers must be thin wrappers: extract input → call service → send response. That's it.

---

## 4. Coding Conventions

### 4.1 TypeScript Rules
- **Strict mode** is enabled. No `any` types unless absolutely unavoidable (and if so, add a `// eslint-disable-next-line` with a comment explaining why).
- Use **interfaces** for object shapes, **types** for unions/intersections.
- All function parameters and return types must be explicitly typed.
- Use `async/await` everywhere. No raw `.then()` chains.
- Use `const` by default. Only use `let` when reassignment is necessary. Never use `var`.

### 4.2 Naming Conventions
| Item | Convention | Example |
|------|-----------|---------|
| Files | camelCase | `auth.service.ts`, `chatFilters.ts` |
| Models | PascalCase (singular) | `User`, `Listing`, `ChatRoom` |
| Collections | snake_case (plural) | `users`, `chat_rooms`, `banned_nids` |
| Interfaces | PascalCase, prefixed with `I` | `IUser`, `IListing` |
| Variables/Functions | camelCase | `getUserById`, `normalizePhone` |
| Constants | UPPER_SNAKE_CASE | `BLOCKED_KEYWORDS`, `MAX_OTP_ATTEMPTS` |
| Env variables | UPPER_SNAKE_CASE | `JWT_ACCESS_SECRET`, `NID_HASH_SALT` |
| Route paths | kebab-case | `/verify-adult`, `/request-otp` |

### 4.3 Error Handling Pattern
- **ALWAYS** use the custom `AppError` class to throw operational errors.
- **NEVER** use raw `throw new Error(...)` in services or controllers.
- **NEVER** send raw `res.json()` or `res.status().send()`. Always use `sendSuccess()` and `sendError()` from `src/utils/response.ts`.
- All async route handlers must be wrapped in try-catch OR use an `asyncHandler` utility that forwards errors to `next()`.

```typescript
// ✅ CORRECT
throw new AppError('Listing not found', 404, 'RESOURCE_NOT_FOUND');

// ❌ WRONG
throw new Error('Listing not found');
res.status(404).json({ message: 'Not found' });
```

### 4.4 Response Format (Universal)
Every single API response MUST follow this format:

**Success:**
```json
{
  "success": true,
  "message": "Description of what happened",
  "data": { ... }
}
```

**Error:**
```json
{
  "success": false,
  "error": "Human-readable error message",
  "code": "MACHINE_READABLE_ERROR_CODE",
  "details": [ ... ]
}
```

### 4.5 Comments & Documentation
- Add JSDoc comments to all service methods explaining the business rule they implement.
- Reference the PRD section when implementing a specific business rule, e.g.:
  ```typescript
  /**
   * Marks a listing as sold and assigns the buyer.
   * PRD 3.2: Seller selects a verified buyer from chat history.
   * PRD 3.5: This triggers the review eligibility window.
   */
  ```
- Do not add obvious comments like `// increment counter` above `counter++`.

---

## 5. Database Rules

### 5.1 MongoDB / Mongoose Conventions
- **Collection names** are lowercase plural: `users`, `listings`, `chat_rooms`, `messages`, `reviews`, `verification_logs`, `banned_nids`, `temporary_otps`, `reports`.
- **Always enable `{ timestamps: true }`** on schemas (auto `createdAt`/`updatedAt`).
- Use `.lean()` on read queries where you don't need Mongoose document methods (performance).
- **Never store raw PII** (NID numbers) in plain text. Always hash with SHA-256 + salt + pepper.
- **Never expose internal fields** like `tokenVersion`, `fcmTokens`, or `__v` in API responses. Use `.select('-field')` or explicit projection.

### 5.2 Transactions
Use MongoDB multi-document transactions (sessions) for these operations:
1. **KYC Approval** — update User + VerificationLog atomically.
2. **User Ban** — suspend User + archive Listings + create BannedNid.
3. **Mark as Sold** — verify ChatRoom exists + update Listing status.
4. **Submit Review** — create Review + recalculate seller averageRating.

Always follow this pattern:
```typescript
const session = await mongoose.startSession();
session.startTransaction();
try {
  // ... operations with { session } ...
  await session.commitTransaction();
} catch (error) {
  await session.abortTransaction();
  throw error;
} finally {
  session.endSession();
}
```

### 5.3 The 9 Collections
| Collection | Purpose |
|------------|---------|
| `users` | User profiles, roles, verification status, trust scores |
| `temporary_otps` | Short-lived OTP codes (TTL auto-delete after 3 min) |
| `verification_logs` | NID verification attempt history and audit trail |
| `banned_nids` | Permanent NID hash blacklist (never deleted) |
| `listings` | Classified ads with geospatial data |
| `chat_rooms` | Chat session links (buyer + seller + listing) |
| `messages` | Individual chat messages (sanitized/masked text) |
| `reviews` | Buyer-to-seller ratings after completed transactions |
| `reports` | User-submitted dispute reports |

---

## 6. Authentication & Authorization Rules

### 6.1 Auth Flow
1. User submits phone number → backend sends OTP via SMS.
2. User submits OTP → backend verifies, creates/finds User, issues JWT tokens.
3. Tokens are set as **HTTP-only, Secure, SameSite=Strict cookies** (NOT in JSON body).
4. Every authenticated request reads the token from the cookie, verifies it, and checks `tokenVersion`.

### 6.2 Token Version Revocation
- Every User has a `tokenVersion` (integer, starts at 0).
- The current `tokenVersion` is embedded in the JWT payload.
- On every authenticated request, the middleware compares the token's `tokenVersion` with the DB value.
- **Mismatch = token is revoked** → reject with 401.
- Banning a user increments `tokenVersion` → all active sessions are instantly killed.
- Logout also increments `tokenVersion`.

### 6.3 Role-Based Access Control (RBAC)

| Role | Can Do |
|------|--------|
| **Guest (unauthenticated)** | Browse listings, search, view public profiles |
| **User (unverified)** | Everything Guest can + view own profile, update profile |
| **User (verified)** | Everything above + post ads, chat, view contact info, submit reviews/reports |
| **Moderator** | Everything verified user can + moderate listings, review KYC queue, manage reports |
| **Admin** | Everything moderator can + ban users, manage system settings |

### 6.4 The Gatekeeper Rule (PRD 3.1)
> **"No NID = No Access"**

Unverified users can browse and search, but CANNOT:
- Post ads
- View seller phone numbers
- Start or send chat messages
- Submit reviews or reports

Enforce this with the `requireVerified` middleware on all protected routes.

---

## 7. Critical Business Rules (Never Violate)

These rules come directly from the PRD and must be respected in all code changes:

### 7.1 Phone Number
- **Format:** Always stored as `+8801XXXXXXXXX` (canonical).
- **Validation regex:** `^(?:\+88|88)?(01[3-9]\d{8})$` (input), `^\+8801[3-9]\d{8}$` (stored).
- **Normalize before any operation** — never store raw user input.

### 7.2 OTP
- **6 digits**, hashed with bcrypt before storage.
- **Expires in 3 minutes** (180 seconds TTL).
- **Rate limit:** Max 5 OTP requests per IP per hour.
- **Max 3 requests per phone** in a 15-minute window.

### 7.3 NID Verification
- **Max 3 attempts per user per day.** Enforced via `attemptsToday` + `lastAttemptDate` with daily reset logic.
- **NID numbers are NEVER stored in plain text.** Only SHA-256 hash with salt + pepper.
- **NID photos encrypted at rest** (AES-256 in S3/KMS).
- **Pre-signed URLs for admin viewing** — 5-minute expiration, never publicly accessible.
- **Parent NID limit:** Maximum 3 minor accounts per parent NID hash.
- **Porichoy API timeout fallback:** If API times out (>10s) or returns 5xx → auto-redirect to manual review queue.

### 7.4 Listings
- **Title:** 10-80 characters. **Description:** 20-1000 characters.
- **Images:** Max 1.5MB each, WebP format preferred. Validate file signatures (magic bytes).
- **HTML/JS tags MUST be stripped** from title, description, and all user-facing text fields (XSS prevention).
- **All new ads start as `pending`** and go through moderation before becoming `active`.
- **Modification triggers re-moderation** if: title changes, or price changes > 20%.
- **Ad lifespan:** 30 days active → Day 27 renewal reminder → Day 30 auto-archive.
- **Archived ads** remain in seller dashboard for 90 days, then permanently deleted.
- **Keyword filtering** for prohibited content (weapons, drugs, adult, counterfeit).

### 7.5 Chat
- **WebSocket on `/chat` namespace**, secured via `wss://` + JWT cookie.
- **ChatRoom uniqueness:** One room per `{ buyerId, sellerId, listingId }` tuple.
- **Link blocking:** External URLs are stripped/blocked.
- **Phone number masking:** Bangladeshi phone patterns are masked in chat text.
- **Suspicious pattern warnings:** Messages containing advance payment keywords trigger a safety banner.

### 7.6 Reviews
- A review is ONLY allowed when ALL 3 conditions are met:
  1. The listing status is `sold`.
  2. The reviewer is the `soldToBuyerId` on the listing.
  3. A ChatRoom exists between the buyer and seller for that listing.
- **One review per listing** (unique index on `listingId`).
- Submitting a review recalculates the seller's `averageRating` and `totalReviews` via aggregation.

### 7.7 User Banning
- Banning is a **transactional operation** that does all of the following atomically:
  1. Set user `status` to `suspended`.
  2. Increment `tokenVersion` (instant session kill).
  3. Archive all active listings.
  4. Add NID hash to `banned_nids` collection.
- **Banned NID hashes are NEVER deleted** (permanent blacklist).

### 7.8 Account Deletion
- On deletion request: listings and chats are immediately hidden, `deletionRequestedAt` is set.
- After 30 days: PII (name, phone, NID photos, selfies) is **hard-deleted**.
- Banned NID hashes and ban history are **retained permanently**.

### 7.9 Inactive User Handling
- Users inactive for 180+ days → status set to `inactive`, ads hidden.
- Logging in via OTP **instantly reactivates** the account without re-verification.

### 7.10 Minor-to-Adult Transition
- When a minor turns 18 (checked against DOB): in-app + SMS alert triggered.
- 30-day grace period to submit own NID.
- If not submitted within grace period → restricted back to Guest-level (unverified).

---

## 8. API Versioning & Route Conventions

- **Base URL:** `/api/v1`
- **Versioning:** URI-based. Major breaking changes → new version (`/api/v2`).
- All routes are prefixed under their feature module:

| Prefix | Module |
|--------|--------|
| `/api/v1/auth` | Authentication (OTP, login, logout) |
| `/api/v1/users` | User profiles |
| `/api/v1/kyc` | KYC / NID verification |
| `/api/v1/media` | S3 pre-signed URL generation |
| `/api/v1/listings` | Ad/listing CRUD, search, geo-query |
| `/api/v1/chat` | Chat rooms and message history (REST) |
| `/api/v1/reviews` | Rating and review system |
| `/api/v1/reports` | Dispute and report submission |
| `/api/v1/admin` | Admin panel (moderation, KYC review, bans, reports) |
| `/api/v1/health` | Health check (no auth) |

---

## 9. Environment Variables

All secrets and configuration must be loaded from environment variables. NEVER hardcode secrets.

```env
# Server
PORT=5000
NODE_ENV=development

# Database
MONGODB_URI=mongodb+srv://...

# JWT
JWT_ACCESS_SECRET=<random-64-char-string>
JWT_REFRESH_SECRET=<random-64-char-string>
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_EXPIRY=7d

# AWS S3
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_REGION=ap-south-1
AWS_S3_BUCKET=becha-kena

# NID Security
NID_HASH_SALT=<stored-in-secrets-manager>
NID_HASH_PEPPER=<stored-in-secrets-manager>

# External APIs
PORICHOY_API_KEY=
PORICHOY_API_URL=
SMS_API_KEY=
SMS_API_URL=

# Frontend
CLIENT_ORIGIN=http://localhost:3000
```

---

## 10. External API Integrations (Stub-First)

These external services are part of the system but should be **stubbed/mocked** during initial development:

| Service | Purpose | Stub Behavior |
|---------|---------|---------------|
| **Porichoy API** | NID validation against Bangladesh NID database | Return mock success with dummy name |
| **AWS Rekognition** | Face matching (selfie vs NID photo) | Return mock `similarity: 98%` |
| **SMS Gateway** | Send OTP via SMS | Log OTP to console |
| **Firebase Cloud Messaging** | Push notifications | Log notification payload to console |
| **Google Maps API** | Location autocomplete and geocoding | Accept raw coordinates without validation |

When stubbing, use a clear pattern:
```typescript
// TODO: Replace with actual Porichoy API call
// STUB: Returning mock verification success
const porichoyResult = { success: true, name: 'MOCK USER NAME' };
```

---

## 11. Background Jobs

The following jobs run on a cron schedule via `node-cron`:

| Job | Schedule | Action |
|-----|----------|--------|
| Ad Renewal Reminder | Daily 9:00 AM | Notify sellers whose ads expire in 3 days |
| Ad Auto-Archive | Daily midnight | Archive expired listings |
| Inactive User Sweep | Daily 2:00 AM | Deactivate users inactive > 180 days |
| PII Purge | Daily 3:00 AM | Hard-delete PII for accounts deleted > 30 days ago |
| Minor Transition Check | Daily 4:00 AM | Restrict minors past grace period |

---

## 12. Security Checklist

Every code change must respect these security principles:

- [ ] **No PII in plain text** — NID numbers are always hashed.
- [ ] **No tokens in response body** — JWT tokens go in HTTP-only cookies only.
- [ ] **XSS prevention** — All user-facing text is sanitized (HTML/JS tags stripped).
- [ ] **Input validation** — All request bodies are validated before processing.
- [ ] **Rate limiting** — OTP and verification endpoints are rate-limited.
- [ ] **RBAC enforcement** — Every route has appropriate `authenticate`, `authorize`, and `requireVerified` guards.
- [ ] **SQL/NoSQL injection** — Mongoose parameterized queries are used (never string concatenation in queries).
- [ ] **CORS** — Only allowed origins can make requests. Credentials mode enabled.
- [ ] **Helmet** — Security headers are always set.
- [ ] **Pre-signed URL expiry** — S3 URLs expire in 5 minutes.
- [ ] **Token version check** — Every authenticated request validates `tokenVersion`.

---

## 13. Testing Expectations

- All services should have unit tests.
- All API routes should have integration tests.
- Use a test database (separate MongoDB instance or in-memory with `mongodb-memory-server`).
- Mock external APIs (Porichoy, S3, SMS) in tests.
- Test edge cases:
  - Expired OTP
  - Banned user trying to login
  - 4th KYC attempt in a day
  - Review on a non-sold listing
  - Chat room deduplication
  - Token version mismatch after ban

---

## 14. Reference Documents

Before making any significant changes, consult these project documents in the repository root:

| Document | Purpose |
|----------|---------|
| [prd.md](./prd.md) | Product Requirements — features, user stories, business rules |
| [architecture.md](./architecture.md) | System architecture — layers, services, design decisions |
| [database.md](./database.md) | Database design — collections, relationships, indexes, transactions, Mongoose schemas |
| [database-schema.md](./database-schema.md) | Detailed field-level schema specifications for all 9 collections |
| [api-spec.md](./api-spec.md) | API endpoints — methods, paths, request/response formats, auth requirements |
| [dfd.md](./dfd.md) | Data Flow Diagrams — how data moves through the system |
| [prompt.md](./prompt.md) | Step-by-step build prompts (24 prompts in 13 phases) |

---

## 15. Common Mistakes to Avoid

| ❌ Don't | ✅ Do |
|----------|-------|
| Store NID number as plain text | Hash with SHA-256 + salt + pepper |
| Send JWT in response JSON body | Set as HTTP-only cookie |
| Put business logic in controllers | Put all logic in services |
| Use `throw new Error()` | Use `throw new AppError(msg, code, errorCode)` |
| Send raw `res.json()` | Use `sendSuccess()` / `sendError()` utilities |
| Skip `tokenVersion` check in auth | Always compare token's version with DB |
| Allow unverified users to post ads | Enforce `requireVerified` middleware |
| Create duplicate chat rooms | Use compound unique index `{ buyerId, sellerId, listingId }` |
| Store phone in user-input format | Normalize to `+8801XXXXXXXXX` before any operation |
| Skip input sanitization | Strip HTML/JS tags from all user text inputs |
| Import models directly in controllers | Go through services layer |
| Hardcode secrets in source code | Use environment variables |
| Allow reviews without sold status | Enforce all 3 review conditions |
| Delete banned NID hashes | Banned hashes are permanently retained |
| Skip MongoDB transactions for multi-doc ops | Use sessions for KYC approval, bans, sold-marking, reviews |

---

## 16. When Adding a New Feature

Follow this checklist when implementing any new feature:

1. **Read the PRD** — understand the business requirement.
2. **Check the database schema** — does the data model support it? If not, update schema first.
3. **Create/update the Model** (`src/models/`) — add new fields or new collection.
4. **Create/update the Service** (`src/services/`) — implement all business logic here.
5. **Create/update the Controller** (`src/controllers/`) — thin handler, delegates to service.
6. **Create/update the Routes** (`src/routes/`) — wire the controller with proper middlewares.
7. **Add validation schema** (`src/validations/`) — validate request input.
8. **Register routes in `app.ts`** — add the new route module if it's a new feature.
9. **Update `api-spec.md`** — document the new endpoint.
10. **Write tests** — unit test the service, integration test the endpoint.

---

## 17. Language & Locale Notes

- The app serves **Bangladesh**. Phone numbers follow BD mobile format.
- All currency values are in **BDT (Bangladeshi Taka)**. No currency symbol stored — just the number.
- Administrative hierarchy: **Division > District > Thana/Upazila**.
- NID (National ID) is the government-issued identity document.
- **Porichoy API** is the government NID validation service in Bangladesh.
- All dates/times should be stored in **UTC** in MongoDB. Conversion to `Asia/Dhaka` (UTC+6) happens on the client.
