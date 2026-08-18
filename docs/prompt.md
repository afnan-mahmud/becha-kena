# Becha-Kena Backend — Step-by-Step Build Prompts

> **Purpose:** This file contains a series of sequential, self-contained prompts. Feed each prompt (one at a time, in order) to an AI coding assistant to incrementally build the complete Becha-Kena Express.js + TypeScript backend from scratch.
>
> **Tech Stack:** Node.js, Express.js, TypeScript, Mongoose ODM, MongoDB Atlas, Socket.io, AWS S3, JWT (HTTP-only cookies)
>
> **Architecture:** Layered Monolith (Controllers → Services → Models)

---

## Phase 1: Project Initialization & Configuration

---

### Prompt 1 — Project Scaffolding & Directory Structure

```
Initialize a new Node.js + TypeScript backend project for a C2C classified marketplace called "Becha-Kena".

Requirements:
1. Initialize the project with `npm init -y` and install the following dependencies:
   - Production: express, mongoose, dotenv, cors, helmet, cookie-parser, jsonwebtoken, bcryptjs, express-rate-limit, xss-clean, socket.io, aws-sdk (or @aws-sdk/client-s3), node-cron
   - Development: typescript, ts-node, nodemon, @types/express, @types/node, @types/cors, @types/cookie-parser, @types/jsonwebtoken, @types/bcryptjs, concurrently

2. Create a `tsconfig.json` with:
   - target: ES2020, module: commonjs, outDir: ./dist, rootDir: ./src
   - strict: true, esModuleInterop: true, resolveJsonModule: true

3. Create the following directory structure inside `backend/src/`:
   ```
   src/
   ├── config/          # DB connection, env vars, S3 config
   ├── controllers/     # HTTP route controllers
   ├── middlewares/      # Auth, RBAC, rate-limiter, sanitizer, error handler
   ├── models/          # Mongoose schemas
   ├── routes/          # Express route definitions
   ├── services/        # Core business logic
   ├── sockets/         # WebSocket handlers (/chat namespace)
   ├── utils/           # Helpers (hashing, OTP generator, validators)
   ├── app.ts           # Express app setup (middlewares, routes)
   └── server.ts        # Server start, MongoDB connect, Socket.io init
   ```

4. Add npm scripts in `package.json`:
   - `"dev": "nodemon --exec ts-node src/server.ts"`
   - `"build": "tsc"`
   - `"start": "node dist/server.js"`

5. Create a `.env.example` file with placeholder variables:
   ```
   PORT=5000
   MONGODB_URI=mongodb+srv://<user>:<pass>@cluster.mongodb.net/becha-kena
   JWT_ACCESS_SECRET=
   JWT_REFRESH_SECRET=
   JWT_ACCESS_EXPIRY=15m
   JWT_REFRESH_EXPIRY=7d
   AWS_ACCESS_KEY_ID=
   AWS_SECRET_ACCESS_KEY=
   AWS_REGION=ap-south-1
   AWS_S3_BUCKET=becha-kena
   NID_HASH_SALT=
   NID_HASH_PEPPER=
   PORICHOY_API_KEY=
   PORICHOY_API_URL=
   SMS_API_KEY=
   SMS_API_URL=
   NODE_ENV=development
   ```

6. Create `src/config/db.ts` — a function that connects to MongoDB Atlas using mongoose. Log success/failure. Export the connect function.

7. Create `src/config/env.ts` — load and validate all environment variables using dotenv. Export a typed config object.

8. Create a basic `src/app.ts` that initializes Express with: helmet, cors (credentials: true), cookie-parser, express.json (limit 10kb), xss-clean. Export the app.

9. Create `src/server.ts` that imports the app, connects to MongoDB, and starts the HTTP server on the configured port. Add graceful shutdown handling.

Do NOT create any routes or controllers yet. Only set up the project skeleton and configuration.
```

---

### Prompt 2 — Global Error Handler & Response Utility

```
In the Becha-Kena backend project, create the global error handling system and response utilities.

Requirements:

1. Create `src/utils/AppError.ts`:
   - A custom error class extending the native `Error` class.
   - Properties: `statusCode` (number), `code` (string, application error code), `isOperational` (boolean, default true).
   - Constructor accepts: (message: string, statusCode: number, code: string).

2. Create `src/utils/response.ts`:
   - A helper function `sendSuccess(res, statusCode, message, data?)` that sends:
     ```json
     { "success": true, "message": "...", "data": { ... } }
     ```
   - A helper function `sendError(res, statusCode, error, code, details?)` that sends:
     ```json
     { "success": false, "error": "...", "code": "...", "details": [...] }
     ```

3. Create `src/middlewares/errorHandler.ts`:
   - A global Express error-handling middleware `(err, req, res, next)`.
   - If `err` is an instance of `AppError`, use its statusCode and code.
   - Handle Mongoose-specific errors:
     - `CastError` → 400 `INVALID_ID`
     - `ValidationError` → 400 `VALIDATION_FAILED` (extract field-level errors into `details` array)
     - Duplicate key error (code 11000) → 409 `DUPLICATE_ENTRY`
   - Handle JWT errors: `JsonWebTokenError` → 401 `INVALID_TOKEN`, `TokenExpiredError` → 401 `TOKEN_EXPIRED`.
   - For unhandled errors in production: send generic 500 `INTERNAL_ERROR`. In development: send full stack trace.
   - Log all errors to console with timestamp.

4. Create `src/middlewares/notFound.ts`:
   - Middleware that catches unmatched routes and throws an AppError with 404 `ROUTE_NOT_FOUND`.

5. Register both `notFound` and `errorHandler` in `app.ts` (notFound before errorHandler, both after all routes).

All API responses across the entire project MUST use the `sendSuccess` and `sendError` utilities for consistency. Never send raw `res.json()` from controllers.
```

---

## Phase 2: Authentication System

---

### Prompt 3 — User Model & Temporary OTP Model

