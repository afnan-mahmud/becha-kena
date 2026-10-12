# Lesson 8.4 — প্রজেক্ট সেটআপ, ডিজাইন সিস্টেম, API ক্লায়েন্ট ও OTP লগইন

> **কভার করা প্রম্পট:** Prompt 1 – 7 (Phase 0 + Phase 1)
> **সময়:** ~২.৫ ঘণ্টা
> **ক্লাস শেষে যা থাকবে:** একটি পরিষ্কার ফোল্ডার স্ট্রাকচারের Expo অ্যাপ, বেচা-কেনার নিজস্ব থিম, Bearer-token ভিত্তিক API ক্লায়েন্ট (অটো টোকেন রিফ্রেশ সহ), অনবোর্ডিং স্ক্রিন এবং ফোন নম্বর + OTP দিয়ে পুরোপুরি কাজ করা লগইন।

---

## 🎯 শেখার লক্ষ্য

এই ক্লাস শেষে স্টুডেন্টরা পারবে —

1. Expo Router-এর **file-based routing** ও **route group** (`(auth)`, `(app)`, `(tabs)`) ব্যাখ্যা করতে।
2. একটি **design system** (রং, টাইপোগ্রাফি, স্পেসিং) কেন দরকার এবং কীভাবে বানাতে হয় বুঝতে।
3. **Access token + Refresh token** দিয়ে মোবাইল অথেনটিকেশন কীভাবে কাজ করে ব্যাখ্যা করতে।
4. Axios **interceptor** দিয়ে অটোমেটিক টোকেন যোগ করা ও মেয়াদ শেষ হলে রিফ্রেশ করা।
5. **Zustand** দিয়ে গ্লোবাল auth state ম্যানেজ করা এবং **expo-secure-store**-এ টোকেন নিরাপদে রাখা।
6. OTP ফ্লো (request → verify) end-to-end টেস্ট করা।

## ✅ পূর্বশর্ত

- Node.js 20+, Git, VS Code
- ফোনে **Expo Go** অথবা Android Emulator / iOS Simulator
- আগের মডিউলের ব্যাকএন্ড (`backend/`) — MongoDB URI সহ `.env` সেট করা
- ল্যাপটপ আর ফোন একই Wi-Fi-তে

## 🔁 শুরুতে রিক্যাপ (৫ মিনিট)

"আমরা আগের মডিউলে Express + MongoDB দিয়ে বেচা-কেনার ব্যাকএন্ড আর React দিয়ে ওয়েব অ্যাপ বানিয়েছি। ওয়েব অ্যাপ লগইনের পর **httpOnly cookie** ব্যবহার করে। কিন্তু মোবাইল অ্যাপে ব্রাউজারের মতো কুকি জার নেই — তাই আজ আমরা শিখব মোবাইলে টোকেন কীভাবে হ্যান্ডেল করতে হয়। একই ব্যাকএন্ড, নতুন ক্লায়েন্ট।"

ব্যাকএন্ড এখন দুইভাবেই কাজ করে:

```
ওয়েব  ──cookie: accessToken──────────▶  Express (auth middleware)
মোবাইল ──Authorization: Bearer <token>──▶  একই middleware
```

---

## 🗓 ক্লাস প্ল্যান

| সময় | অংশ |
|---|---|
| 0:00 – 0:10 | রিক্যাপ + আজকের লক্ষ্য + ফাইনাল অ্যাপের ডেমো |
| 0:10 – 0:30 | ব্যাকএন্ড চালানো, ফোন থেকে API-তে কানেক্ট করা (LAN IP) |
| 0:30 – 0:50 | Prompt 1 — ফোল্ডার স্ট্রাকচার ও Expo Router |
| 0:50 – 1:10 | Prompt 2 — ডিজাইন সিস্টেম ও UI primitives |
| 1:10 – 1:35 | Prompt 3 — API ক্লায়েন্ট, SecureStore, validators |
| 1:35 – 1:55 | Prompt 4 — Zustand auth store + route guards |
| 1:55 – 2:25 | Prompt 5, 6, 7 — অনবোর্ডিং, লগইন, OTP |
| 2:25 – 2:30 | রিভিউ, হোমওয়ার্ক, পরের ক্লাসের প্রিভিউ |

---

