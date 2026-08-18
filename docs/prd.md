# Product Requirements Document (PRD): Becha-Kena

## 1. Project Overview
Becha-Kena is a secure, Peer-to-Peer (C2C) classified marketplace designed specifically for buying and selling second-hand products in Bangladesh. While it mirrors the simplicity and user experience of popular platforms like Bikroy.com, Becha-Kena fundamentally differentiates itself by eliminating scams, fraud, and spam through a mandatory identity verification process for all users.

**Core Value Proposition:** "The simplicity of Bikroy, with 100% verified users. Buy and sell second-hand items with zero fear of fraud."

---

## 2. Target Users & Access Control
* **Primary Sellers:** Everyday citizens in Bangladesh looking to easily sell their used personal items (phones, laptops, furniture, bicycles, etc.).
* **Primary Buyers:** Budget-conscious consumers looking for second-hand goods without the fear of being scammed by fake listings.
* **Safety-Conscious Demographics:** Women, students, and first-time online traders who require a highly secure environment where they know exactly who they are dealing with, free from anonymous strangers hiding behind fake phone numbers.
* **Minors (Under 18 Flow):** Citizens under 18 who do not yet possess a National ID (NID) card can gain access by submitting their parent's or legal guardian's NID along with a parental consent validation process.
* **System Administrators / Moderators:** Operational staff responsible for managing verification queues, approving manual fallbacks, handling user reports, and moderating content.

### 2.1 Permissions & Access Control Matrix

| Role | Browse Listings | Search/Filter | View Contact Info | Chat | Post/Edit Ads | Review Reports | Manually Approve NIDs | System Settings |
|---|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| **Guest (Unverified)** | Yes | Yes | No | No | No | No | No | No |
| **Verified User (Adult/Minor)** | Yes | Yes | Yes | Yes | Yes (Within Limits) | No | No | No |
| **Moderator** | Yes | Yes | Yes | No | No | Yes | No | No |
| **System Admin** | Yes | Yes | Yes | Yes | Yes | Yes | Yes | Yes |
| **Banned User** | No | No | No | No | No | No | No | No |

*Note: Banned users are completely blocked from logging in or fetching any API endpoints except the "Banned Appeal" endpoint. Role-Based Access Control (RBAC) relies on checking the user's role flag (`role: 'user' | 'moderator' | 'admin'`) and status flag (`status: 'active' | 'suspended'`). Session invalidation triggers immediately upon user status changes via a token versioning counter (`tokenVersion`).*

---

## 3. Core Features

### 3.1 Mandatory Identity Verification System
* **Porichoy API Integration:** Verification is conducted programmatically by integrating with the **Porichoy API** to validate NID numbers.
  * **Rate Limiting:** Users are restricted to a maximum of 3 NID verification submissions per day to control Porichoy transaction costs.
  * **Downtime Fallback:** If the Porichoy API experiences timeouts (> 10 seconds) or 5xx server errors, the app displays a notice to the user and automatically redirects the verification details to the **Admin Manual Review Queue** for manual processing (SLA: 12 hours).
* **Live Selfie Match & Liveness Detection:** A mandatory live selfie capture with liveness detection compared against the NID photo.
  * **Fail-Safe & Session Limits:** Users are allowed 3 verification attempts per day. The limit is tracked via a dynamic timestamp reset logic. If face matching or liveness check fails 3 times within 24 hours, automated verification is locked, and the user is offered the option to submit details for manual review.
* **Secure NID Storage & Data Privacy:**
  * **PII Encryption:** Raw NID photos must be encrypted using AES-256 at rest in the **3rd Party Cloud Image Storage** (e.g., AWS S3, Cloudinary).
  * **Pre-Signed URLs:** Raw NID photos are never publicly exposed. The Admin panel must retrieve these files using pre-signed URLs with an expiration limit of **5 minutes**.
  * **NID Hashing:** NID numbers must be cryptographically hashed using SHA-256 combined with a system-level static salt and pepper. This hash is stored in a dedicated database collection to prevent NID duplicates and check for banned users without exposing plain NID numbers.
