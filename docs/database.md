# Database Specifications: Becha-Kena C2C Classified Marketplace

**Prepared by:** Lead Database Architect  
**Date:** June 26, 2026  
**Database System:** MongoDB Atlas (Layered Monolith Backend)  
**ORM / ODM:** Mongoose (Node.js/Express)  
**Source Documents:** [prd.md](file:///c:/Users/afnan/Documents/becha-kena/prd.md) | [dfd.md](file:///c:/Users/afnan/Documents/becha-kena/dfd.md) | [architecture.md](file:///c:/Users/afnan/Documents/becha-kena/architecture.md)

---

## 1. Collection List

The data architecture of Becha-Kena is designed following MongoDB Atlas's document model. There are 9 core collections in the system:

| Collection Name | Description | Real-Time Size / Growth | Tracking Type |
|---|---|---|---|
| **users** | Stores user profiles, phone numbers, KYC status, trust scores, and FCM tokens. | High Growth | Dynamic Profile |
| **verification_logs** | Stores logs of user NID verification attempts, daily limits, and parent NID references. | Medium Growth | Audit / Logging |
| **banned_nids** | Contains SHA-256 cryptographic hashes of NIDs belonging to permanently banned users. | Low Growth | Security Blacklist |
| **listings** | Stores product details, categories, pricing, images, and GeoJSON locations for posted advertisements. | High Growth | Core Transactional |
| **chat_rooms** | Stores chat session links between buyers, sellers, and specific product listings. | High Growth | Relationship Engine |
| **messages** | Stores individual real-time WebSocket messages (masked text) within each chat room. | Very High Growth | Operational |
| **reviews** | Contains ratings and feedback reviews submitted by buyers for sellers after successful transactions. | Medium Growth | Social Proof |
| **temporary_otps** | Short-lived OTP codes for mobile authentication with automatic TTL-based expiration. | Volatile (TTL auto-delete) | Authentication |
| **reports** | Stores user-submitted dispute reports against listings or user profiles for admin review. | Medium Growth | Trust & Safety |

---

---

## 3. Relationships

The logical relationships among the database collections are mapped as follows:

```
[users] (1) <--------------------- (N) [verification_logs]  (userId)
[users] (1) <--------------------- (N) [listings]           (sellerId)
[users] (1) <--------------------- (N) [banned_nids]        (bannedBy)
[users] (1) <--------------------- (N) [chat_rooms]         (buyerId / sellerId)
[users] (1) <--------------------- (N) [messages]           (senderId)
[users] (1) <--------------------- (N) [reviews]            (reviewerId / revieweeId)
[users] (1) <--------------------- (N) [reports]            (reporterId / targetId when targetType='user')
[users] (1) <--------------------- (N) [temporary_otps]     (phoneNumber)

[listings] (1) <------------------ (N) [chat_rooms]         (listingId)
[listings] (1) <------------------ (1) [reviews]            (listingId - Unique)
[listings] (1) <------------------ (N) [reports]            (targetId when targetType='listing')

[chat_rooms] (1) <---------------- (N) [messages]           (roomId)
```

*   **1-to-Many (1:N)**:
    *   One user can publish multiple ad listings (`users` -> `listings`).
    *   One chat room holds multiple message records (`chat_rooms` -> `messages`).
    *   One user can perform multiple KYC verification attempts over time (`users` -> `verification_logs`).
    *   One user can submit multiple dispute reports (`users` -> `reports`).
    *   One listing can be reported multiple times by different users (`listings` -> `reports`).
*   **Many-to-Many (M:N) Resolved via Junction**:
    *   The buyer-to-seller messaging relationship is resolved through the `chat_rooms` junction table, which aggregates the contextual `listingId`.
*   **1-to-1 (1:1) Constrained**:
    *   Each listing allows exactly one review record to be generated after it is marked as sold (`listings` -> `reviews` via unique index constraint on `listingId`).
*   **Volatile / Self-Expiring**:
    *   `temporary_otps` documents auto-delete via TTL index after 180 seconds. No permanent relationship is maintained.

---

## 4. Database Indexes

To optimize index scans, prevent duplicate records, and ensure query speed, the following index definitions must be registered:

```javascript
// 1. users Collection Indexes
db.users.createIndex({ phoneNumber: 1 }, { unique: true });
db.users.createIndex({ status: 1 });

// 2. verification_logs Collection Indexes
db.verification_logs.createIndex({ userId: 1 });
db.verification_logs.createIndex({ nidHash: 1 }); // Non-unique: same NID can have multiple attempts
db.verification_logs.createIndex({ lastAttemptDate: -1 });

// 3. banned_nids Collection Indexes
db.banned_nids.createIndex({ nidHash: 1 }, { unique: true });

// 4. listings Collection Indexes
db.listings.createIndex({ location: "2dsphere" }); // Geospatial queries
db.listings.createIndex({ sellerId: 1, status: 1 });
db.listings.createIndex({ status: 1, expiresAt: 1 }); // Scheduler: Day 27 renewal + Day 30 auto-archive

// 5. chat_rooms Collection Indexes
// Composite unique index ensures only ONE room exists between a buyer, seller, and listing
db.chat_rooms.createIndex({ buyerId: 1, sellerId: 1, listingId: 1 }, { unique: true });

// 6. messages Collection Indexes
db.messages.createIndex({ roomId: 1, createdAt: -1 }); // Sorted message history query

// 7. reviews Collection Indexes
db.reviews.createIndex({ listingId: 1 }, { unique: true }); // Prevent duplicate reviews for one transaction
db.reviews.createIndex({ revieweeId: 1 });

// 8. temporary_otps Collection Indexes
db.temporary_otps.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 }); // TTL auto-delete
db.temporary_otps.createIndex({ phoneNumber: 1 });

// 9. reports Collection Indexes
db.reports.createIndex({ reporterId: 1 });
db.reports.createIndex({ targetType: 1, targetId: 1 });
db.reports.createIndex({ status: 1 });
```

---

## 5. Schema Validation (MongoDB JSON Schema)

The following MongoDB JSON schema rules enforce structural integrity and constraints directly at the database collection level.

### 5.1 users Collection Validation
```json
{
  "bsonType": "object",
  "required": ["phoneNumber", "displayName", "role", "status", "tokenVersion"],
  "properties": {
    "phoneNumber": {
      "bsonType": "string",
      "pattern": "^\\+8801[3-9]\\d{8}$",
      "description": "Must be a valid Bangladeshi mobile number in canonical format +8801XXXXXXXXX"
    },
    "displayName": {
      "bsonType": "string",
      "minLength": 1,
      "maxLength": 30,
      "description": "Display name is required and max 30 characters"
    },
    "role": {
      "enum": ["user", "moderator", "admin"],
      "description": "Role can only be user, moderator, or admin"
    },
    "status": {
      "enum": ["active", "suspended", "inactive"],
      "description": "Status can only be active, suspended, or inactive"
    },
    "tokenVersion": {
      "bsonType": "int",
      "minimum": 0,
      "description": "Token version counter, must be non-negative"
    },
    "parentNIDHash": {
      "bsonType": ["string", "null"],
      "pattern": "^[a-fA-F0-9]{64}$",
      "description": "Must be a valid SHA-256 hash or null"
    }
  }
}
```

### 5.2 verification_logs Collection Validation
```json
{
  "bsonType": "object",
  "required": ["userId", "nidHash", "dob", "selfieUrl", "verificationStatus"],
  "properties": {
    "verificationStatus": {
      "enum": ["pending_review", "approved", "rejected"],
      "description": "Verification outcome status"
    },
    "attemptsToday": {
      "bsonType": "int",
      "minimum": 0,
      "maximum": 3,
      "description": "Max 3 verification attempts per day"
    }
  }
}
```

### 5.3 listings Collection Validation
```json
{
  "bsonType": "object",
  "required": ["sellerId", "title", "description", "price", "category", "condition", "location", "status"],
  "properties": {
    "title": {
      "bsonType": "string",
      "minLength": 10,
      "maxLength": 80,
      "description": "Title must be between 10-80 characters"
    },
    "description": {
      "bsonType": "string",
      "minLength": 20,
      "maxLength": 1000,
      "description": "Description must be between 20-1000 characters"
    },
    "price": {
      "bsonType": "number",
      "minimum": 0,
      "description": "Price must be a positive number"
    },
    "condition": {
      "enum": ["new", "like_new", "used"],
      "description": "Product condition flag"
    },
    "status": {
      "enum": ["pending", "active", "archived", "sold"],
      "description": "Listing lifecycle status"
    }
  }
}
```

### 5.4 reviews Collection Validation
```json
{
  "bsonType": "object",
  "required": ["listingId", "reviewerId", "revieweeId", "rating", "reviewText"],
  "properties": {
    "rating": {
      "bsonType": "int",
      "minimum": 1,
      "maximum": 5,
      "description": "Rating must be between 1-5 stars"
    },
    "reviewText": {
      "bsonType": "string",
      "maxLength": 500,
      "description": "Review text max 500 characters"
    }
  }
}
```

### 5.5 reports Collection Validation
```json
{
  "bsonType": "object",
  "required": ["reporterId", "targetType", "targetId", "reason", "description", "status"],
  "properties": {
    "targetType": {
      "enum": ["Listing", "User"],
      "description": "Type of entity being reported"
    },
    "reason": {
      "enum": ["scam", "harassment", "misrepresentation", "inappropriate", "other"],
      "description": "Report reason category"
    },
    "status": {
      "enum": ["pending", "reviewed", "resolved", "dismissed"],
      "description": "Report processing status"
    },
    "description": {
      "bsonType": "string",
      "maxLength": 1000,
      "description": "Report description max 1000 characters"
    }
  }
}
```

---

## 6. Aggregation Pipelines

### 6.1 Geospatial Distance Sorting (Location-based search queries)
Retrieves active listings within a specific distance threshold filtered by category:

```javascript
db.listings.aggregate([
  {
    $geoNear: {
      near: { type: "Point", coordinates: [ 90.4125, 23.8103 ] }, // [lng, lat] (Dhaka Center coords)
      distanceField: "distance",
      maxDistance: 5000, // 5 Kilometers in meters
      query: { status: "active", category: "Mobile" },
      spherical: true
    }
  },
  { $sort: { distance: 1 } }, // Closest items returned first
  { $limit: 20 }
]);
```

### 6.2 Review Score Aggregator (User rating synchronization)
Calculates the average rating and review counts dynamically for a specific user:

```javascript
db.reviews.aggregate([
  { $match: { revieweeId: ObjectId("60b8d29f4f1a2c0015a99991") } },
  {
    $group: {
      _id: "$revieweeId",
      averageRating: { $avg: "$rating" },
      totalReviews: { $sum: 1 }
    }
  }
]);
```

### 6.3 Admin Report Summary Dashboard (Pending reports by type)
Groups pending reports by target type and reason for admin dashboard overview:

```javascript
db.reports.aggregate([
  { $match: { status: "pending" } },
  {
    $group: {
      _id: { targetType: "$targetType", reason: "$reason" },
      count: { $sum: 1 }
    }
  },
  { $sort: { count: -1 } }
]);
```

---

## 7. Multi-Document Transactions (ACID Workflows)

MongoDB session transactions are utilized to maintain transactional integrity across the following multi-document workflows:

### 7.1 KYC Verification Approval Transaction
Updates the verification badges, role statuses, and logs simultaneously:

```javascript
const session = await mongoose.startSession();
session.startTransaction();
try {
  // 1. Update user validation badge and status fields
  await User.findByIdAndUpdate(userId, {
    isVerified: true,
    verifiedName: porichoyName,
    ageGroup: determinedAgeGroup,
    parentNIDHash: parentHash || null
  }, { session });

  // 2. Resolve target verification log parameters
  await VerificationLog.findOneAndUpdate({ userId, verificationStatus: 'pending_review' }, {
    verificationStatus: 'approved',
    verifiedBy: moderatorId
  }, { session });

  await session.commitTransaction();
} catch (error) {
  await session.abortTransaction();
  throw error;
} finally {
  session.endSession();
}
```

### 7.2 User Permanent Ban Transaction
Suspends the user, increments session variables to force signouts, archives all listings, and blacklists their identity hash:

```javascript
const session = await mongoose.startSession();
session.startTransaction();
try {
  // 1. Update user profile to suspended and increment token version
  await User.findByIdAndUpdate(userId, {
    status: 'suspended',
    $inc: { tokenVersion: 1 }
  }, { session });

  // 2. Archive active ad listings posted by the banned user
  await Listing.updateMany({ sellerId: userId, status: 'active' }, {
    status: 'archived'
  }, { session });

  // 3. Blacklist identity hash to prevent future registration
  await BannedNid.create([{
    nidHash: userNidHash,
    reason: 'Multiple policy violations / Scam activity',
    bannedBy: adminId
  }], { session });

  await session.commitTransaction();
} catch (error) {
  await session.abortTransaction();
  throw error;
} finally {
  session.endSession();
}
```

### 7.3 Mark as Sold & Trigger Review Eligibility
Atomically updates the listing status to 'sold', assigns the buyer, and creates the review window:

```javascript
const session = await mongoose.startSession();
session.startTransaction();
try {
  // 1. Verify the buyer had a chat history with the seller for this listing
  const chatRoom = await ChatRoom.findOne({
    listingId, buyerId: selectedBuyerId, sellerId
  }).session(session);

  if (!chatRoom) throw new Error('No chat history with this buyer for this listing');

  // 2. Mark listing as sold and assign the verified buyer
  await Listing.findByIdAndUpdate(listingId, {
    status: 'sold',
    soldToBuyerId: selectedBuyerId
  }, { session });

  await session.commitTransaction();
} catch (error) {
  await session.abortTransaction();
  throw error;
} finally {
  session.endSession();
}
```

---

## 8. Sample Data Templates

### 8.1 User Profile Sample
```json
{
  "_id": { "$oid": "60b8d29f4f1a2c0015a99991" },
  "phoneNumber": "+8801712345678",
  "displayName": "Afnan Rahman",
  "verifiedName": "AFNAN RAHMAN",
  "isVerified": true,
  "ageGroup": "adult",
  "parentNIDHash": null,
  "role": "user",
  "status": "active",
  "tokenVersion": 0,
  "averageRating": 4.8,
  "totalReviews": 12,
  "fcmTokens": ["fcm_token_web_88192a83bd", "fcm_token_android_9918237ba"],
  "lastLoginDate": { "$date": "2026-06-26T17:00:00Z" },
  "deletionRequestedAt": null,
  "minorTransitionDueDate": null,
  "createdAt": { "$date": "2026-05-01T10:00:00Z" },
  "updatedAt": { "$date": "2026-06-26T17:00:00Z" }
}
```

### 8.2 Product Listing Sample
```json
{
  "_id": { "$oid": "60b8d34f4f1a2c0015a99992" },
  "sellerId": { "$oid": "60b8d29f4f1a2c0015a99991" },
  "title": "iPhone 13 Pro 128GB Mint Condition",
  "description": "Fully fresh iPhone 13 Pro. 88% battery health. Selling to upgrade to 15. Real buyers only.",
  "price": 68000,
  "category": "Mobile",
  "condition": "used",
  "images": [
    "https://s3.ap-south-1.amazonaws.com/becha-kena/listings/img1.webp",
    "https://s3.ap-south-1.amazonaws.com/becha-kena/listings/img2.webp"
  ],
  "hidePhoneNumber": false,
  "location": {
    "type": "Point",
    "coordinates": [90.4125, 23.8103],
    "addressLine": "Dhanmondi, Road 27, Dhaka",
    "division": "Dhaka",
    "district": "Dhaka",
    "thana": "Dhanmondi"
  },
  "soldToBuyerId": null,
  "status": "active",
  "moderationFlags": {
    "flagType": null,
    "flagReason": null,
    "reviewedBy": null
  },
  "expiresAt": { "$date": "2026-07-26T10:00:00Z" },
  "createdAt": { "$date": "2026-06-26T10:00:00Z" },
  "updatedAt": { "$date": "2026-06-26T10:00:00Z" }
}
```

### 8.3 Verification Log Sample
```json
{
  "_id": { "$oid": "60b8d5004f1a2c0015a99993" },
  "userId": { "$oid": "60b8d29f4f1a2c0015a99991" },
  "nidHash": "a3f7b2c19e8d4f5a6b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2",
  "dob": { "$date": "1998-03-15T00:00:00Z" },
  "selfieUrl": "https://s3.ap-south-1.amazonaws.com/becha-kena/nid/selfie_enc_xxxx.jpg",
  "verificationStatus": "approved",
  "attemptsToday": 1,
  "lastAttemptDate": { "$date": "2026-05-01T10:15:00Z" },
  "manualReviewReason": null,
  "verifiedBy": null,
  "createdAt": { "$date": "2026-05-01T10:15:00Z" },
  "updatedAt": { "$date": "2026-05-01T10:15:30Z" }
}
```

### 8.4 Banned NID Sample
```json
{
  "_id": { "$oid": "60b8d6004f1a2c0015a99994" },
  "nidHash": "f1e2d3c4b5a69788091a2b3c4d5e6f7081929394a5b6c7d8e9f0a1b2c3d4e5f6",
  "reason": "Repeated scam activity confirmed by multiple buyer reports",
  "bannedBy": { "$oid": "60b8da004f1a2c0015a99999" },
  "bannedAt": { "$date": "2026-06-20T14:30:00Z" }
}
```

### 8.5 Chat Room Sample
```json
{
  "_id": { "$oid": "60b8d7004f1a2c0015a99995" },
  "listingId": { "$oid": "60b8d34f4f1a2c0015a99992" },
  "buyerId": { "$oid": "60b8d8004f1a2c0015a99996" },
  "sellerId": { "$oid": "60b8d29f4f1a2c0015a99991" },
  "createdAt": { "$date": "2026-06-26T11:00:00Z" },
  "updatedAt": { "$date": "2026-06-26T11:00:00Z" }
}
```

### 8.6 Message Sample
```json
{
  "_id": { "$oid": "60b8d7504f1a2c0015a99997" },
  "roomId": { "$oid": "60b8d7004f1a2c0015a99995" },
  "senderId": { "$oid": "60b8d8004f1a2c0015a99996" },
  "messageText": "Is the price negotiable? I can pick it up from Dhanmondi today.",
  "readStatus": true,
  "createdAt": { "$date": "2026-06-26T11:05:00Z" }
}
```

### 8.7 Review Sample
```json
{
  "_id": { "$oid": "60b8d9004f1a2c0015a99998" },
  "listingId": { "$oid": "60b8d34f4f1a2c0015a99992" },
  "reviewerId": { "$oid": "60b8d8004f1a2c0015a99996" },
  "revieweeId": { "$oid": "60b8d29f4f1a2c0015a99991" },
  "rating": 5,
  "reviewText": "Great seller! Phone was exactly as described. Quick meetup in Dhanmondi.",
  "createdAt": { "$date": "2026-06-26T18:00:00Z" }
}
```

### 8.8 Temporary OTP Sample
```json
{
  "_id": { "$oid": "60b8db004f1a2c0015a9999a" },
  "phoneNumber": "+8801912345678",
  "otpCode": "$2b$10$hashedOtpCodeExample123456",
  "expiresAt": { "$date": "2026-06-26T17:03:00Z" },
  "createdAt": { "$date": "2026-06-26T17:00:00Z" }
}
```

### 8.9 Report Sample
```json
{
  "_id": { "$oid": "60b8dc004f1a2c0015a9999b" },
  "reporterId": { "$oid": "60b8d8004f1a2c0015a99996" },
  "targetType": "Listing",
  "targetId": { "$oid": "60b8d34f4f1a2c0015a99992" },
  "reason": "misrepresentation",
  "description": "The product images do not match the actual item. The phone has visible scratches that were not disclosed in the listing.",
  "status": "pending",
  "reviewedBy": null,
  "resolution": null,
  "createdAt": { "$date": "2026-06-26T19:00:00Z" },
  "updatedAt": { "$date": "2026-06-26T19:00:00Z" }
}
```

---

## 9. Mongoose Schemas (JavaScript Implementation)

Mongoose schemas implementation for the Express backend application:

```javascript
const mongoose = require('mongoose');

// ==========================================
// 1. User Model Schema
// ==========================================
const UserSchema = new mongoose.Schema({
  phoneNumber: {
    type: String,
    required: true,
    unique: true,
    match: [/^\+8801[3-9]\d{8}$/, 'Phone must be in canonical format +8801XXXXXXXXX']
  },
  displayName: {
    type: String,
    required: true,
    trim: true,
    minlength: 1,
    maxlength: 30
  },
  verifiedName: { type: String, default: null },
  isVerified: { type: Boolean, default: false },
  ageGroup: { type: String, enum: ['adult', 'minor', null], default: null },
  parentNIDHash: { type: String, default: null },
  role: { type: String, enum: ['user', 'moderator', 'admin'], default: 'user' },
  status: { type: String, enum: ['active', 'suspended', 'inactive'], default: 'active' },
  tokenVersion: { type: Number, default: 0 },
  averageRating: { type: Number, default: 0 },
  totalReviews: { type: Number, default: 0 },
  fcmTokens: [{ type: String }],
  lastLoginDate: { type: Date, default: Date.now },
  deletionRequestedAt: { type: Date, default: null },
  minorTransitionDueDate: { type: Date, default: null }
}, { timestamps: true });

const User = mongoose.model('User', UserSchema);

// ==========================================
// 2. VerificationLog Model Schema
// ==========================================
const VerificationLogSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  nidHash: { type: String, required: true }, // Non-unique: same NID can have multiple attempts
  dob: { type: Date, required: true },
  selfieUrl: { type: String, required: true },
  verificationStatus: {
    type: String,
    enum: ['pending_review', 'approved', 'rejected'],
    default: 'pending_review'
  },
  attemptsToday: { type: Number, default: 1, max: 3 },
  lastAttemptDate: { type: Date, default: Date.now },
  manualReviewReason: { type: String, default: null },
  verifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null }
}, { timestamps: true });

const VerificationLog = mongoose.model('VerificationLog', VerificationLogSchema);

// ==========================================
// 3. BannedNid Model Schema
// ==========================================
const BannedNidSchema = new mongoose.Schema({
  nidHash: { type: String, required: true, unique: true },
  reason: { type: String, required: true },
  bannedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  bannedAt: { type: Date, default: Date.now }
});

const BannedNid = mongoose.model('BannedNid', BannedNidSchema);

// ==========================================
// 4. Listing Model Schema (Geospatial Indexing)
// ==========================================
const ListingSchema = new mongoose.Schema({
  sellerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true, minlength: 10, maxlength: 80, trim: true },
  description: { type: String, required: true, minlength: 20, maxlength: 1000 },
  price: { type: Number, required: true, min: 0 },
  category: { type: String, required: true },
  condition: { type: String, enum: ['new', 'like_new', 'used'], required: true },
  images: [{ type: String, required: true }],
  hidePhoneNumber: { type: Boolean, default: false },
  location: {
    type: { type: String, enum: ['Point'], required: true, default: 'Point' },
    coordinates: { type: [Number], required: true }, // [longitude, latitude]
    addressLine: { type: String },
    division: { type: String },
    district: { type: String },
    thana: { type: String }
  },
  soldToBuyerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  status: { type: String, enum: ['pending', 'active', 'archived', 'sold'], default: 'pending' },
  moderationFlags: {
    flagType: {
      type: String,
      enum: ['keyword', 'image', 'report', 'manual', null],
      default: null
    },
    flagReason: { type: String, default: null },
    reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null }
  },
  expiresAt: {
    type: Date,
    required: true,
    default: () => new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 Days expiry
  }
}, { timestamps: true });

ListingSchema.index({ location: '2dsphere' });

const Listing = mongoose.model('Listing', ListingSchema);

// ==========================================
// 5. ChatRoom Model Schema
// ==========================================
const ChatRoomSchema = new mongoose.Schema({
  listingId: { type: mongoose.Schema.Types.ObjectId, ref: 'Listing', required: true },
  buyerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  sellerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
}, { timestamps: true });

ChatRoomSchema.index({ buyerId: 1, sellerId: 1, listingId: 1 }, { unique: true });

const ChatRoom = mongoose.model('ChatRoom', ChatRoomSchema);

// ==========================================
// 6. Message Model Schema
// ==========================================
const MessageSchema = new mongoose.Schema({
  roomId: { type: mongoose.Schema.Types.ObjectId, ref: 'ChatRoom', required: true },
  senderId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  messageText: { type: String, required: true, trim: true },
  readStatus: { type: Boolean, default: false }
}, { timestamps: true });

const Message = mongoose.model('Message', MessageSchema);

// ==========================================
// 7. Review Model Schema
// ==========================================
const ReviewSchema = new mongoose.Schema({
  listingId: { type: mongoose.Schema.Types.ObjectId, ref: 'Listing', required: true, unique: true },
  reviewerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  revieweeId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  rating: { type: Number, required: true, min: 1, max: 5 },
  reviewText: { type: String, required: true, maxlength: 500 }
}, { timestamps: true });

const Review = mongoose.model('Review', ReviewSchema);

// ==========================================
// 8. TemporaryOtp Model Schema (TTL Auto-Expiry)
// ==========================================
const TemporaryOtpSchema = new mongoose.Schema({
  phoneNumber: { type: String, required: true },
  otpCode: { type: String, required: true }, // Hashed OTP
  expiresAt: { type: Date, required: true, default: () => new Date(Date.now() + 180 * 1000) } // 3 minutes
}, { timestamps: true });

TemporaryOtpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }); // TTL auto-delete

const TemporaryOtp = mongoose.model('TemporaryOtp', TemporaryOtpSchema);

// ==========================================
// 9. Report Model Schema (Dispute Management)
// ==========================================
const ReportSchema = new mongoose.Schema({
  reporterId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  targetType: { type: String, enum: ['Listing', 'User'], required: true },
  targetId: { type: mongoose.Schema.Types.ObjectId, required: true, refPath: 'targetType' },
  reason: {
    type: String,
    enum: ['scam', 'harassment', 'misrepresentation', 'inappropriate', 'other'],
    required: true
  },
  description: { type: String, required: true, maxlength: 1000 },
  status: {
    type: String,
    enum: ['pending', 'reviewed', 'resolved', 'dismissed'],
    default: 'pending'
  },
  reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  resolution: { type: String, default: null }
}, { timestamps: true });

const Report = mongoose.model('Report', ReportSchema);

module.exports = {
  User,
  VerificationLog,
  BannedNid,
  Listing,
  ChatRoom,
  Message,
  Review,
  TemporaryOtp,
  Report
};
```

---

## 10. Entity Relationship Diagram (ERD)

The Entity Relationship Diagram (ERD) representing the database schema:

```mermaid
erDiagram
    USER {
        ObjectId id PK
        String phoneNumber UK
        String displayName
        String verifiedName
        Boolean isVerified
        String ageGroup
        String parentNIDHash
        String role
        String status
        Number tokenVersion
        Number averageRating
        Number totalReviews
        Array fcmTokens
        Date lastLoginDate
        Date deletionRequestedAt
        Date minorTransitionDueDate
        Date createdAt
        Date updatedAt
    }

    VERIFICATION_LOG {
        ObjectId id PK
        ObjectId userId FK
        String nidHash
        Date dob
        String selfieUrl
        String verificationStatus
        Number attemptsToday
        Date lastAttemptDate
        String manualReviewReason
        ObjectId verifiedBy FK
    }

    BANNED_NID {
        ObjectId id PK
        String nidHash UK
        String reason
        ObjectId bannedBy FK
        Date bannedAt
    }

    LISTING {
        ObjectId id PK
        ObjectId sellerId FK
        String title
        String description
        Number price
        String category
        String condition
        Array images
        Boolean hidePhoneNumber
        Object location
        ObjectId soldToBuyerId FK
        String status
        Object moderationFlags
        Date expiresAt
        Date createdAt
        Date updatedAt
    }

    CHAT_ROOM {
        ObjectId id PK
        ObjectId listingId FK
        ObjectId buyerId FK
        ObjectId sellerId FK
        Date createdAt
        Date updatedAt
    }

    MESSAGE {
        ObjectId id PK
        ObjectId roomId FK
        ObjectId senderId FK
        String messageText
        Boolean readStatus
        Date createdAt
    }

    REVIEW {
        ObjectId id PK
        ObjectId listingId FK "Unique"
        ObjectId reviewerId FK
        ObjectId revieweeId FK
        Number rating
        String reviewText
        Date createdAt
    }

    TEMPORARY_OTP {
        ObjectId id PK
        String phoneNumber
        String otpCode
        Date expiresAt "TTL"
        Date createdAt
    }

    REPORT {
        ObjectId id PK
        ObjectId reporterId FK
        String targetType
        ObjectId targetId FK
        String reason
        String description
        String status
        ObjectId reviewedBy FK
        String resolution
        Date createdAt
        Date updatedAt
    }

    USER ||--oN VERIFICATION_LOG : "has verification attempts"
    USER ||--oN LISTING : "posts ads"
    USER ||--oN BANNED_NID : "banned by admin"
    USER ||--oN CHAT_ROOM : "participates as buyer/seller"
    USER ||--oN MESSAGE : "sends chat messages"
    USER ||--oN REVIEW : "reviews or reviewed by peers"
    USER ||--oN REPORT : "submits or is target of reports"

    LISTING ||--oN CHAT_ROOM : "has negotiations on"
    LISTING ||--o| REVIEW : "verified by purchase"
    LISTING ||--oN REPORT : "can be reported"
    LISTING oN--|| USER : "sold to buyer via soldToBuyerId"

    CHAT_ROOM ||--oN MESSAGE : "contains chat history"
```