## অংশ ১ — ব্যাকএন্ড চালানো ও ফোন থেকে কানেক্ট করা

### কনসেপ্ট: কেন `localhost` কাজ করে না?

ফোনের কাছে `localhost` মানে **ফোন নিজেই**, আপনার ল্যাপটপ না। তাই:

| ডিভাইস | API URL |
|---|---|
| আসল ফোন (Expo Go) | `http://<ল্যাপটপের LAN IP>:5000/api/v1` |
| Android Emulator | `http://10.0.2.2:5000/api/v1` |
| iOS Simulator | `http://localhost:5000/api/v1` |

LAN IP বের করা: Windows → `ipconfig`, macOS/Linux → `ifconfig` বা `ip addr` (যেমন `192.168.0.105`)।

### লাইভ ডেমো

```bash
cd backend && npm run dev
# অন্য টার্মিনালে:
curl http://localhost:5000/api/v1/health
```

তারপর ফোনের ব্রাউজারে `http://192.168.0.105:5000/api/v1/health` খুলে দেখান — JSON আসলে নেটওয়ার্ক ঠিক আছে। না আসলে: ফায়ারওয়াল, ভিন্ন Wi-Fi, অথবা ভুল IP।

> 💡 **টিচিং টিপ:** এই ধাপটা ক্লাসে অবশ্যই করে দেখান — স্টুডেন্টদের ৮০% "Network Error" এখান থেকেই আসে।

---

## অংশ ২ — Prompt 1: ফোল্ডার স্ট্রাকচার ও Expo Router

### কনসেপ্ট: File-based routing

Expo Router-এ `src/app/` ফোল্ডারের **প্রতিটি ফাইল একটি স্ক্রিন**। ফোল্ডারের নামই URL।

```
src/app/listing/[id].tsx      →  /listing/123   ([id] = dynamic segment)
src/app/(auth)/login.tsx      →  /login         ((auth) URL-এ দেখায় না!)
src/app/(app)/(tabs)/home.tsx →  /home
```

- **`( )` দিয়ে route group** — URL-এ আসে না, শুধু স্ক্রিনগুলোকে গুছিয়ে রাখে এবং আলাদা `_layout.tsx` দেয়।
- **`_layout.tsx`** — ওই ফোল্ডারের navigator (Stack, Tabs)। এখানেই আমরা গার্ড বসাই: লগইন না থাকলে `(app)`-এ ঢুকতে দেবো না।

আমাদের আর্কিটেকচার:

```
(auth)  → welcome, login, verify-otp           (লগইন ছাড়া)
(app)   → (tabs)/home, search, post, chat, profile
          listing/[id], chat/[roomId], user/[id], kyc/*, settings/*   (লগইন লাগবে)
```

### কেন এই ফোল্ডার স্ট্রাকচার?

| ফোল্ডার | কাজ | নিয়ম |
|---|---|---|
| `app/` | শুধু স্ক্রিন/রাউট | এখানে কম্পোনেন্ট বা হেল্পার রাখবেন না |
| `components/` | রিইউজেবল UI | ফিচার অনুযায়ী সাব-ফোল্ডার |
| `services/` | API কল | প্রতিটি ব্যাকএন্ড মডিউলের জন্য একটা ফাইল |
| `store/` | গ্লোবাল state (Zustand) | |
| `hooks/`, `lib/`, `constants/`, `types/` | হেল্পার | |

### প্রম্পট দিন

`docs/mobile-app-prompts.md` থেকে **Prompt 1** কপি করে AI-কে দিন।

### AI-এর আউটপুট যাচাই করুন

- [ ] পুরনো boilerplate (`explore.tsx`, `animated-icon` ইত্যাদি) মুছেছে এবং কোথাও import বাকি নেই
- [ ] প্রতিটি রাউট ফাইলে placeholder স্ক্রিন আছে
- [ ] `npx tsc --noEmit` পাস করে
- [ ] `npx expo start` → অ্যাপ খোলে

### সাধারণ ভুল

- **"Unmatched route"** → `index.tsx`-এ redirect ভুল পাথে। Route group-এর পাথ লিখতে হয় `/(app)/(tabs)/home` বা শুধু `/home`।
- **`@/` import কাজ করছে না** → `tsconfig.json`-এ `paths` আছে কিনা দেখুন, Metro রিস্টার্ট দিন (`npx expo start -c`)।

