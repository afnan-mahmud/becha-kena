# Becha-Kena Frontend — Step-by-Step Build Prompts

> **Purpose:** This file contains a series of sequential, self-contained prompts. Feed each prompt (one at a time, in order) to an AI coding assistant to incrementally build the complete Becha-Kena React.js + TypeScript frontend from scratch.
>
> **Tech Stack:** React 18, TypeScript, Vite, React Router v6, Axios, Socket.io-client, React Query (TanStack Query), Zustand (state management), React Hook Form, CSS Modules / Vanilla CSS
>
> **Architecture:** Feature-based folder structure (Pages → Components → Hooks → Services)
>
> **Backend API Base URL:** `http://localhost:5000/api/v1`
>
> **UI Reference:** The design follows a modern e-commerce classified marketplace layout inspired by TopDeal/Bikroy.com — with a prominent top header bar (blue theme), mega-menu category navigation, hero banner carousel, category circles, listing grids with card-based design, and promotional banner sections. The overall aesthetic is clean, vibrant, and professional with a strong blue-yellow-white color palette.

---

## Phase 1: Project Initialization & Configuration

---

### Prompt 1 — Project Scaffolding & Directory Structure

```
Initialize a new React + TypeScript frontend project for a C2C classified marketplace called "Becha-Kena" inside a `frontend/` directory at the project root (sibling to the existing `backend/` directory).

Requirements:

1. Use Vite to scaffold the React + TypeScript project:
   - Run: `npm create vite@latest frontend -- --template react-ts`
   - Navigate into `frontend/` and install dependencies.

2. Install the following additional dependencies:
   - Production: react-router-dom, axios, @tanstack/react-query, zustand, react-hook-form, socket.io-client, react-hot-toast, lucide-react (icons), date-fns, swiper (carousel/slider)
   - Development: @types/react, @types/react-dom (should already be included)

3. Create the following directory structure inside `frontend/src/`:
   ```
   src/
   ├── api/              # Axios instance, API service functions
   ├── assets/           # Static images, logos, icons
   ├── components/       # Shared/reusable UI components
   │   ├── common/       # Button, Input, Modal, Loader, Badge, etc.
   │   ├── layout/       # Header, Footer, Sidebar, MobileNav
   │   └── ui/           # Card, Avatar, Rating, SafetyBanner, etc.
   ├── contexts/         # React Context providers (if needed beyond Zustand)
   ├── hooks/            # Custom React hooks (useAuth, useSocket, useDebounce, etc.)
   ├── pages/            # Page-level components (one per route)
   │   ├── auth/         # Login, OTPVerification
   │   ├── home/         # HomePage
   │   ├── listings/     # BrowseListings, ListingDetail, CreateListing, EditListing
   │   ├── profile/      # MyProfile, PublicProfile, EditProfile
   │   ├── chat/         # ChatInbox, ChatRoom
   │   ├── kyc/          # VerificationFlow (Adult/Minor)
   │   ├── dashboard/    # SellerDashboard (My Listings, Sold Items)
   │   └── admin/        # AdminDashboard, ModerationQueue, ReportQueue, KYCQueue
   ├── routes/           # Route definitions and protected route wrappers
   ├── services/         # API call functions organized by feature
   ├── store/            # Zustand stores (auth, ui, notifications)
   ├── styles/           # Global CSS, CSS variables/tokens, theme
   ├── types/            # TypeScript interfaces and type definitions
   ├── utils/            # Helper functions (formatPrice, formatDate, phoneFormatter, etc.)
   ├── App.tsx           # Root component with router and providers
   ├── main.tsx          # Entry point
   └── vite-env.d.ts     # Vite env type declarations
   ```

4. Create a `.env` file with:
   ```
   VITE_API_BASE_URL=http://localhost:5000/api/v1
   VITE_SOCKET_URL=http://localhost:5000
   VITE_GOOGLE_MAPS_API_KEY=
   ```

5. Set up the Vite proxy in `vite.config.ts` to proxy `/api` requests to `http://localhost:5000` during development to handle cookies and CORS seamlessly.

6. Create `src/main.tsx` that renders the `App` component wrapped in `React.StrictMode`.

7. Create a basic `src/App.tsx` that renders a placeholder `<h1>Becha-Kena</h1>` for now.

Do NOT create any pages, components, or routes yet. Only set up the project skeleton and configuration.
```

---

### Prompt 2 — Design System: Global Styles, CSS Variables & Theme

```
In the Becha-Kena frontend project, create the global design system with CSS variables, typography, and base styles. The design follows a modern e-commerce classified marketplace aesthetic (TopDeal/Bikroy style).

Requirements:

1. Create `src/styles/variables.css`:
   - Define the complete color palette as CSS custom properties:
     - Primary: `--color-primary: #2D5BFF` (royal blue), `--color-primary-dark: #1E40AF`, `--color-primary-light: #60A5FA`
     - Secondary: `--color-secondary: #FFD60A` (vibrant yellow), `--color-secondary-dark: #CA8A04`
     - Accent: `--color-accent: #FF6B35` (orange for sale/deal badges)
     - Success: `--color-success: #22C55E`, Error: `--color-error: #EF4444`, Warning: `--color-warning: #F59E0B`, Info: `--color-info: #3B82F6`
     - Neutrals: `--color-bg: #F5F5F5`, `--color-bg-white: #FFFFFF`, `--color-bg-dark: #1A1A2E`, `--color-text-primary: #1F2937`, `--color-text-secondary: #6B7280`, `--color-text-muted: #9CA3AF`, `--color-border: #E5E7EB`, `--color-border-dark: #D1D5DB`
     - Verified badge: `--color-verified: #10B981`
   - Define spacing scale: `--space-xs: 4px` through `--space-3xl: 48px`
   - Define border radius: `--radius-sm: 4px`, `--radius-md: 8px`, `--radius-lg: 12px`, `--radius-xl: 16px`, `--radius-full: 9999px`
   - Define shadows: `--shadow-sm`, `--shadow-md`, `--shadow-lg`, `--shadow-xl`
   - Define font sizes: `--text-xs: 0.75rem` through `--text-4xl: 2.25rem`
   - Define font weights: `--font-normal: 400`, `--font-medium: 500`, `--font-semibold: 600`, `--font-bold: 700`
   - Define transition: `--transition-fast: 150ms ease`, `--transition-normal: 250ms ease`, `--transition-slow: 350ms ease`
   - Define z-index scale: `--z-dropdown: 1000`, `--z-sticky: 1020`, `--z-modal: 1050`, `--z-tooltip: 1070`, `--z-toast: 1090`
   - Define container widths: `--container-sm: 640px`, `--container-md: 768px`, `--container-lg: 1024px`, `--container-xl: 1280px`, `--container-2xl: 1440px`

2. Create `src/styles/reset.css`:
   - A modern CSS reset (box-sizing border-box on all elements, remove default margins/paddings, set min-height on body, font smoothing, etc.)

3. Create `src/styles/typography.css`:
   - Import Google Font "Inter" (weights: 400, 500, 600, 700).
   - Set `body` font-family to `'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif`.
   - Define heading styles (h1-h6) with appropriate sizes and weights.

4. Create `src/styles/global.css`:
   - Import variables.css, reset.css, and typography.css.
   - Set body background to `var(--color-bg)`.
   - Define utility classes: `.container` (centered, max-width 1440px, padding), `.sr-only` (screen reader only), `.truncate`, `.line-clamp-2`, `.line-clamp-3`.
   - Define scrollbar styling (thin, themed scrollbar for webkit browsers).
   - Define focus-visible outline style using primary color for accessibility.

5. Import `global.css` in `main.tsx`.
```

---

### Prompt 3 — Axios Instance, API Service Layer & TypeScript Types

```
In the Becha-Kena frontend, create the API client configuration, TypeScript type definitions, and the base service layer.

Requirements:

1. Create `src/types/index.ts` — Define all shared TypeScript interfaces:
   - `IUser`: id, phoneNumber, displayName, verifiedName, isVerified, ageGroup, role, status, averageRating, totalReviews, lastLoginDate, createdAt
   - `IListing`: id, sellerId, seller (populated: displayName, verifiedName, isVerified, averageRating, totalReviews), title, description, price, category, condition, images, hidePhoneNumber, location (type, coordinates, addressLine, division, district, thana), soldToBuyerId, status, moderationFlags, expiresAt, createdAt
   - `IChatRoom`: id, listingId, listing (populated: title, images, price, status), buyerId, buyer (populated: displayName), sellerId, seller (populated: displayName), lastMessage (preview), unreadCount, createdAt, updatedAt
   - `IMessage`: id, roomId, senderId, messageText, readStatus, createdAt
   - `IReview`: id, listingId, reviewerId, reviewer (populated: displayName), revieweeId, rating, reviewText, createdAt
   - `IReport`: id, reporterId, targetType, targetId, reason, description, status, createdAt
   - `IVerificationLog`: id, userId, verificationStatus, manualReviewReason, createdAt
   - `ApiResponse<T>`: { success: boolean, message: string, data: T }
   - `PaginatedResponse<T>`: { success: boolean, data: { items: T[], total: number, page: number, totalPages: number } }
   - `ListingFilters`: { category?, minPrice?, maxPrice?, search?, lat?, lng?, radius?, page?, limit?, status? }
   - Define all category and condition enums/union types.

2. Create `src/api/axios.ts`:
   - Create an Axios instance with:
     - `baseURL` from `import.meta.env.VITE_API_BASE_URL`.
     - `withCredentials: true` (to send HTTP-only cookies with every request).
     - `timeout: 15000`.
     - Default headers: `Content-Type: application/json`.
   - Add a response interceptor:
     - On 401 error → attempt to refresh the access token by calling `POST /auth/refresh`. If refresh also fails → clear auth state and redirect to login page.
     - On 403 `ACCOUNT_SUSPENDED` → redirect to a "Suspended Account" page.
     - On 403 `VERIFICATION_REQUIRED` → redirect to the KYC verification page.
     - On other errors → extract the error message from `response.data.error` and reject with a user-friendly message.
   - Export the Axios instance as default.

3. Create `src/services/auth.service.ts`:
   - `requestOTP(phoneNumber: string)`: POST `/auth/request-otp`
   - `verifyOTP(phoneNumber: string, otpCode: string)`: POST `/auth/verify-otp`
   - `logout()`: POST `/auth/logout`
   - All functions use the Axios instance and return typed responses.

