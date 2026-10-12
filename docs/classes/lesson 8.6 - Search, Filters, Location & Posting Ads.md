# Lesson 8.6 — সার্চ, ফিল্টার, লোকেশন ও বিজ্ঞাপন পোস্ট

> **কভার করা প্রম্পট:** Prompt 16 – 23 (Phase 4 + Phase 5)
> **সময়:** ~২.৫–৩ ঘণ্টা
> **ক্লাস শেষে যা থাকবে:** debounce করা সার্চ, বটম-শিট ফিল্টার, বিভাগ › জেলা › থানা পিকার ও "আমার কাছাকাছি" সার্চ, ৪ ধাপের বিজ্ঞাপন ফর্ম (ছবি কম্প্রেস + প্যারালাল আপলোড), "আমার বিজ্ঞাপন" ড্যাশবোর্ড, এডিট, নবায়ন, ডিলিট ও "বিক্রি হয়েছে"।

---

## 🎯 শেখার লক্ষ্য

1. **Debounce** কেন ও কীভাবে — প্রতি অক্ষরে API কল না করা।
2. সার্চ প্যারামিটার → API **query string** ম্যাপিং; ফিল্টার state ডিজাইন।
3. **GeoJSON** (`[longitude, latitude]`) ও ব্যাকএন্ডের `$geoNear` সার্চ।
4. **expo-location** দিয়ে পারমিশন, GPS ও reverse geocoding।
5. **react-hook-form** দিয়ে মাল্টি-স্টেপ ফর্ম ও ভ্যালিডেশন।
6. ছবি **কম্প্রেস** করে একাধিক ফাইল প্যারালালি আপলোড (concurrency limit সহ)।
7. TanStack Query **mutation** ও cache invalidation।
8. বিজ্ঞাপনের **লাইফসাইকেল**: pending → active → sold/archived।

## 🔁 রিক্যাপ

গত ক্লাসে ইউজার ভেরিফাইড হলো, হোমে বিজ্ঞাপন দেখলাম। আজ ইউজার নিজে খুঁজবে এবং নিজে বিজ্ঞাপন দেবে — অর্থাৎ marketplace-এর দুই দিক (demand + supply) সম্পূর্ণ।

---

## 🗓 ক্লাস প্ল্যান

| সময় | অংশ |
|---|---|
| 0:00 – 0:10 | রিক্যাপ, বিজ্ঞাপনের লাইফসাইকেল ডায়াগ্রাম |
| 0:10 – 0:35 | Prompt 16 — সার্চ স্ক্রিন + debounce |
| 0:35 – 1:00 | Prompt 17 — লোকেশন ডেটা, পিকার, GPS |
| 1:00 – 1:15 | Prompt 18 — ফিল্টার বটম শিট |
| 1:15 – 1:55 | Prompt 19, 20 — বিজ্ঞাপন ফর্ম + ইমেজ আপলোড |
| 1:55 – 2:05 | Prompt 21 — query hooks / mutation |
| 2:05 – 2:35 | Prompt 22, 23 — আমার বিজ্ঞাপন, এডিট, বিক্রি, সাকসেস স্ক্রিন |
| 2:35 – 2:45 | এন্ড-টু-এন্ড ডেমো + হোমওয়ার্ক |

---

## অংশ ০ — বিজ্ঞাপনের লাইফসাইকেল

```
POST /listings ──▶ pending ──(অ্যাডমিন approve)──▶ active ──(PATCH /sell)──▶ sold
                     │                                │
                     │(অ্যাডমিন reject)               │(৩০ দিন পার / DELETE)
                     ▼                                ▼
            archived + flagType "manual"          archived ──(PATCH /renew)──▶ active
                 (= বাতিল, নবায়ন হবে না)
```

- এডিটে **শিরোনাম বদলালে** বা **দাম ২০%-এর বেশি বদলালে** আবার `pending` — যাতে কেউ অ্যাপ্রুভের পর বিজ্ঞাপন বদলে প্রতারণা না করতে পারে। (ক্লাসে প্রশ্ন করুন: "কেন এই নিয়ম?")
- `DELETE` আসলে মুছে ফেলে না — `archived` করে (soft delete), যাতে রিপোর্ট/রিভিউর রেকর্ড থাকে।

---

## অংশ ১ — Prompt 16: সার্চ