---

## অংশ ৩ — Prompt 2: ডিজাইন সিস্টেম

### কনসেপ্ট: ডিজাইন টোকেন

প্রতিটি স্ক্রিনে `#00704A` হার্ডকোড না করে একটা জায়গায় রাখি — `theme.ts`। পরে রং বদলাতে হলে এক জায়গায় বদলালেই হয়, ডার্ক মোডও সহজ হয়।

আমাদের ব্র্যান্ড (ওয়েবের সাথে মিলিয়ে):

| টোকেন | রং | কোথায় |
|---|---|---|
| primary | `#00704A` (পতাকার সবুজ) | বাটন, দাম, অ্যাক্টিভ ট্যাব |
| accent | `#E63946` (পতাকার লাল) | "বিজ্ঞাপন দিন", ব্যাজ |
| secondary | `#F4B400` (গাঁদা ফুলের হলুদ) | হাইলাইট, রেটিং স্টার |
| background | `#F7F5F0` (নকশিকাঁথার অফ-হোয়াইট) | স্ক্রিন ব্যাকগ্রাউন্ড |

ফন্ট: **Hind Siliguri** — বাংলা টেক্সট সুন্দর দেখায়। ফন্ট লোড না হওয়া পর্যন্ত splash স্ক্রিন ধরে রাখতে হয়, না হলে টেক্সট "লাফ" দেয়।

### UI primitives কেন?

`<Button variant="primary" loading />` একবার বানালে ৫০টা স্ক্রিনে একই রকম বাটন — কনসিস্টেন্সি + কম কোড। ক্লাসে দেখান:

```tsx
<Button title="OTP পাঠান" onPress={send} loading={isLoading} fullWidth />
```

### যাচাই

- [ ] `useTheme()` লাইট/ডার্ক দুটোতে ঠিক রং দেয়
- [ ] Hind Siliguri লোড হচ্ছে (বাংলা অক্ষর আলাদা দেখাবে)
- [ ] Button, Input, Card, Badge, Chip, Screen কম্পোনেন্ট আছে

---

## অংশ ৪ — Prompt 3: API ক্লায়েন্ট, স্টোরেজ, ভ্যালিডেটর

### কনসেপ্ট ১: Access token vs Refresh token

```
লগইন ─▶ { accessToken (১৫ মিনিট), refreshToken (৭ দিন) }

প্রতিটি রিকোয়েস্ট:  Authorization: Bearer <accessToken>

১৫ মিনিট পর ─▶ 401 TOKEN_EXPIRED
             ─▶ POST /auth/refresh { refreshToken } ─▶ নতুন accessToken
             ─▶ আসল রিকোয়েস্ট আবার পাঠাও (ইউজার কিছুই টের পায় না)

৭ দিন পর বা লগআউটের পর ─▶ refresh ফেল ─▶ লগইন স্ক্রিন
```

**কেন দুইটা টোকেন?** access token চুরি হলেও ১৫ মিনিটেই অকেজো। refresh token শুধু একটা এন্ডপয়েন্টে যায়, তাই কম এক্সপোজড।

### কনসেপ্ট ২: কোথায় রাখবো?

| ডেটা | স্টোরেজ | কেন |
|---|---|---|
| টোকেন | `expo-secure-store` | iOS Keychain / Android Keystore — এনক্রিপ্টেড |
| অনবোর্ডিং ফ্ল্যাগ, রিসেন্ট সার্চ | `AsyncStorage` | সাধারণ, সেনসিটিভ না |

### কনসেপ্ট ৩: Interceptor

Interceptor হলো প্রতিটি রিকোয়েস্ট/রেসপন্সের মাঝখানে বসা একটা ফাংশন।

```ts
api.interceptors.request.use(async (config) => {
  const token = await getAccessToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});
```

রেসপন্স interceptor-এ 401 ধরলে রিফ্রেশ করি। **গুরুত্বপূর্ণ:** একসাথে ৫টা রিকোয়েস্ট 401 পেলে ৫ বার রিফ্রেশ করা যাবে না — একটাই refresh promise শেয়ার করতে হবে। আর `/auth/*` রিকোয়েস্টে (যেমন ভুল OTP-র 401) রিফ্রেশ করা যাবে না।

