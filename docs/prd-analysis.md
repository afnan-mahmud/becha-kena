# Product Requirements Document (PRD) Analysis: Becha-Kena

**Prepared by:** Senior Product Analyst & Business Analyst  
**Date:** June 26, 2026  
**Project:** Becha-Kena (P2P Classified Marketplace with Mandatory NID Verification)  
**Status:** Under Review

---

## 1. Executive Summary & Product Overview

**Becha-Kena** (which translates to "Buying and Selling" in Bangla) is a peer-to-peer (C2C) classified marketplace application designed specifically for the Bangladeshi consumer market. The product addresses a major pain point in the local second-hand market: **widespread scams, fake listings, spam, and physical safety concerns.**

While incumbent platforms like *Bikroy.com* have established market dominance, they suffer from high volumes of fraudulent accounts, ghost listings, and safety issues due to anonymous registration. Becha-Kena's primary differentiator and core value proposition is **100% Identity Verification (NID + Live Selfie)**. By acting as a strict gatekeeper ("No NID = No Access"), the platform aims to build a high-trust community where users can buy and sell used personal goods with zero fear.

---

## 2. Product Goals & Objectives

### Business Goals
* **Establish Trust Supremacy:** Become the most trusted second-hand marketplace in Bangladesh within the first 6-12 months of launch.
* **User Growth & Retention:** Acquire high-intent, safety-conscious buyers and sellers who have previously abandoned anonymous platforms due to bad experiences.
* **Low Fraud Rate:** Target a near-zero scam/fraud rate on the platform.

### Product Metrics (KPIs)
* **Trust Score:** Percentage of transactions completed without report/dispute.
* **Verification Rate:** Conversion rate of signups to fully verified users.
* **Ad-to-Sale Conversion Time:** The average time an ad remains active before being marked as sold.
* **User Retention Rate:** Re-listing and re-buying frequency of verified users.

---

## 3. User Segmentation & Personas

### 1. Primary Buyer (Budget & Security-Conscious)
* **Demographics:** University students, young professionals, middle-class families in urban areas (Dhaka, Chittagong, Sylhet).
* **Behavior:** Actively searches for value-for-money deals on electronics (laptops, phones), cycles, and furniture.
* **Pain Points:** Fear of buying stolen items, fake products, or meeting a seller who turns out to be a mugger/scammer.
* **Needs:** Proof of seller identity, transparent product descriptions, and a safe channel to negotiate.

### 2. Primary Seller (Individual Household Seller)
* **Demographics:** Everyday citizens clearing out household items, upgrading personal electronics, or moving houses.
* **Behavior:** Prefers a simple upload process, quick buyers, and minimal spam calls.
* **Pain Points:** Inundated by fake offers, spammers, and harassment (especially female sellers receiving unsolicited calls/messages).
* **Needs:** Genuine, verified buyers who show real interest and respect transaction boundaries.

### 3. Safety-Conscious Users (Women & Students)
* **Demographics:** Female buyers/sellers, young student traders.
* **Behavior:** Highly cautious about sharing phone numbers publicly or meeting strangers in unfamiliar locations.
* **Needs:** Features that protect personal details (like hiding phone numbers), secure in-app communication, and safety guidelines for offline meetups.

### 4. System Administrator / Moderator (Missing in PRD but crucial)
* **Demographics:** Operations/Customer Support team.
* **Behavior:** Manages user reports, monitors suspicious activity, manually reviews failed automated verifications, and enforces bans.
* **Needs:** An administrative panel showing verification queues, reported ads, user flags, and ban controls.

---

## 4. Functional Requirements

### 4.1 Onboarding & Mandatory Verification (The Gatekeeper)
* **FR-1.1: Registration & Login:** Users register using a mobile number with OTP (One-Time Password) verification or secure social logins.
* **FR-1.2: NID OCR Processing:** Users must upload high-quality front and back photos of their Bangladeshi National ID. The system extracts Name, NID Number, and Date of Birth using OCR.
* **FR-1.3: Live Selfie Face-Matching:** The app prompts a live selfie capture (with liveness detection to prevent photo-of-photo spoofing) and compares the selfie with the photo extracted from the NID.
* **FR-1.4: Gatekeeper Block:** Users can browse listings anonymously, but **cannot** view seller contact info, send messages, post ads, or edit profiles until verification is successful.
* **FR-1.5: Verification Badge:** Once verified, profiles display a prominent, non-transferable "100% Verified Citizen" badge.

### 4.2 Ad Management System
* **FR-2.1: Ad Creation:** Verified sellers can post ads with:
  * Title, Category, Condition (used - like new, good, fair).
  * 1 to 5 images (compressed client-side before upload).
  * Description, Price (fixed or negotiable).
  * Location (Division > District > Thana/Area selection).
* **FR-2.2: Ad Dashboard:** Sellers can view active, pending, draft, and sold listings.
* **FR-2.3: Ad Modification:** Sellers can edit listing details or mark items as "Sold" or "Deleted."

### 4.3 Search, Filter & Discovery
* **FR-3.1: Full-Text Search:** Search listings by title, keywords, or tags.
* **FR-3.2: Tiered Filtering:** Filter listings by:
  * Category (Electronics, Vehicles, Home & Living, etc.).
  * Location (Standardized administrative hierarchy).
  * Price range.
  * Date listed.

