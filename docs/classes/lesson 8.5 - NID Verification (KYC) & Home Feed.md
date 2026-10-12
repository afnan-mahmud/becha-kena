# Lesson 8.5 — NID ভেরিফিকেশন (KYC), ট্যাব নেভিগেশন ও হোম ফিড

> **কভার করা প্রম্পট:** Prompt 8 – 15 (Phase 2 + Phase 3)
> **সময়:** ~২.৫ ঘণ্টা
> **ক্লাস শেষে যা থাকবে:** ক্যামেরা দিয়ে লাইভ সেলফি তুলে S3-তে আপলোড করে NID ভেরিফিকেশন সাবমিট, অ্যাডমিন অ্যাপ্রুভ করলে অ্যাপে "ভেরিফাইড", ৫টি ট্যাবের কাস্টম বটম বার এবং ইনফিনিট স্ক্রলসহ হোম ফিড।

---

## 🎯 শেখার লক্ষ্য

1. **KYC (Know Your Customer)** কেন বেচা-কেনার মূল ফিচার এবং ব্যাকএন্ডে এটা কীভাবে কাজ করে।
2. **expo-camera** দিয়ে পারমিশন নেওয়া ও ছবি তোলা; পারমিশন না দিলে fallback।
3. **Presigned URL** দিয়ে সরাসরি S3-তে ফাইল আপলোড — সার্ভারকে বাইপাস করে।
4. **Polling** দিয়ে স্ট্যাটাস চেক করা (অ্যাডমিন কখন অ্যাপ্রুভ করলো)।
5. Expo Router-এ **কাস্টম ট্যাব বার** ও ট্যাব প্রেসে গার্ড।
6. **TanStack Query** দিয়ে ডেটা ফেচিং, ক্যাশিং ও **infinite scroll**।
7. রিইউজেবল **ListingCard** (grid/list) ও পারফরম্যান্ট লিস্ট।

## 🔁 রিক্যাপ (৫ মিনিট)

গত ক্লাসে লগইন করলাম। এখন ইউজার লগইন করা আছে কিন্তু `isVerified: false` — সে বিজ্ঞাপন দেখতে পারবে, কিন্তু দিতে, চ্যাট করতে বা বিক্রেতার নম্বর দেখতে পারবে না। আজ সেই গেটটা খুলবো।

---

## 🗓 ক্লাস প্ল্যান

| সময় | অংশ |
|---|---|
| 0:00 – 0:15 | KYC কনসেপ্ট + ব্যাকএন্ড ফ্লো ডায়াগ্রাম |
| 0:15 – 0:30 | Prompt 8 — KYC সার্ভিস ও ল্যান্ডিং |
| 0:30 – 1:05 | Prompt 9 — অ্যাডাল্ট ফ্লো: ক্যামেরা + S3 আপলোড |
| 1:05 – 1:15 | Prompt 10 — মাইনর ফ্লো |
| 1:15 – 1:30 | Prompt 11 — স্ট্যাটাস স্ক্রিন + অ্যাডমিন প্যানেলে লাইভ অ্যাপ্রুভ |
| 1:30 – 1:45 | Prompt 12 — বটম ট্যাব |
| 1:45 – 2:20 | Prompt 13, 14, 15 — হোম ফিড, ListingCard, ক্যাটাগরি |
| 2:20 – 2:30 | টেস্ট, হোমওয়ার্ক |

---

## অংশ ১ — KYC কনসেপ্ট

### কেন NID ভেরিফিকেশন?

বাংলাদেশের অনলাইন বেচা-কেনায় সবচেয়ে বড় সমস্যা — **ফেক আইডি ও অগ্রিম টাকার প্রতারণা**। বেচা-কেনার প্রমিস: প্রত্যেক বিক্রেতা আসল মানুষ। তাই:

- ব্রাউজ করা → সবাই
- বিজ্ঞাপন দেওয়া / চ্যাট / রিভিউ / রিপোর্ট / ফোন নম্বর দেখা → শুধু ভেরিফাইড

### ব্যাকএন্ড ফ্লো