```
In the Becha-Kena backend, create the Mongoose schemas for the User and TemporaryOtp collections.

Requirements:

1. Create `src/models/User.ts`:
   - Fields:
     - `phoneNumber`: String, required, unique, must match regex `/^\+8801[3-9]\d{8}$/` (canonical Bangladeshi format +8801XXXXXXXXX).
     - `displayName`: String, required, trim, min 1, max 30 characters.
     - `verifiedName`: String, default null (official name from Porichoy API after NID verification).
     - `isVerified`: Boolean, default false.
     - `ageGroup`: String, enum ['adult', 'minor', null], default null.
     - `parentNIDHash`: String, default null (SHA-256 hash for minor accounts).
     - `role`: String, enum ['user', 'moderator', 'admin'], default 'user'.
     - `status`: String, enum ['active', 'suspended', 'inactive'], default 'active'.
     - `tokenVersion`: Number, default 0 (incremented to invalidate all active JWTs on ban/logout).
     - `averageRating`: Number, default 0.
     - `totalReviews`: Number, default 0.
     - `fcmTokens`: Array of Strings (device push notification tokens).
     - `lastLoginDate`: Date, default Date.now.
     - `deletionRequestedAt`: Date, default null.
     - `minorTransitionDueDate`: Date, default null.
   - Enable `{ timestamps: true }`.
   - Create indexes: `{ phoneNumber: 1 }` (unique), `{ status: 1 }`.

2. Create `src/models/TemporaryOtp.ts`:
   - Fields:
     - `phoneNumber`: String, required (canonical format +8801XXXXXXXXX).
     - `otpCode`: String, required (will store bcrypt-hashed OTP).
     - `expiresAt`: Date, required, default `Date.now() + 180_000` (3 minutes).
   - Enable `{ timestamps: true }`.
   - Create TTL index: `{ expiresAt: 1 }, { expireAfterSeconds: 0 }` for auto-deletion.
   - Create index: `{ phoneNumber: 1 }`.

3. Export both models.
```

---

### Prompt 4 — OTP & Auth Service (Business Logic)

```
In the Becha-Kena backend, create the authentication service that handles OTP generation, verification, JWT token management, and phone number normalization.

Requirements:

1. Create `src/utils/phone.ts`:
   - A function `normalizePhone(input: string): string` that takes flexible Bangladeshi phone formats (e.g., `01712345678`, `+8801712345678`, `8801712345678`) and normalizes to canonical format `+8801XXXXXXXXX`.
   - Validate against regex `^(?:\+88|88)?(01[3-9]\d{8})$`. Throw AppError 400 `INVALID_PHONE` if invalid.

2. Create `src/utils/otp.ts`:
   - `generateOTP(): string` — returns a random 6-digit numeric string.
   - `hashOTP(otp: string): Promise<string>` — hashes with bcryptjs (10 salt rounds).
   - `compareOTP(plain: string, hashed: string): Promise<boolean>` — compares using bcryptjs.

3. Create `src/utils/jwt.ts`:
   - `generateAccessToken(payload: { userId: string, role: string, tokenVersion: number }): string` — signs with `JWT_ACCESS_SECRET`, expires in `JWT_ACCESS_EXPIRY` (15m).
   - `generateRefreshToken(payload: { userId: string, tokenVersion: number }): string` — signs with `JWT_REFRESH_SECRET`, expires in `JWT_REFRESH_EXPIRY` (7d).
   - `verifyAccessToken(token: string): JwtPayload` — verifies and returns decoded payload.
   - `verifyRefreshToken(token: string): JwtPayload` — verifies and returns decoded payload.

4. Create `src/services/auth.service.ts`:
   - `requestOTP(phoneNumber: string): Promise<{ expiresIn: number }>`:
     - Normalize phone number.
     - Generate OTP, hash it, save to `TemporaryOtp` collection.
     - TODO: Send OTP via SMS gateway (log to console for now).
     - Return `{ expiresIn: 180 }`.
   - `verifyOTP(phoneNumber: string, otpCode: string): Promise<{ accessToken, refreshToken, user }>`:
     - Normalize phone number.
     - Find the latest OTP record for this phone number.
     - If no record or expired → throw AppError 401 `INVALID_OTP`.
     - Compare OTP using bcrypt.
     - If match:
       - Find or create the User (upsert by phoneNumber). If new user, set `displayName` to "User" + last 4 digits of phone.
       - Check user status: if `suspended` → throw AppError 403 `ACCOUNT_SUSPENDED`.
       - Update `lastLoginDate` to now.
       - Generate access and refresh tokens (include userId, role, tokenVersion in payload).
       - Delete the used OTP record.
       - Return tokens and user object.
     - If no match → throw AppError 401 `INVALID_OTP`.
   - `logout(userId: string): Promise<void>`:
     - Increment `tokenVersion` by 1 for the user (this invalidates all existing JWTs).
```

---

### Prompt 5 — Auth Middleware (JWT + Token Version Validation)

```
In the Becha-Kena backend, create the authentication and authorization middlewares.

Requirements:

1. Create `src/middlewares/auth.ts`:
   - `authenticate` middleware:
     - Extract access token from the HTTP-only cookie named `accessToken`.
     - If no token → throw AppError 401 `TOKEN_MISSING`.
     - Verify the token using `verifyAccessToken()`.
     - Fetch the user from the database by `userId` from the payload.
     - If user not found → throw AppError 401 `INVALID_TOKEN`.
     - If user status is `suspended` → throw AppError 403 `ACCOUNT_SUSPENDED`.
     - If user status is `inactive` → reactivate the user (set status to 'active', update lastLoginDate) as per PRD rule: "Logging in via OTP instantly reactivates the account without re-verification."
     - **Token Version Check:** Compare `payload.tokenVersion` with the user's current `tokenVersion` in the database. If they don't match → throw AppError 401 `TOKEN_EXPIRED` (the token has been revoked).
     - Attach the user object to `req.user`.
     - Call `next()`.

   - `optionalAuth` middleware:
     - Same as `authenticate`, but if no token is found, simply call `next()` without attaching a user (for endpoints accessible by both guests and logged-in users, e.g., browsing listings).

2. Create `src/middlewares/authorize.ts`:
   - `authorize(...roles: string[])` — a higher-order middleware factory:
     - Checks if `req.user` exists (must be used after `authenticate`).
     - Checks if `req.user.role` is included in the allowed `roles` array.
     - If not → throw AppError 403 `ACCESS_DENIED`.

3. Create `src/middlewares/requireVerified.ts`:
   - Middleware that checks `req.user.isVerified === true`.
   - If not verified → throw AppError 403 `VERIFICATION_REQUIRED` with message "You must complete NID verification to perform this action."
```

---

### Prompt 6 — Auth Controller & Routes