4. Create `src/services/user.service.ts`:
   - `getMe()`: GET `/users/me`
   - `updateProfile(data: { displayName?: string })`: PUT `/users/me`
   - `deleteAccount()`: DELETE `/users/me`
   - `getPublicProfile(userId: string)`: GET `/users/{userId}`

5. Create `src/services/listing.service.ts`:
   - `getListings(filters: ListingFilters)`: GET `/listings`
   - `getListingById(id: string)`: GET `/listings/{id}`
   - `createListing(data: Partial<IListing>)`: POST `/listings`
   - `updateListing(id: string, data: Partial<IListing>)`: PUT `/listings/{id}`
   - `markAsSold(id: string, buyerId: string)`: PATCH `/listings/{id}/sell`
   - `renewListing(id: string)`: PATCH `/listings/{id}/renew`
   - `deleteListing(id: string)`: DELETE `/listings/{id}`
   - `getMyListings(status?: string)`: GET `/listings/my`

6. Create `src/services/chat.service.ts`:
   - `getRooms()`: GET `/chat/rooms`
   - `getMessages(roomId: string, page?: number)`: GET `/chat/rooms/{roomId}/messages`
   - `createRoom(listingId: string)`: POST `/chat/rooms`

7. Create `src/services/review.service.ts`:
   - `submitReview(data: { listingId: string, rating: number, reviewText: string })`: POST `/reviews`
   - `getReviewsForUser(userId: string, page?: number)`: GET `/reviews/user/{userId}`

8. Create `src/services/report.service.ts`:
   - `submitReport(data: { targetType: string, targetId: string, reason: string, description: string })`: POST `/reports`
   - `getMyReports(page?: number)`: GET `/reports/my`

9. Create `src/services/media.service.ts`:
   - `getPresignedUrl(fileName: string, fileType: string, folder?: string)`: POST `/media/presigned-url`
   - `uploadFileToS3(uploadUrl: string, file: File)`: PUT request directly to the S3 presigned URL.

10. Create `src/services/kyc.service.ts`:
    - `submitAdultVerification(data)`: POST `/kyc/verify-adult`
    - `submitMinorVerification(data)`: POST `/kyc/verify-minor`
    - `getVerificationStatus()`: GET `/kyc/status`

11. Create `src/services/admin.service.ts`:
    - `getModerationQueue(page?: number)`: GET `/admin/moderation/listings`
    - `moderateListing(id: string, action: 'approve' | 'reject', reason?: string)`: PATCH `/admin/moderation/listings/{id}`
    - `getKYCQueue(page?: number)`: GET `/admin/kyc/queue`
    - `resolveVerification(logId: string, action: 'approve' | 'reject')`: PATCH `/admin/kyc/{logId}`
    - `banUser(userId: string, reason: string)`: POST `/admin/users/{userId}/ban`
    - `getReports(status?: string, page?: number)`: GET `/admin/reports`
    - `resolveReport(reportId: string, resolution: string)`: PATCH `/admin/reports/{reportId}/resolve`
    - `dismissReport(reportId: string)`: PATCH `/admin/reports/{reportId}/dismiss`
```

---

### Prompt 4 — State Management (Zustand Stores) & Auth Provider

```
In the Becha-Kena frontend, create the global state management using Zustand and the authentication flow.

Requirements:

1. Create `src/store/authStore.ts`:
   - State: `user: IUser | null`, `isAuthenticated: boolean`, `isLoading: boolean`, `isVerified: boolean`
   - Actions:
     - `setUser(user: IUser)`: Set the user and derive `isAuthenticated` and `isVerified` from the user object.
     - `clearUser()`: Reset all auth state to initial values.
     - `fetchUser()`: Call `userService.getMe()`, if successful → `setUser()`, if 401 → `clearUser()`. This is called on app load to check if the user has a valid session cookie.
     - `updateUser(updates: Partial<IUser>)`: Merge partial updates into the current user state.
   - The store should persist nothing to localStorage (auth state is derived from HTTP-only cookies, so on page refresh we call `fetchUser()` to re-hydrate).

2. Create `src/store/uiStore.ts`:
   - State: `isMobileMenuOpen: boolean`, `isSearchOpen: boolean`, `activeModal: string | null`, `modalData: any`
   - Actions: `toggleMobileMenu()`, `toggleSearch()`, `openModal(name, data?)`, `closeModal()`

3. Create `src/hooks/useAuth.ts`:
   - A custom hook that returns the auth store state and actions.
   - Additionally provides convenience methods:
     - `login(phoneNumber, otpCode)`: Calls `authService.verifyOTP()`, then `fetchUser()`.
     - `logout()`: Calls `authService.logout()`, then `clearUser()`, navigate to home.
     - `requestOTP(phoneNumber)`: Calls `authService.requestOTP()`.

4. Create `src/components/providers/AppProviders.tsx`:
   - Wrap children with `QueryClientProvider` (TanStack React Query with default config: staleTime 5 minutes, retry 1, refetchOnWindowFocus false).
   - Wrap children with `Toaster` from react-hot-toast (position top-right, themed with our design tokens).
   - Optionally wrap with any other needed providers.

5. Update `src/App.tsx`:
   - Wrap the entire app in `AppProviders`.
   - On mount (useEffect), call `authStore.fetchUser()` to check for existing session.
   - Show a full-screen loading spinner while `isLoading` is true.
   - Render the router (placeholder for now).

6. Create `src/components/common/LoadingSpinner.tsx`:
   - A centered full-screen spinner with the Becha-Kena brand colors.
   - Use a CSS animation (spinning circle or pulsing dots).
   - Export both a full-screen variant and an inline variant.
```

---

## Phase 2: Layout Components (Header, Footer, Navigation)

---

### Prompt 5 — Top Header Bar & Announcement Banner

```
In the Becha-Kena frontend, create the top header section that includes the announcement bar and the main header with logo, search bar, and user actions.

