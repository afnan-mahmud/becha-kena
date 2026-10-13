# Becha-Kena Mobile — Test Checklist (Prompt 48)

How to run the full flow test:

```bash
# Terminal 1 — backend (needs backend/.env + MongoDB)
cd backend && npm install && npm run dev        # OTPs are printed here

# Terminal 2 — app (needs a development build for camera / notifications / location)
cd mobile-app && npm install && npx expo start
```

- Read OTPs from the backend terminal: `[SMS Gateway Mock] Sending OTP 123456 to +8801…`
- Approve KYC requests at `/admin/kyc-queue` and ads at `/admin/moderation` in the web admin panel.
- Two **verified** test accounts are needed for chat, sell and review flows (two phones, or a phone + an emulator).

Legend: ✅ verified · ⬜ to test on a device · ⚠️ known limitation

---

## 0. Automated checks (run in CI / before every commit)

| Check | Command | Status |
|---|---|---|
| Type check | `npx tsc --noEmit` | ✅ 0 errors |
| Lint | `npx expo lint` | ✅ 0 errors (remaining warnings are hook-dependency hints in Phase 1–3 screens and react-hook-form's known React Compiler skip) |
| Android bundle | `npx expo export --platform android` | ✅ bundles (Hermes bytecode ≈ 5.5 MB) |
| Formatters | `formatPrice(68000)` → `৳৬৮,০০০`, `formatDistance(2400)` → `২.৪ কিমি দূরে`, `maskPhone('+8801712345678')` → `017•••••678` | ✅ |

> The flows below were **not** executed on a phone in the environment where this
> code was written (no MongoDB / device available there). Run them in class and tick them off.

## 1. Auth

- ⬜ Fresh install → onboarding slides → login → OTP → home
- ⬜ Wrong OTP → shake + red boxes + "ভুল কোড" (`INVALID_OTP`)
- ⬜ 5 wrong OTPs → "অনেকবার ভুল হয়েছে" (`OTP_ATTEMPTS_EXCEEDED`), resend enabled
- ⬜ Expired OTP (wait 3 min) → `OTP_EXPIRED` message
- ⬜ Resend (max 3 on the screen; backend allows 5 requests/hour/IP)
- ⬜ Kill & reopen the app → auto-login through the refresh token
- ⬜ Wait > 15 min → next request refreshes the access token silently (single refresh, queued requests retried)
- ⬜ Socket reconnects after the token refresh (chat dot turns green again)
- ⬜ Logout → back to login, chat store + query cache cleared

## 2. KYC

- ⬜ Unverified user: post tab, chat tab, "কল করুন" and 🚩 report all show the verification prompt
- ⬜ Adult flow → status screen shows "রিভিউ চলছে…" → approve in admin → status screen polling shows the success check, `isVerified` becomes true everywhere
- ⬜ Rejected → red banner with `manualReviewReason`, "আবার আবেদন করুন"
- ⬜ Minor flow with consent checkbox
- ⬜ 4th attempt in a day → `KYC_LIMIT_REACHED` message
- ⬜ App in background while pending → approve → on foreground a local notification "অভিনন্দন! আপনি এখন ভেরিফাইড"

## 3. Listings

- ⬜ Create ad: category + condition → title/description/price (live counters) → 1-10 photos (camera + gallery, cover tag, long-press to change cover, failed upload → "আবার চেষ্টা") → location (picker / GPS + picker) → preview → submit
- ⬜ Success screen → "আমার বিজ্ঞাপন দেখুন" opens the রিভিউতে tab
- ⬜ Approve in admin → ad appears on Home and Search; foreground → "আপনার বিজ্ঞাপন অনুমোদিত হয়েছে!"
- ⬜ Reject in admin → My Listings shows "🔴 বাতিল" + reason
- ⬜ Edit an active ad's title → "বড় পরিবর্তনের কারণে বিজ্ঞাপনটি আবার রিভিউতে গেছে"
- ⬜ Renew (≤ 5 days left / archived) and delete (confirm dialog)
- ⬜ Search: debounce, recent searches (saved on submit / blur, "সব মুছুন")
- ⬜ Filters: category, condition, price presets + manual range, division/district/thana, every sort, "আমার কাছাকাছি" (shows distance in cards)
- ⬜ Home location chip / Settings → ডিফল্ট এলাকা filters the home feed (persisted)
- ⬜ Public profile shows only active ads
- ⬜ Listing detail: carousel swipe, full-screen viewer (pinch, double-tap, swipe down), share, similar ads
- ⬜ `hidePhoneNumber` ad → "🔒 বিক্রেতা শুধু চ্যাটে যোগাযোগ করতে চান"; visible number opens the dialer

## 4. Chat (two verified accounts)

- ⬜ "চ্যাট করুন" on an ad → conversation opens (same room on second tap)
- ⬜ Send / receive in real time on two devices; bubbles animate in
- ⬜ Typing indicator in the conversation and "টাইপ করছে…" in the list
- ⬜ ✓ → ✓✓ (marigold) when the other person opens the chat
- ⬜ Unread badge on the tab and the room row; cleared on open
- ⬜ Message with a link / phone number → pre-send warning, server shows `[link removed]` / `***** *****` + warning banner
- ⬜ Scroll up loads older messages; date separators আজ / গতকাল / date
- ⬜ App open on another screen → in-app chat banner, tap opens the chat
- ⬜ App in background (< 30s) → local notification, tap opens the chat
- ⚠️ After 30s in background the socket disconnects, so messages that arrive later only show up when the app returns (the backend does not send pushes yet)

## 5. Sell & review

- ⬜ Seller: My Listings → "বিক্রি হয়েছে" → pick the buyer who chatted → toast "বিক্রিত! ক্রেতা এখন রিভিউ দিতে পারবেন"
- ⬜ Buyer: conversation and listing detail show "রিভিউ দিন" → stars + text → success → seller rating updates on the profile
- ⬜ Second review → "এই বিজ্ঞাপনের জন্য আপনি আগেই রিভিউ দিয়েছেন" and the prompt disappears
- ⬜ "বেচা-কেনার বাইরে বিক্রি করেছি" → no review prompt for anyone

## 6. Reports

- ⬜ Report an ad and a user (reason → description → confirm → success with report number)
- ⬜ Duplicate report → `DUPLICATE_REPORT` message
- ⬜ My Reports lists both; resolve in admin → status + resolution text update on refresh

## 7. Profile & settings

- ⬜ Edit display name (1-30 chars, HTML rejected) → profile updates
- ⬜ Theme: system / light / dark applies instantly and persists
- ⬜ Notification preferences: toggles, "সব বন্ধ", quiet hours (start/end pickers), permission row opens system settings when denied
- ⬜ Terms / Privacy open in the in-app browser; About shows the app version
- ⬜ One-time disclaimer appears once after the first login
- ⬜ Delete account → type DELETE → back to welcome; log in again within 30 days → account restored

## 8. Edge cases

- ⬜ Airplane mode → offline banner, error states show the offline variant with retry, queries refetch on reconnect
- ⬜ Backend stopped → "সার্ভারে সমস্যা হয়েছে" / retry everywhere
- ⬜ Empty states: no ads, no chats, no reviews, no reports, no search results
- ⬜ Very long titles (80) and descriptions (1000) wrap correctly
- ⬜ Bangla text renders with Hind Siliguri on every screen
- ⬜ Small (iPhone SE) and large screens; Android back button closes sheets / goes back
- ⬜ Dark mode on every screen
- ⬜ "Reduce Motion" on → no stagger/scale animations

## Performance (Prompt 49)

- ⬜ React DevTools profiler: Home scroll and Conversation stay under 16 ms/frame
- ✅ Only the Ionicons font and the 4 used Hind Siliguri weights are bundled
- ✅ Listing detail is prefetched on card press-in; search keeps the previous page while loading
