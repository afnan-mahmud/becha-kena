# 📱 Becha-Kena Mobile App — Step-by-Step Development Prompts

> **Tech Stack:** Expo SDK 57 + React Native 0.86 + TypeScript + Expo Router (File-based routing)
> **Backend:** Express.js (already built) — Base URL: `/api/v1`
> **Setup Folder:** `mobilea-app/`
> **Follow this step-by-step prompt guide to build a production-ready mobile app from scratch (0 to production).**

---

## 🔖 Table of Contents

| Phase | Scope | Prompts |
|-------|--------|---------|
| **Phase 0** | Project Foundation & Architecture Setup | Prompt 1-3 |
| **Phase 1** | Authentication System (OTP Login) | Prompt 4-7 |
| **Phase 2** | KYC / NID Verification | Prompt 8-11 |
| **Phase 3** | Home Feed & Listing Browse | Prompt 12-15 |
| **Phase 4** | Search, Filter & Location | Prompt 16-18 |
| **Phase 5** | Ad Creation & Management | Prompt 19-23 |
| **Phase 6** | Listing Detail Page | Prompt 24-26 |
| **Phase 7** | Real-time Chat System | Prompt 27-31 |
| **Phase 8** | User Profile & Reviews | Prompt 32-35 |
| **Phase 9** | Notifications (Push + In-App) | Prompt 36-38 |
| **Phase 10** | Reports & Disputes | Prompt 39-40 |
| **Phase 11** | Settings & Account Management | Prompt 41-43 |
| **Phase 12** | Polish, Animations & UX | Prompt 44-46 |
| **Phase 13** | Testing & Bug Fixes | Prompt 47-49 |
| **Phase 14** | Production Build & Deployment | Prompt 50-52 |

---

## ⚙️ Phase 0: Project Foundation & Architecture Setup

### ✅ Prompt 1 — Project Cleanup & Folder Structure Setup

```
Set up a clean project structure in the `mobilea-app/` folder for our Becha-Kena mobile app. We have an existing Expo SDK 57 + React Native 0.86 + TypeScript + Expo Router project.

Remove the current default boilerplate files (explore.tsx, animated-icon, hint-row, etc.) and create the following production-grade folder structure:

```
src/
├── app/                    # Expo Router file-based routes
│   ├── _layout.tsx         # Root layout (auth check, providers wrap)
│   ├── index.tsx           # Entry redirect (auth check → login or home)
│   ├── (auth)/             # Auth group (unauthenticated)
│   │   ├── _layout.tsx
│   │   ├── welcome.tsx     # Welcome/Onboarding screen
│   │   ├── login.tsx       # Phone number input
│   │   └── verify-otp.tsx  # OTP verification
│   ├── (app)/              # Main app group (authenticated)
│   │   ├── _layout.tsx     # Tab navigation layout
│   │   ├── (tabs)/
│   │   │   ├── _layout.tsx # Bottom tab bar config
│   │   │   ├── home.tsx    # Home feed
│   │   │   ├── search.tsx  # Search & filter
│   │   │   ├── post.tsx    # Create ad
│   │   │   ├── chat.tsx    # Chat list
│   │   │   └── profile.tsx # User profile
│   │   ├── listing/
│   │   │   └── [id].tsx    # Listing detail page
│   │   ├── chat/
│   │   │   └── [roomId].tsx # Chat conversation
│   │   ├── user/
│   │   │   └── [id].tsx    # Public user profile
│   │   ├── kyc/
│   │   │   ├── index.tsx   # KYC landing
│   │   │   ├── adult.tsx   # Adult NID verification
│   │   │   └── minor.tsx   # Minor verification
│   │   └── settings/
│   │       ├── index.tsx   # Settings menu
│   │       ├── edit-profile.tsx
│   │       └── about.tsx
│   └── +not-found.tsx      # 404 handler
├── components/
│   ├── ui/                 # Reusable UI primitives
│   ├── auth/               # Auth-specific components
│   ├── listing/            # Listing cards, forms
│   ├── chat/               # Chat bubbles, input
│   ├── kyc/                # KYC flow components
│   └── common/             # Headers, loaders, empty states
├── services/
│   ├── api.ts              # Axios instance with interceptors
│   ├── auth.service.ts     # Auth API calls
│   ├── listing.service.ts  # Listing CRUD API calls
│   ├── chat.service.ts     # Chat REST API calls
│   ├── kyc.service.ts      # KYC/Verification API calls
│   ├── user.service.ts     # User/Profile API calls
│   ├── media.service.ts    # Pre-signed URL & upload
│   ├── review.service.ts   # Review API calls
│   └── report.service.ts   # Report API calls
├── store/                  # Zustand state management
│   ├── auth.store.ts
│   ├── listing.store.ts
│   ├── chat.store.ts
│   └── ui.store.ts
├── hooks/                  # Custom React hooks
│   ├── useAuth.ts
│   ├── useSocket.ts
│   ├── useLocation.ts
│   └── useImagePicker.ts
├── lib/
│   ├── socket.ts           # Socket.io client singleton
│   ├── storage.ts          # AsyncStorage/SecureStore helpers
│   └── validators.ts       # Phone, input validation utils
├── constants/
│   ├── theme.ts            # Colors, typography, spacing
│   ├── api.ts              # API base URL, endpoints map
│   └── categories.ts       # Listing categories list
├── types/
│   ├── user.types.ts
│   ├── listing.types.ts
│   ├── chat.types.ts
│   └── api.types.ts
└── assets/                 # (at root level — already exists)
```

Create all folders and keep placeholder index.ts files where needed. Clean up default boilerplate code while preserving the `_layout.tsx` root file, `tsconfig.json`, `app.json`, and `package.json`.
```

---

### ✅ Prompt 2 — Design System & Theme Configuration

```
Create a complete design system and theme configuration for the Becha-Kena mobile app in `src/constants/theme.ts`:

Requirements:
1. **Color Palette:**
   - Primary: Deep Blue (#1A73E8) — trust & security feel
   - Secondary: Emerald Green (#34A853) — verified/success states
   - Accent: Amber (#F9AB00) — warnings, highlights
   - Error: Red (#EA4335)
   - Background: Light (#F8F9FA), Dark (#121212)
   - Surface: White (#FFFFFF), Dark Surface (#1E1E1E)
   - Text: Primary (#1F1F1F), Secondary (#5F6368), Muted (#9AA0A6)
   - Verified Badge: Gold (#FFB300)
   - Chat bubbles: Sent (#DCF8C6), Received (#FFFFFF)

2. **Typography** (use expo-font to load Inter or Poppins):
   - heading1: 28px, Bold
   - heading2: 22px, SemiBold
   - heading3: 18px, SemiBold
   - body: 16px, Regular
   - bodySmall: 14px, Regular
   - caption: 12px, Regular
   - button: 16px, Medium

3. **Spacing scale:** 4, 8, 12, 16, 20, 24, 32, 40, 48, 64
4. **Border radius:** sm(8), md(12), lg(16), xl(24), full(9999)
5. **Shadows** (3 levels: light, medium, heavy)
6. **Dark mode support** — useColorScheme() hook integration

Export everything as named constants, keeping it compatible with `StyleSheet.create()`.
```

---

### ✅ Prompt 3 — API Client, Storage & Core Utilities

```
Create the core infrastructure layer for the Becha-Kena mobile app:

**1. API Client (`src/services/api.ts`):**
- Create an Axios instance with baseURL = environment variable (EXPO_PUBLIC_API_URL)
- Request interceptor: Attach Bearer token to Authorization header in every request (read from expo-secure-store)
- Response interceptor:
  - On 401 error → attempt refresh token → on failure: logout + redirect to login screen
  - On 429 error → show rate limit message
  - On 500/503 error → show generic error toast
- Standard response type: `{ success: boolean, message: string, data: T }`
- Standard error type: `{ success: false, error: string, code: string, details?: any[] }`

**2. Secure Storage (`src/lib/storage.ts`):**
- Use expo-secure-store for sensitive data (tokens)
- Use AsyncStorage for non-sensitive data (user preferences, onboarding status)
- Helper functions: saveToken(), getToken(), removeToken(), saveUser(), getUser()

**3. Validators (`src/lib/validators.ts`):**
- Bangladeshi phone number validation: regex `^(?:\+88|88)?(01[3-9]\d{8})$`
- Phone number normalize function: input → `+8801XXXXXXXXX` canonical format
- OTP validation: exactly 6 digits
- Listing title validation: 10-80 chars
- Listing description validation: 20-1000 chars
- Price validation: positive number

**4. API Endpoints Map (`src/constants/api.ts`):**
- Backend base URL config
- Map all endpoint paths:
  - AUTH: /auth/request-otp, /auth/verify-otp, /auth/logout
  - USER: /users/me (GET, PUT, DELETE)
  - KYC: /kyc/verify-adult, /kyc/verify-minor
  - MEDIA: /media/presigned-url
  - LISTINGS: /listings (GET, POST), /listings/:id, /listings/:id/sell
  - CHAT: /chat/rooms, /chat/rooms/:roomId/messages
  - REVIEWS: /reviews (POST)
  - REPORTS: /reports (POST)
  - ADMIN: /admin/moderation/listings, /admin/users/:id/ban

Install expo-secure-store and @react-native-async-storage/async-storage in package.json.
```