```
In the Becha-Kena backend, create the authentication controller, routes, and rate limiter.

Requirements:

1. Create `src/middlewares/rateLimiter.ts`:
   - `otpRateLimiter`: Using `express-rate-limit`, limit to 5 requests per IP per hour on OTP request endpoint. On limit exceeded, throw AppError 429 `RATE_LIMIT_EXCEEDED` with message "Too many OTP requests. Try again later."

2. Create `src/controllers/auth.controller.ts`:
   - `requestOTP` handler:
     - Extract `phoneNumber` from `req.body`.
     - Validate: phoneNumber is required. If missing → throw AppError 400.
     - Call `authService.requestOTP(phoneNumber)`.
     - Send success response 200 with `{ expiresIn: 180 }`.
   - `verifyOTP` handler:
     - Extract `phoneNumber` and `otpCode` from `req.body`.
     - Validate: both fields required. If missing → throw AppError 400.
     - Call `authService.verifyOTP(phoneNumber, otpCode)`.
     - Set `accessToken` cookie: httpOnly, secure (in production), sameSite 'strict', maxAge 15 minutes.
     - Set `refreshToken` cookie: httpOnly, secure (in production), sameSite 'strict', maxAge 7 days, path '/api/v1/auth/refresh'.
     - Send success response 200 with user data (do NOT include tokens in JSON body, they are in cookies).
   - `logout` handler:
     - Requires `authenticate` middleware.
     - Call `authService.logout(req.user._id)`.
     - Clear `accessToken` and `refreshToken` cookies.
     - Send success response 200.

3. Create `src/routes/auth.routes.ts`:
   - `POST /request-otp` → otpRateLimiter → authController.requestOTP
   - `POST /verify-otp` → authController.verifyOTP
   - `POST /logout` → authenticate → authController.logout

4. Register auth routes in `app.ts` under `/api/v1/auth`.
```

---

## Phase 3: User Profile Management

---

### Prompt 7 — User Profile Service, Controller & Routes

```
In the Becha-Kena backend, create the user profile management feature.

Requirements:

1. Create `src/services/user.service.ts`:
   - `getProfile(userId: string)`: Fetch user by ID, return the user object excluding sensitive fields (tokenVersion, fcmTokens).
   - `updateProfile(userId: string, updates: { displayName?: string, fcmToken?: string })`:
     - If `displayName` provided: validate 1-30 chars, sanitize (strip HTML/JS tags), update.
     - If `fcmToken` provided: push to `fcmTokens` array (use `$addToSet` to avoid duplicates).
     - Return updated user.
   - `requestDeletion(userId: string)`:
     - Set `deletionRequestedAt` to `Date.now()`.
     - Set user status to `inactive`.
     - Archive all active listings by this user (set listing status to 'archived').
     - Return confirmation.
   - `getPublicProfile(userId: string)`: Fetch a user's public-facing profile (displayName, verifiedName, isVerified, averageRating, totalReviews, createdAt). Do NOT expose phone number, status, or internal fields.

2. Create `src/controllers/user.controller.ts`:
   - `getMe` → calls `userService.getProfile(req.user._id)`, returns 200.
   - `updateMe` → calls `userService.updateProfile(req.user._id, req.body)`, returns 200.
   - `deleteMe` → calls `userService.requestDeletion(req.user._id)`. Clear cookies. Returns 200.
   - `getPublicProfile` → calls `userService.getPublicProfile(req.params.id)`, returns 200.

3. Create `src/routes/user.routes.ts`:
   - `GET /me` → authenticate → getMe
   - `PUT /me` → authenticate → updateMe
   - `DELETE /me` → authenticate → deleteMe
   - `GET /:id` → getPublicProfile (public, no auth required)

4. Register user routes in `app.ts` under `/api/v1/users`.
```

---

## Phase 4: KYC & Identity Verification

---

### Prompt 8 — Verification Models

```
In the Becha-Kena backend, create the Mongoose schemas for the VerificationLog and BannedNid collections.

Requirements:

1. Create `src/models/VerificationLog.ts`:
   - Fields:
     - `userId`: ObjectId, ref 'User', required.
     - `nidHash`: String, required (SHA-256 salted hash of the NID number. NOT unique — same NID may appear across multiple attempts).
     - `dob`: Date, required.
     - `selfieUrl`: String, required (encrypted selfie image URL in AWS S3).
     - `verificationStatus`: String, enum ['pending_review', 'approved', 'rejected'], default 'pending_review'.
     - `attemptsToday`: Number, default 1, max 3.
     - `lastAttemptDate`: Date, default Date.now.
     - `manualReviewReason`: String, default null (e.g., 'face_match_failed_3x', 'timeout_fallback').
     - `verifiedBy`: ObjectId, ref 'User', default null (Moderator who resolved manual verification).
   - Enable `{ timestamps: true }`.
   - Indexes: `{ userId: 1 }`, `{ nidHash: 1 }`, `{ lastAttemptDate: -1 }`.

2. Create `src/models/BannedNid.ts`:
   - Fields:
     - `nidHash`: String, required, unique (SHA-256 cryptographic hash of the blacklisted NID).
     - `reason`: String, required.
     - `bannedBy`: ObjectId, ref 'User', required (Admin who issued the ban).
     - `bannedAt`: Date, default Date.now.
   - Index: `{ nidHash: 1 }` unique.

3. Export both models.
```

---

### Prompt 9 — NID Hashing Utility & Verification Service

```
In the Becha-Kena backend, create the NID hashing utility and the KYC verification service.

Requirements:

1. Create `src/utils/nidHash.ts`:
   - `hashNID(nidNumber: string): string`:
     - Concatenate: `nidNumber + NID_HASH_SALT + NID_HASH_PEPPER` (from env vars).
     - Hash using SHA-256 (crypto module).
     - Return the hex digest string.
   - The salt and pepper are stored in environment variables, never in the database.

2. Create `src/services/verification.service.ts`:
   - `submitAdultVerification(userId, nidNumber, dob, selfieUrl)`:
     - Step 1: Hash the NID using `hashNID()`.
     - Step 2: Check `banned_nids` collection. If hash exists → throw AppError 403 `NID_BANNED` "This NID has been permanently banned."
     - Step 3: Check daily attempt limits. Find the latest VerificationLog for this userId. If `lastAttemptDate` is today AND `attemptsToday >= 3` → throw AppError 429 `KYC_LIMIT_REACHED`.
     - Step 4: If `lastAttemptDate` is older than today, reset attemptsToday to 0.
     - Step 5: TODO — Call Porichoy API to validate NID + DOB (stub this for now, return a mock success response). If Porichoy times out (>10s) or returns 5xx → set `manualReviewReason: 'timeout_fallback'`, create log with status `pending_review`, return "Sent to manual review".
     - Step 6: TODO — Call AWS Rekognition CompareFaces to match selfie with NID photo (stub this for now).
     - Step 7: If both succeed → Use a MongoDB transaction:
       - Create VerificationLog with status `approved`.
       - Update user: `isVerified: true`, `verifiedName: <name from Porichoy>`, `ageGroup: 'adult'`.
     - Step 8: If face match fails → increment attemptsToday. If attemptsToday reaches 3 → set `manualReviewReason: 'face_match_failed_3x'`, status `pending_review`.
     - Return verification status.

   - `submitMinorVerification(userId, parentNidNumber, dob, parentSelfieUrl, consentConfirmed)`:
     - Step 1: Validate `consentConfirmed === true`. If not → throw AppError 400.
     - Step 2: Hash parent NID.
     - Step 3: Check `banned_nids` for parent NID hash.
     - Step 4: Count how many users have `parentNIDHash` matching this hash. If >= 3 → throw AppError 403 `PARENT_NID_LIMIT` "Maximum 3 minor accounts per parent NID."
     - Step 5: Follow same Porichoy + face match flow as adult.
     - Step 6: On success → update user: `isVerified: true`, `ageGroup: 'minor'`, `parentNIDHash: <hash>`, calculate `minorTransitionDueDate` from DOB (18th birthday + 30 days).

   - `getVerificationStatus(userId)`: Return the latest verification log for this user.
```