* **Under 18 Parental Verification:** Minors submit their parent’s NID, a selfie match of the parent, and parental consent confirmation.
  * **Limit:** A single parent NID hash is restricted to a maximum of **3 minor accounts** to prevent commercial bypass or system abuse.
* **Gatekeeper Protocol:** Users can browse listings, but cannot post ads, view contact info, or start/send messages until identity verification is complete ("No NID = No Access").

### 3.2 Ad Management & Content Moderation
* **Ad Creation:** Verified sellers post ads with titles, descriptions, pricing, condition flags, and photo uploads.
  * **Input Validation:** Titles must be 10-80 characters. Descriptions must be 20-1000 characters. Photos must be compressed client-side to a maximum of 1.5MB in WebP format. File signatures (magic bytes) must be verified to prevent malicious executable scripts from being uploaded.
  * **Input Sanitization:** HTML/JS tags must be stripped from titles, descriptions, and user profile fields to prevent Cross-Site Scripting (XSS).
  * **Upload Confirmation Flow:** To prevent orphan files in S3/Cloudinary storage, the client must trigger an upload confirmation API callback once S3 storage upload completes, linking the media to the listing before it goes live.
* **Phone Number Privacy:** Sellers can toggle a setting to **"Hide phone number"** on listings, forcing all negotiations to happen exclusively through the secure in-app chat.
* **Ad Expiration, Auto-Archive & Renewal:**
  * **Ad Lifespan:** Active ads remain live for 30 days.
  * **Renewal Alert:** Sellers receive a notification on day 27 to renew their ad.
  * **Auto-Archive:** If not renewed by day 30, the ad is auto-archived (inactive status), hidden from search, but remains in the dashboard for 90 days before permanent deletion.
* **Ad Content Moderation Queue:**
  * **Automated Keyword Filtering:** Automatic flagging of listings containing illegal keywords (e.g., weapons, drugs, adult items, counterfeit goods).
  * **Post-Moderation Queue:** Newly posted ads go into a quick moderation review system to ensure listing quality and compliance before public display.
  * **Moderation Flag Logging:** Flags are tracked explicitly containing details on the flag type (keyword, image compliance, report, manual review) and audit trails of the reviewing moderator.
  * **Modification Rules:** Any significant modification to a pending ad (e.g., title edits, price change > 20%, or image changes) resets the moderation state and pushes the listing to the bottom of the moderation queue.
* **Monetization & Ad Limits:** To offset the per-query cost of the Porichoy API, users have a limit on the number of active free ads they can post. Beyond this limit, posting ads requires a nominal listing fee. Optional premium upgrades (e.g., "Bump Ad", "Top Ad") are available.

### 3.3 Browsing, Search & Location Services
* **Standard Navigation:** Categorized catalog browsing (Phones, Laptops, Furniture, Cycles, etc.).
* **Google Maps API Integration:**
  * Location selection is powered by the **Google Maps API** (Autocompleting addresses, selecting locations, pin-pointing meetup zones, and calculating distance-based search ranges).
  * Location validation must enforce a strict structured administrative hierarchy (Division > District > Thana/Upazila).

### 3.4 Secure Direct Messaging & Chat Safety
* **In-App Real-Time Messaging:** Secure WebSocket-based chat for negotiation.
  * **WebSocket Security:** Connection must be secured via `wss://` and require a valid JWT token. Connections are isolated to a designated `/chat` namespace.
  * **ChatRoom Uniqueness:** A chat session between a specific buyer and seller is strictly tied to a unique listing (`{ buyerId, sellerId, listingId }`). Re-opening chat for the same listing reuses this room.
* **Chat Safety Features:**
  * **Link Blocking:** Prevention of sending external URLs/links to block phishing.
  * **Keyword Filtering:** Automatic warning banners for suspicious patterns (e.g., asking for advance bkash/Nagad payments, sharing suspicious locations).
  * **Phone Number Masking:** Dynamically restricting/masking raw phone numbers shared inside chat bubbles unless both users explicitly confirm to exchange contacts.
  * **Safety Banner:** Permanent reminder in the chat view highlighting safety rules (e.g., "Always meet in a crowded public place", "Do not pay in advance").