---

## 🔐 Phase 1: Authentication System (OTP Login)

### ✅ Prompt 4 — Auth State Management (Zustand Store)

```
Create the authentication state management for the Becha-Kena mobile app using Zustand (`src/store/auth.store.ts`):

**State:**
- user: User object | null (id, phoneNumber, displayName, verifiedName, isVerified, role, status, averageRating, totalReviews)
- token: string | null
- isAuthenticated: boolean
- isLoading: boolean
- isOnboarded: boolean (check if first-time user)

**Actions:**
- login(token, user) → Save token in SecureStore + update state
- logout() → SecureStore clear + state reset + router replace to /login
- setUser(user) → user info update
- checkAuth() → On app startup, read and validate token from SecureStore → if valid, call /users/me to fetch user data → if invalid, logout
- setOnboarded() → Save onboarding complete flag in AsyncStorage

**Persistence:**
- Token → expo-secure-store (encrypted)
- User data → Zustand persist middleware with AsyncStorage
- Call checkAuth() automatically on app startup

Install Zustand: `zustand`
```

---

### ✅ Prompt 5 — Welcome/Onboarding Screen

```
Create a beautiful Welcome/Onboarding screen for the Becha-Kena app (`src/app/(auth)/welcome.tsx`):

**Design:**
- 3-slide horizontal swipeable onboarding (smooth transitions using react-native-reanimated)
- Slide 1: "Becha-Kena" logo + tagline "Trusted People, Safe Trading" — image: trust/security icon
- Slide 2: "100% Verified Users" — NID verified badge illustration — "Every user is verified via National ID"
- Slide 3: "Safe Chat & Easy Deals" — chat illustration — "Direct communication, fraud-free trading"

**UI Elements:**
- Animated dot indicators (bottom)
- "Next" button — slides through
- "Get Started" button on last slide — navigates to login
- "Skip" option on top right

**Animations:**
- Parallax effect on illustrations
- Fade-in text animations
- Smooth page indicator transitions

**Logic:**
- First time user → show onboarding → save onboarded flag
- Returning user → skip directly to login/home

react-native-reanimated is already installed, use it for animations.
```

---

### ✅ Prompt 6 — Phone Login Screen (OTP Request)

```
Create the Phone Login screen for the Becha-Kena app (`src/app/(auth)/login.tsx`):

**Design:**
- Clean, minimal screen
- Top: Becha-Kena logo (small) + "Log In" heading
- Bangladesh flag icon (🇧🇩) + country code "+88" fixed prefix
- Large phone number input field (numeric keyboard)
- Placeholder: "01XXXXXXXXX"
- Real-time validation: Bangladeshi format check `^(?:\+88|88)?(01[3-9]\d{8})$`
- If invalid: Red border + error message "Please enter a valid mobile number"
- "Send OTP" primary button — full width
- Bottom: "By continuing, you agree to our Terms and Conditions" disclaimer

**API Integration:**
- Call POST `/api/v1/auth/request-otp` with `{ phoneNumber }` (normalized format)
- Loading state during API call (button disabled + spinner)
- Success → navigate to verify-otp screen, passing phoneNumber as route param
- Error handling:
  - 429 → "Too many requests. Please try again later."
  - 500 → "Server error occurred. Please try again."

**UX:**
- Auto-focus on phone input
- KeyboardAvoidingView implementation
- Haptic feedback on button press
```

---

### ✅ Prompt 7 — OTP Verification Screen

```
Create the OTP Verification screen for the Becha-Kena app (`src/app/(auth)/verify-otp.tsx`):

**Design:**
- Heading: "Verify OTP"
- Subtitle: "Enter the 6-digit code sent to +880-1XXX-XXXXXX" (phone number passed from previous screen)
- 6-digit OTP input — individual boxes (6 separate input fields, auto-focus next on type)
- Animated countdown timer: 3:00 → 0:00 (180 seconds)
- When timer expires → "Didn't receive code?" + "Resend OTP" button enabled
- "Verify" button — auto-submit when 6 digits are complete, or on button press

**API Integration:**
- POST `/api/v1/auth/verify-otp` with `{ phoneNumber, otpCode }`
- Success response → save token + user data in auth store
  - user.isVerified === true → redirect to `/(app)/(tabs)/home`
  - user.isVerified === false → redirect to `/(app)/kyc/` (KYC flow)
- Error:
  - INVALID_OTP → "Invalid code entered" shake animation + red highlight
  - TOKEN_EXPIRED → "Code expired. Please request a new one."

**Resend Logic:**
- Resend button press → POST `/api/v1/auth/request-otp` again
- Timer restart (180 seconds)
- Max resend tracking (frontend side — 3 resends per session)

**Animations:**
- OTP box scale animation on focus
- Shake animation on wrong OTP
- Smooth countdown timer
```

---

## 🪪 Phase 2: KYC / NID Identity Verification

### ✅ Prompt 8 — KYC Landing Page

```
Create the KYC Landing page for the Becha-Kena app (`src/app/(app)/kyc/index.tsx`):

**Purpose:** Guide unverified users through identity verification. Gatekeeper — without verification, users cannot post ads, chat, or view seller contact info.

**Design:**
- Hero section: Shield/verification icon + "Verify Your Identity"
- Subtitle: "Verify with NID to sell or communicate safely on Becha-Kena."
- Trust indicators: "🔒 100% Secure", "🕐 Takes 2 Minutes", "✅ Verify Once, Use Forever"

**Two options (cards):**
1. **"I am 18+ (Adult)"** — Adult verification
   - Icon: NID card illustration
   - Description: "Verify using your own National ID"
   - Button → navigate to `/kyc/adult`

2. **"I am under 18 (Minor)"** — Minor verification
   - Icon: Family/parent illustration
   - Description: "Verify using a parent/guardian's National ID"
   - Button → navigate to `/kyc/minor`

**Bottom note:** "Your data is protected with AES-256 encryption. We never store your raw NID number directly."

**Guard logic:**
- If an already verified user arrives here → redirect to home
- Check user.isVerified from auth store
```

---

### ✅ Prompt 9 — Adult NID Verification Screen

```
Create the Adult NID Verification screen for the Becha-Kena app (`src/app/(app)/kyc/adult.tsx`):

**Multi-step flow (3 steps):**

**Step 1 — NID Information:**
- NID number input (numeric, 10 or 17 digits)
- Date of birth picker (native date picker)
- "Next" button → validates and moves to step 2

**Step 2 — NID Photo Capture:**
- Camera permission request
- "Capture front side of NID" — camera viewfinder with frame overlay
- Capture → preview → "Retake" or "Next"
- "Capture back side of NID" — same flow
- Upload images to S3 using pre-signed URL flow:
  1. POST `/api/v1/media/presigned-url` → get uploadUrl + fileUrl
  2. PUT to uploadUrl with image binary
  3. Save fileUrl locally

**Step 3 — Live Selfie:**
- Front camera activate
- Face detection guide overlay (oval frame)
- "Position your face inside the frame" instruction
- Capture selfie
- Upload to S3 (same pre-signed URL flow)

**Submit:**
- POST `/api/v1/kyc/verify-adult` with `{ nidNumber, dob, selfieUrl }`
- Loading state with "Verifying..." message
- Response handling:
  - `status: "approved"` → Success screen → "🎉 You are verified!" → redirect home
  - `status: "pending_review"` → "Your submission is under review. You will be notified within 12 hours."
  - `status: "rejected"` → Error message with reason
  - 429 (KYC_LIMIT_REACHED) → "Daily limit of 3 attempts reached. Please try again tomorrow."

**Progress indicator:** Step 1/3, 2/3, 3/3 — animated progress bar on top

Install expo-camera and expo-image-picker.
```

