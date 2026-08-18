# Requirement Validation Document: Becha-Kena
**Prepared by:** Senior Product Analyst & Business Analyst  
**Date:** June 26, 2026  
**Project:** Becha-Kena (P2P Classified Marketplace with Mandatory NID Verification)  
**Reference Document:** [prd.md](file:///c:/Users/afnan/Documents/becha-kena/prd.md)  
**Status:** Draft / Validation Review
---
## 1. Missing Flows
Through validation of the current [prd.md](file:///c:/Users/afnan/Documents/becha-kena/prd.md), the following functional workflows must be defined before architecture design:
* **MF-1: OTP Expiration & Resend Flow**
  * *Description:* When a user registers or logs in, they receive a mobile OTP.
  * *Specification:* The OTP must have an expiration window of 3 minutes. The user is limited to requesting a maximum of 3 OTPs within a 15-minute window to prevent SMS cost bloat and API abuse.
* **MF-2: Ad Expiration, Auto-Archive & Renewal Flow**
  * *Description:* Ads cannot remain active indefinitely.
  * *Specification:* Published ads will remain active for 30 days. On day 27, the seller receives a notification to renew. If not renewed by day 30, the ad is auto-archived (inactive status) and hidden from search, but remains in the seller's dashboard for up to 90 days before permanent deletion.
* **MF-3: Minor-to-Adult Account Transition Flow**
  * *Description:* Under-18 users who register using parental NID will eventually turn 18.
  * *Specification:* Upon reaching 18 years of age (checked against the date of birth associated with their registration record), the user is prompted to complete their own NID verification. Their access is restricted back to "Guest/Visitor" status if they do not complete their personal verification within 30 days of turning 18.
* **MF-4: Account Deletion & Data Retention Policy**
  * *Description:* Users requesting account deletion.
  * *Specification:* When a user deletes their account, their active listings and chats are immediately hidden. However, to prevent banned users from escaping penalties, the cryptographic **NID Hash** and history of bans are retained permanently in a blacklist table. Active/clean user PII (names, NID photos) is hard-deleted from cloud storage after 30 days of deletion.
---
## 2. Edge Cases
Handling unexpected or edge scenarios to prevent system abuse:
* **EC-1: Duplicate Parent NID Submissions**
  * *Scenario:* Multiple siblings under 18 attempting to use the same parent's NID.
  * *Rule:* A single parent NID hash can be linked to a maximum of **3 minor accounts** to prevent systemic abuse or commercial entities masquerading as minor accounts.
* **EC-2: Recycled Mobile SIM Cards (Account Takeover Protection)**
  * *Scenario:* Mobile phone operators in Bangladesh frequently recycle inactive SIM cards. A new owner registers with a number already associated with an old verified account.
  * *Rule:* If a new user registers a SIM card that already has an account, they must undergo NID verification. If the NID details of the new verification do not match the existing account's NID details, the system must trigger an account reset (archive old account data, detach the phone number, and assign it to the new user). This protects the PII of the previous owner.
* **EC-3: Ad Modifications During Pending Moderation**
  * *Scenario:* A seller edits their ad while it is still waiting in the moderation review queue.
  * *Rule:* Any significant modifications (title, images, price change > 20%) to a pending ad will push it back to the bottom of the moderation queue to prevent bypass of keyword/image moderation.
* **EC-4: Profile Name Mismatch with NID Verified Name**
  * *Scenario:* User enters their name as "Prince Afnan" but the NID name returned by the Porichoy API is "Afnan Rahman".
  * *Rule:* The user's public display profile name can be customized, but their profile detail page must prominently show their legally verified name as returned by the Porichoy API (e.g., "Legally Verified: Afnan Rahman").
---
## 3. Error Handling
Defining system behavior when APIs or uploads fail:
* **EH-1: Porichoy API Downtime & Timeouts**
  * *Handling:* If the Porichoy API is offline (5xx errors or timeouts > 10 seconds), the front-end must display a friendly notice: *"Government verification servers are currently experiencing heavy traffic. You can wait or upload your NID for Manual Verification (takes up to 12 hours)."*
  * *System Action:* Create a fallback entry in the Admin Manual Verification Queue.
* **EH-2: Selfie Liveness Detection Failures**
  * *Handling:* If the liveness check/face match fails due to poor lighting or camera angle:
    * Users are allowed 3 attempts in one session.
    * After 3 failures, automated verification is locked for 24 hours. The user is offered the option to submit the details to the Admin Manual Review Queue.
* **EH-3: Large Ad Image Upload Failures**
  * *Handling:* During low-bandwidth connections (common in remote parts of Bangladesh), upload retries must be handled.
  * *System Action:* Implement chunked uploads and client-side image compression (maximum 1.5MB per image in WebP format) before triggering the upload. Show progress indicators in the UI.
---
## 4. Security Requirements
Ensuring safety of data and communication:
* **SEC-1: Pre-Signed URLs for NID Photo Access**
  * *Rule:* Raw NID front/back images stored in the 3rd party cloud storage must **never** be publicly accessible. The admin panel must use pre-signed URLs with an expiration limit of **5 minutes** to retrieve these images for verification.
* **SEC-2: Salted Hashing for NID Numbers**
  * *Rule:* NID numbers must be hashed using a secure cryptographic hashing algorithm (like SHA-256 with a system-level static salt and a pepper) before saving. This prevents rainbow table lookups and ensures that a leaked database does not reveal the plain NID numbers of citizens.
* **SEC-3: WebSocket Communication Security**
  * *Rule:* All real-time chat connections must be secured via `wss://`. Every websocket connection request must include a valid JWT in the query parameters or initial handshake headers to prevent unauthorized interception of messages.
* **SEC-4: Rate Limiting on API Gateways**
  * *Rule:* Implement strict rate-limiting on sensitive endpoints:
    * `/api/v1/auth/request-otp`: Max 5 requests per IP/Device ID per hour.
    * `/api/v1/verify/nid`: Max 3 submissions per user per day (due to Porichoy transaction costs).
---
## 5. Input & Data Validation
Ensuring correct formats and preventing security attacks (SQLi/XSS):
* **VAL-1: Bangladeshi Mobile Number Format**
  * *Regex Rule:* Validate numbers matching the Bangladeshi format: `^(?:\+88|88)?(01[3-9]\d{8})$` (supports +8801X, 8801X, and 01X formats).
* **VAL-2: Ad Listing Limits**
  * *Title:* Minimum 10 characters, maximum 80 characters.
  * *Description:* Minimum 20 characters, maximum 1000 characters.
  * *Photos:* Must validate file signature (magic bytes) to ensure they are images (JPEG, PNG, WEBP), not disguised executable scripts.
* **VAL-3: Input Sanitization**
  * *Rule:* Strip HTML/JS tags from ad titles, descriptions, and user profile fields before storing them in the database to prevent cross-site scripting (XSS).
---
## 6. Permissions & Access Control Matrix
Defining who can do what on the platform:
| Role | Browse Listings | Search/Filter | View Contact Info | Chat | Post/Edit Ads | Review Reports | Manually Approve NIDs | System Settings |
|---|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| **Guest (Unverified)** | Yes | Yes | No | No | No | No | No | No |
| **Verified User (Adult/Minor)** | Yes | Yes | Yes | Yes | Yes (Within Limits) | No | No | No |
| **Moderator** | Yes | Yes | Yes | No | No | Yes | No | No |
| **System Admin** | Yes | Yes | Yes | Yes | Yes | Yes | Yes | Yes |
| **Banned User** | No | No | No | No | No | No | No | No |
*Note: Banned users are completely blocked from logging in or fetching any API endpoints except the "Banned Appeal" endpoint.*
---
## 7. Notification Events
System-generated communications to keep users informed:
* **NT-1: Verification Status Notification**
  * *Trigger:* NID review is completed (automatically or manually).
  * *Channel:* SMS (via local gateways like GP, Robi, Teletalk API) and in-app push notification.
  * *Content:* *"Congratulations! Your Becha-Kena account is now fully verified. You can now post ads and chat with buyers."* or *"Verification failed: [Rejection Reason]. Please re-verify or contact support."*
* **NT-2: Moderation Updates**
  * *Trigger:* Ad is approved or rejected by a moderator.
  * *Channel:* Push notification and in-app notification.
  * *Content:* *"Your ad '[Ad Title]' is now live!"* or *"Your ad '[Ad Title]' was rejected due to [Rejection Reason]. Please update and resubmit."*
* **NT-3: Offline Chat Notifications**
  * *Trigger:* User receives a chat message while websocket is disconnected.
  * *Channel:* Push notification (via Firebase Cloud Messaging).
  * *Content:* *"Afnan sent you a message: 'Is the price negotiable?'"*
---
## 8. Exception Handling
Scenarios where standard system rules must be overridden or handled under crisis:
* **EX-1: API Credit Exhaustion**
  * *Scenario:* The platform's prepaid credits with the Porichoy API are completely exhausted.
  * *Handling:* The system must immediately flag a warning to the admin dashboard, send an emergency email/SMS alert to the development team, and automatically fallback new verification requests to the **Admin Manual Review Queue** with a user message stating: *"Automatic verification is temporarily slow. Manual review is processing your application."*
* **EX-2: Blocked/Banned NID Re-registration Attempt**
  * *Scenario:* A seller who was banned for scamming changes their SIM card and tries to re-register with the same NID.
  * *Handling:* During NID processing, the system hashes the NID and checks it against the `banned_nid_hashes` table. If a match is found, registration is immediately halted, and a notification is shown: *"This identity has been suspended due to violations of our safety guidelines. If you believe this is an error, please file an appeal."*
* **EX-3: Inactive User Auto-Deactivation**
  * *Scenario:* User has not logged in for over 180 days.
  * *Handling:* Set user status to `inactive`. Their active ads are hidden. The user can reactivate the account instantly by requesting an OTP login, without needing to redo the NID verification.