### 3.5 Trust Profiles, Reviews & Dispute Resolution
* **Verified Badging:** Verified user accounts display a prominent "100% Verified Citizen" badge.
  * **Profile Name Mismatch:** The user's public display profile name is customizable, but the profile detail page must show their legally verified name as returned by the Porichoy API (e.g., "Legally Verified: [Name]").
* **User Rating & Review System:**
  * **Access Rule:** Buyers and sellers can rate (1-5 stars) and write reviews for each other. A review is allowed only if: (a) a chat conversation history exists between the two users for that listing, and (b) the seller marks the ad as "Sold" specifically to that buyer.
  * **Trust Score aggregation:** Average rating and total review count are aggregated on the User profile.
* **Account Deletion & Data Retention:**
  * **Deletion:** Upon account deletion request, listings and chats are immediately hidden.
  * **Retention:** Active/clean user PII (names, NID photos) is hard-deleted after 30 days. Banned NID hashes and ban history are retained permanently in a blacklist table to prevent re-registration.
* **Dispute & Reporting Flow:**
  * Users can report listings or profiles for fraudulent offline behavior, harassment, or listing misrepresentation.
  * **Admin Panel Actions:** System administrators review reports, temporarily freeze suspicious accounts, or permanently ban users by blacklisting their verified NID hash.

---

## 4. User Stories & Flows

### 4.1 Primary User 1: Buyer
**User Story:** As a Buyer, I want to search for verified products, view verified seller information, hide/share my phone details, utilize precise location searches, and message sellers under strict safety parameters so that I can buy goods without scam risks.

**Buyer Flow:**
1. **Registration:** Buyer registers via mobile OTP.
   * **Phone Format Validation:** Enforce Bangladeshi mobile format `^(?:\+88|88)?(01[3-9]\d{8})$`.
   * **OTP Rate Limits & Expiry:** OTP expires in 3 minutes. Requests are limited to a maximum of 3 requests within a 15-minute window. Rate-limiting on `/api/v1/auth/request-otp` limits to 5 requests per IP/Device ID per hour.
2. **Identity Verification:**
   * **If Adult:** Submits NID details + live selfie. API processes verification via Porichoy API.
   * **If Minor (Under 18):** Submits parent's NID, parent's live selfie, and parent's verification consent (limit 3 accounts per parent NID hash).
3. **Location Setup:** Selects location using Google Maps location picker.
4. **Search and Discovery:** Searches for items filtered by category, price, and distance/location.
5. **Verified Seller Details:** Clicks a listing, views the seller's verified badge, ratings, and legally verified NID name.
6. **Communication:**
   * **Chat:** Clicks "Chat" to initiate secure messaging via `wss://` on `/chat` namespace. System shows safety warnings.
   * **Call:** If the seller has chosen to display their phone number, the buyer can click to reveal and call it.

### 4.2 Primary User 2: Seller
**User Story:** As a Seller, I want to securely list my second-hand items, toggle phone number visibility, utilize moderation to keep my ad visible, manage listings from my dashboard, and receive ratings after sales.

**Seller Flow:**
1. **Signup/Login:** Authenticates and logs in. If new, completes NID verification.
2. **Dashboard Access:** Views active ads, active chat threads, account standing, and ratings.
3. **Post Ad:**
   * Uploads photos (stored in Cloud Storage via pre-signed URL) and inputs validated details.
   * Confirms upload via API callback to prevent storage orphans.
   * Selects location zone via Google Maps API.
   * Chooses phone number visibility ("Show Number" or "Chat Only").
   * Submits ad. The ad goes through automated keyword screening and post-moderation review before going live.
4. **Manage Ad:** Can mark as "Sold" (selecting a verified buyer from their chat history to trigger the rating/review flow), renew active listings, or "Delete" listings.