### কনসেপ্ট ৪: ব্যাকএন্ডের রেসপন্স ফরম্যাট

```jsonc
{ "success": true, "data": { ... } }                       // সফল
{ "success": false, "error": "Invalid or expired OTP", "code": "INVALID_OTP" }  // এরর
```

UI-তে সবসময় `code` দেখে সিদ্ধান্ত নেবো, `error` টেক্সট দেখাবো।

### যাচাই

- [ ] `.env`-এ `EXPO_PUBLIC_API_URL` ও `EXPO_PUBLIC_SOCKET_URL` আছে, `.env` gitignore-এ
- [ ] `formatPrice(68000)` → `৳৬৮,০০০`
- [ ] `normalizePhone('01712345678')` → `+8801712345678`

### সাধারণ ভুল

- `.env` বদলানোর পর Metro রিস্টার্ট না দেওয়া → পুরনো URL থেকে যায়।
- `EXPO_PUBLIC_` প্রিফিক্স ছাড়া env variable অ্যাপে পাওয়া যায় না।
- **কখনো** API secret `.env`-এ `EXPO_PUBLIC_` দিয়ে রাখবেন না — এটা অ্যাপ বান্ডেলে ঢুকে যায়।

---

## অংশ ৫ — Prompt 4: Zustand Auth Store ও Route Guard

### কনসেপ্ট: কেন Zustand?

Redux-এর চেয়ে অনেক কম কোড, Context-এর মতো অপ্রয়োজনীয় re-render নেই।

```ts
const useAuthStore = create<AuthState>((set) => ({
  user: null,
  login: async ({ user, accessToken, refreshToken }) => {
    await saveTokens({ accessToken, refreshToken });
    set({ user, isAuthenticated: true });
  },
}));

// কম্পোনেন্টে — শুধু যেটুকু দরকার সেটুকু select করুন
const user = useAuthStore((s) => s.user);
```

### Bootstrap ফ্লো (অ্যাপ খোলার সময়)

```
Splash দেখাও ─▶ SecureStore-এ refreshToken আছে?
   ├─ না  ─▶ onboarded? → login : welcome
   └─ হ্যাঁ ─▶ GET /users/me (দরকার হলে interceptor রিফ্রেশ করবে)
               ├─ সফল → home
               └─ ফেল → localLogout → login
Splash লুকাও
```

### Route guard

```tsx
// (app)/_layout.tsx
if (!isAuthenticated) return <Redirect href="/login" />;
return <Stack />;
```

### `useRequireVerified` — কেন এখনই?

NID যাচাই ছাড়া ইউজার ব্রাউজ করতে পারে, কিন্তু বিজ্ঞাপন দেওয়া, চ্যাট, রিপোর্ট পারে না (ব্যাকএন্ড `403 VERIFICATION_REQUIRED` দেয়)। একটা হুক বানিয়ে রাখলে পরের ক্লাসগুলোতে এক লাইনে গার্ড বসানো যাবে।

---

## অংশ ৬ — Prompt 5, 6, 7: অনবোর্ডিং, লগইন, OTP

### Prompt 5 — অনবোর্ডিং

- **Reanimated কনসেপ্ট:** `useSharedValue` (UI thread-এ থাকা ভ্যালু), `useAnimatedStyle`, `interpolate`। স্ক্রল পজিশন থেকে ডট-এর width interpolate করুন — এটা ক্লাসে লাইভ দেখান।
- প্রথমবার দেখানো হবে, তারপর `hasOnboarded` ফ্ল্যাগ সেভ।

### Prompt 6 — লগইন

ফ্লো: ইউজার `01712345678` লেখে → `POST /auth/request-otp { phoneNumber }` → সফল হলে OTP স্ক্রিনে যাই।

```
রেসপন্স: { success: true, message: "OTP sent successfully", data: { expiresIn: 180 } }
এরর:     429 RATE_LIMIT_EXCEEDED (ঘণ্টায় ৫ বার), 400 INVALID_PHONE
```

ডেভেলপমেন্টে SMS যায় না — ব্যাকএন্ড টার্মিনালে দেখুন:

```
[SMS Gateway Mock] Sending OTP 482913 to +8801712345678
```

### Prompt 7 — OTP যাচাই

```
POST /auth/verify-otp { phoneNumber, otpCode: "482913" }   ← otpCode STRING
→ data: { user, accessToken, refreshToken }
```