```
অ্যাপ                                ব্যাকএন্ড                          অ্যাডমিন (ওয়েব)
 │ ১. সেলফি তুলি                       │                                   │
 │ ২. POST /media/presigned-url ─────▶ │ S3-তে আপলোডের জন্য ৫ মিনিটের URL   │
 │ ◀──── { uploadUrl, fileUrl } ────── │                                   │
 │ ৩. PUT uploadUrl (ছবির bytes) ─────────────────────▶ S3                 │
 │ ৪. POST /kyc/verify-adult           │                                   │
 │    { nidNumber, dob, selfieUrl } ─▶ │ NID হ্যাশ করে রাখে                │
 │ ◀── { verificationStatus:           │ status = pending_review            │
 │       "pending_review" }            │                                   │
 │                                      │ ◀── /admin/kyc-queue → Approve ── │
 │ ৫. GET /kyc/status (polling) ─────▶ │ approved, user.isVerified = true  │
```

**গুরুত্বপূর্ণ পয়েন্ট (ক্লাসে জোর দিন):**

- ব্যাকএন্ড **NID কার্ডের ছবি নেয় না** — শুধু NID নম্বর, জন্মতারিখ আর একটা লাইভ সেলফি।
- NID নম্বর কখনো সরাসরি সেভ হয় না — `sha256(nid + salt + pepper)` হ্যাশ সেভ হয়। কেউ ডাটাবেস চুরি করলেও NID পাবে না।
- সব আবেদন **ম্যানুয়াল রিভিউ**-তে যায় (Porichoy API ইন্টিগ্রেশন ভবিষ্যতের কাজ)।
- দিনে সর্বোচ্চ ৩ বার চেষ্টা (`KYC_LIMIT_REACHED`)।
- একজন অভিভাবকের NID দিয়ে সর্বোচ্চ ৩টি মাইনর অ্যাকাউন্ট।

---

## অংশ ২ — Prompt 8: KYC সার্ভিস ও ল্যান্ডিং

প্রম্পট দিন। যাচাই করুন:

- [ ] `getStatus()` রিটার্ন করে `data.status` — এটা `null` হতে পারে (কখনো আবেদন করেনি)
- [ ] ভেরিফাইড ইউজার এই স্ক্রিনে এলে হোমে রিডাইরেক্ট
- [ ] pending থাকলে সরাসরি স্ট্যাটাস স্ক্রিনে

---

## অংশ ৩ — Prompt 9: অ্যাডাল্ট ফ্লো (ক্যামেরা + আপলোড)

### কনসেপ্ট ১: পারমিশন

```tsx
const [permission, requestPermission] = useCameraPermissions();
if (!permission?.granted) {
  // ব্যাখ্যা দেখাও → requestPermission()
  // canAskAgain === false হলে → Linking.openSettings()
}
```

iOS/Android দুটোতেই পারমিশনের কারণ লিখতে হয় `app.json`-এ (config plugin)। না লিখলে iOS-এ অ্যাপ ক্র্যাশ করে।

### কনসেপ্ট ২: Presigned URL কেন?

সার্ভারের মধ্য দিয়ে ছবি পাঠালে সার্ভারের ব্যান্ডউইথ ও মেমরি খরচ হয় (আমাদের Express বডি লিমিট মাত্র 10kb!)। Presigned URL দিয়ে ফোন সরাসরি S3-তে আপলোড করে, সার্ভার শুধু "অনুমতিপত্র" দেয়।

```ts
const { data } = await api.post('/media/presigned-url', {
  fileName: 'selfie.jpg', fileType: 'image/jpeg', folder: 'kyc',
});
const blob = await (await fetch(localUri)).blob();
const res = await fetch(data.uploadUrl, {
  method: 'PUT',
  headers: { 'Content-Type': 'image/jpeg' },   // presign-এর fileType-এর সাথে হুবহু মিলতে হবে
  body: blob,
});
if (!res.ok) throw new Error('Upload failed');
return data.fileUrl;
```

**সাধারণ ভুল:** `Content-Type` না মিললে S3 `403 SignatureDoesNotMatch` দেয়।

### কনসেপ্ট ৩: মাল্টি-স্টেপ ফর্ম

একটা `step` state (১, ২, ৩) আর প্রতিটি স্টেপ আলাদা কম্পোনেন্ট। "পেছনে" গেলে ডেটা হারাবে না — state প্যারেন্টে রাখুন।

### যাচাই

