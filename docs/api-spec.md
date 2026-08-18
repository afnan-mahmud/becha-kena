# Becha-Kena API Specification

This document outlines the RESTful API endpoints for the Becha-Kena marketplace, based on the PRD and Database Schema.

## Base URL & Version Control
- **Current Version:** `v1`
- **Base URL:** `/api/v1`
- **Versioning Strategy:** The API uses URI versioning (e.g., `/api/v1/`, `/api/v2/`). Major breaking changes will result in a new version number. Minor additions will be backwards-compatible within the same version.

## Common Response Format
All successful API responses follow a standard JSON structure:
```json
{
  "success": true,
  "message": "Operation successful",
  "data": { ... } // object or array
}
```

## Error Handling
The API uses standard HTTP status codes and a consistent error response structure. 

### Standard Error Response Format
```json
{
  "success": false,
  "error": "Human-readable error message.",
  "code": "SPECIFIC_ERROR_CODE",
  "details": [ ... ] // (Optional) Additional error context, such as validation failure fields.
}
```

### Common HTTP Status Codes
| Status Code | Description | Example Scenarios |
|-------------|-------------|-------------------|
| **200 OK** | Success | GET, PUT, PATCH, DELETE operations completed. |
| **201 Created** | Created | POST operations (e.g., listing created). |
| **400 Bad Request** | Validation Error | Missing parameters, invalid phone format, invalid JSON. |
| **401 Unauthorized** | Authentication Failed | Missing or invalid JWT, token expired, invalid OTP. |
| **403 Forbidden** | Access Denied | Unverified user trying to post an ad, user lacking admin role. |
| **404 Not Found** | Resource Not Found | Listing ID does not exist, User ID not found. |
| **429 Too Many Requests** | Rate Limit Exceeded | Requesting OTPs too quickly, KYC attempt limits reached. |
| **500 Internal Error** | Server Failure | Database connection issues, unexpected backend errors. |
| **503 Service Unavailable** | External API Down | Porichoy API or AWS S3 is down. |

### Common Application Error Codes
- `INVALID_OTP`
- `TOKEN_EXPIRED`
- `ACCOUNT_SUSPENDED`
- `KYC_LIMIT_REACHED`
- `VALIDATION_FAILED`
- `RESOURCE_NOT_FOUND`

---

## 1. Authentication APIs

### 1.1 Request OTP
- **Method:** `POST`
- **Path:** `/auth/request-otp`
- **Auth Required:** No
- **Description:** Request an OTP for a given Bangladeshi phone number. Rate-limited to 5 requests/hour.
- **Request Body:**
  ```json
  {
    "phoneNumber": "01712345678"
  }
  ```
- **Response:**
  ```json
  {
    "success": true,
    "message": "OTP sent successfully",
    "data": { "expiresIn": 180 }
  }
  ```

### 1.2 Verify OTP
- **Method:** `POST`
- **Path:** `/auth/verify-otp`
- **Auth Required:** No
- **Description:** Verify the OTP and authenticate the user. Returns a JWT access token.
- **Request Body:**
  ```json
  {
    "phoneNumber": "01712345678",
    "otpCode": "123456"
  }
  ```
- **Response:**
  ```json
  {
    "success": true,
    "data": {
      "token": "eyJhbG...",
      "user": {
        "id": "60b8d2...",
        "phoneNumber": "+8801712345678",
        "isVerified": false,
        "role": "user"
      }
    }
  }
  ```

### 1.3 Logout
- **Method:** `POST`
- **Path:** `/auth/logout`
- **Auth Required:** Yes (Any Role)
- **Description:** Logs out the user by incrementing `tokenVersion`, invalidating existing JWTs.
- **Request Body:** None
- **Response:**
  ```json
  { "success": true, "message": "Logged out successfully" }
  ```

---

## 2. User & Profile APIs

### 2.1 Get Current User Profile
- **Method:** `GET`
- **Path:** `/users/me`
- **Auth Required:** Yes (Any Role)
- **Description:** Get the authenticated user's profile information.
- **Response:**
  ```json
  {
    "success": true,
    "data": {
      "id": "60b8...",
      "displayName": "Afnan",
      "verifiedName": "AFNAN RAHMAN",
      "isVerified": true,
      "status": "active"
    }
  }
  ```

### 2.2 Update Profile
- **Method:** `PUT`
- **Path:** `/users/me`
- **Auth Required:** Yes (Any Role)
- **Description:** Update user settings like display name or push notification tokens.
- **Request Body:**
  ```json
  {
    "displayName": "New Nickname",
    "fcmToken": "new_fcm_token_xyz"
  }
  ```
- **Response:**
  ```json
  { "success": true, "message": "Profile updated" }
  ```

### 2.3 Request Account Deletion
- **Method:** `DELETE`
- **Path:** `/users/me`
- **Auth Required:** Yes (Any Role)
- **Description:** Initiates account deletion. PII is hard-deleted after 30 days.
- **Response:**
  ```json
  { "success": true, "message": "Account scheduled for deletion" }
  ```

---

## 3. KYC & Identity Verification APIs

### 3.1 Submit Adult Verification
- **Method:** `POST`
- **Path:** `/kyc/verify-adult`
- **Auth Required:** Yes (Unverified User)
- **Description:** Submit NID details and selfie for automated Porichoy validation. Max 3 attempts/day.
- **Request Body:**
  ```json
  {
    "nidNumber": "1234567890",
    "dob": "1998-03-15",
    "selfieUrl": "https://s3.bucket/path/to/selfie.jpg"
  }
  ```
- **Response:**
  ```json
  { "success": true, "message": "Verification pending or approved", "data": { "status": "approved" } }
  ```