---

### Prompt 10 — Verification Controller & Routes

```
In the Becha-Kena backend, create the KYC verification controller and routes.

Requirements:

1. Create `src/controllers/verification.controller.ts`:
   - `submitAdultVerification` handler:
     - Extract `nidNumber`, `dob`, `selfieUrl` from req.body.
     - Validate all fields are present.
     - Call `verificationService.submitAdultVerification(req.user._id, ...)`.
     - Send response 200 with verification status.
   - `submitMinorVerification` handler:
     - Extract `parentNidNumber`, `dob`, `parentSelfieUrl`, `consentConfirmed` from req.body.
     - Validate all fields are present.
     - Call `verificationService.submitMinorVerification(req.user._id, ...)`.
     - Send response 200.
   - `getVerificationStatus` handler:
     - Call `verificationService.getVerificationStatus(req.user._id)`.
     - Send response 200.

2. Create `src/routes/verification.routes.ts`:
   - `POST /verify-adult` → authenticate → submitAdultVerification
   - `POST /verify-minor` → authenticate → submitMinorVerification
   - `GET /status` → authenticate → getVerificationStatus

3. Register verification routes in `app.ts` under `/api/v1/kyc`.
```

---

## Phase 5: Media Upload (AWS S3)

---

### Prompt 11 — S3 Pre-signed URL Service & Routes

```
In the Becha-Kena backend, create the S3 pre-signed URL service for secure client-side file uploads.

Requirements:

1. Create `src/config/s3.ts`:
   - Initialize and export an AWS S3 client configured from environment variables (AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_REGION, AWS_S3_BUCKET).

2. Create `src/services/s3.service.ts`:
   - `generatePresignedUploadUrl(fileName: string, fileType: string, folder: string)`:
     - Validate `fileType` is one of: 'image/webp', 'image/jpeg', 'image/png'.
     - Generate a unique S3 key: `{folder}/{uuid}_{fileName}`.
     - Generate a pre-signed PUT URL with 5-minute expiration.
     - Return `{ uploadUrl, fileUrl }` where fileUrl is the final permanent S3 URL.
   - `generatePresignedReadUrl(fileKey: string)`:
     - Generate a pre-signed GET URL with 5-minute expiration (used by admins to view encrypted NID photos).
     - Return the signed URL string.

3. Create `src/controllers/media.controller.ts`:
   - `getPresignedUrl` handler:
     - Extract `fileName` and `fileType` from req.body.
     - Validate both fields are present.
     - Determine folder based on context (default: 'listings'). Can accept optional `folder` field ('listings', 'nid', 'selfies').
     - Call `s3Service.generatePresignedUploadUrl(...)`.
     - Send response 200 with `{ uploadUrl, fileUrl }`.

4. Create `src/routes/media.routes.ts`:
   - `POST /presigned-url` → authenticate → getPresignedUrl

5. Register media routes in `app.ts` under `/api/v1/media`.
```

---

## Phase 6: Listings (Ad Management)

---

### Prompt 12 — Listing Model

```
In the Becha-Kena backend, create the Mongoose schema for the Listings collection.

Requirements:

1. Create `src/models/Listing.ts`:
   - Fields:
     - `sellerId`: ObjectId, ref 'User', required.
     - `title`: String, required, trim, minlength 10, maxlength 80.
     - `description`: String, required, minlength 50, maxlength 500.
     - `price`: Number, required, min 0.
     - `category`: String, required (e.g., 'Mobile', 'Electronics', 'Vehicles', 'Furniture', 'Cycles', 'Fashion', 'Other').
     - `condition`: String, enum ['new', 'like_new', 'used'].
     - `images`: Array of Strings, required (S3 URLs of uploaded product images).
     - `hidePhoneNumber`: Boolean, default false.
     - `location`: Embedded object:
       - `type`: String, enum ['Point'], required, default 'Point'.
       - `coordinates`: Array of Numbers [longitude, latitude], required.
       - `addressLine`: String (full text address for display).
       - `division`: String.
       - `district`: String.
       - `thana`: String.
     - `soldToBuyerId`: ObjectId, ref 'User', default null.
     - `status`: String, enum ['pending', 'active', 'archived', 'sold'], default 'pending'.
     - `moderationFlags`: Embedded object:
       - `flagType`: String, enum ['keyword', 'image', 'report', 'manual', null], default null.
       - `flagReason`: String, default null.
       - `reviewedBy`: ObjectId, ref 'User', default null.
     - `expiresAt`: Date, required, default `Date.now() + 30 * 24 * 60 * 60 * 1000` (30 days).
   - Enable `{ timestamps: true }`.
   - Create a 2dsphere index on `location`.
   - Create compound indexes: `{ sellerId: 1, status: 1 }`, `{ status: 1, expiresAt: 1 }`.

2. Export the model.
```


---

### Prompt 13 — Listing Service (Business Logic)