---

### ✅ Prompt 10 — Minor Verification Screen

```
Create the Minor (Under 18) Verification screen for the Becha-Kena app (`src/app/(app)/kyc/minor.tsx`):

**Flow:**
- Step 1: Input parent/guardian's NID number + user's date of birth
- Step 2: Capture parent's NID photos (front + back) — S3 upload
- Step 3: Capture parent's live selfie — S3 upload
- Step 4: Parental consent checkbox:
  - "I confirm that my parent/guardian has consented to the use of this account" ✓
  - Submit button disabled until consent is checked

**Submit:**
- POST `/api/v1/kyc/verify-minor` with `{ parentNidNumber, dob, parentSelfieUrl, consentConfirmed: true }`
- Same success/pending/rejected handling as adult flow
- Extra error: "3 minor accounts already exist under this NID." (max 3 minor accounts per parent NID)

**UI similar to adult.tsx but with parent-focused instructions।**
```

---

### ✅ Prompt 11 — KYC Pending Status Component

```
Create a reusable component to display KYC pending/review status (`src/components/kyc/KYCStatusBanner.tsx`):

**Props:** status: 'unverified' | 'pending_review' | 'approved' | 'rejected'

**Render:**
- `unverified` → Yellow banner: "Your account is not verified. Verify now →" (tap → /kyc)
- `pending_review` → Blue banner: "Your verification is in progress. Results will be notified within 12 hours."
- `approved` → Green badge: "✅ Verified"
- `rejected` → Red banner: "Verification failed. Try again →" (tap → /kyc)

Reusable across Home screen, profile, listing detail screen, etc.
```

---

## 🏠 Phase 3: Home Feed & Listing Browse

### ✅ Prompt 12 — Bottom Tab Navigation Setup

```
Create the Bottom Tab Navigation for the Becha-Kena app (`src/app/(app)/(tabs)/_layout.tsx`):

**5 Tabs:**
1. 🏠 "Home" — home icon — `/home`
2. 🔍 "Search" — search icon — `/search`
3. ➕ "Post Ad" — plus circle icon (raised/floating center button) — `/post`
4. 💬 "Chat" — chat bubble icon — `/chat` — unread count badge
5. 👤 "Profile" — person icon — `/profile`

**Design:**
- Custom tab bar component (animated with react-native-reanimated)
- Center "Post Ad" button — raised circular primary color button, larger than others
- Active tab: Primary color + filled icon
- Inactive tab: Gray + outlined icon
- Tab bar background: White (light) / Dark surface (dark mode)
- Smooth icon transition animation on tab switch
- Chat tab: Unread message count badge (red dot with number)
- Handle SafeArea bottom padding properly

**Auth guard:**
- Unverified user pressing "Post Ad" tab → redirect to KYC screen with message
- Chat tab has the same guard
```

---

### ✅ Prompt 13 — Home Feed Screen

```
Create the Home Feed screen for the Becha-Kena app (`src/app/(app)/(tabs)/home.tsx`):

**Layout:**
- Top: App header bar
  - Left: "Becha-Kena" logo/text
  - Right: Notification bell icon (with badge count) + Location pin (current division)
- KYC Status Banner (if unverified)
- Categories horizontal scroll row:
  - Icons + labels: Mobile, Laptop, Electronics, Vehicles, Bikes, Furniture, Clothing, Books, Sports, Other
  - Tappable → filter listings by category
- Featured/Recent listings grid (2 columns)
- Pull-to-refresh
- Infinite scroll pagination

**API:**
- GET `/api/v1/listings?page=1&limit=20` — paginated
- Query params: category, lat, lng, radius (from user location)

**Listing Card Component (`src/components/listing/ListingCard.tsx`):**
- Image thumbnail (first image)
- Title (truncated)
- Price: "৳68,000" (Bangladeshi Taka format)
- Location: "Dhanmondi, Dhaka"
- Time ago: "2 hours ago"
- Verified seller badge (small green tick if seller is verified)
- Tap → navigate to `/listing/[id]`

**Empty state:** "No listings available in your area yet."
**Error state:** Retry button with error message
**Loading state:** Skeleton cards (shimmer effect)
```

---

### ✅ Prompt 14 — Listing Card Component (Reusable)

```
Create the reusable ListingCard component for the Becha-Kena app (`src/components/listing/ListingCard.tsx`):

**Props:**
- listing: Listing type object

**Design — Two variants:**
1. **Grid Card** (for home feed — 2 column grid):
   - 16:12 aspect ratio image
   - Price overlay on image (bottom left, semi-transparent bg)
   - Title below image (max 2 lines, ellipsis)
   - Location text (small, gray)
   - Seller verified badge
   - "condition" pill badge (Used / Like New / New)

2. **List Card** (for search results — full width row):
   - Left: Square thumbnail (80x80)
   - Right: Title, price, location, time, condition
   - Verified badge

**Animations:**
- Press-in scale animation (Pressable + Reanimated)
- Image lazy loading with placeholder shimmer
- Use expo-image (already installed) — with blurhash placeholder

**Price formatting:** Number → "৳" prefix + comma format (e.g., ৳1,20,000)
**Time formatting:** createdAt → relative time ("5 minutes ago", "2 days ago")
```

---

### ✅ Prompt 15 — Categories Data & Horizontal Scroll Component

```
Create the Categories system for the Becha-Kena app:

**1. Categories Data (`src/constants/categories.ts`):**
```typescript
export const CATEGORIES = [
  { id: 'mobile', label: 'Mobile', icon: '📱' },
  { id: 'laptop', label: 'Laptop', icon: '💻' },
  { id: 'electronics', label: 'Electronics', icon: '🔌' },
  { id: 'vehicles', label: 'Vehicles', icon: '🚗' },
  { id: 'bikes', label: 'Bikes', icon: '🏍️' },
  { id: 'furniture', label: 'Furniture', icon: '🪑' },
  { id: 'clothing', label: 'Clothing', icon: '👕' },
  { id: 'books', label: 'Books', icon: '📚' },
  { id: 'sports', label: 'Sports', icon: '⚽' },
  { id: 'property', label: 'Property', icon: '🏠' },
  { id: 'services', label: 'Services', icon: '🔧' },
  { id: 'other', label: 'Other', icon: '📦' },
];
```

**2. CategoryScroll Component (`src/components/common/CategoryScroll.tsx`):**
- Horizontal FlatList
- Circular icons with labels below
- Selected state: Primary color background, white icon
- Unselected: Light gray background
- "All" as first item — resets filter
- Animated selection indicator
- onSelect callback prop
```

---

## 🔍 Phase 4: Search, Filter & Location

### ✅ Prompt 16 — Search Screen

```
Create the Search screen for the Becha-Kena app (`src/app/(app)/(tabs)/search.tsx`):

**Layout:**
- Top: Search bar (auto-focus on tab open)
  - Search icon + text input + clear (X) button
  - Placeholder: "What are you looking for? e.g., iPhone 13..."
- Filter chips row (horizontal scroll below search):
  - Category filter chip (dropdown)
  - Price range chip ("Price: ৳0 - ৳∞")
  - Location chip ("All Locations")
  - Condition chip ("All Conditions")
  - Sort chip ("Newest First")
- Results: ListingCard list view (full width variant)
- Results count: "250 ads found"

**API:**
- GET `/api/v1/listings` with query params:
  - search (keyword)
  - category
  - minPrice, maxPrice
  - condition (used, like_new, new)
  - lat, lng, radius
  - sort (newest, price_low, price_high)
  - page, limit

**Filter Modal/Bottom Sheet:**
- Tap any filter chip → open bottom sheet with options
- Price range → dual slider (min-max)
- Category → selectable grid
- Location → Division > District > Thana hierarchy picker
- Condition → radio buttons
- "Apply Filters" button + "Reset" clear button

**Debounced search:** 500ms debounce on text input before API call
**Recent searches:** Save last 10 searches in AsyncStorage, show as suggestions
**Empty result:** "No ads found. Try searching with different keywords."
```

---

### ✅ Prompt 17 — Location Picker & Division-District-Thana Data