### 3.2 Submit Minor Verification
- **Method:** `POST`
- **Path:** `/kyc/verify-minor`
- **Auth Required:** Yes (Unverified User)
- **Description:** Submit parent's NID and consent.
- **Request Body:**
  ```json
  {
    "parentNidNumber": "0987654321",
    "dob": "2008-05-10",
    "parentSelfieUrl": "https://s3.bucket/path/to/parent_selfie.jpg",
    "consentConfirmed": true
  }
  ```
- **Response:**
  ```json
  { "success": true, "message": "Minor verification submitted" }
  ```

---

## 4. Media & Storage APIs

### 4.1 Get Pre-signed URL
- **Method:** `POST`
- **Path:** `/media/presigned-url`
- **Auth Required:** Yes (Any Role)
- **Description:** Request an S3 pre-signed URL for direct client-side upload of images/selfies. Expires in 5 minutes.
- **Request Body:**
  ```json
  {
    "fileName": "item1.webp",
    "fileType": "image/webp"
  }
  ```
- **Response:**
  ```json
  {
    "success": true,
    "data": {
      "uploadUrl": "https://s3...",
      "fileUrl": "https://s3.../final_path"
    }
  }
  ```

---

## 5. Listing (Ad) APIs

### 5.1 Get Active Listings (Search & Filter)
- **Method:** `GET`
- **Path:** `/listings`
- **Auth Required:** No (Guest Allowed)
- **Description:** Browse and search listings. Can filter by category, price, and location.
- **Query Params:** `category`, `minPrice`, `maxPrice`, `lat`, `lng`, `radius`, `search`
- **Response:** List of listing objects (paginated).

### 5.2 Get Listing Details
- **Method:** `GET`
- **Path:** `/listings/:id`
- **Auth Required:** No (Guest Allowed)
- **Description:** Get full details of a specific ad. Phone number masked if `hidePhoneNumber` is true.

### 5.3 Create Listing
- **Method:** `POST`
- **Path:** `/listings`
- **Auth Required:** Yes (Verified User Only)
- **Description:** Post a new classified ad. Goes into pending/moderation queue.
- **Request Body:**
  ```json
  {
    "title": "iPhone 13 Pro",
    "description": "Mint condition, 88% battery...",
    "price": 68000,
    "category": "Mobile",
    "condition": "used",
    "images": ["https://s3..."],
    "hidePhoneNumber": false,
    "location": {
      "coordinates": [90.4125, 23.8103],
      "division": "Dhaka",
      "district": "Dhaka",
      "thana": "Dhanmondi"
    }
  }
  ```
- **Response:**
  ```json
  { "success": true, "message": "Listing created and pending moderation" }
  ```

### 5.4 Mark Listing as Sold
- **Method:** `PATCH`
- **Path:** `/listings/:id/sell`
- **Auth Required:** Yes (Verified User, Must be Seller)
- **Description:** Mark ad as sold to a specific verified buyer to trigger review flow.
- **Request Body:**
  ```json
  {
    "buyerId": "60b8d8004f1a2c0015a99996"
  }
  ```
- **Response:**
  ```json
  { "success": true, "message": "Listing marked as sold" }
  ```

---

## 6. Chat APIs

### 6.1 Get Chat Rooms
- **Method:** `GET`
- **Path:** `/chat/rooms`
- **Auth Required:** Yes (Verified User)
- **Description:** Get all active chat sessions for the user.

### 6.2 Get Chat History
- **Method:** `GET`
- **Path:** `/chat/rooms/:roomId/messages`
- **Auth Required:** Yes (Verified User, Must be participant)
- **Description:** Get message history for a specific room.

*(Real-time messaging occurs over `wss://[host]/chat` namespace using JWT authentication on connection)*

---

## 7. Review APIs

### 7.1 Submit Review
- **Method:** `POST`
- **Path:** `/reviews`
- **Auth Required:** Yes (Verified User, Must be Buyer of Sold Listing)
- **Description:** Rate and review the seller.
- **Request Body:**
  ```json
  {
    "listingId": "60b8d34...",
    "rating": 5,
    "reviewText": "Great seller! Phone exactly as described."
  }
  ```
- **Response:**
  ```json
  { "success": true, "message": "Review submitted successfully" }
  ```

---

## 8. Report & Dispute APIs

### 8.1 Submit Report
- **Method:** `POST`
- **Path:** `/reports`
- **Auth Required:** Yes (Verified User)
- **Description:** Report a suspicious user or listing.
- **Request Body:**
  ```json
  {
    "targetType": "Listing",
    "targetId": "60b8d34...",
    "reason": "misrepresentation",
    "description": "Scratches not disclosed in photos."
  }
  ```
- **Response:**
  ```json
  { "success": true, "message": "Report submitted for review" }
  ```

---

## 9. Admin & Moderation APIs

### 9.1 Get Moderation Queue
- **Method:** `GET`
- **Path:** `/admin/moderation/listings`
- **Auth Required:** Yes (Admin/Moderator)
- **Description:** Fetch listings pending approval.

### 9.2 Moderate Listing
- **Method:** `PATCH`
- **Path:** `/admin/moderation/listings/:id`
- **Auth Required:** Yes (Admin/Moderator)
- **Description:** Approve or reject a listing.
- **Request Body:**
  ```json
  {
    "action": "approve" // or "reject",
    "reason": "Optional reason if rejected"
  }
  ```

### 9.3 Ban User
- **Method:** `POST`
- **Path:** `/admin/users/:id/ban`
- **Auth Required:** Yes (Admin)
- **Description:** Permanently ban a user, archive their listings, and blacklist their NID.
- **Request Body:**
  ```json
  {
    "reason": "Scam activity confirmed"
  }
  ```