### 4.3 Primary User 3: Admin/Moderator
**User Story:** As an Admin, I want a dedicated dashboard to handle manual verification approvals, review flagged/reported ads, view chat dispute logs, manage global settings, and apply account suspensions, token revocations, or permanent NID hash bans.

### 4.4 Minor-to-Adult Account Transition Flow
**User Story:** As a user registered under a parental NID, upon turning 18, I want to transition my account to use my own NID so that I maintain legal ownership of my account profile.

**Transition Flow:**
1. **Trigger:** Upon reaching 18 years of age (checked against the date of birth associated with their registration record), the system triggers an in-app and SMS alert.
2. **Grace Period:** The user is given a 30-day grace period to submit their personal NID details.
3. **Action:** User uploads their own NID and completes the live selfie check.
4. **Enforcement:** If verification is not completed within 30 days, the user's status is restricted back to "Guest/Visitor" until verification is successful.

---

## 5. Out of Scope Items (For Initial Release)
* **In-App Payments:** All transactions occur offline (cash/mobile banking at meetup).
* **Shipping & Logistics:** Meetup coordinates are arranged between users; the platform does not offer delivery.
* **Escrow Services:** No platform-managed escrow.
* **B2C / Business Accounts:** Restricted to C2C second-hand trading. Business shops and merchant listings are out of scope.
* **New Items:** Strictly for used/second-hand goods.

---

## 6. System Limits, Exceptions & Notifications

### 6.1 System Exceptions & Edge Cases
1. **API Credit Exhaustion:** If prepaid credits with Porichoy API are completely exhausted, the system alerts the admin dashboard, sends an emergency email/SMS alert to the development team, and automatically fallbacks new verification requests to the manual review queue with a user message stating: *"Automatic verification is temporarily slow. Manual review is processing your application."*
2. **Inactive User Auto-Deactivation:** Users inactive for over 180 days are set to `inactive` status and their active ads are hidden. Logging in via OTP instantly reactivates the account without re-verification.
3. **Recycled Mobile SIM Cards:** If a user registers a number already tied to an account:
   * Verification is required.
   * If the NID details do not match the old account, the old account is archived, its data detached from the phone number, and a fresh account is assigned to the new user.
4. **Device Token Management:** User collection maintains a list of FCM device tokens for offline notifications. Tokens are added during login and pruned upon invalid response from FCM gateway.

### 6.2 Notification Events

* **NT-1: Verification Status Notification:**
  * *Trigger:* NID review is completed (automatically or manually).
  * *Channel:* SMS and in-app push notification.
  * *Content:* *"Congratulations! Your Becha-Kena account is now fully verified. You can now post ads and chat with buyers."* or *"Verification failed: [Rejection Reason]. Please re-verify or contact support."*
* **NT-2: Moderation Updates:**
  * *Trigger:* Ad is approved or rejected by a moderator.
  * *Channel:* Push notification and in-app notification.
  * *Content:* *"Your ad '[Ad Title]' is now live!"* or *"Your ad '[Ad Title]' was rejected due to [Rejection Reason]. Please update and resubmit."*
* **NT-3: Offline Chat Notifications:**
  * *Trigger:* User receives a chat message while websocket is disconnected.
  * *Channel:* Push notification (via Firebase Cloud Messaging).
  * *Content:* *"Afnan sent you a message: 'Is the price negotiable?'"*

---

## 7. Implementation Risk & Security Guidelines
1. **PII Storage Security:** Raw NID photos must be encrypted using AES-256 in the 3rd party storage. Access credentials must be strictly controlled and rotated. Pre-signed URLs must be restricted to 5-minute durations.
2. **NID Hashing Integrity:** Ensure the salt/pepper used for hashing NIDs is protected and stored securely outside the primary database.
3. **Session Invalidation:** Banning or suspending an account must dynamically increment the user's `tokenVersion` flag, instantly invalidating any active JWT access/refresh tokens.
4. **Compliance:** Adhere to local digital safety acts and data privacy guidelines in Bangladesh.
5. **Terms of Service:** Force a pop-up disclaimer acknowledging that all transactions and hand-offs occur offline under the users' own liability.