The design reference:
- A thin announcement bar at the very top (dark blue/navy background) with a promotional message like "বেচা-কেনা তে স্বাগতম! ১০০% ভেরিফাইড মার্কেটপ্লেস" (Welcome to Becha-Kena! 100% Verified Marketplace).
- Below it, the main header bar with a blue (#2D5BFF) background containing:
  - Left: Becha-Kena logo (text-based with a shopping bag icon or similar). Logo text should use a bold font with the yellow accent color for "Kena" part.
  - Center: A prominent search bar with a category dropdown selector on the left side of the search input, a text input field, and a yellow "Search" button on the right.
  - Right: User action icons — "Login" text/icon, "My Account" dropdown, language toggle (BN/EN), and a "My Cart" icon with item count badge (Note: Becha-Kena doesn't have cart, so replace with "পোস্ট করুন" / "Post Ad" button — a prominent yellow CTA button).

Requirements:

1. Create `src/components/layout/AnnouncementBar.tsx`:
   - A thin bar at the top with dark blue background.
   - Scrolling/static text announcement.
   - A close (dismiss) button on the right. When dismissed, it stays hidden for the session.
   - Style with `AnnouncementBar.css`.

2. Create `src/components/layout/Header.tsx`:
   - The main header with the blue background.
   - **Logo Section:** Left-aligned. Text "Becha" in white + "Kena" in yellow, with a small shopping/marketplace icon. Links to homepage.
   - **Search Bar:** Center. Contains:
     - A select dropdown for "All Categories" (Mobile, Electronics, Vehicles, Furniture, Cycles, Fashion, Other).
     - A text input field with placeholder "আপনি কি খুঁজছেন?" (What are you looking for?).
     - A yellow search button with a search icon.
   - **User Actions:** Right-aligned.
     - If NOT logged in: "Login" button (icon + text).
     - If logged in: User avatar/icon with a dropdown showing: My Profile, My Listings, Messages (with unread count badge), Settings, Logout.
     - A prominent yellow "Post Ad" button (বিজ্ঞাপন দিন) — if clicked and user not verified → redirect to KYC page.
   - On mobile (< 768px): Collapse search bar into a search icon that expands on click. Show a hamburger menu icon.
   - Style with `Header.css`.

3. Create `src/components/layout/Header.css`:
   - Blue header background with white text.
   - Search bar styled with white background, rounded corners, category dropdown with border-right separator.
   - Yellow (#FFD60A) "Search" and "Post Ad" buttons with dark text.
   - Hover effects and transitions on all interactive elements.
   - Responsive breakpoints for mobile, tablet, desktop.
```

---

### Prompt 6 — Category Navigation Bar & Mega Menu

```
In the Becha-Kena frontend, create the category navigation bar that sits below the main header.

The design reference:
- A white/light gray bar with horizontal category links.
- Left side: "All Departments" dropdown with a hamburger/grid icon (blue background button). Clicking this opens a vertical mega-menu sidebar showing all categories with sub-categories.
- Center/right: Horizontal category link items like "Today's Deals", "New Arrivals", "Featured", "Shop", "Blog" (adapt for Becha-Kena: "হট ডিল", "নতুন বিজ্ঞাপন", "ক্যাটেগরি", "ভেরিফাইড সেলার").
- Right edge: "Special Offer!" text in red/accent color.

Requirements:

1. Create `src/components/layout/CategoryNav.tsx`:
   - A horizontal navigation bar directly below the header.
   - **Left Button:** "সব ক্যাটেগরি" (All Categories) — blue background, white text, hamburger icon. On hover/click, opens a vertical dropdown/flyout menu listing all categories with icons.
   - **Category Links:** Horizontal list of quick-access links:
     - হট ডিল (Hot Deals) — with a fire emoji/icon
     - নতুন বিজ্ঞাপন (New Listings)
     - মোবাইল (Mobile)
     - ইলেকট্রনিক্স (Electronics)
     - গাড়ি (Vehicles)
     - আসবাবপত্র (Furniture)
   - Each link, when clicked, navigates to the browse page with that category pre-filtered.
   - On mobile: This bar becomes a horizontally scrollable strip.
   - Style with `CategoryNav.css`.

2. Create `src/components/layout/MegaMenu.tsx`:
   - A vertical dropdown/flyout that opens when the "All Categories" button is hovered or clicked.
   - Shows categories in a left panel. On hovering a category, a right panel expands showing sub-details or featured listings in that category.
   - Categories list: Mobile, Electronics, Vehicles, Furniture, Cycles, Fashion, Health & Beauty, Food & Restaurant, Travel, Sports & Outdoors, Other.
   - Each category has a small icon (use lucide-react icons).
   - Style with `MegaMenu.css` — absolute/fixed positioning, shadow, border, smooth open/close animation.

3. Create `src/components/layout/CategoryNav.css` and `src/components/layout/MegaMenu.css`:
   - White background bar with subtle bottom border/shadow.
   - "All Categories" button with blue background, hover darkens.
   - Category links with hover underline effect and text color change.
   - MegaMenu with a slide-down/fade-in animation, layered z-index above content.
   - Responsive: On mobile, MegaMenu becomes a full-screen overlay.
```

---

### Prompt 7 — Footer & Mobile Bottom Navigation

```
In the Becha-Kena frontend, create the footer component and the mobile bottom navigation bar.

Requirements:

1. Create `src/components/layout/Footer.tsx`:
   - A multi-column footer with a dark background (navy/dark blue `#1A1A2E`).
   - **Column 1 — About:** Becha-Kena logo, brief description ("বাংলাদেশের সবচেয়ে নিরাপদ সেকেন্ড-হ্যান্ড মার্কেটপ্লেস"), social media icon links.
   - **Column 2 — Quick Links:** Home, Browse Listings, Post Ad, How It Works, Contact Us.
   - **Column 3 — Categories:** Mobile, Electronics, Vehicles, Furniture, Fashion, Other.
   - **Column 4 — Support:** FAQ, Safety Tips, Report a Problem, Terms of Service, Privacy Policy.
   - **Bottom Bar:** Copyright "© 2026 Becha-Kena. All rights reserved." centered, with payment method icons (bKash, Nagad logos as future payment options).
   - Style with `Footer.css`.

2. Create `src/components/layout/MobileBottomNav.tsx`:
   - A fixed bottom navigation bar visible ONLY on mobile/tablet screens (< 768px).
   - 5 tab items with icons and labels:
     - হোম (Home) — home icon
     - ক্যাটেগরি (Categories) — grid icon
     - পোস্ট করুন (Post Ad) — plus-circle icon (larger, elevated, centered — acts as FAB)
     - মেসেজ (Messages) — message icon with unread badge
     - প্রোফাইল (Profile) — user icon
   - Active tab is highlighted with the primary blue color.
   - Style with `MobileBottomNav.css` — fixed bottom, safe-area-inset-bottom for iPhone notch, elevated "Post Ad" button.

3. Create `src/components/layout/Layout.tsx`:
   - A wrapper layout component that includes:
     - `<AnnouncementBar />`
     - `<Header />`
     - `<CategoryNav />`
     - `<main>{children}</main>` (with min-height to push footer down)
     - `<Footer />`
     - `<MobileBottomNav />` (only on mobile)
   - This Layout wraps all public-facing pages.
```

---

## Phase 3: Authentication Pages

---

### Prompt 8 — Login Page (Phone Number Input + OTP Verification)

```
In the Becha-Kena frontend, create the login/authentication flow with phone number input and OTP verification.

Requirements:

1. Create `src/pages/auth/LoginPage.tsx`:
   - A centered card-based layout on a light background.
   - **Step 1 — Phone Number Entry:**
     - Becha-Kena logo at the top of the card.
     - Heading: "লগইন / রেজিস্ট্রেশন" (Login / Registration).
     - Subtext: "আপনার মোবাইল নম্বর দিয়ে শুরু করুন" (Start with your mobile number).
     - A phone number input field with a "+88" prefix label (fixed, non-editable). Input expects the 11-digit number (01XXXXXXXXX).
     - Validate the Bangladeshi format: `^01[3-9]\d{8}$`. Show inline error if invalid.
     - A "OTP পাঠান" (Send OTP) button — primary blue, full width.
     - On submit: Call `authService.requestOTP()`. Show loading spinner on the button. On success → move to Step 2. On rate limit error → show toast "Too many attempts. Please try again later."
   - **Step 2 — OTP Verification (shown after OTP is sent):**
     - Show "OTP পাঠানো হয়েছে" (OTP sent to) with the masked phone number (01***XXXXX).
     - 6 individual input boxes for each OTP digit (auto-focus to next box on input, auto-submit when all 6 filled).
     - A countdown timer showing remaining time (3 minutes). When expired, show "Resend OTP" link.
     - "ভেরিফাই করুন" (Verify) button — primary blue.
     - On submit: Call `authService.verifyOTP()`. On success → `fetchUser()` → redirect to home (or the page user was trying to access). On invalid OTP → show error "ভুল OTP কোড" (Invalid OTP code), shake animation on the input boxes.
     - "ফোন নম্বর পরিবর্তন করুন" (Change phone number) link → go back to Step 1.
   - Style with `LoginPage.css` — centered card with shadow, max-width 420px, responsive for mobile.

2. Create `src/components/common/OTPInput.tsx`:
   - A reusable 6-digit OTP input component.
   - Each digit in its own square input box, styled with border.
   - Auto-focus management: on typing → focus next, on backspace → focus previous.
   - Paste support: if user pastes a 6-digit number, fill all boxes automatically.
   - Props: `length`, `value`, `onChange`, `disabled`, `error`.

3. Create `src/routes/ProtectedRoute.tsx`:
   - A wrapper component that checks `isAuthenticated` from the auth store.
   - If not authenticated → redirect to `/login` with the current URL saved as a `redirect` query param.
   - If authenticated but route requires verification and user is not verified → redirect to `/verify`.

4. Create `src/routes/VerifiedRoute.tsx`:
   - Same as ProtectedRoute but additionally checks `isVerified`.
   - If authenticated but not verified → redirect to `/verify` with a toast message "Please complete identity verification first."
```

---

## Phase 4: Home Page

---

### Prompt 9 — Home Page: Hero Banner Carousel

```
In the Becha-Kena frontend, create the home page with the hero banner carousel section.

The design reference:
- A large hero banner section at the top of the page (below the header/nav).
- Left side: A large main carousel slider showing promotional banners (e.g., "Cyber Week Sale", "Save up to 50%", deals and offers). Each slide has a vibrant image/gradient background with text overlay.
- Right side: 2-3 smaller promotional banner cards stacked vertically (e.g., "76% OFF Everything", "Happy Christmas Sale").

Requirements:

1. Create `src/pages/home/HomePage.tsx`:
   - The main landing page. For now, include only the hero section. Other sections will be added in subsequent prompts.
   - Import and render `<HeroBanner />`.
   - Style with `HomePage.css`.

2. Create `src/components/home/HeroBanner.tsx`:
   - A two-column layout:
     - **Left Column (70% width):** A Swiper carousel with auto-play (5 seconds), pagination dots, and navigation arrows.
       - Slides contain promotional banners. Use placeholder gradient backgrounds with overlay text for now:
         - Slide 1: "বেচা-কেনায় স্বাগতম! ১০০% ভেরিফাইড ইউজার" (blue-purple gradient)
         - Slide 2: "আপনার পুরাতন জিনিস বিক্রি করুন — সহজে, নিরাপদে" (green gradient)
         - Slide 3: "নতুন অফার! এই সপ্তাহের সেরা ডিল দেখুন" (orange gradient)
       - Each slide has a title, subtitle, and a CTA button ("ব্রাউজ করুন" / Browse Now).
     - **Right Column (30% width):** 2 stacked promotional cards with smaller banners:
       - Card 1: "ভেরিফাইড সেলার থেকে কিনুন" — with a shield/verified icon.
       - Card 2: "আজকের সেরা ডিল" — with a fire/deal icon.
   - On mobile: Right column stacks below the carousel. Carousel takes full width.
   - Style with `HeroBanner.css` — rounded corners on banners, smooth carousel transitions, gradient overlays on images.

3. Create `src/components/home/HeroBanner.css`:
   - Carousel with border-radius, overflow hidden.
   - Gradient overlay on each slide for text readability.
   - Swiper pagination dots customized to yellow color.
   - Right column cards with hover zoom effect on the image.
   - Responsive: On tablet, right column becomes 2 cards side by side below carousel. On mobile, single column stacked.
```

---

### Prompt 10 — Home Page: Trust Bar, Category Circles & Hot Deals Section

```
In the Becha-Kena frontend, add the trust badges bar, category circle navigation, and Hot Deals product grid section to the home page.

The design reference:
- Below the hero banner: A horizontal bar with trust/service badges (Free Delivery, 99% Customer Feedback, 365 Days Return, etc.) — adapt for Becha-Kena (e.g., "১০০% ভেরিফাইড", "নিরাপদ চ্যাট", "সহজ ব্যবহার", "NID যাচাই").
- Below trust bar: Circular category icons in a horizontal row. Each circle has a category image/icon inside and the category name below. Clicking navigates to that category's listing page.
- Below categories: A "🔥 হট ডিল" (Hot Deal) section header with a countdown timer on the right. Below it, a grid of 4-5 product cards showing recent active listings.

Requirements:

1. Create `src/components/home/TrustBar.tsx`:
   - A horizontal row of 4-5 trust/feature badges:
     - 🛡️ ১০০% ভেরিফাইড ইউজার (100% Verified Users)
     - 💬 নিরাপদ ইন-অ্যাপ চ্যাট (Safe In-App Chat)
     - 🔒 NID যাচাইকৃত (NID Verified)
     - 📱 সহজ ব্যবহার (Easy to Use)
     - ⭐ বিশ্বস্ত কমিউনিটি (Trusted Community)
   - Each badge has an icon (circle with colored background), title, and short subtitle.
   - Centered horizontally with even spacing.
   - Style with `TrustBar.css`.

2. Create `src/components/home/CategoryCircles.tsx`:
   - A horizontal row of circular category icons.
   - Categories: মোবাইল (Mobile), ইলেকট্রনিক্স (Electronics), গাড়ি (Vehicles), আসবাবপত্র (Furniture), সাইকেল (Cycles), ফ্যাশন (Fashion), স্বাস্থ্য (Health), খেলাধুলা (Sports).
   - Each circle: Has a gradient border, a category icon/image inside, and the category name text below.
   - Clicking a circle navigates to `/listings?category=<category_name>`.
   - On mobile: Horizontally scrollable.
   - Style with `CategoryCircles.css` — circular avatars with colored borders, hover scale-up effect.

3. Create `src/components/home/HotDeals.tsx`:
   - A section with:
     - Section header: "🔥 হট ডিল" (Hot Deals) on the left, a decorative countdown timer on the right (placeholder: "শেষ হতে বাকি: ০৩ দিন ১২:৪৫:৩০").
     - A grid of listing cards (4 columns on desktop, 2 on tablet, 1 on mobile).
     - Fetches the latest active listings from `listingService.getListings({ limit: 8 })` using React Query.
     - Shows loading skeletons while fetching.
     - "আরও দেখুন" (See More) link at the bottom → navigates to `/listings`.
   - Style with `HotDeals.css`.

4. Create `src/components/ui/ListingCard.tsx`:
   - A reusable product/listing card component used across the app.
   - Props: `listing: IListing`.
   - Design:
     - Top: Image (first image from the `images` array). If `status === 'sold'` → show a "বিক্রি হয়ে গেছে" (SOLD) overlay badge.
     - Middle: Title (truncated to 2 lines), Location text (division, district).
     - Bottom: Price (formatted with ৳ symbol and comma-separated — e.g., ৳৬৮,০০০), posted date ("৫ দিন আগে").
     - Seller info: Small row with seller displayName, verified badge (if verified), and average rating stars.
     - Hover effect: Slight lift (translateY), shadow increase.
   - Clicking the card navigates to `/listings/{id}`.
   - Style with `ListingCard.css` — white card, rounded corners, shadow, image with object-fit cover.

5. Create `src/utils/formatters.ts`:
   - `formatPrice(price: number): string` — Formats number to Bengali currency: "৳৬৮,০০০".
   - `formatRelativeTime(date: string | Date): string` — Returns relative time in Bangla: "৫ মিনিট আগে", "২ ঘণ্টা আগে", "৩ দিন আগে".
   - `formatDate(date: string | Date): string` — Returns formatted date in Bangla.

6. Update `src/pages/home/HomePage.tsx`:
   - Add `<TrustBar />`, `<CategoryCircles />`, and `<HotDeals />` below the `<HeroBanner />`.
```

---

### Prompt 11 — Home Page: Category-wise Listing Sections & Promotional Banners

```
In the Becha-Kena frontend, add category-wise listing sections and mid-page promotional banners to the home page.

The design reference:
- After the Hot Deals section, there's a large mid-page promotional banner (e.g., "3 Years Anniversary Sale — 50% OFF Sitewide").
- Below that, sections for specific categories like "ফ্যাশন ও এক্সেসরিজ" (Fashion & Accessories) and "ডিজিটাল ও ইলেকট্রনিক্স" (Digital & Electronics). Each section shows a row of listing cards with a "See All" link.
- On the left sidebar: "স্পেশাল আইটেমস" (Special Items) vertical card list, and "রিকমেন্ডেড আইটেমস" (Recommended Items).

Requirements:

1. Create `src/components/home/PromoBanner.tsx`:
   - A wide promotional banner component.
   - Props: `title: string`, `subtitle: string`, `bgGradient: string`, `ctaText: string`, `ctaLink: string`.
   - Full-width with a gradient background, centered text, and a CTA button.
   - Style with `PromoBanner.css` — gradient background, text shadow, responsive padding.

2. Create `src/components/home/CategorySection.tsx`:
   - A reusable section component that displays listings from a specific category.
   - Props: `title: string`, `category: string`, `icon: ReactNode`.
   - Section header with the category name, an icon, and a "সব দেখুন →" (See All) link on the right.
   - A horizontal scrollable row of `ListingCard` components (or a 4-column grid).
   - Fetches listings filtered by category using React Query: `listingService.getListings({ category, limit: 6 })`.
   - Shows loading skeleton placeholders while data is loading.
   - Style with `CategorySection.css`.

3. Create `src/components/home/SidebarSpecialItems.tsx`:
   - A vertical sidebar component showing "স্পেশাল আইটেমস" (Special Items).
   - Displays 4-5 compact listing items vertically (small image on left, title + price on right).
   - Each item is clickable → navigates to the listing detail.
   - Style with `SidebarSpecialItems.css`.

4. Create `src/components/ui/ListingCardCompact.tsx`:
   - A compact horizontal listing card (for sidebar use).
   - Small thumbnail image (60x60), title (1 line truncated), price.
   - Hover highlight effect.

5. Update `src/pages/home/HomePage.tsx`:
   - Final layout structure:
     ```
     <HeroBanner />
     <TrustBar />
     <CategoryCircles />
     <div class="home-content">
       <aside class="home-sidebar">
         <SidebarSpecialItems />
       </aside>
       <main class="home-main">
         <HotDeals />
         <PromoBanner title="..." ... />
         <CategorySection title="ফ্যাশন ও এক্সেসরিজ" category="Fashion" />
         <CategorySection title="মোবাইল ফোন" category="Mobile" />
         <CategorySection title="ইলেকট্রনিক্স" category="Electronics" />
       </main>
     </div>
     ```
   - Sidebar is hidden on mobile (shows as a horizontal scrollable section instead).
```

---

## Phase 5: Listings (Browse, Search & Detail)

---

### Prompt 12 — Browse Listings Page (Search, Filter & Grid)

```
In the Becha-Kena frontend, create the browse/search listings page with filtering, sorting, and responsive grid display.

Requirements:

1. Create `src/pages/listings/BrowseListingsPage.tsx`:
   - URL route: `/listings` with optional query params: `?category=Mobile&search=iPhone&minPrice=5000&maxPrice=50000`
   - **Page Layout:**
     - Left Sidebar (desktop only, 25% width): Filter panel.
     - Right Main Content (75% width): Listings grid with toolbar.
   - **Filter Sidebar:**
     - Category filter: Checkbox list of all categories. Pre-selected if category comes from URL params.
     - Price range filter: Two input fields (Min ৳ and Max ৳).
     - Condition filter: Checkboxes for "নতুন" (New), "প্রায় নতুন" (Like New), "ব্যবহৃত" (Used).
     - Location filter: Division dropdown, District dropdown (populated based on division), Thana dropdown.
     - "ফিল্টার প্রয়োগ করুন" (Apply Filters) button.
     - "ফিল্টার রিসেট" (Reset Filters) link.
   - **Main Content:**
     - Top toolbar:
       - Breadcrumb: Home > Listings > {Category Name}
       - Result count: "২৫০ টি বিজ্ঞাপন পাওয়া গেছে" (250 listings found)
       - Sort dropdown: "সাজান" (Sort by) — Latest, Price Low-High, Price High-Low.
       - View toggle: Grid view (default) / List view icons.
     - Listing grid: 3 columns (grid) or 1 column (list) display using `ListingCard`.
     - Pagination at the bottom: Page numbers with Previous/Next arrows.
   - Uses React Query to fetch listings with debounced filters.
   - Shows skeleton loading cards while fetching.
   - If no results → show an empty state: illustration + "কোন বিজ্ঞাপন পাওয়া যায়নি" (No listings found) + suggestion to change filters.
   - Style with `BrowseListingsPage.css`.

2. Create `src/components/ui/ListingCardList.tsx`:
   - A horizontal list-view variant of the listing card.
   - Image on the left (200px wide), details on the right.
   - Shows more info than the grid card: title, description (truncated 2 lines), price, location, seller info, posted date.

3. Create `src/components/common/Pagination.tsx`:
   - A reusable pagination component.
   - Props: `currentPage`, `totalPages`, `onPageChange`.
   - Shows: « Previous, page numbers (with ellipsis for large ranges), Next ».
   - Style with `Pagination.css` — pill-shaped page buttons, active page highlighted in primary blue.

4. Create `src/hooks/useDebounce.ts`:
   - A custom hook that debounces a value by a specified delay (default 500ms).
   - Used for debouncing the search input to avoid excessive API calls.

5. On mobile:
   - The filter sidebar is hidden. Instead, show a "ফিল্টার" (Filter) button at the top that opens a full-screen slide-up filter panel/drawer.
   - The grid switches to 2 columns on tablet and 1 column on mobile.
```

---

### Prompt 13 — Listing Detail Page

```
In the Becha-Kena frontend, create the listing detail page that shows the full details of a classified ad.

Requirements:

1. Create `src/pages/listings/ListingDetailPage.tsx`:
   - URL route: `/listings/:id`
   - Fetches the listing by ID using React Query: `listingService.getListingById(id)`.
   - **Layout (two columns on desktop):**
     - **Left Column (60%):** Image gallery.
     - **Right Column (40%):** Product info + seller card + actions.
   - **Image Gallery Section:**
     - Large main image display with zoom-on-hover effect.
     - Below: Thumbnail strip — clicking a thumbnail switches the main image.
     - If the listing has multiple images, enable swipe on mobile.
     - If listing is SOLD → overlay a semi-transparent "বিক্রি হয়ে গেছে" (SOLD) banner over the image.
   - **Product Info Section:**
     - Title (large, bold).
     - Price: "৳৬৮,০০০" in large bold text, accent color.
     - Condition badge: "ব্যবহৃত" (Used) / "নতুন" (New) / "প্রায় নতুন" (Like New) — colored pill badge.
     - Category badge.
     - Location: "📍 ধানমণ্ডি, ঢাকা" with a small map preview (static, using the coordinates).
     - Posted date: "পোস্ট করা হয়েছে ৫ দিন আগে".
     - Expiry info: "মেয়াদ শেষ: ২৫ দিন বাকি".
     - Description: Full description text block.
   - **Seller Info Card:**
     - A card with:
       - Seller avatar (first letter of display name in a colored circle).
       - Display name + verified badge (green shield icon with "✓ ভেরিফাইড") if `isVerified`.
       - Verified name (if available): "আইনত যাচাইকৃত: [Verified Name]".
       - Average rating (star display) + total reviews count. Clickable → opens reviews.
       - Member since date.
     - "সেলারের সব বিজ্ঞাপন দেখুন" (View Seller's All Ads) link.
   - **Action Buttons:**
     - "চ্যাট করুন" (Chat with Seller) — primary blue button. If not logged in → redirect to login. If not verified → redirect to KYC. If logged in and verified → creates/opens chat room via `chatService.createRoom()`.
     - "ফোন নম্বর দেখুন" (Show Phone Number) — secondary button. Only visible if `hidePhoneNumber === false`. On click, reveals the seller's phone number (requires auth). If `hidePhoneNumber === true`, this button is hidden and replaced with "শুধুমাত্র চ্যাটে যোগাযোগ করুন" (Contact via Chat Only) text.
     - "রিপোর্ট করুন" (Report Listing) — small text link, opens the report modal.
     - Share buttons: Copy link, Facebook, WhatsApp.
   - **Safety Banner:**
     - A yellow/orange warning box at the bottom:
       - "⚠️ নিরাপত্তা পরামর্শ: সর্বদা জনবহুল জায়গায় দেখা করুন। অগ্রিম পেমেন্ট করবেন না।" (Safety Tip: Always meet in a public place. Never pay in advance.)
   - **Related Listings:**
     - Below the detail section, show a "সম্পর্কিত বিজ্ঞাপন" (Related Listings) grid — fetched by the same category.
   - Style with `ListingDetailPage.css`.

2. Create `src/components/ui/ImageGallery.tsx`:
   - A reusable image gallery with a main viewer and thumbnail strip.
   - Props: `images: string[]`.
   - Support swipe gestures on mobile (use CSS scroll-snap or Swiper).

3. Create `src/components/ui/RatingStars.tsx`:
   - A reusable star rating display component.
   - Props: `rating: number` (0-5, supports decimals), `size: 'sm' | 'md' | 'lg'`, `showCount: boolean`, `count: number`.
   - Renders filled/half/empty stars using CSS or SVG.

4. Create `src/components/ui/VerifiedBadge.tsx`:
   - A reusable verified badge component.
   - Shows a green shield icon with "✓ ভেরিফাইড" text.
   - Props: `size: 'sm' | 'md'`.

5. Handle loading state with a skeleton layout matching the detail page structure.
6. Handle 404: Show a "বিজ্ঞাপনটি পাওয়া যায়নি" (Listing not found) page.
```

---

### Prompt 14 — Create & Edit Listing Pages

```
In the Becha-Kena frontend, create the listing creation and editing pages with multi-step form and image upload.

Requirements:

1. Create `src/pages/listings/CreateListingPage.tsx`:
   - URL route: `/listings/create` — requires authenticated + verified user (VerifiedRoute).
   - A multi-step form wizard:
     - **Step 1 — Category & Condition:**
       - Category selection: Large clickable category cards with icons (not a dropdown). Selecting one highlights it.
       - Condition selection: Three radio-card options — "নতুন" (New), "প্রায় নতুন" (Like New), "ব্যবহৃত" (Used).
       - "পরবর্তী" (Next) button.
     - **Step 2 — Details:**
       - Title input (10-80 chars). Show character counter. Live validation.
       - Description textarea (50-500 chars). Show character counter.
       - Price input (৳ prefix, number only). Format with commas as user types.
       - "আগের ধাপ" (Previous) and "পরবর্তী" (Next) buttons.
     - **Step 3 — Photos:**
       - Image upload area: Drag-and-drop zone + "ছবি আপলোড করুন" (Upload Photos) button.
       - Support up to 5 images. Show thumbnails of uploaded images with "X" delete button on each.
       - Upload flow:
         1. User selects image → client-side compress to WebP (max 1.5MB).
         2. Call `mediaService.getPresignedUrl()` to get S3 upload URL.
         3. Upload directly to S3 using the presigned URL.
         4. Store the returned `fileUrl` in the form state.
       - Show upload progress bar for each image.
       - "আগের ধাপ" and "পরবর্তী" buttons.
     - **Step 4 — Location & Settings:**
       - Location input: A text input for address search. Division, District, Thana dropdowns (cascading — selecting division populates district options, etc.).
       - For MVP: Use hardcoded Bangladesh divisions/districts/thanas data.
       - Map preview: A static map image or a placeholder showing the selected location.
       - "ফোন নম্বর লুকান" (Hide Phone Number) toggle switch. Tooltip: "চালু করলে শুধু চ্যাটে যোগাযোগ করা যাবে" (If enabled, contact only via chat).
       - "আগের ধাপ" and "বিজ্ঞাপন পোস্ট করুন" (Post Ad) buttons.
   - On submit:
     - Call `listingService.createListing()` with all form data.
     - Show success toast: "আপনার বিজ্ঞাপন পোস্ট করা হয়েছে এবং পর্যালোচনার অপেক্ষায় আছে।" (Your ad has been posted and is pending review.)
     - Redirect to `/dashboard/my-listings`.
   - Step progress indicator at the top showing current step with completion status.
   - Style with `CreateListingPage.css`.

2. Create `src/pages/listings/EditListingPage.tsx`:
   - URL route: `/listings/:id/edit` — requires authenticated + verified user + must be the owner.
   - Same form as CreateListingPage but pre-populated with existing listing data.
   - Fetches the listing first, then fills the form.
   - On submit: Call `listingService.updateListing()`. Show a warning if title or price change is significant (will trigger re-moderation).

3. Create `src/components/common/ImageUploader.tsx`:
   - Reusable image upload component with drag-and-drop.
   - Props: `maxFiles: number`, `images: string[]`, `onImagesChange`, `onUpload`.
   - Handles: File validation (type, size), client-side compression, presigned URL fetch, S3 upload, progress tracking.
   - Style: Dashed border drop zone, thumbnail grid with delete buttons, progress bars.

4. Create `src/components/common/StepIndicator.tsx`:
   - A horizontal step progress indicator.
   - Props: `steps: string[]`, `currentStep: number`.
   - Shows numbered circles connected by lines. Completed steps are green, current step is blue, upcoming steps are gray.

5. Create `src/utils/locations.ts`:
   - Export Bangladesh location data:
     - `DIVISIONS`: Array of division names.
     - `DISTRICTS`: Object mapping division → array of district names.
     - `THANAS`: Object mapping district → array of thana names.
   - Include at least 5-6 divisions with 3-4 districts each and 3-4 thanas per district for a working demo.
```

---

## Phase 6: User Profile & Dashboard

---

### Prompt 15 — User Profile Pages (My Profile, Public Profile, Edit Profile)

```
In the Becha-Kena frontend, create the user profile pages.

Requirements:

1. Create `src/pages/profile/MyProfilePage.tsx`:
   - URL route: `/profile` — requires authentication (ProtectedRoute).
   - **Profile Header Section:**
     - Large avatar circle with the first letter of the user's display name, colored based on the letter.
     - Display name (large, bold).
     - Verified badge if `isVerified` (green shield + "✓ ভেরিফাইড সিটিজেন").
     - If `verifiedName` exists: "আইনত যাচাইকৃত নাম: [verifiedName]".
     - If NOT verified: A yellow warning banner "আপনার অ্যাকাউন্ট যাচাই করা হয়নি। বিজ্ঞাপন দিতে ও চ্যাট করতে যাচাই করুন।" (Your account is not verified) with a "এখনই যাচাই করুন" (Verify Now) button → navigates to `/verify`.
     - Rating stars + total reviews count.
     - Member since date.
     - Phone number (partially masked: 017****5678).
   - **Profile Stats Cards:**
     - Total Active Listings count.
     - Total Sold Items count.
     - Total Reviews count.
     - Average Rating.
   - **Quick Action Buttons:**
     - "প্রোফাইল সম্পাদনা" (Edit Profile) → `/profile/edit`
     - "আমার বিজ্ঞাপন" (My Listings) → `/dashboard/my-listings`
     - "মেসেজ" (Messages) → `/chat`
   - **Recent Reviews Section:**
     - Last 3-5 reviews received by this user. Fetched via `reviewService.getReviewsForUser(userId)`.
     - Each review: Reviewer name, rating stars, review text, date.
     - "সব রিভিউ দেখুন" (View All Reviews) link.
   - **Account Actions:**
     - "অ্যাকাউন্ট ডিলিট করুন" (Delete Account) — red text link. On click, opens a confirmation modal with a warning about 30-day PII retention.
   - Style with `MyProfilePage.css`.

2. Create `src/pages/profile/PublicProfilePage.tsx`:
   - URL route: `/user/:id` — public, no auth required.
   - Similar to MyProfilePage but shows only public information:
     - Display name, verified badge, verified name, rating, reviews, member since.
     - No phone number, no edit buttons, no account actions.
   - Shows the user's active listings grid.
   - Shows reviews section.

3. Create `src/pages/profile/EditProfilePage.tsx`:
   - URL route: `/profile/edit` — requires authentication.
   - Form fields:
     - Display Name input (1-30 chars). Current value pre-filled.
   - "সেভ করুন" (Save) button → calls `userService.updateProfile()`. Show success toast.
   - "বাতিল করুন" (Cancel) → go back to profile.
   - Style with `EditProfilePage.css`.

4. Create `src/components/ui/ReviewCard.tsx`:
   - Reusable review display card.
   - Props: `review: IReview`.
   - Shows: Reviewer avatar, display name, rating stars, review text, date.
   - Style with `ReviewCard.css`.

5. Create `src/components/ui/UserAvatar.tsx`:
   - Reusable avatar component.
   - Props: `name: string`, `size: 'sm' | 'md' | 'lg' | 'xl'`, `src?: string`.
   - If no `src`, shows the first letter of the name in a colored circle (color derived from the name hash).
```

---

### Prompt 16 — Seller Dashboard (My Listings Management)

```
In the Becha-Kena frontend, create the seller dashboard for managing listings.

Requirements:

1. Create `src/pages/dashboard/MyListingsPage.tsx`:
   - URL route: `/dashboard/my-listings` — requires authentication (ProtectedRoute).
   - **Tab Navigation:**
     - "সব" (All) — shows all listings.
     - "সক্রিয়" (Active) — status: active.
     - "অপেক্ষমান" (Pending) — status: pending (in moderation queue).
     - "আর্কাইভড" (Archived) — status: archived/expired.
     - "বিক্রিত" (Sold) — status: sold.
   - Each tab shows a count badge (e.g., "সক্রিয় (১২)").
   - **Listing Items:** Display as a list (not grid) with more actions:
     - Thumbnail image, title, price, status badge (color-coded), posted date, expiry date, view count.
     - **Action buttons per listing:**
       - "সম্পাদনা" (Edit) → `/listings/:id/edit` (only for pending/active).
       - "বিক্রি হয়েছে" (Mark as Sold) — opens a modal to select the buyer from chat history (only for active).
       - "নবায়ন" (Renew) — extends listing for 30 more days (only for archived/expiring).
       - "মুছুন" (Delete) — archives the listing with confirmation modal.
   - If no listings → empty state: "আপনার কোন বিজ্ঞাপন নেই। আপনার প্রথম বিজ্ঞাপন পোস্ট করুন!" with a "Post Ad" CTA button.
   - Fetches data using React Query: `listingService.getMyListings(status)`.
   - Style with `MyListingsPage.css`.

2. Create `src/components/dashboard/MyListingItem.tsx`:
   - A list-style listing management card.
   - Props: `listing: IListing`, `onEdit`, `onSold`, `onRenew`, `onDelete`.
   - Shows: Image thumbnail (100x80), title, price, status badge, dates, action buttons.
   - Status badge colors: active=green, pending=yellow, archived=gray, sold=blue.
   - Style with `MyListingItem.css`.

3. Create `src/components/common/StatusBadge.tsx`:
   - Reusable status pill badge.
   - Props: `status: string`, `variant: 'success' | 'warning' | 'danger' | 'info' | 'neutral'`.
   - Colored pill with text.

4. Create `src/components/common/ConfirmModal.tsx`:
   - A reusable confirmation modal/dialog.
   - Props: `isOpen`, `onClose`, `onConfirm`, `title`, `message`, `confirmText`, `confirmVariant: 'primary' | 'danger'`.
   - Modal overlay with centered card, title, message, Cancel and Confirm buttons.
   - Style with `ConfirmModal.css` — backdrop blur, fade-in animation.

5. Create `src/components/dashboard/MarkAsSoldModal.tsx`:
   - A specialized modal for the "Mark as Sold" flow.
   - Fetches chat rooms for the listing to show a list of buyers who have chatted about this listing.
   - User selects a buyer from the list.
   - On confirm: Calls `listingService.markAsSold(listingId, selectedBuyerId)`.
   - Shows success toast and refreshes the listings.
```

---

## Phase 7: Chat System (Real-time Messaging)

---

### Prompt 17 — Chat Inbox & Chat Room Pages

```
In the Becha-Kena frontend, create the real-time chat system with chat inbox and chat room pages.

Requirements:

1. Create `src/hooks/useSocket.ts`:
   - A custom hook that manages the Socket.io connection.
   - On mount: Connect to the Socket.io server at `VITE_SOCKET_URL` with the `/chat` namespace. Pass JWT cookies via handshake.
   - Returns: `socket` instance, `isConnected` boolean.
   - On unmount: Disconnect the socket.
   - Handle reconnection logic with exponential backoff.

2. Create `src/pages/chat/ChatPage.tsx`:
   - URL route: `/chat` — requires authenticated + verified user (VerifiedRoute).
   - **Layout (split panel on desktop, full-screen switching on mobile):**
     - **Left Panel (35% width):** Chat rooms list.
     - **Right Panel (65% width):** Active chat conversation.
   - On mobile: Show only the rooms list. Tapping a room navigates to `/chat/:roomId` which shows the conversation full-screen with a back button.

3. Create `src/components/chat/ChatRoomsList.tsx`:
   - Fetches all chat rooms via `chatService.getRooms()`.
   - Each room item shows:
     - Other user's avatar and display name (with verified badge).
     - Listing title (small, muted text).
     - Last message preview (truncated, 1 line).
     - Timestamp of last message ("২ মিনিট আগে").
     - Unread message count badge (if any).
   - Active/selected room is highlighted.
   - Rooms are sorted by most recent activity.
   - Real-time: Listen for `new_message` socket events to update the last message preview and unread count.
   - Style with `ChatRoomsList.css`.

4. Create `src/components/chat/ChatConversation.tsx`:
   - Displays the message history for a selected chat room.
   - **Top bar:** Other user's name + verified badge, listing title + small thumbnail, listing price. A "বিজ্ঞাপন দেখুন" (View Listing) link.
   - **Safety Banner (fixed):** A yellow bar at the top of the message area:
     - "⚠️ নিরাপত্তা: জনবহুল জায়গায় দেখা করুন। অগ্রিম টাকা পাঠাবেন না।" (Safety: Meet in public. Don't send advance payment.)
   - **Messages Area:**
     - Scrollable message history.
     - Sender messages on the right (blue background, white text).
     - Received messages on the left (light gray background, dark text).
     - Each message bubble shows: text, timestamp (small, below).
     - Date separators between different days ("আজ", "গতকাল", "১০ আগস্ট ২০২৬").
     - "Typing..." indicator shown when the other user is typing.
   - **Message Input:**
     - Text input field with placeholder "মেসেজ লিখুন..." (Type a message...).
     - Send button (arrow icon, blue).
     - On submit: Emit `send_message` via socket. Add the message to the local state optimistically.
     - On typing: Emit `typing` event (debounced).
   - **Real-time Events:**
     - `join_room` on component mount.
     - Listen for `new_message` → append to messages.
     - Listen for `user_typing` → show typing indicator.
     - Listen for `message_warning` → show toast with the warning (e.g., "External links are not allowed").
     - `mark_read` when the conversation is opened.
   - Auto-scroll to the bottom on new messages.
   - Load more (older) messages on scroll to top (infinite scroll pagination).
   - Style with `ChatConversation.css` — Messenger/WhatsApp-like bubble design.

5. Create `src/components/chat/MessageBubble.tsx`:
   - A single chat message bubble.
   - Props: `message: IMessage`, `isOwn: boolean`.
   - Rounded bubble with tail, different alignment and color for own vs received.
   - Timestamp in small text below the bubble.

6. Style with chat-specific CSS files — dark/light message bubbles, smooth scroll, typing animation dots.
```

---

## Phase 8: KYC Verification Flow

---

### Prompt 18 — Identity Verification Pages (Adult & Minor)

```
In the Becha-Kena frontend, create the KYC (Know Your Customer) identity verification flow.

Requirements:

1. Create `src/pages/kyc/VerificationPage.tsx`:
   - URL route: `/verify` — requires authentication (ProtectedRoute). If already verified → redirect to profile with toast "আপনার অ্যাকাউন্ট ইতিমধ্যে যাচাই করা হয়েছে" (Already verified).
   - **Initial Choice Screen:**
     - Heading: "পরিচয় যাচাই করুন" (Verify Your Identity).
     - Subtext: "বিজ্ঞাপন দিতে ও চ্যাট করতে আপনার জাতীয় পরিচয়পত্র (NID) দিয়ে যাচাই সম্পন্ন করুন।"
     - Two large option cards:
       - "প্রাপ্তবয়স্ক (১৮+)" — Adult verification. Icon: ID card.
       - "অপ্রাপ্তবয়স্ক (১৮ এর নিচে)" — Minor verification (parent NID). Icon: Family.
     - Selecting one transitions to the respective verification form.

   - **Adult Verification Form:**
     - Step 1: NID Number input (numeric, 10 or 17 digits). Date of Birth date picker.
     - Step 2: Selfie capture. Show a camera preview area (use `navigator.mediaDevices.getUserMedia()`). A "ছবি তুলুন" (Capture) button. After capture, show the photo preview with "আবার তুলুন" (Retake) and "পরবর্তী" (Next) options.
       - For MVP: Alternatively allow file upload of a selfie image.
     - Step 3: Review & Submit. Show a summary of entered data. Privacy disclaimer text: "আপনার NID নম্বর এনক্রিপ্ট করে সংরক্ষণ করা হবে।" (Your NID number will be stored encrypted).
     - On submit: Upload selfie via presigned URL to S3. Then call `kycService.submitAdultVerification()`.
     - Handle responses:
       - Approved → show success animation + "যাচাই সম্পন্ন!" message → redirect to profile.
       - Pending manual review → show info: "আপনার আবেদন ম্যানুয়াল পর্যালোচনার জন্য পাঠানো হয়েছে। ১২ ঘণ্টার মধ্যে ফলাফল জানানো হবে।"
       - Failed (face match) → show error with retry option. Show remaining attempts today.
       - Rate limited (3 attempts exceeded) → show error: "আজকের জন্য সর্বোচ্চ চেষ্টা শেষ। আগামীকাল আবার চেষ্টা করুন।"

   - **Minor Verification Form:**
     - Similar to adult but with:
       - "অভিভাবকের NID নম্বর" (Parent/Guardian NID Number) input.
       - Parent's Date of Birth.
       - Parent's Selfie capture/upload.
       - Consent checkbox: "আমি নিশ্চিত করছি যে আমার অভিভাবক এই যাচাইয়ের জন্য সম্মতি দিয়েছেন।" (I confirm my parent/guardian has consented to this verification.)
     - On submit: Call `kycService.submitMinorVerification()`.

   - Style with `VerificationPage.css`.

2. Create `src/pages/kyc/VerificationStatusPage.tsx`:
   - URL route: `/verify/status` — shows the current verification status.
   - Fetches status via `kycService.getVerificationStatus()`.
   - Shows: Status (Pending/Approved/Rejected), submitted date, reason (if rejected), next steps.

3. Create `src/components/common/CameraCapture.tsx`:
   - A reusable camera capture component using the browser's MediaDevices API.
   - Props: `onCapture(file: File)`, `facingMode: 'user' | 'environment'`.
   - Shows a live camera preview, a capture button, and a preview of the captured image.
   - Fallback: If camera access is denied, show a file upload input instead.
```

---

## Phase 9: Reviews & Reports

---

### Prompt 19 — Review Submission & Report Modal

```
In the Becha-Kena frontend, create the review submission flow and report modal.

Requirements:

1. Create `src/components/review/SubmitReviewModal.tsx`:
   - A modal/dialog that appears when a buyer wants to review a seller after a sale.
   - Triggered from: The "Sold" listing in the buyer's chat, or a prompt after marking as sold.
   - **Form fields:**
     - Star rating selector: 5 interactive star icons. Hover to preview, click to set. Required.
     - Review text: Textarea (max 500 chars) with character counter.
   - "রিভিউ জমা দিন" (Submit Review) button.
   - On submit: Call `reviewService.submitReview({ listingId, rating, reviewText })`.
   - Validation: Rating required, reviewText required.
   - Show success toast on completion.
   - Style with `SubmitReviewModal.css`.

2. Create `src/components/ui/StarRatingInput.tsx`:
   - An interactive star rating input component.
   - Props: `value: number`, `onChange(rating: number)`, `size: 'sm' | 'md' | 'lg'`.
   - 5 star icons. Hovering over a star highlights it and all previous stars. Clicking sets the value.
   - Golden/yellow color for filled stars, gray for empty.

3. Create `src/components/report/ReportModal.tsx`:
   - A modal for reporting a listing or user.
   - Props: `targetType: 'Listing' | 'User'`, `targetId: string`, `isOpen`, `onClose`.
   - **Form fields:**
     - Reason selector: Radio buttons for — "প্রতারণা" (Scam), "হয়রানি" (Harassment), "ভুল তথ্য" (Misrepresentation), "অনুপযুক্ত" (Inappropriate), "অন্যান্য" (Other).
     - Description: Textarea (max 1000 chars). "বিস্তারিত বর্ণনা করুন" (Describe in detail).
   - "রিপোর্ট জমা দিন" (Submit Report) button.
   - On submit: Call `reportService.submitReport()`. Show success toast.
   - Style with `ReportModal.css`.

4. Create `src/pages/profile/MyReportsPage.tsx`:
   - URL route: `/profile/reports` — shows user's submitted reports with their statuses.
   - Fetches via `reportService.getMyReports()`.
   - List of report items: target type, reason, status badge, submitted date.
```

---

## Phase 10: Admin & Moderation Panel

---

### Prompt 20 — Admin Dashboard Layout & Navigation

```
In the Becha-Kena frontend, create the admin dashboard layout with sidebar navigation. This is a separate layout from the public-facing pages.

Requirements:

1. Create `src/components/layout/AdminLayout.tsx`:
   - A dashboard layout with:
     - **Left Sidebar (fixed, 260px wide):**
       - Becha-Kena Admin logo at the top.
       - Navigation menu items with icons:
         - "ড্যাশবোর্ড" (Dashboard) — home icon
         - "মডারেশন কিউ" (Moderation Queue) — shield icon, with pending count badge
         - "KYC যাচাই কিউ" (KYC Verification Queue) — id-card icon, with pending count badge
         - "রিপোর্টস" (Reports) — flag icon, with pending count badge
         - "ইউজার ম্যানেজমেন্ট" (User Management) — users icon
       - Active nav item highlighted with blue background.
       - Logged-in admin's name at the bottom with logout option.
     - **Main Content Area:** Renders the child page content.
     - **Top Bar:** Page title, breadcrumb, admin user avatar with dropdown.
   - Only accessible by users with `role: 'admin'` or `role: 'moderator'`. Create `src/routes/AdminRoute.tsx` wrapper that checks role.
   - Style with `AdminLayout.css` — dark sidebar, clean white content area.

2. Create `src/pages/admin/AdminDashboardPage.tsx`:
   - URL route: `/admin` — shows overview cards:
     - Total pending listings (moderation queue).
     - Total pending KYC reviews.
     - Total pending reports.
     - Total active users.
     - Total active listings.
   - Each card is clickable → navigates to the respective queue page.
   - Recent activity feed: Last 10 actions taken by moderators.
   - Style with `AdminDashboardPage.css`.
```

---

### Prompt 21 — Moderation Queue, KYC Queue & Report Management Pages

```
In the Becha-Kena frontend, create the admin moderation queue, KYC review queue, and report management pages.

Requirements:

1. Create `src/pages/admin/ModerationQueuePage.tsx`:
   - URL route: `/admin/moderation` — within AdminLayout.
   - Fetches pending listings via `adminService.getModerationQueue()`.
   - **Table/List View:**
     - Columns: Thumbnail, Title, Seller Name, Category, Price, Posted Date, Flag Type (if flagged), Actions.
     - Flag Type badge: If `moderationFlags.flagType` is set → show "🚩 Keyword Flagged" or similar warning.
   - **Actions per listing:**
     - "অনুমোদন" (Approve) — green button. On click: Call `adminService.moderateListing(id, 'approve')`.
     - "বাতিল" (Reject) — red button. On click: Opens a small modal to enter rejection reason, then calls `adminService.moderateListing(id, 'reject', reason)`.
     - "বিস্তারিত দেখুন" (View Details) — opens listing detail in a slide-out panel or new tab.
   - Pagination at the bottom.
   - Show success toast after each action and remove the item from the list.
   - Style with `ModerationQueuePage.css`.

2. Create `src/pages/admin/KYCQueuePage.tsx`:
   - URL route: `/admin/kyc-queue` — within AdminLayout.
   - Fetches pending verifications via `adminService.getKYCQueue()`.
   - **Table/List View:**
     - Columns: User Name, Phone Number, Verification Type (Adult/Minor), Submitted Date, Manual Review Reason, Actions.
   - **Actions per verification:**
     - "অনুমোদন" (Approve) — calls `adminService.resolveVerification(logId, 'approve')`.
     - "বাতিল" (Reject) — calls `adminService.resolveVerification(logId, 'reject')`.
     - "সেলফি দেখুন" (View Selfie) — fetches a presigned URL for the selfie image and displays it in a modal (5-minute expiry).
   - Style with `KYCQueuePage.css`.

3. Create `src/pages/admin/ReportManagementPage.tsx`:
   - URL route: `/admin/reports` — within AdminLayout.
   - Fetches reports via `adminService.getReports()`.
   - **Filter tabs:** "অপেক্ষমান" (Pending), "সমাধান হয়েছে" (Resolved), "বাতিল" (Dismissed).
   - **Table/List View:**
     - Columns: Reporter Name, Target Type, Target (Listing Title or User Name), Reason, Description (truncated), Status, Submitted Date, Actions.
   - **Actions per report:**
     - "সমাধান করুন" (Resolve) — opens a modal for entering resolution text. Calls `adminService.resolveReport()`.
     - "বাতিল করুন" (Dismiss) — calls `adminService.dismissReport()` with confirmation.
     - "ইউজার ব্যান করুন" (Ban User) — opens a confirmation modal. Calls `adminService.banUser()`. Only for admin role.
   - Style with `ReportManagementPage.css`.
```

---

## Phase 11: Routing & Navigation Setup

---

### Prompt 22 — Complete Route Configuration & Navigation Guards

```
In the Becha-Kena frontend, set up the complete routing configuration with all pages, navigation guards, and 404 handling.

Requirements:

1. Create `src/routes/AppRouter.tsx`:
   - Define all application routes using React Router v6 `createBrowserRouter` or `<Routes>`:

   **Public Routes (wrapped in Layout):**
   - `/` → HomePage
   - `/listings` → BrowseListingsPage
   - `/listings/:id` → ListingDetailPage
   - `/user/:id` → PublicProfilePage
   - `/login` → LoginPage (redirect to `/` if already authenticated)

   **Protected Routes (require login, wrapped in Layout):**
   - `/profile` → MyProfilePage
   - `/profile/edit` → EditProfilePage
   - `/profile/reports` → MyReportsPage
   - `/verify` → VerificationPage
   - `/verify/status` → VerificationStatusPage

   **Verified Routes (require login + NID verification, wrapped in Layout):**
   - `/listings/create` → CreateListingPage
   - `/listings/:id/edit` → EditListingPage
   - `/dashboard/my-listings` → MyListingsPage
   - `/chat` → ChatPage
   - `/chat/:roomId` → ChatPage (with room pre-selected)

   **Admin Routes (require admin/moderator role, wrapped in AdminLayout):**
   - `/admin` → AdminDashboardPage
   - `/admin/moderation` → ModerationQueuePage
   - `/admin/kyc-queue` → KYCQueuePage
   - `/admin/reports` → ReportManagementPage

   **Error Routes:**
   - `*` → NotFoundPage (404)

2. Create `src/pages/errors/NotFoundPage.tsx`:
   - A styled 404 page with:
     - Large "৪০৪" text.
     - "পৃষ্ঠাটি পাওয়া যায়নি" (Page Not Found) message.
     - An illustration or icon.
     - "হোম পেজে ফিরে যান" (Go to Home) button.
   - Style with `NotFoundPage.css`.

3. Create `src/pages/errors/SuspendedPage.tsx`:
   - A page shown when a suspended user tries to access the app.
   - Message: "আপনার অ্যাকাউন্ট স্থগিত করা হয়েছে" (Your account has been suspended).
   - Contact support information.

4. Update `src/App.tsx`:
   - Replace the placeholder content with `<AppRouter />`.
   - Ensure all providers wrap the router.
   - On mount: Call `fetchUser()` to restore session from cookies.

5. Update the `Header` component:
   - All navigation links should now use React Router `<Link>` or `useNavigate()`.
   - Active page link highlighting based on current route.
   - "Post Ad" button navigates to `/listings/create` (or `/verify` if not verified, or `/login` if not authenticated).
   - Messages icon navigates to `/chat`.
```

---

## Phase 12: Common UI Components & Polish

---

### Prompt 23 — Reusable Common UI Components

```
In the Becha-Kena frontend, create the remaining reusable common UI components used throughout the app.

Requirements:

1. Create `src/components/common/Button.tsx`:
   - Props: `variant: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger'`, `size: 'sm' | 'md' | 'lg'`, `isLoading`, `disabled`, `fullWidth`, `leftIcon`, `rightIcon`, `children`.
   - Primary: Blue background, white text. Secondary: Yellow background, dark text. Outline: Transparent with border. Ghost: No border/bg. Danger: Red.
   - Loading state: Show spinner, disable clicks.
   - Style with `Button.css` — hover effects, active pressed effect, focus ring.

2. Create `src/components/common/Input.tsx`:
   - Props: `label`, `type`, `placeholder`, `error`, `helperText`, `leftIcon`, `rightIcon`, `disabled`, all native input props.
   - Shows label above, input with optional icons, error message below in red.
   - Style with `Input.css` — border on focus turns blue, error state turns red.

3. Create `src/components/common/Select.tsx`:
   - Props: `label`, `options: { value, label }[]`, `placeholder`, `error`, `value`, `onChange`.
   - Custom styled dropdown.

4. Create `src/components/common/Modal.tsx`:
   - Props: `isOpen`, `onClose`, `title`, `size: 'sm' | 'md' | 'lg'`, `children`, `footer`.
   - Overlay backdrop (semi-transparent dark), centered modal card.
   - Close button (X) on top-right. Close on Escape key and backdrop click.
   - Smooth fade-in/scale-up animation.
   - Style with `Modal.css`.

5. Create `src/components/common/Toast.tsx`:
   - Configure react-hot-toast with custom styling:
     - Success: Green accent.
     - Error: Red accent.
     - Loading: Blue spinner.
   - Positioned top-right.
   - Auto-dismiss after 4 seconds.

6. Create `src/components/common/EmptyState.tsx`:
   - Props: `icon`, `title`, `description`, `actionText`, `actionLink`.
   - Centered content with a large icon, title, description text, and optional action button.

7. Create `src/components/common/Skeleton.tsx`:
   - Props: `width`, `height`, `variant: 'text' | 'circular' | 'rectangular'`, `count`.
   - A pulsing placeholder loading component.
   - Style with `Skeleton.css` — shimmer animation effect.

8. Create `src/components/common/Breadcrumb.tsx`:
   - Props: `items: { label, path? }[]`.
   - Shows: "Home > Category > Listing Title" with clickable links except the last item.

9. Create `src/components/common/Tabs.tsx`:
   - Props: `tabs: { label, value, count? }[]`, `activeTab`, `onChange`.
   - Horizontal tab bar with active tab indicator (bottom border or filled background).
```

---

## Phase 13: SEO, Accessibility & Performance

---

### Prompt 24 — SEO Meta Tags, Accessibility & Performance Optimization

```
In the Becha-Kena frontend, implement SEO best practices, accessibility improvements, and performance optimizations.

Requirements:

1. Create `src/hooks/useDocumentTitle.ts`:
   - A custom hook that sets the document `<title>` dynamically.
   - Usage: `useDocumentTitle('Browse Listings - Becha-Kena')`.
   - On unmount, restore the default title "Becha-Kena — বাংলাদেশের নিরাপদ মার্কেটপ্লেস".

2. Create `src/components/common/SEOHead.tsx`:
   - A component that sets meta tags using `document.head` manipulation or a library.
   - Props: `title`, `description`, `keywords`, `ogImage`, `ogUrl`.
   - Sets: `<title>`, `<meta name="description">`, Open Graph tags, Twitter card tags.
   - Add this component to all page-level components with appropriate meta content:
     - HomePage: "Becha-Kena — বাংলাদেশের সবচেয়ে নিরাপদ সেকেন্ড-হ্যান্ড মার্কেটপ্লেস"
     - BrowseListingsPage: "Browse Listings — Becha-Kena"
     - ListingDetailPage: Dynamic — "{Listing Title} — ৳{Price} — Becha-Kena"

3. Accessibility improvements across all components:
   - All interactive elements must have `aria-label` or visible labels.
   - All images must have meaningful `alt` text. Listing images: `alt="{listing title} - photo {index}"`.
   - Form inputs must be associated with labels via `htmlFor`/`id`.
   - Modals must trap focus when open and return focus on close.
   - The skip navigation link at the very top of the page for keyboard users.
   - Color contrast must meet WCAG AA standards (already ensured by our color palette).
   - The OTP input must be keyboard-navigable.

4. Performance optimizations:
   - Implement lazy loading for page-level components using `React.lazy()` + `Suspense`:
     - All admin pages, chat page, create listing page should be lazy-loaded.
   - Images: Add `loading="lazy"` to all images not above the fold.
   - Listing cards: Use intersection observer for lazy rendering of listing cards below the fold.
   - Implement `React.memo` on frequently re-rendered components like ListingCard, MessageBubble.

5. Update `index.html`:
   - Add proper `<html lang="bn">` (Bengali as primary language).
   - Add `<meta name="description" content="বেচা-কেনা — বাংলাদেশের সবচেয়ে নিরাপদ সেকেন্ড-হ্যান্ড মার্কেটপ্লেস। ১০০% ভেরিফাইড ইউজার। NID যাচাই ছাড়া কেনা-বেচা নয়।">`.
   - Add `<meta name="viewport" content="width=device-width, initial-scale=1.0">`.
   - Add favicon.
   - Preconnect to Google Fonts and API server.
```

---

## Phase 14: Responsive Design & Mobile Optimization

---

### Prompt 25 — Responsive Design Audit & Mobile Polish

```
In the Becha-Kena frontend, perform a comprehensive responsive design audit and mobile optimization pass.

Requirements:

1. Define breakpoints (should already be in variables.css but verify):
   - Mobile: 0 - 480px
   - Tablet: 481px - 768px
   - Small Desktop: 769px - 1024px
   - Desktop: 1025px - 1440px
   - Large Desktop: 1441px+

2. Review and fix ALL page layouts for proper responsiveness:
   - **HomePage:** Sidebar collapses into horizontal scroll on mobile. Banner right-column stacks below. Category circles are scrollable.
   - **BrowseListingsPage:** Filter sidebar becomes a slide-up drawer triggered by a filter button on mobile. Grid becomes 2-col on tablet, 1-col on mobile.
   - **ListingDetailPage:** Two-column layout stacks to single column on mobile (images full-width on top, details below). Action buttons become sticky at the bottom on mobile.
   - **ChatPage:** Split panel becomes full-screen switching (room list → conversation) on mobile. Input bar stays fixed at the bottom.
   - **CreateListingPage:** Step wizard takes full width. Image upload thumbnails adjust to smaller sizes.
   - **AdminLayout:** Sidebar collapses into a hamburger menu on mobile/tablet.

3. Touch optimization:
   - All tap targets must be at least 44x44px on mobile.
   - Swipe gestures on image galleries and carousels.
   - Pull-to-refresh on listing pages (optional, nice to have).

4. Mobile-specific UI adjustments:
   - The MobileBottomNav is always visible on mobile (z-index above content).
   - The Header search bar collapses into an expandable overlay on mobile.
   - Font sizes adjust for readability on small screens.
   - Modals become full-screen drawers on mobile instead of centered cards.

5. Test and fix:
   - No horizontal scrollbar on any page at any breakpoint.
   - Images don't overflow their containers.
   - Text doesn't overflow or clip.
   - All forms are usable on mobile keyboards (proper input types: `tel` for phone, `number` for price, etc.).
```

---

## Phase 15: Final Integration, Testing & Build

---

### Prompt 26 — Final Integration, Error Boundaries & Production Build

```
In the Becha-Kena frontend, perform the final integration, add error boundaries, and prepare for production build.

Requirements:

1. Create `src/components/common/ErrorBoundary.tsx`:
   - A React Error Boundary class component.
   - Catches rendering errors in child components.
   - Shows a fallback UI: "কিছু একটা সমস্যা হয়েছে" (Something went wrong) with a "রিফ্রেশ করুন" (Refresh) button.
   - Logs the error to the console (future: send to error tracking service).

2. Wrap the root App component with `<ErrorBoundary>`.

3. Create `src/components/common/NetworkStatus.tsx`:
   - Monitors the browser's online/offline status.
   - When offline → show a red banner at the top: "ইন্টারনেট সংযোগ বিচ্ছিন্ন" (No Internet Connection).
   - When back online → show a green banner briefly: "সংযোগ পুনরুদ্ধার হয়েছে" (Connection Restored).

4. Final integration checklist:
   - Verify ALL service functions are correctly connected to their respective pages.
   - Verify ALL navigation links work correctly.
   - Verify cookie-based authentication works (login → navigate → refresh → still logged in).
   - Verify socket connection works with the backend.
   - Verify error handling: API errors show user-friendly toast messages.
   - Verify loading states: Every data-fetching page shows skeletons or spinners.
   - Verify empty states: Every list/grid shows appropriate empty state messages.
   - Verify the "Post Ad" flow: Login → Verify → Create Listing → Pending → Admin Approves → Active.

5. Update `vite.config.ts` for production build:
   - Enable source maps for debugging.
   - Configure chunk splitting for vendor libraries.
   - Set build output to `dist/`.

6. Add npm scripts to `frontend/package.json`:
   - `"dev": "vite"` — development server
   - `"build": "tsc && vite build"` — production build
   - `"preview": "vite preview"` — preview production build locally

7. Create a README.md in the `frontend/` directory with:
   - Setup instructions (npm install, env variables).
   - Available scripts.
   - Project structure overview.
   - Backend dependency note (must run backend on port 5000).
```

---

## Summary: Prompt Execution Order

| Phase | Prompt # | Feature |
|-------|----------|---------|
| 1 | Prompt 1 | Project scaffolding & directory structure |
| 1 | Prompt 2 | Design system — global styles, CSS variables, theme |
| 1 | Prompt 3 | Axios instance, API services & TypeScript types |
| 1 | Prompt 4 | Zustand stores, auth provider & loading states |
| 2 | Prompt 5 | Top header bar, search bar & announcement banner |
| 2 | Prompt 6 | Category navigation bar & mega menu |
| 2 | Prompt 7 | Footer & mobile bottom navigation |
| 3 | Prompt 8 | Login page — phone number + OTP verification |
| 4 | Prompt 9 | Home page — hero banner carousel |
| 4 | Prompt 10 | Home page — trust bar, categories & hot deals |
| 4 | Prompt 11 | Home page — category sections & promo banners |
| 5 | Prompt 12 | Browse listings — search, filter & grid |
| 5 | Prompt 13 | Listing detail page |
| 5 | Prompt 14 | Create & edit listing pages |
| 6 | Prompt 15 | User profile pages |
| 6 | Prompt 16 | Seller dashboard — my listings management |
| 7 | Prompt 17 | Chat inbox & real-time chat room |
| 8 | Prompt 18 | KYC verification flow (adult & minor) |
| 9 | Prompt 19 | Review submission & report modal |
| 10 | Prompt 20 | Admin dashboard layout & navigation |
| 10 | Prompt 21 | Moderation, KYC & report management pages |
| 11 | Prompt 22 | Complete routing & navigation guards |
| 12 | Prompt 23 | Reusable common UI components |
| 13 | Prompt 24 | SEO, accessibility & performance optimization |
| 14 | Prompt 25 | Responsive design & mobile optimization |
| 15 | Prompt 26 | Final integration, error boundaries & production build |