```
Create the Location system for the Becha-Kena app:

**1. Bangladesh Location Data (`src/constants/locations.ts`):**
- All 8 divisions: Dhaka, Chattogram, Rajshahi, Khulna, Barishal, Sylhet, Rangpur, Mymensingh
- Districts under each division (all 64)
- Major thanas/upazilas under each district
- Format: hierarchical object

**2. Location Picker Component (`src/components/common/LocationPicker.tsx`):**
- 3-step cascading picker:
  - Step 1: Select Division
  - Step 2: Select District — filtered by division
  - Step 3: Select Thana — filtered by district
- Each step as scrollable list inside bottom sheet
- Search filter within each step
- Selected value shown as breadcrumb: "Dhaka > Dhaka > Dhanmondi"
- onLocationSelect callback: returns { division, district, thana, coordinates }

**3. useLocation Hook (`src/hooks/useLocation.ts`):**
- Use expo-location
- Request location permission
- Get current GPS coordinates
- Reverse geocode → nearest division/district
- Fallback: manual picker if permission denied

Install expo-location.
```

---

### ✅ Prompt 18 — Filter Bottom Sheet Component

```
Create a reusable FilterBottomSheet component for the Becha-Kena app (`src/components/common/FilterBottomSheet.tsx`):

**Features:**
- React Native bottom sheet (react-native-gesture-handler + reanimated)
- Drag handle on top
- Snap points: 50%, 90%
- Backdrop overlay (tappable to dismiss)

**Filter Options Inside:**
1. **Price Range Slider:**
   - Dual-thumb slider (min-max)
   - Labels: "Min ৳{min}" — "Max ৳{max}"
   - Quick presets: "৳0 - 5,000", "৳5,000 - 20,000", "৳20,000 - 100,000", "৳100,000+"

2. **Condition Selector:**
   - Radio pills: "All", "New", "Like New", "Used"

3. **Sort By:**
   - Radio list: "Newest First", "Price: Low → High", "Price: High → Low", "Nearest First"

4. **Location:**
   - LocationPicker component embed

**Footer:**
- "Reset" — clears all filters
- "Apply Filters" (View Results) — applies and closes sheet

Install @gorhom/bottom-sheet.
```

---

## 📝 Phase 5: Ad Creation & Management

### ✅ Prompt 19 — Create Ad Screen (Part 1 — Form)

```
Create the Ad Creation form for the Becha-Kena app (`src/app/(app)/(tabs)/post.tsx`):

**Auth Guard:** If isVerified === false → redirect to /kyc with message "Please verify your identity before posting an ad"

**Multi-step form (4 steps):**

**Step 1 — Basic Info:**
- Title input: "Ad Title" (10-80 chars, live character counter)
- Description textarea: "Detailed Description" (20-1000 chars, live character counter)
- Category picker: CategoryScroll component or bottom sheet select
- Condition selector: Radio pills — "New" / "Like New" / "Used"
- Price input: "Price (৳)" — numeric keyboard
- "Next" button

**Step 2 — Add Photos:**
- Image grid (max 10 images)
- "+" add button opens:
  - "Take Photo" option (Camera)
  - "Choose from Gallery" option (Image Library)
- Image preview with "X" remove button
- Client-side compression to max 1.5MB WebP (expo-image-manipulator)
- Upload each image to S3 via pre-signed URL flow
- Progress bar per image during upload
- First image = cover photo indicator
- "Next" button (min 1 photo required)

**Step 3 — Location:**
- LocationPicker component (Division > District > Thana)
- Or "Use Current Location" button (GPS)
- Selected location preview: "Dhanmondi, Dhaka, Dhaka"
- "Next" button

**Step 4 — Settings & Publish:**
- Toggle: "Show phone number" (hidePhoneNumber: false by default)
- Summary preview card — shows how the ad will look
- "Publish Ad" submit button

**Progress bar on top:** Step 1/4, 2/4, 3/4, 4/4

Install expo-image-manipulator.
```

---

### ✅ Prompt 20 — Image Upload Service

```
Create the image upload service for the Becha-Kena app (`src/services/media.service.ts`):

**Functions:**

1. `getPresignedUrl(fileName: string, fileType: string)`:
   - POST `/api/v1/media/presigned-url` → returns { uploadUrl, fileUrl }

2. `uploadImageToS3(localUri: string, uploadUrl: string)`:
   - Read file from local URI
   - PUT request to S3 uploadUrl with binary data
   - Content-Type: image/webp
   - Return success/failure

3. `compressImage(uri: string)`:
   - Use expo-image-manipulator
   - Resize to max 1200px width
   - Compress quality 0.8
   - Convert to WebP format
   - Return compressed URI

4. `uploadListingImages(localUris: string[])`:
   - Parallel upload (Promise.all)
   - Each image: compress → getPresignedUrl → uploadToS3
   - Return array of final fileUrls
   - Progress callback (completed/total)

5. `uploadSelfie(uri: string)`:
   - Same flow but for KYC selfie (single image)
   - No WebP conversion (keep JPEG for face matching accuracy)

**Error handling:**
- Network failure → retry 3 times with exponential backoff
- S3 upload failure → user-friendly error message
```

---

### ✅ Prompt 21 — Create Ad API Integration

```
Create the Ad creation API integration and listing service for the Becha-Kena app (`src/services/listing.service.ts`):

**Functions:**

1. `createListing(data)`:
   - POST `/api/v1/listings`
   - Body: { title, description, price, category, condition, images[], hidePhoneNumber, location: { coordinates, division, district, thana } }
   - Returns: created listing ID

2. `getListings(params)`:
   - GET `/api/v1/listings`
   - Query params: page, limit, category, search, minPrice, maxPrice, lat, lng, radius, sort
   - Returns: paginated listings array

3. `getListingById(id)`:
   - GET `/api/v1/listings/:id`
   - Returns: full listing object with seller info

4. `updateListing(id, data)`:
   - PUT `/api/v1/listings/:id`
   - Partial update

5. `markAsSold(id, buyerId)`:
   - PATCH `/api/v1/listings/:id/sell`
   - Body: { buyerId }

6. `deleteListing(id)`:
   - DELETE `/api/v1/listings/:id`

7. `getMyListings()`:
   - GET `/api/v1/listings?sellerId=me` or dedicated endpoint
   - Returns: current user's listings

**Listing Store (`src/store/listing.store.ts`):**
- State: listings[], myListings[], currentListing, isLoading, pagination info
- Actions: fetchListings, fetchMore, fetchMyListings, setCurrentListing
- Do not persist Zustand state (always keep fresh from API)
```

---

### ✅ Prompt 22 — My Listings (Seller Dashboard)

```
Create the "My Listings" section in the Profile screen (Seller Dashboard):

**Location:** Part of profile tab, or separate screen accessible from profile

**Design:**
- Tab switch: "Active" | "Pending Review" | "Sold" | "Archived"
- Each tab shows filtered list of user's own ads

**Listing management actions (swipe or long-press menu):**
- "Edit" → navigate to edit form (pre-filled)
- "Mark as Sold" → shows buyer picker from chat history
- "Delete" → confirmation dialog → DELETE API call
- "Renew" → extends expiry by 30 days (for archived/expiring listings)

**Status badges on each card:**
- 🟢 Active / 🟡 Pending Moderation / 🔴 Rejected / 🔵 Sold / ⚫ Archived

**Mark as Sold Flow:**
- Tap "Mark as Sold" → Bottom sheet shows list of buyers who chatted about this listing
- Select buyer → PATCH `/api/v1/listings/:id/sell` with buyerId
- Success → card status changes to "Sold"

**Empty state per tab:** "No listings in this category."
```

---

### ✅ Prompt 23 — Ad Success & Pending Moderation Screen

```
Create screens/components to display after an ad is successfully submitted:

**1. Ad Submitted Success (`src/components/listing/AdSubmitSuccess.tsx`):**
- Animated checkmark (Lottie or Reanimated)
- "Your Ad Has Been Submitted! 🎉"
- "Our team is reviewing your ad. Once approved, your ad will be visible to everyone."
- "Go to Home" button
- "Post Another Ad" button

**2. Moderation Pending Card (`src/components/listing/ModerationBadge.tsx`):**
- Small inline badge component
- Yellow/amber: "Under Review"
- Green: "Approved"
- Red: "Rejected — Reason: [reason]"
```

---

## 📄 Phase 6: Listing Detail Page

### ✅ Prompt 24 — Listing Detail Screen