```
In the Becha-Kena backend, create the listing management service.

Requirements:

1. Create `src/utils/keywords.ts`:
   - Export a constant array `BLOCKED_KEYWORDS` containing sample prohibited terms (e.g., 'weapon', 'drug', 'gun', 'cocaine', 'counterfeit', 'replica', 'xxx', 'porn').
   - Export a function `checkBlockedKeywords(text: string): string | null` that checks if title or description contains any blocked keyword. Returns the matched keyword if found, null otherwise. Case-insensitive.

2. Create `src/utils/sanitize.ts`:
   - Export a function `stripHtmlTags(text: string): string` that removes all HTML and JS script tags from the input string to prevent XSS attacks.

3. Create `src/services/ad.service.ts`:
   - `createListing(sellerId, listingData)`:
     - Sanitize title and description (strip HTML tags).
     - Run keyword filter on title + description. If a blocked keyword is found → set `moderationFlags.flagType = 'keyword'`, `moderationFlags.flagReason = 'Contains prohibited term: {keyword}'`.
     - Set `status` to `pending` (all new ads go to moderation).
     - Set `expiresAt` to `Date.now() + 30 days`.
     - Save and return the created listing.

   - `getListings(filters)`:
     - Only return listings with `status: 'active'`.
     - Support filters: `category`, `minPrice`, `maxPrice`, `search` (text search on title).
     - Support geospatial query: if `lat`, `lng`, `radius` provided, use MongoDB `$geoNear` aggregation to find listings within the radius (in meters), sorted by distance.
     - Paginate results: accept `page` (default 1) and `limit` (default 20, max 50). Return `{ listings, total, page, totalPages }`.

   - `getListingById(listingId, requestingUserId?)`:
     - Find listing by ID. If not found → throw AppError 404.
     - Populate seller info (displayName, verifiedName, averageRating, totalReviews, isVerified).
     - If `hidePhoneNumber` is true AND the requesting user is not the seller → mask the phone number from the response.
     - Return listing with seller details.

   - `updateListing(listingId, sellerId, updates)`:
     - Find listing. If not found → throw 404. If `sellerId` doesn't match → throw 403.
     - If title is being changed OR price change is > 20% → reset status to `pending` for re-moderation (as per PRD).
     - Sanitize updated title/description. Re-run keyword filter.
     - Return updated listing.

   - `markAsSold(listingId, sellerId, buyerId)`:
     - Use a MongoDB transaction:
       - Verify the listing exists, is active, and belongs to the seller.
       - Verify a ChatRoom exists with `{ listingId, buyerId, sellerId }` (buyer must have chatted with seller about this listing).
       - If no chat room → throw AppError 400 `NO_CHAT_HISTORY`.
       - Update listing: `status: 'sold'`, `soldToBuyerId: buyerId`.
     - Return updated listing.

   - `renewListing(listingId, sellerId)`:
     - Find listing. Verify ownership.
     - Reset `expiresAt` to `Date.now() + 30 days`.
     - If status was `archived`, set back to `active`.
     - Return updated listing.

   - `deleteListing(listingId, sellerId)`:
     - Find listing. Verify ownership.
     - Set status to `archived`.
     - Return confirmation.

   - `getMyListings(sellerId, status?)`:
     - Return all listings by the seller, optionally filtered by status.
     - Paginated.
```

---

### Prompt 14 — Listing Controller & Routes

```
In the Becha-Kena backend, create the listing controller and routes.

Requirements:

1. Create `src/controllers/ad.controller.ts`:
   - `createListing` → authenticate, requireVerified. Extract body fields. Call `adService.createListing(req.user._id, req.body)`. Send 201.
   - `getListings` → no auth required (guest allowed). Extract query params. Call `adService.getListings(req.query)`. Send 200.
   - `getListingById` → optionalAuth. Call `adService.getListingById(req.params.id, req.user?._id)`. Send 200.
   - `updateListing` → authenticate, requireVerified. Call `adService.updateListing(req.params.id, req.user._id, req.body)`. Send 200.
   - `markAsSold` → authenticate, requireVerified. Extract `buyerId` from body. Call `adService.markAsSold(req.params.id, req.user._id, req.body.buyerId)`. Send 200.
   - `renewListing` → authenticate, requireVerified. Call `adService.renewListing(req.params.id, req.user._id)`. Send 200.
   - `deleteListing` → authenticate, requireVerified. Call `adService.deleteListing(req.params.id, req.user._id)`. Send 200.
   - `getMyListings` → authenticate. Extract optional `status` query param. Call `adService.getMyListings(req.user._id, req.query.status)`. Send 200.

2. Create `src/routes/ad.routes.ts`:
   - `POST /` → authenticate, requireVerified → createListing
   - `GET /` → getListings (public)
   - `GET /my` → authenticate → getMyListings
   - `GET /:id` → optionalAuth → getListingById
   - `PUT /:id` → authenticate, requireVerified → updateListing
   - `PATCH /:id/sell` → authenticate, requireVerified → markAsSold
   - `PATCH /:id/renew` → authenticate, requireVerified → renewListing
   - `DELETE /:id` → authenticate, requireVerified → deleteListing

3. Register listing routes in `app.ts` under `/api/v1/listings`.
```

---

## Phase 7: Chat System (Real-time Messaging)

---

### Prompt 15 — Chat Models

```
In the Becha-Kena backend, create the Mongoose schemas for ChatRoom and Message collections.

Requirements:

1. Create `src/models/ChatRoom.ts`:
   - Fields:
     - `listingId`: ObjectId, ref 'Listing', required.
     - `buyerId`: ObjectId, ref 'User', required.
     - `sellerId`: ObjectId, ref 'User', required.
   - Enable `{ timestamps: true }`.
   - Create a compound unique index: `{ buyerId: 1, sellerId: 1, listingId: 1 }` to ensure only ONE chat room exists between a specific buyer, seller, and listing.

2. Create `src/models/Message.ts`:
   - Fields:
     - `roomId`: ObjectId, ref 'ChatRoom', required.
     - `senderId`: ObjectId, ref 'User', required.
     - `messageText`: String, required, trim (masked/sanitized chat text).
     - `readStatus`: Boolean, default false.
   - Enable `{ timestamps: true }`.
   - Index: `{ roomId: 1, createdAt: -1 }` for efficient sorted message history retrieval.

3. Export both models.
```

---

### Prompt 16 — Chat Service

```
In the Becha-Kena backend, create the chat service with message filtering and safety features.

Requirements:

1. Create `src/utils/chatFilters.ts`:
   - `containsExternalLink(text: string): boolean` — returns true if the text contains any URL/link pattern (http, https, www, .com, .net, .org, etc.).
   - `maskPhoneNumbers(text: string): string` — replaces Bangladeshi phone number patterns with '***** *****'.
   - `containsSuspiciousPatterns(text: string): boolean` — returns true if the text contains suspicious payment keywords (e.g., 'bkash advance', 'nagad advance', 'send money first', 'advance payment').
   - `sanitizeMessage(text: string): { sanitizedText: string, warnings: string[] }`:
     - Strip HTML tags.
     - If contains external link → block it (replace link with '[link removed]'), add warning "External links are not allowed."
     - Mask phone numbers.
     - If contains suspicious patterns → add warning "Caution: Never send advance payment."
     - Return sanitized text and array of warnings.

2. Create `src/services/chat.service.ts`:
   - `getOrCreateRoom(buyerId, sellerId, listingId)`:
     - Validate the listing exists and is active.
     - Validate the buyer is NOT the seller (can't chat with yourself).
     - Use `findOneAndUpdate` with `upsert: true` on the compound unique key `{ buyerId, sellerId, listingId }`.
     - Return the room (with populated listing title and user display names).
   - `getRoomsForUser(userId)`:
     - Find all chat rooms where `buyerId == userId` OR `sellerId == userId`.
     - Populate listing title, other user's displayName.
     - For each room, include the last message preview and unread count.
     - Return sorted by most recent activity.
   - `getMessages(roomId, userId, page, limit)`:
     - Verify the user is a participant in the room (buyerId or sellerId). If not → throw 403.
     - Fetch messages for the room, sorted by `createdAt` descending, paginated.
     - Mark unread messages sent TO this user as `readStatus: true`.
     - Return `{ messages, total, page, totalPages }`.
   - `sendMessage(roomId, senderId, messageText)`:
     - Verify sender is a participant.
     - Run `sanitizeMessage()` on the text.
     - If the message was entirely blocked (empty after sanitization) → throw AppError 400.
     - Save the message with sanitized text.
     - Return `{ message, warnings }`.
```