### কনসেপ্ট: Debounce

```
টাইপ: i → ip → iph → ipho → iphon → iphone
debounce ছাড়া: ৬টা API কল
৫০০ms debounce: ইউজার থামার পর ১টা কল
```

```ts
const [text, setText] = useState('');
const debounced = useDebounce(text, 500);
const query = useInfiniteQuery({ queryKey: ['listings', { search: debounced, ...filters }], ... });
```

Query key-এ ফিল্টার রাখলে TanStack Query নিজেই পুরনো রিকোয়েস্টের রেজাল্ট বাদ দেয় এবং আগের সার্চ ক্যাশে রাখে।

### ব্যাকএন্ড যা সাপোর্ট করে (মুখস্থ করার দরকার নেই, API Contract দেখুন)

`search` (শিরোনাম + বিবরণে খোঁজে), `category`, `condition`, `minPrice`, `maxPrice`, `division`, `district`, `thana`, `sort` (`newest`, `oldest`, `price_low`, `price_high`), `lat`+`lng`+`radius`।

**নিরাপত্তা নোট:** ব্যাকএন্ড সার্চ টেক্সট regex-escape করে — কেউ `.*` বা অদ্ভুত regex দিয়ে সার্ভার স্লো করতে পারবে না।

### রিসেন্ট সার্চ

AsyncStorage-এ শেষ ১০টা — ছোট ফিচার, কিন্তু UX-এ বড় পার্থক্য।

---

## অংশ ২ — Prompt 17: লোকেশন

### কনসেপ্ট ১: লোকেশন স্ট্রিং বাংলায়

ব্যাকএন্ড `division`, `district`, `thana` বাংলা স্ট্রিং হিসেবে রাখে (`"ঢাকা"`, `"ধানমন্ডি"`) — ওয়েবের `frontend/src/utils/locations.ts`-এর সাথে হুবহু। তাই মোবাইলে **একই ফাইল কপি** করি। একটা অক্ষর ভিন্ন হলে (যেমন "চট্রগ্রাম" vs "চট্টগ্রাম") ফিল্টার কাজ করবে না।

### কনসেপ্ট ২: GeoJSON ও "আমার কাছাকাছি"

```
location.coordinates = [longitude, latitude]   ← সাবধান! [lat, lng] না
```

ব্যাকএন্ডে `2dsphere` ইনডেক্স আছে। `lat`, `lng`, `radius` (মিটার) পাঠালে `$geoNear` দূরত্ব অনুযায়ী সাজিয়ে দেয় এবং প্রতিটি বিজ্ঞাপনে `distance` (মিটার) দেয় → "২.৪ কিমি দূরে"।

গোপনীয়তার জন্য আমরা বিক্রেতার আসল GPS না পাঠিয়ে **বিভাগের কেন্দ্রের কোঅর্ডিনেট** পাঠাই। (আলোচনা: সুবিধা — গোপনীয়তা; অসুবিধা — "কাছাকাছি" সার্চ মোটা দাগে কাজ করে।)

### কনসেপ্ট ৩: Reverse geocoding

```ts
const { status } = await Location.requestForegroundPermissionsAsync();
const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
const [place] = await Location.reverseGeocodeAsync(pos.coords);
// place.region → "Dhaka Division" → "ঢাকা"
```

ইংরেজি নাম → বাংলা ম্যাপিং টেবিল লাগবে (Chittagong/Chattogram → চট্টগ্রাম)।

---

## অংশ ৩ — Prompt 18: ফিল্টার বটম শিট

- `@gorhom/bottom-sheet`-এর জন্য রুটে `GestureHandlerRootView` ও `BottomSheetModalProvider` লাগে।
- SDK 57-এ কম্প্যাটিবিলিটি সমস্যা হলে প্রম্পটেই বলা আছে — সাধারণ `Modal` + Reanimated দিয়ে বানাও। **এটা ক্লাসে আলোচনা করুন:** লাইব্রেরি কাজ না করলে বিকল্প রাখা প্রফেশনাল অভ্যাস।
- ফিল্টারের একটা লোকাল কপি রাখুন; "ফলাফল দেখুন" চাপলে তবেই অ্যাপ্লাই — না হলে প্রতিটি ট্যাপে API কল হবে।

---

## অংশ ৪ — Prompt 19 ও 20: বিজ্ঞাপন পোস্ট