```
Create the Listing Detail page for the Becha-Kena app (`src/app/(app)/listing/[id].tsx`):

**Layout (scrollable):**

**1. Image Carousel (top):**
- Full-width image slider (horizontal paging)
- Dot indicators below
- Pinch-to-zoom support
- Image counter: "2/5"
- Share button (top right)
- Back button (top left, overlay)

**2. Price & Title:**
- Price: "৳68,000" — large, bold, primary color
- Title: "iPhone 13 Pro — Mint Condition"
- Posted time: "3 days ago"
- Condition badge: "Used"
- Category pill: "Mobile"

**3. Seller Info Card:**
- Seller avatar (or initial)
- Display name + "✅ Verified" badge (if verified)
- Verified legal name: "Legally verified: AFNAN RAHMAN"
- Rating: ⭐ 4.8 (12 reviews)
- "View Profile" link → /user/[sellerId]
- Member since: "Member since: June 2025"

**4. Description:**
- Full description text (expandable "Show more" if >200 chars)

**5. Location:**
- Map preview (static map image or small MapView)
- "Dhanmondi, Dhaka, Dhaka Division"
- Note: exact pin not shown for safety, approximate area only

**6. Safety Tips Banner:**
- "⚠️ Safety Tips: Always meet in a public place. Never send advance payment."

**Bottom Fixed Bar (CTA):**
- Left: "📞 Call" button (if hidePhoneNumber === false, verified user only)
- Right: "💬 Chat" button (verified user only)
- Unverified → both buttons → redirect to /kyc with message

**API:** GET `/api/v1/listings/:id`
**Share:** expo-sharing or Share API → deep link to listing
```

---

### ✅ Prompt 25 — Image Carousel Component

```
Create a reusable ImageCarousel component for the Becha-Kena app (`src/components/ui/ImageCarousel.tsx`):

**Props:**
- images: string[] (URLs)
- height: number (default 300)
- showCounter: boolean
- onImagePress: (index) => void (for full-screen view)

**Features:**
- Horizontal paging FlatList
- Animated dot indicators (Reanimated)
- Counter text: "1/5" (top right overlay)
- Tap → full-screen image viewer modal
- Pinch-to-zoom in full-screen mode
- Smooth spring animation on page change
- Placeholder/shimmer while loading
- expo-image for optimized loading + caching

**Full-screen Modal:**
- Dark background
- Close (X) button (top left)
- Swipe down to dismiss
- Swipe left/right to navigate
- Double tap to zoom
```

---

### ✅ Prompt 26 — Public User Profile Screen

```
Create the Public User Profile screen for the Becha-Kena app (`src/app/(app)/user/[id].tsx`):

**Layout:**
- User avatar (large) + display name
- "✅ 100% Verified Citizen" badge (if verified)
- Verified legal name: "Legally verified: [verifiedName]"
- Rating display: ⭐ 4.8/5.0 (12 reviews)
- Member since date
- "🚩 Report User" button (top right)

**Tabs:**
1. "Listings" — grid of user's active listings
2. "Reviews" — list of reviews received

**Reviews list:**
- Reviewer name + avatar
- Star rating (filled/unfilled stars)
- Review text
- Listing reference: "Item: iPhone 13 Pro"
- Date

**API:**
- GET `/api/v1/users/:id` — user profile
- GET `/api/v1/listings?sellerId=:id` — user's listings
- GET `/api/v1/reviews?revieweeId=:id` — user's reviews
```

---

## 💬 Phase 7: Real-time Chat System

### ✅ Prompt 27 — Socket.io Client Setup

```
Create the Socket.io client singleton for the Becha-Kena app (`src/lib/socket.ts`):

**Setup:**
- Install socket.io-client
- Connect to `/chat` namespace
- Auth: Pass JWT token in connection handshake (auth: { token })
- Reconnection strategy: auto-reconnect with exponential backoff
- Handle connection events:
  - `connect` → log + update connection status
  - `disconnect` → log + show "Reconnecting..." indicator
  - `connect_error` → error handling (auth failure → logout)

**Events (emit/listen):**
- `join_room` → join room (roomId)
- `leave_room` → leave room
- `send_message` → send message { roomId, messageText }
- `new_message` → receive incoming message
- `typing` → typing indicator
- `message_read` → read receipt
- `user_online` → online status

**Singleton pattern:**
- Single instance throughout app
- Connect on auth success
- Disconnect on logout
- Expose: connect(), disconnect(), getSocket()

Install socket.io-client.
```

---

### ✅ Prompt 28 — Chat Store (Zustand)

```
Create the Chat state management for the Becha-Kena app using Zustand (`src/store/chat.store.ts`):

**State:**
- rooms: ChatRoom[] (sorted by last message time)
- currentRoomId: string | null
- messages: Map<roomId, Message[]>
- unreadCounts: Map<roomId, number>
- totalUnread: number
- typingUsers: Map<roomId, userId[]>
- isConnected: boolean

**ChatRoom type:**
- id, listingId, buyerId, sellerId
- listing: { title, image, price } (populated)
- otherUser: { id, displayName, isVerified } (populated)
- lastMessage: { text, senderId, createdAt }
- unreadCount: number

**Message type:**
- id, roomId, senderId, messageText, readStatus, createdAt

**Actions:**
- fetchRooms() → GET /chat/rooms
- fetchMessages(roomId) → GET /chat/rooms/:roomId/messages (paginated)
- addMessage(roomId, message) → append to messages map
- markAsRead(roomId) → update readStatus
- setTyping(roomId, userId, isTyping)
- incrementUnread(roomId)
- resetUnread(roomId)
- updateConnectionStatus(status)

**Socket listeners setup function:**
- setupSocketListeners() → listen to socket events and update store
```

---

### ✅ Prompt 29 — Chat List Screen

```
Create the Chat List screen for the Becha-Kena app (`src/app/(app)/(tabs)/chat.tsx`):

**Auth Guard:** Unverified → redirect to /kyc

**Layout:**
- Header: "Chats" + online status indicator (green dot if connected)
- Search bar: "Search chats..."
- Chat rooms list (FlatList)

**Chat Room Item:**
- Left: Other user avatar
- Center:
  - User name + verified badge (✅)
  - Listing title (small, gray): "Item: iPhone 13 Pro"
  - Last message preview (truncated, 1 line)
  - Typing indicator: "Typing..." (animated dots)
- Right:
  - Time: "2:30 PM", "Yesterday", or "Oct 12"
  - Unread badge (red circle with count)

**Features:**
- Pull-to-refresh
- Real-time updates via socket (new message → move room to top)
- Swipe to delete/archive (optional)
- Empty state: "No chats yet. When you contact a seller or buyer, chats will appear here."

**Sort:** Most recent message first

**API:** GET `/api/v1/chat/rooms`
**Socket:** Listen for `new_message` to update last message + unread count
```

---

### ✅ Prompt 30 — Chat Conversation Screen

```
Create the Chat Conversation screen for the Becha-Kena app (`src/app/(app)/chat/[roomId].tsx`):

**Header:**
- Back button
- Other user name + verified badge + online/offline indicator
- Listing info: thumbnail + title + price (tappable → listing detail)

**Safety Banner (fixed, below header):**
- "⚠️ Safety: Meet in a public place. Never send advance money."
- Dismissible (X button)

**Message List:**
- Chat bubbles (FlatList, inverted)
- Sent messages: Right aligned, green-ish bubble (#DCF8C6)
- Received messages: Left aligned, white/gray bubble
- Each bubble: message text + time (small, bottom right)
- Read receipts: ✓ (sent) / ✓✓ (read) — blue double tick
- Date separators: "Today", "Yesterday", "Oct 12, 2026"
- Typing indicator: animated 3 dots in bubble when other user is typing

**Message Input Bar (bottom):**
- Text input (multiline, max 500 chars)
- Send button (arrow icon, primary color) — disabled when empty
- Send on button press or Enter key

**Socket Integration:**
- On screen mount: socket.emit('join_room', { roomId })
- On message send: socket.emit('send_message', { roomId, messageText })
- Listen 'new_message' → add to messages + scroll to bottom
- Listen 'typing' → show/hide typing indicator
- Emit 'typing' on user input (debounced)
- On screen unmount: socket.emit('leave_room', { roomId })

**Safety Filters (frontend validation before send):**
- External link detection → show warning: "External links are not allowed."
- Phone number pattern detection → mask or warn

**Load more:** Scroll to top → load older messages (paginated)

**KeyboardAvoidingView:** Proper keyboard handling for iOS/Android
```

---

### ✅ Prompt 31 — Chat Bubble & Input Components