---

### Prompt 17 — Chat REST Controller, Routes & WebSocket Setup

```
In the Becha-Kena backend, create the chat REST API controller, routes, and WebSocket real-time messaging handler.

Requirements:

1. Create `src/controllers/chat.controller.ts`:
   - `getRooms` → authenticate, requireVerified. Call `chatService.getRoomsForUser(req.user._id)`. Send 200.
   - `getMessages` → authenticate, requireVerified. Call `chatService.getMessages(req.params.roomId, req.user._id, req.query.page, req.query.limit)`. Send 200.
   - `createRoom` → authenticate, requireVerified. Extract `listingId` from body. Get listing's sellerId. Call `chatService.getOrCreateRoom(req.user._id, sellerId, listingId)`. Send 200.

2. Create `src/routes/chat.routes.ts`:
   - `GET /rooms` → authenticate, requireVerified → getRooms
   - `GET /rooms/:roomId/messages` → authenticate, requireVerified → getMessages
   - `POST /rooms` → authenticate, requireVerified → createRoom

3. Register chat routes in `app.ts` under `/api/v1/chat`.

4. Create `src/sockets/chatSocket.ts`:
   - Export a function `initializeChatSocket(io: Server)` that sets up the `/chat` namespace.
   - **Connection Authentication:**
     - On connection, extract the JWT access token from the handshake cookies.
     - Verify the token. If invalid → disconnect with error "Authentication failed".
     - Fetch user from DB. Check tokenVersion matches. Check user is verified. If any fail → disconnect.
     - Store userId on the socket instance.
   - **Events:**
     - `join_room` → client sends `{ roomId }`. Verify user is a participant. Join the socket to the room. Emit `room_joined` back.
     - `send_message` → client sends `{ roomId, messageText }`. Call `chatService.sendMessage(roomId, socket.userId, messageText)`. Emit `new_message` to the room (broadcast to all participants). If warnings exist, emit `message_warning` to the sender.
     - `typing` → client sends `{ roomId }`. Broadcast `user_typing` to the room (exclude sender).
     - `mark_read` → client sends `{ roomId }`. Mark all messages in the room sent to this user as read. Emit `messages_read` to the room.
   - **Disconnect:** Log and clean up.

5. In `src/server.ts`:
   - Create an HTTP server from the Express app.
   - Initialize Socket.io on the HTTP server with cors settings.
   - Call `initializeChatSocket(io)`.
   - Start the HTTP server (not `app.listen`).
```

---

## Phase 8: Reviews & Ratings

---

### Prompt 18 — Review Model, Service, Controller & Routes

```
In the Becha-Kena backend, create the complete review and rating system.

Requirements:

1. Create `src/models/Review.ts`:
   - Fields:
     - `listingId`: ObjectId, ref 'Listing', required, unique (only one review per listing/transaction).
     - `reviewerId`: ObjectId, ref 'User', required (the buyer submitting the review).
     - `revieweeId`: ObjectId, ref 'User', required (the seller receiving the review).
     - `rating`: Number, required, min 1, max 5.
     - `reviewText`: String, required, maxlength 500.
   - Enable `{ timestamps: true }`.
   - Indexes: `{ listingId: 1 }` unique, `{ revieweeId: 1 }`.

2. Create `src/services/review.service.ts`:
   - `submitReview(reviewerId, listingId, rating, reviewText)`:
     - Step 1: Find the listing. If not found → 404. If status is not 'sold' → throw AppError 400 "Listing must be marked as sold before reviewing."
     - Step 2: Verify the reviewer is the `soldToBuyerId` on the listing. If not → throw 403.
     - Step 3: Verify a ChatRoom exists between the reviewer (buyer) and the seller for this listing. If not → throw 400 "No chat history found."
     - Step 4: Check if a review already exists for this listing. If yes → throw 409 `DUPLICATE_ENTRY`.
     - Step 5: Use a MongoDB transaction:
       - Create the Review document.
       - Recalculate the seller's (revieweeId) `averageRating` and `totalReviews` using an aggregation pipeline on the reviews collection.
       - Update the seller's User document with the new averageRating and totalReviews.
     - Return the created review.
   - `getReviewsForUser(userId, page, limit)`:
     - Find all reviews where `revieweeId == userId`. Populate reviewer displayName.
     - Paginate. Return `{ reviews, total, averageRating }`.

3. Create `src/controllers/review.controller.ts`:
   - `submitReview` → authenticate, requireVerified. Extract body. Call service. Send 201.
   - `getReviewsForUser` → no auth required. Extract `userId` from params. Call service. Send 200.

4. Create `src/routes/review.routes.ts`:
   - `POST /` → authenticate, requireVerified → submitReview
   - `GET /user/:userId` → getReviewsForUser (public)

5. Register review routes in `app.ts` under `/api/v1/reviews`.
```

---

## Phase 9: Reports & Disputes

---

### Prompt 19 — Report Model, Service, Controller & Routes

```
In the Becha-Kena backend, create the report and dispute system.

Requirements:

1. Create `src/models/Report.ts`:
   - Fields:
     - `reporterId`: ObjectId, ref 'User', required.
     - `targetType`: String, enum ['Listing', 'User'], required.
     - `targetId`: ObjectId, required, refPath 'targetType'.
     - `reason`: String, enum ['scam', 'harassment', 'misrepresentation', 'inappropriate', 'other'], required.
     - `description`: String, required, maxlength 1000.
     - `status`: String, enum ['pending', 'reviewed', 'resolved', 'dismissed'], default 'pending'.
     - `reviewedBy`: ObjectId, ref 'User', default null.
     - `resolution`: String, default null.
   - Enable `{ timestamps: true }`.
   - Indexes: `{ reporterId: 1 }`, `{ targetType: 1, targetId: 1 }`, `{ status: 1 }`.

2. Create `src/services/report.service.ts`:
   - `submitReport(reporterId, targetType, targetId, reason, description)`:
     - Validate the target exists (look up in listings or users collection depending on targetType).
     - Prevent self-reporting (reporterId cannot equal targetId if targetType is 'User').
     - Sanitize description (strip HTML tags).
     - Create and return the Report document.
   - `getMyReports(reporterId, page, limit)`: Paginated list of reports submitted by this user.

3. Create `src/controllers/report.controller.ts`:
   - `submitReport` → authenticate, requireVerified. Extract body. Call service. Send 201.
   - `getMyReports` → authenticate. Call service. Send 200.

4. Create `src/routes/report.routes.ts`:
   - `POST /` → authenticate, requireVerified → submitReport
   - `GET /my` → authenticate → getMyReports

5. Register report routes in `app.ts` under `/api/v1/reports`.
```