### ফর্মের ৪ ধাপ

| ধাপ | ফিল্ড | ভ্যালিডেশন |
|---|---|---|
| ১ | category, condition | দুটোই required; condition = `new` / `like_new` / `used` |
| ২ | title, description, price | 10–80, 20–1000 অক্ষর, price ≥ 0 (number) |
| ৩ | images | 1–10টি, সব আপলোড শেষ |
| ৪ | division, district, thana, addressLine, hidePhoneNumber | তিনটা লোকেশন required |

### react-hook-form + ধাপভিত্তিক ভ্যালিডেশন

```ts
const { control, trigger, handleSubmit } = useForm<FormValues>();
const next = async () => {
  const ok = await trigger(STEP_FIELDS[step]);   // শুধু এই ধাপের ফিল্ড চেক
  if (ok) setStep(step + 1);
};
```

### ইমেজ পাইপলাইন

```
পিক (camera / gallery)
  └─▶ compress: সর্বোচ্চ 1280px, JPEG 0.75   (৪MB → ~২৫০KB)
       └─▶ POST /media/presigned-url { fileType: 'image/jpeg', folder: 'listings' }
            └─▶ PUT uploadUrl
                 └─▶ fileUrl → form.images[]
```

- **কেন কম্প্রেস?** বাংলাদেশে মোবাইল ডেটা দামি ও স্লো; ছোট ছবি = দ্রুত আপলোড + দ্রুত ফিড।
- **কেন JPEG?** সব প্ল্যাটফর্মে কাজ করে, ব্যাকএন্ড গ্রহণ করে।
- **Concurrency limit ৩:** ১০টা ছবি একসাথে আপলোড করলে দুর্বল নেটওয়ার্কে সব ফেল হতে পারে।
- **Retry + exponential backoff:** ১s, ২s, ৪s।
- presigned URL-এর মেয়াদ ৫ মিনিট — তাই আপলোডের ঠিক আগে নিতে হবে, আগে থেকে না।

### সাবমিট বডি (হুবহু)

```json
{
  "title": "...", "description": "...", "price": 68000,
  "category": "Mobile", "condition": "used",
  "images": ["https://.../listings/<userId>/<uuid>_photo.jpg"],
  "hidePhoneNumber": false,
  "location": { "coordinates": [90.4125, 23.8103], "division": "ঢাকা", "district": "ঢাকা", "thana": "ধানমন্ডি" }
}
```

রেসপন্স **201**, `status: "pending"`। এরর হলে `VALIDATION_FAILED` + `details: ["title must be at least 10 characters"]`।

---

## অংশ ৫ — Prompt 21: Query hooks ও Mutation

```ts
export const useDeleteListing = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: deleteListing,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['my-listings'] });
      qc.invalidateQueries({ queryKey: ['listings'] });
    },
  });
};
```

**নিয়ম:** সার্ভারের ডেটা → TanStack Query; শুধু ক্লায়েন্টের ডেটা (থিম, সিলেক্টেড বিভাগ) → Zustand। একই ডেটা দুই জায়গায় রাখলে sync বাগ হয়।

---

## অংশ ৬ — Prompt 22 ও 23: আমার বিজ্ঞাপন

### স্ট্যাটাস → অ্যাকশন টেবিল (ক্লাসে বোর্ডে লিখুন)

| স্ট্যাটাস | দেখাবো | অ্যাকশন |
|---|---|---|
| active | 🟢 সক্রিয় | বিক্রি হয়েছে, এডিট, সরান, (≤৫ দিন হলে) মেয়াদ বাড়ান |
| pending | 🟡 রিভিউতে | এডিট, সরান |
| sold | 🔵 বিক্রিত | শুধু দেখা |
| archived | ⚫ আর্কাইভড | নবায়ন |
| archived + `flagType: "manual"` | 🔴 বাতিল + কারণ | কিছু না (নতুন করে দিতে হবে) |

### "বিক্রি হয়েছে" ফ্লো — রিভিউ সিস্টেমের ভিত্তি

```
GET /chat/rooms → room.listingId === এই বিজ্ঞাপন && room.sellerId === আমি
   → ক্রেতাদের লিস্ট
   → একজন বেছে নিলে: PATCH /listings/:id/sell { buyerId }
   → অথবা "বাইরে বিক্রি করেছি": PATCH /listings/:id/sell {}
```