```
Create the Chat UI components for the Becha-Kena app:

**1. ChatBubble (`src/components/chat/ChatBubble.tsx`):**
- Props: message, isMine, showAvatar
- Mine: right aligned, green bg, white text
- Theirs: left aligned, white bg, dark text
- Time text: bottom right corner (small, gray)
- Read status: ✓/✓✓ icon (mine only)
- Subtle shadow
- Rounded corners (more rounded on one side based on sender)
- Animated appearance (slide-in from bottom)

**2. ChatInput (`src/components/chat/ChatInput.tsx`):**
- Props: onSend, disabled
- TextInput (flex, multiline, max 4 lines auto-expand)
- Send button (animated scale on press)
- Placeholder: "Type your message..."
- Character limit indicator (near limit → orange/red)

**3. TypingIndicator (`src/components/chat/TypingIndicator.tsx`):**
- 3 animated dots (bouncing/pulsing)
- Appears inside a chat bubble (left side)
- "Typing..." text

**4. DateSeparator (`src/components/chat/DateSeparator.tsx`):**
- Centered date text with lines on both sides
- "Today", "Yesterday", or formatted date

**5. ListingHeader (`src/components/chat/ListingHeader.tsx`):**
- Mini card: listing image + title + price
- Tappable → navigate to listing detail
- "Discussing this listing"
```

---

## 👤 Phase 8: User Profile & Reviews

### ✅ Prompt 32 — Profile Tab Screen

```
Create the Profile tab screen for the Becha-Kena app (`src/app/(app)/(tabs)/profile.tsx`):

**Layout:**
- **Profile Header:**
  - Large avatar (with edit icon overlay)
  - Display name (editable)
  - Verified badge (✅ Verified) or KYC banner
  - Verified legal name (if verified): "Verified: AFNAN RAHMAN"
  - Rating: ⭐ 4.8 (12 reviews)
  - Phone number (partially masked: +880 17XX-XXXX78)

- **Stats Row:**
  - Active ads count | Sold count | Reviews count

- **Menu Items (scrollable list):**
  1. 📋 "My Listings" → My listings screen
  2. ⭐ "My Reviews" → Reviews received
  3. 🔔 "Notifications" → Notification settings
  4. 📍 "My Location" → Location preference
  5. ⚙️ "Settings" → Settings screen
  6. ℹ️ "About" → About Becha-Kena
  7. 🚪 "Log Out" → Confirmation → logout

- **Logout confirmation dialog:** "Are you sure you want to log out?"

**API:** GET `/api/v1/users/me`
```

---

### ✅ Prompt 33 — Edit Profile Screen

```
Create the Edit Profile screen for the Becha-Kena app (`src/app/(app)/settings/edit-profile.tsx`):

**Fields:**
- Avatar/Profile photo change (camera/gallery picker → S3 upload)
- Display Name input (1-30 chars): "Display Name"
  - Note: "This is your nickname. Your verified legal name cannot be changed."
- Phone number (read-only, displayed)
- Verified name (read-only, if verified)

**Save:**
- PUT `/api/v1/users/me` with { displayName, fcmToken }
- Success toast: "Profile updated successfully"
- Navigate back

**Validation:**
- Display name: 1-30 chars, no HTML tags (XSS prevention)
```

---

### ✅ Prompt 34 — Review Submission Flow

```
Create the Review submission flow for the Becha-Kena app:

**Trigger:** When seller marks a listing as "Sold" and selects a buyer → buyer receives notification → buyer can submit a review

**Review Screen/Modal (`src/components/listing/ReviewModal.tsx`):**
- Listing reference: title + image thumbnail
- Seller name
- Star rating selector (1-5): Interactive tappable stars (animated fill)
- Review text input (max 500 chars)
- "Submit Review" button

**API:**
- POST `/api/v1/reviews` with { listingId, rating, reviewText }
- Success → "Thank you! Your review has been submitted. ✅"
- Error → "Could not submit review: [reason]"

**Rules enforced (backend validated, but also show frontend messages):**
- Chat history must exist
- Listing must be marked as sold to this buyer
- One review per listing (duplicate check)

**Star Rating Component (`src/components/ui/StarRating.tsx`):**
- Props: value, onChange (interactive), size, readOnly
- Animated fill on tap (Reanimated spring)
- Half-star not supported (whole numbers 1-5)
```

---

### ✅ Prompt 35 — Reviews List Component

```
Create the Reviews list display component (`src/components/listing/ReviewsList.tsx`):

**Props:**
- userId: string (whose reviews to show)
- limit: number (optional, for preview mode)

**API:** GET reviews for user

**Review Item:**
- Reviewer avatar + display name + verified badge
- Star rating (visual stars)
- Review text
- Listing reference: "Item: [listing title]"
- Date: "October 12, 2026"

**Features:**
- Pagination (load more button or infinite scroll)
- Average rating summary at top: ⭐ 4.8/5.0 from 12 reviews
- Rating distribution bar chart (optional):
  - 5⭐: ████████ 8
  - 4⭐: ████ 3
  - 3⭐: █ 1
  - 2⭐: 0
  - 1⭐: 0

**Empty state:** "No reviews yet."
```

---

## 🔔 Phase 9: Notifications (Push + In-App)

### ✅ Prompt 36 — Push Notification Setup (FCM)

```
Set up Firebase Cloud Messaging (FCM) push notifications in the Becha-Kena app:

**1. Expo Notifications setup:**
- Install and configure expo-notifications
- Add notification configuration in app.json (Android channel, iOS permissions)

**2. Notification Permission & Token (`src/hooks/useNotification.ts`):**
- Request notification permissions on app startup
- Permission granted → Generate FCM token
- Token → Save to backend via PUT `/api/v1/users/me` with { fcmToken: token }
- Token refresh listener — new token → update API

**3. Notification Handlers:**
- Foreground: In-app banner/toast (custom component)
- Background: System notification tray
- Tap on notification → deep link:
  - Chat message notification → navigate to `/chat/[roomId]`
  - KYC update → navigate to profile
  - Ad moderation update → navigate to my listings
  - Ad expiry warning → navigate to my listings

**4. Notification Types (NT-1, NT-2, NT-3 from PRD):**
- NT-1: Verification status ("Your account has been verified!")
- NT-2: Ad moderation ("Your ad has been approved!")
- NT-3: Chat message ("Afnan sent a message: 'Is the price negotiable?'")

Install expo-notifications.
```

---

### ✅ Prompt 37 — In-App Notification Banner

```
Create an in-app notification banner component (`src/components/common/NotificationBanner.tsx`):

**Design:**
- Top-of-screen slide-down banner (animated with Reanimated)
- Auto-dismiss after 4 seconds
- Swipe-up to dismiss early
- Tap → navigate to relevant screen

**Variants:**
- Chat message: Avatar + name + message preview
- Success: Green bg — "✅ Your ad has been approved!"
- Warning: Amber bg — "⚠️ Your ad expires in 3 days"
- Error: Red bg — "❌ Verification failed"

**Integration:**
- Notification queue in Zustand UI store
- Mount NotificationBanner in root layout
- showNotification(type, title, body, onPress) action
```

---

### ✅ Prompt 38 — Notification Preferences Screen

```
Create the Notification settings screen (inside settings section):

**Toggles:**
- 💬 "Chat Messages" — Chat message notifications (on/off)
- 📢 "Ad Updates" — Ad moderation/expiry updates (on/off)
- 🔔 "Verification Updates" — KYC status updates (on/off)
- 🔕 "Mute All" — Mute all notifications (override)

**Time-based quiet hours:**
- "Quiet Hours" toggle
- Start time picker: default 11:00 PM
- End time picker: default 7:00 AM

**Store locally in AsyncStorage** (backend doesn't need these prefs, notifications are filtered client-side)
```

---

## 🚩 Phase 10: Reports & Disputes

### ✅ Prompt 39 — Report User/Listing Flow

```
Create the Report flow for the Becha-Kena app:

**Report Button Locations:**
- Listing detail page → "🚩 Report Ad" button
- User profile page → "🚩 Report User" button

**Report Modal (`src/components/common/ReportModal.tsx`):**
- Props: targetType ('Listing' | 'User'), targetId

**Steps:**
1. **Reason selection (radio list):**
   - "Scam / Fraud attempt" (scam)
   - "Harassment / Abusive behavior" (harassment)
   - "Misleading price or description" (misrepresentation)
   - "Inappropriate content" (inappropriate)
   - "Other" (other)

2. **Description input:**
   - "Provide detailed description (optional)" — textarea (max 1000 chars)

3. **Submit:**
   - POST `/api/v1/reports` with { targetType, targetId, reason, description }
   - Success: "Your report has been submitted. We will review and take necessary action."
   - Close modal

**Confirmation before submit:** "Are you sure? False reports may negatively impact your account standing."
```