### 4.4 Secure In-App Messaging
* **FR-4.1: Real-Time Chat:** Secure, text-based chat using WebSockets.
* **FR-4.2: System Notices in Chat:** Banner alerts in the chat box reminding users of safety guidelines (e.g., "Meet in a public place", "Do not pay advance money").
* **FR-4.3: User Block/Report:** Users can block or report a counterparty directly from the chat screen.

---

## 5. Non-Functional Requirements

### 5.1 Security & Data Privacy (Critical)
* **NFR-1.1: NID Data Security:** Since National ID numbers and photos are highly sensitive, all PII (Personally Identifiable Information) must be encrypted at rest (AES-256) and in transit (TLS 1.3).
* **NFR-1.2: Data Minimization:** To reduce liability, raw NID photos should be deleted or moved to secure, offline cold storage once verification is completed. Only the verification status, NID hash (to prevent re-use of same NID on multiple accounts), and verified name should be stored in the active database.
* **NFR-1.3: Secure APIs:** All API endpoints must require JWT-based authentication tokens.

### 5.2 Performance & Scalability
* **NFR-2.1: Image Optimization:** Automated image resizing and compression to WebP format to support users on slow mobile networks (2G/3G/4G).
* **NFR-2.2: Database Performance:** Latency of product search queries must be under 300ms.
* **NFR-2.3: Verification Speed:** Automated NID and selfie-matching response time should ideally be under 30 seconds.

### 5.3 Accessibility & Local Usability
* **NFR-3.1: Bilingual Support:** User Interface must support both Bangla and English.
* **NFR-3.2: Mobile-First Responsive Design:** The interface must be optimized for budget smartphones (low resolutions, varying screen sizes).

---

## 6. Gap Analysis & Missing Requirements (Critical Observations)

Through a thorough analysis of the PRD, the following critical gaps, operational risks, and missing features have been identified:

| # | Identified Gap / Missing Requirement | Risk/Impact | Recommended Solution |
|---|--------------------------------------|-------------|----------------------|
| **1** | **Monetization & NID Verification Costs** | Verification APIs (like *Porichoy*) charge per query. Free accounts + free ads will lead to high operational costs without revenue. | Implement premium features (e.g., "Bump Ad", "Top Ad") or charge a small nominal fee for ad listing after a certain limit. |
| **2** | **NID API Downtime & Manual Fallback** | Government NID servers experience frequent downtimes in Bangladesh. This will block user registration completely. | Implement a "Pending Manual Verification" queue where users can submit details and support staff can approve them within 12 hours. |
| **3** | **Phone Number Privacy & Harassment** | PRD states buyers can directly call sellers using the displayed phone number. Public phone numbers expose sellers (especially women) to off-platform spam/harassment. | Provide a setting: "Hide phone number and communicate via Chat only." Use virtual number masking if budget permits. |
| **4** | **Location Hierarchy Standardization** | The PRD mentions location filters but lacks details. Free-form text location fields lead to poor search/filter experiences. | Implement a rigid dropdown location system based on Bangladesh's official geography (Divisions > Districts > Upazilas/Thanas). |
| **5** | **User Rating & Review System** | Even verified citizens can be rude, late, or sell low-quality products. Trust badge alone doesn't guarantee a good trading experience. | Add a basic post-transaction rating and review system (1-5 stars with short feedback) to track user behavior over time. |
| **6** | **Dispute Resolution & Reporting** | If a verified user scams someone offline (e.g., sells a broken phone), there is no system workflow to handle reports or freeze/block accounts. | Build a reporting workflow: Users can report a verified profile with proof. Admins can review, temporarily freeze accounts, or permanently ban the NID hash. |
| **7** | **Ad Content Moderation Queue** | Verified users might list illegal, counterfeit, or inappropriate items. Auto-publishing all listings presents legal risks. | Implement automated keyword filtering (e.g., weapons, drugs, adult items) and a quick post-moderation review system. |
| **8** | **Legal Liability Disclaimer** | Since transactions are offline and peer-to-peer, the platform must protect itself from liability if transactions go wrong. | Standard Terms of Service and a mandatory popup warning during first transaction/listing acknowledging the platform is not liable. |

---

## 7. Open Questions & Alignment Needed

Before starting technical implementation, the business and product teams must align on the following:

1. **Which NID Verification API will be used?** 
   * *Options:* Porichoy API, directly integrating with Election Commission (EC), or using a third-party KYC vendor. What are the budget allocations per verification?
2. **What is the exact data retention policy for NIDs?**
   * Do we store NID card photos on our cloud servers? (High security risk, requires strict compliance). Or do we only store the hash of the NID number to prevent duplicate accounts?
3. **What is the flow for minors (under 18)?**
   * Citizens under 18 in Bangladesh might not have a smart NID card yet. Are they completely barred from using the platform, or can they verify using a parent's/guardian's NID?
4. **How do we handle location selection?**
   * Should we implement location detection using GPS coordinates (lat/long) or rely entirely on hierarchical dropdowns (Division -> District -> Thana)?
5. **Should we implement chat safety features?**
   * E.g., blocking sharing of external links, preventing specific keywords, or restricting phone number sharing in chats until verification is complete?