ব্যাকএন্ড চেক করে ওই ক্রেতার সাথে আসলেই চ্যাট হয়েছে কিনা (`NO_CHAT_HISTORY`)। এতে ফেক রিভিউ আটকানো যায় — শুধু যে আসলে কিনেছে সে-ই রিভিউ দিতে পারবে (Lesson 8.8)।

### এডিট স্ক্রিন

একই `ListingForm` কম্পোনেন্ট, শুধু `initial` ভ্যালু দিয়ে। আগের ছবিগুলো "ইতিমধ্যে আপলোড হয়েছে" হিসেবে ধরা হবে। সেভের পর রেসপন্সে `status: "pending"` এলে ইউজারকে জানান যে আবার রিভিউতে গেছে।

---

## 🧪 এন্ড-টু-এন্ড ডেমো

1. ৪ ধাপে একটা বিজ্ঞাপন দিন (৩টা ছবি) → সাকসেস স্ক্রিন → আমার বিজ্ঞাপন → "রিভিউতে"
2. ওয়েব অ্যাডমিন `/admin/moderation` → Approve
3. অ্যাপে রিফ্রেশ → "সক্রিয়"; হোম ও সার্চে দেখা যাচ্ছে
4. সার্চে শিরোনামের একটা শব্দ লিখুন → পাওয়া যায়
5. ফিল্টার: ক্যাটাগরি + বিভাগ + দাম → রেজাল্ট ঠিক
6. এডিট করে শিরোনাম বদলান → আবার "রিভিউতে"
7. সরান → "আর্কাইভড" → নবায়ন → "সক্রিয়"

## 🛠 ট্রাবলশুটিং

| সমস্যা | কারণ | সমাধান |
|---|---|---|
| `VALIDATION_FAILED: location.coordinates must be an array of exactly 2 numbers` | কোঅর্ডিনেট string বা উল্টো | `[Number(lng), Number(lat)]` |
| price "68000" স্ট্রিং গেছে | TextInput সবসময় string দেয় | `Number(price)` |
| বিজ্ঞাপন সার্চে আসছে না | এখনো `pending` | অ্যাডমিন অ্যাপ্রুভ |
| বাংলা লোকেশন ফিল্টারে মিলছে না | বানান ভিন্ন | ওয়েবের locations.ts হুবহু কপি |
| ১০টা ছবির কয়েকটা ফেল | একসাথে সব আপলোড | concurrency 3 + retry |
| `NO_CHAT_HISTORY` | ওই ক্রেতা চ্যাট করেনি | লিস্ট chat rooms থেকেই বানান |

## 📝 হোমওয়ার্ক

1. সার্চ রেজাল্টে "আমার কাছাকাছি" সর্ট চালু থাকলে প্রতিটি কার্ডে দূরত্ব দেখান ("৩.২ কিমি")।
2. বিজ্ঞাপন ফর্মে ড্রাফট সেভ করুন (AsyncStorage) — অ্যাপ বন্ধ হলেও ডেটা যেন না হারায়।
3. আমার বিজ্ঞাপনে "৫ দিনের মধ্যে মেয়াদ শেষ" হলে লাল ব্যাজ দেখান।

## ❓ কুইজ

1. GeoJSON-এ কোঅর্ডিনেটের ক্রম কী? → **[longitude, latitude]**
2. কোন পরিবর্তনে বিজ্ঞাপন আবার pending হয়? → **শিরোনাম বদলালে বা দাম ২০%-এর বেশি বদলালে**
3. "বাতিল" বিজ্ঞাপন কীভাবে চিনবো? → **status archived + moderationFlags.flagType "manual"**
4. ছবি আপলোডের আগে কেন কম্প্রেস করি? → **ডেটা খরচ ও আপলোড সময় কমাতে**
5. `markAsSold`-এ buyerId না দিলে কী হয়? → **বাইরে বিক্রি; কেউ রিভিউ দিতে পারবে না**

## 🔜 পরের ক্লাস (Lesson 8.7)

বিজ্ঞাপনের ডিটেইল পেজ, ফুল-স্ক্রিন ইমেজ ভিউয়ার, বিক্রেতার প্রোফাইল, আর সবচেয়ে মজার অংশ — Socket.io দিয়ে রিয়েল-টাইম চ্যাট।