---

### ✅ Prompt 40 — Report Confirmation & Status

```
Confirmation and tracking UI after submitting a report:

**Report Success Card:**
- "✅ Report Submitted"
- Report ID display
- "Our team will review this within 24 hours."
- "OK" dismiss button

**My Reports (optional, in settings):**
- List of submitted reports
- Status: "Under Review" / "Resolved" / "Dismissed"
```

---

## ⚙️ Phase 11: Settings & Account Management

### ✅ Prompt 41 — Settings Screen

```
Create the Settings screen for the Becha-Kena app (`src/app/(app)/settings/index.tsx`):

**Menu Items:**
1. 👤 "Edit Profile" → /settings/edit-profile
2. 🔔 "Notification Settings" → notification prefs
3. 📍 "Location Preference" → default location set
4. 🌙 "Dark Mode" → toggle switch (system/light/dark)
5. 🌐 "Language" → Bengali / English toggle (future)
6. 📜 "Terms of Service" → WebView or in-app text
7. 🔒 "Privacy Policy" → WebView
8. ℹ️ "About Becha-Kena" → /settings/about
9. 🗑️ "Delete Account" → Confirmation flow
10. 🚪 "Log Out"

**Design:**
- Grouped sections with headers
- Right arrows (chevron) for navigation items
- Toggle switches for on/off settings
- Destructive actions (delete, logout) in red
```

---

### ✅ Prompt 42 — Account Deletion Flow

```
Create the Account deletion flow:

**Step 1 — Warning Dialog:**
- "Are you sure you want to delete your account?"
- Consequences list:
  - "All your listings will be permanently hidden"
  - "Your chat history will be deleted"
  - "Your personal information will be permanently deleted after 30 days"
  - "This action cannot be undone"

**Step 2 — Confirmation:**
- "Type 'DELETE' to confirm" — text input match
- "Delete Account" red button (enabled only when text matches)

**API:** DELETE `/api/v1/users/me`
**After success:**
- Clear all local data (SecureStore, AsyncStorage)
- Navigate to welcome screen
- Toast: "Your account deletion request has been submitted."
```

---

### ✅ Prompt 43 — About Screen & Terms

```
Create the About screen (`src/app/(app)/settings/about.tsx`):

**Content:**
- Becha-Kena logo
- App version: "v1.0.0"
- "The Safest Second-Hand Marketplace in Bangladesh"
- "100% NID Verified Users — Safe, Fraud-Free Trading"

**Links:**
- Terms of Service (WebView or in-app)
- Privacy Policy (WebView)
- Contact/Support email
- Social media links

**Disclaimer popup (shown once on first app open after login):**
- "All transactions are completed offline and at user's own discretion. Becha-Kena provides no financial transaction guarantee."
- "Understood" accept button
```

---

## ✨ Phase 12: Polish, Animations & UX

### ✅ Prompt 44 — Loading States & Skeletons

```
Create all loading states and skeleton components across the app:

**1. SkeletonCard (`src/components/ui/SkeletonCard.tsx`):**
- Shimmer skeleton for listing cards
- Animated gradient sweep effect (Reanimated)
- Grid variant + List variant

**2. SkeletonProfile (`src/components/ui/SkeletonProfile.tsx`):**
- Profile page shimmer

**3. FullScreenLoader (`src/components/ui/FullScreenLoader.tsx`):**
- Centered spinner + "Loading..." text
- Semi-transparent overlay variant

**4. ButtonLoader:**
- Inline spinner inside buttons during API calls
- Button disabled state

**5. Pull-to-Refresh:**
- Custom RefreshControl with Becha-Kena branding

**6. Empty States (`src/components/ui/EmptyState.tsx`):**
- Illustration + title + subtitle + action button
- Variants: no listings, no chats, no reviews, no search results, error/retry
```

---

### ✅ Prompt 45 — Micro-Animations & Transitions

```
Add micro-animations across the app for a premium feel:

**1. Screen Transitions:**
- Stack screens: slide from right (default)
- Modal screens: slide from bottom
- Tab switch: crossfade

**2. List Animations:**
- Listing cards: staggered fade-in on first load
- Chat messages: slide-in from bottom
- Reviews: fade-in

**3. Button Interactions:**
- Scale down on press (0.96) + haptic feedback
- Loading spinner transition (text → spinner)

**4. Tab Bar:**
- Active icon: bounce/scale animation
- Badge count: bounce on update

**5. Toast/Notification:**
- Slide down from top + fade in
- Auto-dismiss with slide up

**6. Star Rating:**
- Stars fill with spring animation
- Color transition: gray → gold

**7. OTP Input:**
- Box scale on focus
- Shake on wrong code
- Success: all boxes turn green

**8. Heart/Save Animation (future):**
- Scale + burst particles

Use react-native-reanimated for all animations. Install expo-haptics for haptic feedback.
```

---

### ✅ Prompt 46 — Error Handling & Offline State

```
Create app-wide error handling and offline state management:

**1. Network Status Hook (`src/hooks/useNetworkStatus.ts`):**
- Use @react-native-community/netinfo
- Track online/offline state
- Offline → show persistent banner: "No internet connection"

**2. Offline Banner (`src/components/common/OfflineBanner.tsx`):**
- Red/orange bar at top: "You are offline. Some features may not work."
- Animated slide-down on disconnect, slide-up on reconnect

**3. API Error Handling (global):**
- 401 → auto-logout + "Please log in again"
- 403 → "Access denied"
- 404 → "Resource not found"
- 429 → "Too many requests. Please try again later."
- 500 → "Server error occurred. Please try again."
- 503 → "Service temporarily unavailable"
- Network error → "Please check your internet connection"

**4. Error Boundary:**
- React Error Boundary component
- Crash screen: "Something went wrong" + "Try Again" button

**5. Retry Logic:**
- Failed API calls → "Try Again" button
- Auto-retry on reconnect for critical calls

Install @react-native-community/netinfo.
```

---

## 🧪 Phase 13: Testing & Bug Fixes

### ✅ Prompt 47 — TypeScript Types & Interfaces

```
Finalize all TypeScript type definitions for the Becha-Kena app (`src/types/` folder):

**1. user.types.ts:**
```typescript
interface User {
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
  createdAt: string;
}
```

**2. listing.types.ts:**
```typescript
interface Listing {
  id: string;
  sellerId: string;
  seller?: UserSummary;
  title: string;
  description: string;
  price: number;
  category: string;
  condition: 'new' | 'like_new' | 'used';
  images: string[];
  hidePhoneNumber: boolean;
  location: Location;
  soldToBuyerId?: string;
  status: 'pending' | 'active' | 'archived' | 'sold';
  expiresAt: string;
  createdAt: string;
}

interface Location {
  type: 'Point';
  coordinates: [number, number];
  addressLine?: string;
  division: string;
  district: string;
  thana: string;
}
```

**3. chat.types.ts:**
```typescript
interface ChatRoom { ... }
interface Message { ... }
```

**4. api.types.ts:**
```typescript
interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}
interface ApiError {
  success: false;
  error: string;
  code: string;
  details?: any[];
}
interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: { page: number; limit: number; total: number; totalPages: number; };
}
```

Export all types and use them consistently across the entire app.
```

---

### ✅ Prompt 48 — End-to-End Flow Testing

```
Manually test all major user flows in the Becha-Kena app and fix bugs:

**Test Flows:**

1. **Auth Flow:**
   - Fresh install → onboarding → login → OTP → verify
   - Already logged in → app open → auto-login (token check)
   - Token expired → auto-refresh or redirect to login
   - Wrong OTP → error handling
   - Rate limited → proper message

2. **KYC Flow:**
   - Unverified user → KYC gate on post/chat/contact
   - Adult verification: NID + selfie + submit
   - Pending review state display
   - Approved → badge update

3. **Listing Flow:**
   - Create ad → all 4 steps → submit → success
   - View ad → all details display correctly
   - Edit ad → pre-filled form
   - Mark as sold → buyer selection → review trigger
   - Delete ad → confirmation → removal

4. **Chat Flow:**
   - Initiate chat from listing → room creation
   - Real-time message send/receive
   - Typing indicator
   - Offline notification
   - Chat list order

5. **Profile & Settings:**
   - Edit profile → save
   - View reviews
   - Logout → clear data
   - Delete account → full cleanup

6. **Edge Cases:**
   - No internet → offline banner
   - API errors → proper user-friendly error messages
   - Empty states → proper illustrations
   - Deep links work
   - Dark mode consistency

Verify that text and typography render properly across all screens.
```

