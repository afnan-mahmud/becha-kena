## 2. Schema Specifications

### 2.1 users (Users Datastore)
The primary schema for tracking user profiles and access control status.

*   **`_id`**: `ObjectId` (Primary Key)
*   **`phoneNumber`**: `String` (Unique, canonical stored format: `+8801XXXXXXXXX`. Input is normalized from flexible formats like `01XXXXXXXXX` or `+8801XXXXXXXXX` to this canonical form before storage.)
*   **`displayName`**: `String` (Nickname, 1-30 characters)
*   **`verifiedName`**: `String` (Official name fetched from Porichoy API, default: `null`)
*   **`isVerified`**: `Boolean` (NID verification status, default: `false`)
*   **`ageGroup`**: `String` (Values: `adult` | `minor` | `null`, set after NID verification)
*   **`parentNIDHash`**: `String` (SHA-256 hash reference of the parent's NID for minor accounts, default: `null`)
*   **`role`**: `String` (Values: `user` | `moderator` | `admin`, default: `user`)
*   **`status`**: `String` (Values: `active` | `suspended` | `inactive`, default: `active`)
*   **`tokenVersion`**: `Number` (Default: `0`, incremented upon user ban or logout to invalidate existing JWTs)
*   **`averageRating`**: `Number` (Default: `0`, average rating score based on reviews)
*   **`totalReviews`**: `Number` (Default: `0`, total number of reviews received)
*   **`fcmTokens`**: `Array of Strings` (Device push notification tokens)
*   **`lastLoginDate`**: `Date` (Used to track and trigger automatic account deactivation/inactive sweeps after 180 days)
*   **`deletionRequestedAt`**: `Date` (Set when a user requests account deletion. PII is hard-deleted after 30 days. Default: `null`)
*   **`minorTransitionDueDate`**: `Date` (For minor users: deadline to submit own NID after turning 18. Calculated as 18th birthday + 30-day grace period. Default: `null`)
*   **`createdAt`**: `Date` (Auto-generated timestamp)
*   **`updatedAt`**: `Date` (Auto-generated timestamp)

### 2.2 verification_logs (KYC Verification Logs)
Saves NID validation attempt logs to enforce attempt limits and track references.

*   **`_id`**: `ObjectId` (Primary Key)
*   **`userId`**: `ObjectId` (Foreign Key -> `users._id`)
*   **`nidHash`**: `String` (SHA-256 salted hash of the NID number. NOT unique — the same NID hash may appear across multiple verification attempts or minor accounts linked to a parent NID.)
*   **`dob`**: `Date` (Date of birth, required for Porichoy validation)
*   **`selfieUrl`**: `String` (Encrypted selfie image URL in the AWS S3 cloud store)
*   **`verificationStatus`**: `String` (Values: `pending_review` | `approved` | `rejected`, default: `pending_review`)
*   **`attemptsToday`**: `Number` (Enforces maximum 3 attempts per day, default: `1`)
*   **`lastAttemptDate`**: `Date` (Timestamp of the last attempt, default: `Date.now`)
*   **`manualReviewReason`**: `String` (Reason for escalating to manual review, e.g., `face_match_failed_3x` | `timeout_fallback`)
*   **`verifiedBy`**: `ObjectId` (Moderator ID who resolved the manual verification -> `users._id`, default: `null`)
*   **`createdAt`**: `Date` (Auto-generated timestamp)
*   **`updatedAt`**: `Date` (Auto-generated timestamp)

### 2.3 banned_nids (Banned NID Blacklist)
Ensures permanently banned individuals cannot register new accounts under the same identity.

*   **`_id`**: `ObjectId` (Primary Key)
*   **`nidHash`**: `String` (Unique, SHA-256 cryptographic hash of the blacklisted NID)
*   **`reason`**: `String` (Official reason for deactivation)
*   **`bannedBy`**: `ObjectId` (Admin ID who issued the ban -> `users._id`)
*   **`bannedAt`**: `Date` (Timestamp of the ban action)

### 2.4 listings (Classified Ads)
Stores classified advertisements, metadata, and geospatial data.

*   **`_id`**: `ObjectId` (Primary Key)
*   **`sellerId`**: `ObjectId` (Foreign Key -> `users._id`)
*   **`title`**: `String` (Ad title, 10-80 characters)
*   **`description`**: `String` (Ad description, 20-1000 characters)
*   **`price`**: `Number` (Price value, must be positive)
*   **`category`**: `String` (Product category, e.g., `Mobile`, `Electronics`, `Vehicles`)
*   **`condition`**: `String` (Values: `new` | `like_new` | `used`)
*   **`images`**: `Array of Strings` (Secure AWS S3 URLs of uploaded product images)
*   **`hidePhoneNumber`**: `Boolean` (Option to hide the contact number to limit unsolicited calls, default: `false`)
*   **`location`**: `Object` (MongoDB Geospatial `Point` model with structured administrative hierarchy)
    *   **`type`**: `String` (Value: `Point`)
    *   **`coordinates`**: `Array of Numbers` (Format: `[longitude, latitude]`)
    *   **`addressLine`**: `String` (Full text address for display purposes)
    *   **`division`**: `String` (Administrative division, e.g., `Dhaka`)
    *   **`district`**: `String` (Administrative district, e.g., `Dhaka`)
    *   **`thana`**: `String` (Thana/Upazila, e.g., `Dhanmondi`)
*   **`soldToBuyerId`**: `ObjectId` (The verified buyer selected by the seller when marking the listing as 'sold'. Required for review eligibility check. Default: `null`, Foreign Key -> `users._id`)
*   **`status`**: `String` (Values: `pending` | `active` | `archived` | `sold`, default: `pending`)
*   **`moderationFlags`**: `Object` (Listing moderation details)
    *   **`flagType`**: `String` (Values: `keyword` | `image` | `report` | `manual` | `null`, default: `null`. Tracks what triggered the moderation flag.)
    *   **`flagReason`**: `String` (Reason text for the flag status, default: `null`)
    *   **`reviewedBy`**: `ObjectId` (Moderator ID -> `users._id`, default: `null`)
*   **`expiresAt`**: `Date` (Auto-expiration timestamp, defaults to 30 days after creation)
*   **`createdAt`**: `Date` (Auto-generated timestamp)
*   **`updatedAt`**: `Date` (Auto-generated timestamp)

### 2.5 chat_rooms (Chat Session Linker)
Links buyers, sellers, and specific advertisements into persistent conversation rooms.

*   **`_id`**: `ObjectId` (Primary Key)
*   **`listingId`**: `ObjectId` (Foreign Key -> `listings._id`)
*   **`buyerId`**: `ObjectId` (Foreign Key -> `users._id`)
*   **`sellerId`**: `ObjectId` (Foreign Key -> `users._id`)
*   **`createdAt`**: `Date` (Auto-generated timestamp)
*   **`updatedAt`**: `Date` (Auto-generated timestamp)

### 2.6 messages (WebSocket Chat Messages)
Maintains WebSocket message history and handles contact details masking/filtering records.

*   **`_id`**: `ObjectId` (Primary Key)
*   **`roomId`**: `ObjectId` (Foreign Key -> `chat_rooms._id`)
*   **`senderId`**: `ObjectId` (Foreign Key -> `users._id`)
*   **`messageText`**: `String` (Masked/sanitized chat text, hiding phone numbers or blocked links)
*   **`readStatus`**: `Boolean` (Message read status tracker, default: `false`)
*   **`createdAt`**: `Date` (Auto-generated timestamp)
*   **`updatedAt`**: `Date` (Auto-generated timestamp)

### 2.7 reviews (Rating & Reviews)
Persists peer ratings and feedback scores after successful transactions.

*   **`_id`**: `ObjectId` (Primary Key)
*   **`listingId`**: `ObjectId` (Unique, Foreign Key -> `listings._id` - restricts users to a maximum of one review per transaction)
*   **`reviewerId`**: `ObjectId` (Buyer ID submitting the review -> `users._id`)
*   **`revieweeId`**: `ObjectId` (Seller ID receiving the review -> `users._id`)
*   **`rating`**: `Number` (Review score, range: 1-5)
*   **`reviewText`**: `String` (Feedback text, maximum 500 characters)
*   **`createdAt`**: `Date` (Auto-generated timestamp)
*   **`updatedAt`**: `Date` (Auto-generated timestamp)

### 2.8 temporary_otps (OTP Authentication Codes)
Stores short-lived OTP codes for passwordless mobile authentication. Documents auto-expire via MongoDB TTL index.

*   **`_id`**: `ObjectId` (Primary Key)
*   **`phoneNumber`**: `String` (Target phone number in canonical format: `+8801XXXXXXXXX`)
*   **`otpCode`**: `String` (Hashed 6-digit OTP code)
*   **`expiresAt`**: `Date` (TTL auto-deletion trigger, set to `Date.now + 180 seconds`)
*   **`createdAt`**: `Date` (Auto-generated timestamp)
*   **`updatedAt`**: `Date` (Auto-generated timestamp)

### 2.9 reports (Dispute & Report Management)
Stores user-submitted complaints against listings or other users for admin investigation.

*   **`_id`**: `ObjectId` (Primary Key)
*   **`reporterId`**: `ObjectId` (User who submitted the report -> `users._id`)
*   **`targetType`**: `String` (Values: `Listing` | `User`, specifies what is being reported)
*   **`targetId`**: `ObjectId` (The listing or user being reported -> `listings._id` or `users._id`)
*   **`reason`**: `String` (Values: `scam` | `harassment` | `misrepresentation` | `inappropriate` | `other`)
*   **`description`**: `String` (Detailed description of the issue, maximum 1000 characters)
*   **`status`**: `String` (Values: `pending` | `reviewed` | `resolved` | `dismissed`, default: `pending`)
*   **`reviewedBy`**: `ObjectId` (Admin/Moderator ID who reviewed the report -> `users._id`, default: `null`)
*   **`resolution`**: `String` (Action taken description, default: `null`)
*   **`createdAt`**: `Date` (Auto-generated timestamp)
*   **`updatedAt`**: `Date` (Auto-generated timestamp)