- [ ] NID 10/13/17 ডিজিট ছাড়া পরের ধাপে যাওয়া যায় না
- [ ] ১৮ বছরের কম হলে মাইনর ফ্লো সাজেস্ট করে
- [ ] সেলফি তোলা, রিটেক, তারপর সাবমিট
- [ ] সাবমিটের পর স্ট্যাটাস স্ক্রিন

---

## অংশ ৪ — Prompt 10 ও 11: মাইনর ফ্লো ও স্ট্যাটাস

মাইনর ফ্লোতে পার্থক্য তিনটা: অভিভাবকের NID, অভিভাবকের সেলফি, সম্মতির চেকবক্স (`consentConfirmed: true`)। **জন্মতারিখ কিন্তু ইউজারের নিজের।**

### লাইভ ডেমো: অ্যাডমিন অ্যাপ্রুভাল

1. অ্যাপ থেকে KYC সাবমিট করুন → স্ট্যাটাস "রিভিউ চলছে"।
2. ব্রাউজারে ওয়েব অ্যাপের `/admin/kyc-queue` খুলুন (অ্যাডমিন অ্যাকাউন্ট)।
3. সেলফি দেখুন → Approve → আইনগত নাম লিখুন (যেমন `MD RAKIB HASAN`)।
4. অ্যাপে ৬০ সেকেন্ডের মধ্যে (বা pull-to-refresh করলে) "অভিনন্দন! আপনি এখন ভেরিফাইড 🎉"।

এটা ক্লাসে অবশ্যই দেখান — স্টুডেন্টরা পুরো সিস্টেমটা (মোবাইল + ব্যাকএন্ড + ওয়েব অ্যাডমিন) একসাথে কাজ করতে দেখবে।

### Polling বনাম Push

এখন ব্যাকএন্ড পুশ নোটিফিকেশন পাঠায় না, তাই আমরা **polling** করি (প্রতি ৬০ সেকেন্ডে + স্ক্রিন ফোকাসে)। TanStack Query-তে: `refetchInterval: 60_000`।

---

## অংশ ৫ — Prompt 12: বটম ট্যাব

```tsx
<Tabs tabBar={(props) => <CustomTabBar {...props} />}>
  <Tabs.Screen name="home" options={{ title: 'হোম' }} />
  <Tabs.Screen
    name="post"
    listeners={{
      tabPress: (e) => {
        if (!user?.isVerified) {
          e.preventDefault();          // ট্যাব খুলবে না
          router.push('/kyc');
        }
      },
    }}
  />
</Tabs>
```

ডিজাইন: মাঝের "বিজ্ঞাপন দিন" বাটন লাল এবং একটু উপরে উঠানো — এটাই অ্যাপের প্রধান অ্যাকশন (marketplace-এ সাপ্লাই সবচেয়ে গুরুত্বপূর্ণ)।

---

## অংশ ৬ — Prompt 13, 14, 15: হোম ফিড

### কনসেপ্ট ১: `GET /listings` রেসপন্স

```jsonc
{
  "success": true,
  "data": {
    "listings": [ { "id": "...", "title": "...", "price": 68000,
                    "sellerId": { "id": "...", "displayName": "রাকিব", "isVerified": true, ... },
                    "location": { "division": "ঢাকা", "district": "ঢাকা", "thana": "ধানমন্ডি", ... } } ],
    "total": 128, "page": 1, "limit": 20, "totalPages": 7
  }
}
```

⚠️ বিক্রেতার তথ্য `listing.seller`-এ না, **`listing.sellerId`** (populated object)-এ।

### কনসেপ্ট ২: TanStack Query ও Infinite Scroll

```ts
const query = useInfiniteQuery({
  queryKey: ['listings', filters],
  queryFn: ({ pageParam }) => getListings({ ...filters, page: pageParam, limit: 20 }),
  initialPageParam: 1,
  getNextPageParam: (last) => (last.page < last.totalPages ? last.page + 1 : undefined),
});
const listings = query.data?.pages.flatMap((p) => p.listings) ?? [];

<FlatList
  data={listings}
  numColumns={2}
  onEndReached={() => query.hasNextPage && query.fetchNextPage()}
  onEndReachedThreshold={0.5}
  refreshing={query.isRefetching}
  onRefresh={query.refetch}
/>
```