---

## Phase 10: Admin & Moderation

---

### Prompt 20 — Admin Service, Controller & Routes

```
In the Becha-Kena backend, create the admin and moderation system.

Requirements:

1. Create `src/services/admin.service.ts`:
   - **Moderation Queue:**
     - `getModerationQueue(page, limit)`: Fetch listings with `status: 'pending'`, sorted by oldest first. Paginate.
     - `moderateListing(listingId, moderatorId, action: 'approve' | 'reject', reason?)`:
       - If action is 'approve' → set listing status to 'active', set `moderationFlags.reviewedBy` to moderatorId.
       - If action is 'reject' → set listing status to 'archived', set `moderationFlags.flagType: 'manual'`, `flagReason: reason`, `reviewedBy: moderatorId`.
       - TODO: Send notification to seller (NT-2).

   - **Manual KYC Review Queue:**
     - `getManualVerificationQueue(page, limit)`: Fetch VerificationLogs with `verificationStatus: 'pending_review'`. Populate user details. Paginate.
     - `resolveVerification(logId, moderatorId, action: 'approve' | 'reject')`:
       - Use a MongoDB transaction:
         - If approve → update VerificationLog status to 'approved', set `verifiedBy: moderatorId`. Update user: `isVerified: true`, `verifiedName`, `ageGroup`.
         - If reject → update VerificationLog status to 'rejected', set `verifiedBy: moderatorId`.
       - TODO: Send notification to user (NT-1).
     - `getPresignedNidUrl(selfieUrl)`: Generate a 5-minute pre-signed S3 URL for the admin to view the encrypted NID photo.

   - **User Ban:**
     - `banUser(userId, adminId, reason)`:
       - Use a MongoDB transaction:
         - Set user `status: 'suspended'`, increment `tokenVersion` by 1 (invalidates all active JWTs).
         - Archive all active listings by the user (`status: 'archived'`).
         - Retrieve the user's NID hash from the latest approved VerificationLog.
         - Create an entry in `banned_nids` collection with the NID hash.
       - Return confirmation.

   - **Reports Management:**
     - `getReports(status?, page, limit)`: Fetch reports, optionally filtered by status. Paginate. Populate reporter and target details.
     - `resolveReport(reportId, moderatorId, resolution)`:
       - Update report: `status: 'resolved'`, `reviewedBy: moderatorId`, `resolution: resolution`.
       - Return updated report.
     - `dismissReport(reportId, moderatorId)`:
       - Update report: `status: 'dismissed'`, `reviewedBy: moderatorId`.
       - Return updated report.

2. Create `src/controllers/admin.controller.ts`:
   - Moderation endpoints: getModerationQueue, moderateListing.
   - KYC review endpoints: getManualVerificationQueue, resolveVerification, getPresignedNidUrl.
   - Ban endpoint: banUser.
   - Report endpoints: getReports, resolveReport, dismissReport.
   - All handlers use `sendSuccess` utility.

3. Create `src/routes/admin.routes.ts`:
   - All routes require `authenticate` + `authorize('admin', 'moderator')`.
   - Moderation:
     - `GET /moderation/listings` → getModerationQueue
     - `PATCH /moderation/listings/:id` → moderateListing
   - KYC Review:
     - `GET /kyc/queue` → getManualVerificationQueue
     - `PATCH /kyc/:logId` → resolveVerification
     - `POST /kyc/nid-preview` → getPresignedNidUrl
   - User Ban (admin only):
     - `POST /users/:id/ban` → authorize('admin') → banUser
   - Reports:
     - `GET /reports` → getReports
     - `PATCH /reports/:id/resolve` → resolveReport
     - `PATCH /reports/:id/dismiss` → dismissReport

4. Register admin routes in `app.ts` under `/api/v1/admin`.
```

---

## Phase 11: Background Jobs & Schedulers

---

### Prompt 21 — Background Cron Jobs (Ad Expiry, Account Cleanup, Minor Transition)

```
In the Becha-Kena backend, create background scheduled jobs using node-cron.

Requirements:

1. Create `src/services/scheduler.service.ts` with the following cron jobs:

   - **Ad Renewal Reminder (Runs daily at 9:00 AM):**
     - Query listings where `status: 'active'` AND `expiresAt` is within the next 3 days (Day 27 of 30).
     - For each, TODO: send a push notification to the seller (NT-2 reminder).
     - Log the count of reminders sent.

   - **Ad Auto-Archive (Runs daily at midnight):**
     - Query listings where `status: 'active'` AND `expiresAt <= Date.now()`.
     - Set their `status` to `'archived'`.
     - Log the count of archived listings.

   - **Inactive User Sweep (Runs daily at 2:00 AM):**
     - Query users where `status: 'active'` AND `lastLoginDate` is older than 180 days.
     - Set their `status` to `'inactive'`.
     - Archive all their active listings.
     - Log the count of deactivated users.

   - **Account Deletion PII Purge (Runs daily at 3:00 AM):**
     - Query users where `deletionRequestedAt` is not null AND is older than 30 days.
     - Hard-delete PII: set `displayName` to '[Deleted User]', `verifiedName` to null, `phoneNumber` to a unique placeholder, `fcmTokens` to empty array.
     - Delete associated VerificationLog records (selfie URLs, NID data).
     - TODO: Delete associated S3 files (selfie and NID images).
     - Do NOT delete the banned_nids entry if the user was banned (permanently retained).
     - Log the count of purged accounts.

   - **Minor-to-Adult Transition Check (Runs daily at 4:00 AM):**
     - Query users where `ageGroup: 'minor'` AND `minorTransitionDueDate <= Date.now()` AND `isVerified: true`.
     - These users have passed their 18th birthday + 30-day grace period without submitting their own NID.
     - Set `isVerified: false` (restrict back to Guest-level access).
     - TODO: Send notification to the user.
     - Log the count of restricted minor accounts.

2. Create `src/sockets/scheduler.init.ts`:
   - Initialize all cron jobs when the server starts.
   - Export an `initSchedulers()` function.

3. Call `initSchedulers()` in `server.ts` after successful database connection.
```

---

## Phase 12: Input Validation & Sanitization Middleware

---

### Prompt 22 — Request Validation Middleware