---

### ✅ Prompt 49 — Performance Optimization

```
Optimize the performance of the Becha-Kena mobile app:

**1. Image Optimization:**
- Use expo-image (already installed) — built-in caching
- Blurhash placeholders for all listing images
- Lazy loading in FlatList (windowSize, maxToRenderPerBatch tuning)

**2. FlatList Optimization:**
- getItemLayout for fixed-height items
- keyExtractor properly set
- removeClippedSubviews: true
- windowSize: 5
- maxToRenderPerBatch: 10
- initialNumToRender: 10

**3. Memoization:**
- React.memo on ListingCard, ChatBubble, ReviewItem
- useMemo/useCallback where appropriate
- Avoid unnecessary re-renders in list items

**4. Bundle Size:**
- Check for unused imports
- Tree-shakeable imports (e.g., import specific icons, not whole library)
- Lazy load screens where possible

**5. API Optimization:**
- Response caching with SWR or TanStack Query pattern
- Debounced search (already done)
- Pagination optimization
- Cancel previous requests on new search

**6. Socket Optimization:**
- Reconnect with backoff
- Message batching
- Disconnect on app background, reconnect on foreground
```

---

## 🚀 Phase 14: Production Build & Deployment

### ✅ Prompt 50 — App Configuration for Production

```
Configure the Becha-Kena mobile app for production builds:

**1. app.json / app.config.ts update:**
- name: "Becha-Kena" (app display name)
- slug: "becha-kena"
- version: "1.0.0"
- iOS bundle identifier: "com.bechakena.app"
- Android package: "com.bechakena.app"
- Splash screen config (Becha-Kena logo, blue background)
- Icon (1024x1024 adaptive icon)
- Orientation: portrait
- Permissions: camera, location, notifications, photo library

**2. Environment Variables:**
- .env.development: EXPO_PUBLIC_API_URL=http://localhost:5000/api/v1
- .env.staging: EXPO_PUBLIC_API_URL=https://staging-api.bechakena.com/api/v1
- .env.production: EXPO_PUBLIC_API_URL=https://api.bechakena.com/api/v1
- EXPO_PUBLIC_SOCKET_URL for WebSocket

**3. EAS Build Configuration (eas.json):**
```json
{
  "cli": { "version": ">= 14.0.0" },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal"
    },
    "preview": {
      "distribution": "internal",
      "env": { "EXPO_PUBLIC_API_URL": "https://staging-api.bechakena.com/api/v1" }
    },
    "production": {
      "autoIncrement": true,
      "env": { "EXPO_PUBLIC_API_URL": "https://api.bechakena.com/api/v1" }
    }
  },
  "submit": {
    "production": {
      "ios": { "appleId": "your@email.com", "ascAppId": "YOUR_ASC_APP_ID" },
      "android": { "serviceAccountKeyPath": "./google-service-account.json" }
    }
  }
}
```

Install eas-cli: `npm install -g eas-cli`
```

---

### ✅ Prompt 51 — App Icons, Splash Screen & Assets

```
Create and configure production assets for the Becha-Kena app:

**1. App Icon:**
- Design: Stylized "BK" logo or shield + checkmark (trust symbol)
- Color: Deep Blue (#1A73E8) background, white icon
- Sizes:
  - iOS: 1024x1024
  - Android Adaptive: foreground (1024x1024 with safe zone) + background color (#E6F4FE)
  - Android Monochrome: grayscale variant

**2. Splash Screen:**
- Background: Primary Blue (#1A73E8)
- Center: White Becha-Kena logo/icon
- expo-splash-screen configured (already in app.json)

**3. Assets (`assets/` folder):**
- onboarding illustrations (3 slides)
- empty state illustrations
- KYC flow illustrations
- category icons
- placeholder images

**4. Fonts:**
- Load Bengali-supporting fonts (Noto Sans Bengali or Hind Siliguri from Google Fonts)
- expo-font setup for custom fonts
- Fallback to system font

Optimize all assets (compressed PNG/WebP) for minimum bundle size.
```

---

### ✅ Prompt 52 — Build, Test & Store Submission

```
Final build and store submission preparation for the Becha-Kena app:

**1. Pre-build Checklist:**
- [ ] TypeScript errors: 0
- [ ] All screens functional
- [ ] Text and typography rendering correctly
- [ ] Dark mode working
- [ ] All API endpoints connected
- [ ] Socket.io chat working
- [ ] Push notifications working
- [ ] Image upload/download working
- [ ] Error handling on all screens
- [ ] Loading states on all screens
- [ ] Offline state handling
- [ ] Deep linking working
- [ ] Keyboard handling (KeyboardAvoidingView) on all input screens

**2. Build Commands:**
```bash
# Development build (for testing)
eas build --profile development --platform all

# Preview build (internal testing)
eas build --profile preview --platform all

# Production build
eas build --profile production --platform all
```

**3. Store Submission:**
```bash
# Submit to App Store & Play Store
eas submit --profile production --platform all
```

**4. App Store Metadata:**
- App Name: "Becha-Kena — Verified Marketplace"
- Subtitle: "Safe Second-Hand Marketplace"
- Description (Bengali + English)
- Screenshots (6.7" iPhone, 6.5" iPhone, Android phone)
- Category: Shopping
- Keywords: "second hand, buy sell, bangladesh, verified, marketplace, bikroy alternative"
- Privacy Policy URL
- Support URL
- Age Rating: 12+

**5. Play Store Metadata:**
- Similar to above
- Content rating questionnaire
- Data safety section (camera, location, contacts used)
- Target audience: 13+

**6. Post-Launch:**
- Monitor crash reports (Sentry or expo-updates error tracking)
- OTA updates via `eas update` for hotfixes
- Analytics setup (optional: expo-analytics or Firebase Analytics)
```

---

## 📌 Quick Reference — Package Install Summary

```bash
# Navigate to mobile app folder
cd mobilea-app

# Core dependencies (most already installed)
npx expo install expo-secure-store @react-native-async-storage/async-storage

# State management
npm install zustand

# API & Networking
npm install axios socket.io-client

# Camera & Media
npx expo install expo-camera expo-image-picker expo-image-manipulator

# Location
npx expo install expo-location

# Notifications
npx expo install expo-notifications

# UI Components
npm install @gorhom/bottom-sheet

# Offline detection
npm install @react-native-community/netinfo

# Haptics
npx expo install expo-haptics

# Fonts
npx expo install expo-font @expo-google-fonts/noto-sans-bengali

# Build tools
npm install -g eas-cli
```

---

## 🎯 Development Order Recommendation

| Priority | Phase | Estimated Time |
|----------|-------|-----------------|
| 🔴 P0 | Phase 0 (Foundation) | 1 day |
| 🔴 P0 | Phase 1 (Auth) | 2 days |
| 🔴 P0 | Phase 3 (Home Feed) | 2 days |
| 🔴 P0 | Phase 6 (Listing Detail) | 1 day |
| 🟡 P1 | Phase 5 (Ad Creation) | 3 days |
| 🟡 P1 | Phase 2 (KYC) | 3 days |
| 🟡 P1 | Phase 4 (Search/Filter) | 2 days |
| 🟡 P1 | Phase 7 (Chat) | 3 days |
| 🟢 P2 | Phase 8 (Profile/Reviews) | 2 days |
| 🟢 P2 | Phase 9 (Notifications) | 1 day |
| 🟢 P2 | Phase 10 (Reports) | 1 day |
| 🟢 P2 | Phase 11 (Settings) | 1 day |
| 🔵 P3 | Phase 12 (Polish) | 2 days |
| 🔵 P3 | Phase 13 (Testing) | 2 days |
| 🔵 P3 | Phase 14 (Production) | 2 days |
| | **Total** | **~28 days** |

---

> **💡 Usage Instructions:** Feed each prompt individually to your AI (Claude / ChatGPT / Cursor / Antigravity). Implement the output of each prompt, test it thoroughly, and then proceed to the next prompt. Do not skip steps — adhere to the sequential order!