কেন TanStack Query? ক্যাশিং, লোডিং/এরর স্টেট, রিফেচ, ডুপ্লিকেট রিকোয়েস্ট বাদ — সব ফ্রি। Zustand থাকবে শুধু ক্লায়েন্ট state-এর জন্য।

### কনসেপ্ট ৩: ক্যাটাগরি ভ্যালু

ক্যাটাগরির `value` **ওয়েব আর ব্যাকএন্ডের সাথে হুবহু এক** হতে হবে (`Mobile`, `Electronics`, `Health & Beauty`…)। না হলে ওয়েব থেকে দেওয়া বিজ্ঞাপন মোবাইলের ফিল্টারে আসবে না। লেবেল বাংলায় আলাদা রাখি।

### কনসেপ্ট ৪: পারফরম্যান্ট কার্ড

- `expo-image` → ডিস্ক ক্যাশ, প্লেসহোল্ডার
- `React.memo` → স্ক্রলে অপ্রয়োজনীয় re-render নেই
- ফিক্সড `aspectRatio: 4/3` → লেআউট লাফায় না

### যাচাই

- [ ] হোমে বিজ্ঞাপন আসছে (না থাকলে ওয়েব থেকে একটা দিয়ে অ্যাডমিনে অ্যাপ্রুভ করুন)
- [ ] নিচে স্ক্রল করলে পরের পেজ লোড হয়
- [ ] পুল-টু-রিফ্রেশ কাজ করে
- [ ] ক্যাটাগরি ট্যাপ → সার্চ ট্যাবে সেই ক্যাটাগরি
- [ ] দাম বাংলা সংখ্যায়: ৳৬৮,০০০

---

## 🛠 ট্রাবলশুটিং

| সমস্যা | কারণ | সমাধান |
|---|---|---|
| S3 PUT → 403 | Content-Type মিলছে না / URL-এর মেয়াদ শেষ | presign-এর ঠিক পরেই আপলোড, একই Content-Type |
| ছবি আপলোড হয় কিন্তু দেখায় না | S3 অবজেক্ট পাবলিক না | ব্যাকএন্ডের `scripts/check-bucket.ts` দিয়ে চেক |
| KYC সাবমিটে 409 `KYC_PENDING` | আগের আবেদন এখনো রিভিউতে | স্ট্যাটাস স্ক্রিনে পাঠান |
| ক্যামেরা কালো স্ক্রিন | পারমিশন / সিমুলেটরে ক্যামেরা নেই | আসল ফোনে টেস্ট / image-picker fallback |
| হোম ফিড খালি | কোনো `active` বিজ্ঞাপন নেই | অ্যাডমিন প্যানেল থেকে অ্যাপ্রুভ |

## 📝 হোমওয়ার্ক

1. KYC স্ট্যাটাস স্ক্রিনে "rejected" হলে কারণের সাথে একটা "কীভাবে ভালো সেলফি তুলবেন" টিপস কার্ড যোগ করুন।
2. হোম ফিডে বিভাগ (division) বেছে নেওয়ার চিপ যোগ করুন — `GET /listings?division=ঢাকা`।
3. দুটো আলাদা অ্যাকাউন্ট ভেরিফাই করে রাখুন — পরের ক্লাসগুলোতে চ্যাট টেস্ট করতে লাগবে।

## ❓ কুইজ

1. KYC-তে ব্যাকএন্ড কোন কোন ফিল্ড নেয়? → **nidNumber, dob, selfieUrl** (মাইনর: parentNidNumber, dob, parentSelfieUrl, consentConfirmed)
2. Presigned URL-এর সুবিধা কী? → **ফাইল সরাসরি S3-তে যায়, সার্ভারের লোড নেই**
3. বিক্রেতার নাম কোথায় পাবো? → **`listing.sellerId.displayName`**
4. `getNextPageParam` কখন `undefined` রিটার্ন করবে? → **`page >= totalPages` হলে**
5. KYC অ্যাপ্রুভ কে করে? → **অ্যাডমিন, ওয়েবের `/admin/kyc-queue` থেকে**

## 🔜 পরের ক্লাস (Lesson 8.6)

সার্চ ও ফিল্টার (বটম শিট), লোকেশন পিকার ও GPS, এবং ৪ ধাপে বিজ্ঞাপন পোস্ট — ছবি কম্প্রেস করে একসাথে অনেকগুলো আপলোড।