```
In the Becha-Kena backend, create a centralized input validation middleware using a validation approach.

Requirements:

1. Create `src/middlewares/validate.ts`:
   - A reusable middleware factory that accepts a validation schema object and validates `req.body`, `req.query`, and `req.params`.
   - For each field, support validation rules: `required`, `type`, `minLength`, `maxLength`, `min`, `max`, `enum`, `pattern` (regex), `custom` (custom validator function).
   - If validation fails → throw AppError 400 `VALIDATION_FAILED` with a `details` array listing each failing field and its error message.

2. Create `src/validations/auth.validation.ts`:
   - `requestOtpSchema`: phoneNumber is required, must be a string.
   - `verifyOtpSchema`: phoneNumber required string, otpCode required string of exactly 6 digits.

3. Create `src/validations/listing.validation.ts`:
   - `createListingSchema`: title (required, 10-80 chars), description (required, 20-1000 chars), price (required, number, min 0), category (required), condition (required, enum), images (required, non-empty array), location.coordinates (required, array of 2 numbers).

4. Create `src/validations/review.validation.ts`:
   - `submitReviewSchema`: listingId (required), rating (required, integer, 1-5), reviewText (required, max 500 chars).

5. Create `src/validations/report.validation.ts`:
   - `submitReportSchema`: targetType (required, enum ['Listing', 'User']), targetId (required), reason (required, enum), description (required, max 1000 chars).

6. Apply the validation middleware to the appropriate routes created in previous prompts.
```

---

## Phase 13: Final Integration & Testing

---

### Prompt 23 — Route Registration Verification & App.ts Finalization

```
In the Becha-Kena backend, finalize the app.ts file to ensure all routes, middlewares, and configurations are correctly wired together.

Requirements:

1. Review and update `src/app.ts` to ensure:
   - All global middlewares are applied in the correct order:
     1. `helmet()` — security headers
     2. `cors({ origin: [allowed origins], credentials: true })` — CORS with cookie support
     3. `express.json({ limit: '10kb' })` — body parser
     4. `cookie-parser()` — cookie parsing
     5. `xss-clean()` — XSS sanitization
   - All route modules are registered in this order:
     1. `/api/v1/auth` → auth.routes
     2. `/api/v1/users` → user.routes
     3. `/api/v1/kyc` → verification.routes
     4. `/api/v1/media` → media.routes
     5. `/api/v1/listings` → ad.routes
     6. `/api/v1/chat` → chat.routes
     7. `/api/v1/reviews` → review.routes
     8. `/api/v1/reports` → report.routes
     9. `/api/v1/admin` → admin.routes
   - After all routes: `notFound` middleware, then `errorHandler` middleware.

2. Review and update `src/server.ts` to ensure:
   - MongoDB connection is established before starting the server.
   - Socket.io is properly attached to the HTTP server.
   - Chat WebSocket is initialized.
   - Background schedulers are started.
   - Graceful shutdown on SIGTERM/SIGINT: close DB connection, close socket connections, stop cron jobs.

3. Create a health check route:
   - `GET /api/v1/health` → returns `{ success: true, message: "Becha-Kena API is running", timestamp: Date.now(), version: "1.0.0" }`. No auth required.
```

---

### Prompt 24 — Comprehensive API Testing with Sample Requests

```
In the Becha-Kena backend, create a comprehensive Postman collection to verify all API endpoints.

Requirements:

Create a Postman collection that documents how to test every endpoint with sample HTTP request examples:

1. **Auth Flow:**
   - POST /api/v1/auth/request-otp → with phoneNumber
   - POST /api/v1/auth/verify-otp → with phoneNumber + otpCode (check OTP from console logs)
   - Verify cookies are set in response
   - POST /api/v1/auth/logout → verify cookies cleared

2. **User Profile:**
   - GET /api/v1/users/me → verify authenticated profile
   - PUT /api/v1/users/me → update displayName
   - GET /api/v1/users/:id → public profile

3. **KYC Verification:**
   - POST /api/v1/kyc/verify-adult → with mock NID data
   - GET /api/v1/kyc/status → check verification status
   - Test attempt limit (4th attempt should fail with 429)

4. **Media Upload:**
   - POST /api/v1/media/presigned-url → get upload URL

5. **Listings:**
   - POST /api/v1/listings → create listing (must be verified)
   - GET /api/v1/listings → browse (no auth)
   - GET /api/v1/listings/:id → detail view
   - PUT /api/v1/listings/:id → update
   - PATCH /api/v1/listings/:id/sell → mark as sold
   - GET /api/v1/listings/my → seller dashboard

6. **Chat:**
   - POST /api/v1/chat/rooms → create room
   - GET /api/v1/chat/rooms → list rooms
   - GET /api/v1/chat/rooms/:roomId/messages → message history
   - Test WebSocket connection with a sample Socket.io client script

7. **Reviews:**
   - POST /api/v1/reviews → submit review (must be buyer of sold listing)
   - GET /api/v1/reviews/user/:userId → public reviews

8. **Reports:**
   - POST /api/v1/reports → submit report

9. **Admin:**
   - GET /api/v1/admin/moderation/listings → moderation queue
   - PATCH /api/v1/admin/moderation/listings/:id → approve/reject
   - POST /api/v1/admin/users/:id/ban → ban user
   - GET /api/v1/admin/reports → view reports

Include expected success responses and common error cases for each endpoint.
```

---

## Summary: Prompt Execution Order

| Phase | Prompt # | Feature |
|-------|----------|---------|
| 1 | Prompt 1 | Project scaffolding & directory structure |
| 1 | Prompt 2 | Error handler & response utilities |
| 2 | Prompt 3 | User & OTP Mongoose models |
| 2 | Prompt 4 | Auth service (OTP, JWT, login logic) |
| 2 | Prompt 5 | Auth & RBAC middlewares |
| 2 | Prompt 6 | Auth controller & routes |
| 3 | Prompt 7 | User profile service, controller & routes |
| 4 | Prompt 8 | Verification & BannedNid models |
| 4 | Prompt 9 | NID hashing & verification service |
| 4 | Prompt 10 | Verification controller & routes |
| 5 | Prompt 11 | S3 pre-signed URL service & routes |
| 6 | Prompt 12 | Listing model |
| 6 | Prompt 13 | Listing service (CRUD, search, geo, moderation) |
| 6 | Prompt 14 | Listing controller & routes |
| 7 | Prompt 15 | ChatRoom & Message models |
| 7 | Prompt 16 | Chat service (filters, safety) |
| 7 | Prompt 17 | Chat controller, routes & WebSocket |
| 8 | Prompt 18 | Review model, service, controller & routes |
| 9 | Prompt 19 | Report model, service, controller & routes |
| 10 | Prompt 20 | Admin service, controller & routes |
| 11 | Prompt 21 | Background cron jobs |
| 12 | Prompt 22 | Input validation middleware |
| 13 | Prompt 23 | Final app.ts wiring & health check |
| 13 | Prompt 24 | API testing guide |