| code | কী দেখাবো |
|---|---|
| `INVALID_OTP` | ভুল কোড + শেক অ্যানিমেশন |
| `OTP_EXPIRED` | মেয়াদ শেষ, নতুন কোড নিন |
| `OTP_ATTEMPTS_EXCEEDED` | ৫ বার ভুল — কোড বাতিল, রিসেন্ড করুন |
| `ACCOUNT_SUSPENDED` | অ্যাকাউন্ট স্থগিত |

**নিরাপত্তা আলোচনা (২ মিনিট):** ব্যাকএন্ড OTP হ্যাশ করে রাখে, ৩ মিনিটে মেয়াদ শেষ, ৫ বার ভুল হলে কোড বাতিল — তাই brute-force করে ১০ লাখ কম্বিনেশন ট্রাই করা সম্ভব না।

---

## 🧪 লাইভ টেস্ট চেকলিস্ট (ক্লাসের শেষে একসাথে)

- [ ] প্রথমবার অ্যাপ খুললে অনবোর্ডিং → স্কিপ → লগইন
- [ ] ভুল নম্বর (`0171234`) → বাটন ডিজেবল / এরর
- [ ] সঠিক নম্বর → OTP স্ক্রিন, টাইমার ৩:০০ থেকে কমছে
- [ ] ভুল OTP → শেক + এরর
- [ ] সঠিক OTP → হোম (placeholder)
- [ ] অ্যাপ বন্ধ করে আবার খুললে সরাসরি হোম (auto login)
- [ ] লগআউট → লগইন স্ক্রিন, আবার খুললে লগইন স্ক্রিনই

## 🛠 ট্রাবলশুটিং

| সমস্যা | কারণ | সমাধান |
|---|---|---|
| `Network Error` | ফোন ল্যাপটপে পৌঁছাতে পারছে না | LAN IP, একই Wi-Fi, ফায়ারওয়াল |
| OTP দিলে 401 কিন্তু কোড সঠিক | পুরনো OTP দিচ্ছেন (নতুনটা পাঠানো হয়েছে) | টার্মিনালে সর্বশেষ OTP দেখুন |
| লগইনের পর `/users/me` 401 | Bearer হেডার যাচ্ছে না | request interceptor চেক করুন |
| Splash আটকে আছে | bootstrap এ `isBootstrapping=false` সেট হয়নি | `finally` ব্লকে সেট করুন |
| বাংলা ফন্ট আসছে না | ফন্ট লোড হওয়ার আগেই রেন্ডার | `useFonts` + splash hide after load |

## 📝 হোমওয়ার্ক

1. লগইন স্ক্রিনে "+88" প্রিফিক্সের পাশে একটা "নম্বর কপি-পেস্ট" সাপোর্ট যোগ করুন — `+8801712345678` পেস্ট করলেও যেন `01712345678` হয়।
2. ডার্ক মোডে লগইন ও OTP স্ক্রিনের স্ক্রিনশট নিয়ে জমা দিন।
3. AI-কে জিজ্ঞেস করুন: "আমাদের api.ts-এ একসাথে ৩টা রিকোয়েস্ট 401 পেলে কী হবে?" — উত্তরটা নিজের ভাষায় লিখুন।

## ❓ কুইজ

1. `src/app/(auth)/login.tsx` ফাইলের URL কী? → **`/login`** (group-এর নাম URL-এ আসে না)
2. টোকেন কেন AsyncStorage-এ না রেখে SecureStore-এ রাখি? → **AsyncStorage এনক্রিপ্টেড না**
3. access token-এর মেয়াদ কত? refresh token-এর? → **১৫ মিনিট, ৭ দিন**
4. ভুল OTP-র 401 পেলে interceptor কেন রিফ্রেশ করবে না? → **এটা auth এন্ডপয়েন্ট; টোকেনের সমস্যা না, কোড ভুল**
5. `otpCode` কোন টাইপে পাঠাতে হয়? → **string**

## 🔜 পরের ক্লাস (Lesson 8.5)

NID দিয়ে পরিচয় যাচাই (ক্যামেরা দিয়ে লাইভ সেলফি, S3-তে আপলোড), বটম ট্যাব নেভিগেশন আর বিজ্ঞাপনের হোম ফিড।
