# NH Fahim — ওয়েবসাইট + অ্যাডমিন ড্যাশবোর্ড

এই ফোল্ডারটাই পুরো সাইট। GitHub-এ তুলে Vercel-এ কানেক্ট করলেই লাইভ হবে।
লেখা, ছবি, ভিডিও, প্রজেক্ট, গিয়ার, ব্র্যান্ড সব থাকবে **Supabase**-এ (ফ্রি ডাটাবেস + ফাইল রাখার জায়গা + লগইন)।
এডিট করা যাবে সাইটের ভেতরের ড্যাশবোর্ড থেকে, শুধু ফাহিমের ইমেইল দিয়ে লগইন করে।

## ফোল্ডারে কী আছে

| ফাইল | কাজ |
|---|---|
| `index.html` | পুরো সাইট আর ড্যাশবোর্ড |
| `config.js` | Supabase-এর দুইটা মান বসানোর জায়গা (**এটা তোমাকে এডিট করতে হবে**) |
| `adapter.js` | সাইটকে Supabase-এর সাথে জোড়ে। বদলানোর দরকার নেই |
| `img/` | ফাহিমের ছবি আর ব্র্যান্ড লোগো |
| `supabase/setup.sql` | ডাটাবেস, নিরাপত্তার নিয়ম আর শুরুর লেখা বানানোর কোড (একবার চালাতে হবে) |

---

## ধাপ ১ — Supabase সেটআপ (১০ মিনিট)

1. **supabase.com** → *Start your project* → GitHub দিয়ে সাইন ইন করো।
2. **New project** চাপো:
   - Name: `nh-fahim`
   - Database Password: একটা পাসওয়ার্ড দাও (লিখে রাখো)
   - Region: **Southeast Asia (Singapore)**, বাংলাদেশের সবচেয়ে কাছে
   - **Create new project** → ১–২ মিনিট অপেক্ষা।
3. বাম মেনু থেকে **SQL Editor** → **New query**।
   `supabase/setup.sql` ফাইলটা খুলে **পুরো লেখা** কপি করে এখানে পেস্ট করো → **Run**।
   নিচে "Success" দেখাবে।
   > ফাহিম ছাড়া অন্য কেউ ড্যাশবোর্ড চালাবে? তাহলে Run করার আগে ফাইলের ভেতরের `nh10fahim@gmail.com` বদলে দাও।
4. বাম মেনু **Authentication** → **Users** → **Add user** → **Create new user**:
   - Email: `nh10fahim@gmail.com` (ধাপ ৩-এর ইমেইলটাই)
   - Password: ড্যাশবোর্ডে ঢোকার পাসওয়ার্ড
   - **Auto Confirm User** টিক দাও → **Create user**।
5. বাম মেনু **Project Settings** → **API** (কিছু প্রজেক্টে **API Keys** নামে)। দুইটা জিনিস কপি করো:
   - **Project URL**, যেমন `https://abcdefgh.supabase.co`
   - **anon public** key (নতুন প্রজেক্টে নাম হতে পারে **Publishable key**)
   > **service_role / secret** key কখনো কোথাও বসাবে না।
6. `config.js` খুলে মান দুইটা বসাও:
   ```js
   supabaseUrl: 'https://abcdefgh.supabase.co',
   supabaseAnonKey: 'eyJhbGciOi....',
   ```
   সেভ করো।

---

## ধাপ ২ — GitHub-এ তোলা (৫ মিনিট)

1. **github.com** → উপরে **+** → **New repository**।
2. Repository name: `nh-fahim-site` → **Create repository**।
3. নতুন repo পেজে **"uploading an existing file"** লিংকে চাপো।
4. zip খুলে ফোল্ডারের **ভেতরের** সব জিনিস একসাথে টেনে ছেড়ে দাও: `index.html`, `config.js`, `adapter.js`, `README.md`, `img`, `supabase`।
   > পুরো ফোল্ডার না, ভেতরের জিনিসগুলো। `index.html` যেন repo-র একদম উপরে থাকে।
5. নিচে **Commit changes** চাপো।

---

## ধাপ ৩ — Vercel-এ হোস্ট (৩ মিনিট)

1. **vercel.com** → **Sign Up / Log in** → **Continue with GitHub**।
2. **Add New…** → **Project** → `nh-fahim-site`-এর পাশে **Import**।
3. **Framework Preset: Other**। Build Command আর Output Directory খালি রাখো → **Deploy**।
4. ১ মিনিটের মধ্যে লিংক পাবে, যেমন `https://nh-fahim-site.vercel.app`। এটাই লাইভ সাইট।

---

## ধাপ ৪ — অ্যাডমিন ড্যাশবোর্ড

1. সাইটের ঠিকানার শেষে **`/#admin`** লিখে খোলো:
   `https://nh-fahim-site.vercel.app/#admin`
2. ধাপ ১.৪-এর ইমেইল আর পাসওয়ার্ড দিয়ে **Log in** → ড্যাশবোর্ড খুলে যাবে।
3. লগইন থাকা অবস্থায় সাইটে (উপরে, ☰ মেনুতে, ফুটারে) **Dashboard** বাটন দেখবে। সাধারণ দর্শক এটা দেখে না।
4. কোন জিনিস কোথা থেকে বদলায়: ড্যাশবোর্ডের **Guide** ট্যাব দেখো।
5. কাজ শেষে বাম পাশের **Log out** চাপো।

**রোজকার কাজ (লেখা, ছবি, ভিডিও, প্রজেক্ট, গিয়ার, সার্ভিস) শুধু ড্যাশবোর্ড থেকে।** GitHub বা Vercel ছুঁতে হবে না, Save চাপলেই সাইটে চলে আসে।

---

## পরে কাজে লাগবে

**ডিজাইন বা কোড বদলালে:** GitHub-এ ফাইলটা এডিট বা নতুন করে আপলোড করে **Commit** করো। Vercel ১ মিনিটের মধ্যে নিজে থেকে সাইট আপডেট করবে।

**আগে setup.sql চালিয়ে থাকলে আর নতুন ভার্সন বসালে:** Reels অংশের sample reels পেতে `supabase/setup.sql` আরেকবার Run করো। আগের কোনো লেখা, ছবি বা ভিডিও মুছবে না, শুধু যা নেই তা যোগ হবে।

**থাম্বনেইল:** প্রজেক্ট, রিল, শোরিল বা এক্সট্রা সেকশনে ভিডিও আপলোড করলে ভিডিও থেকে একটা ফ্রেম নিজে থেকেই থাম্বনেইল হয়ে যায়। বদলাতে চাইলে **Pick from video** চেপে স্লাইডার দিয়ে যেকোনো ফ্রেম বেছে নাও, অথবা **Replace** চেপে নিজের ছবি দাও।

**নিজের ডোমেইন (যেমন nhfahim.com):** Vercel → প্রজেক্ট → **Settings → Domains** → ডোমেইন লেখো → Vercel যে DNS রেকর্ড দেখাবে, সেটা ডোমেইন যেখান থেকে কিনেছ সেখানে বসাও।

**আরেকজন অ্যাডমিন যোগ করতে:**
1. Supabase → **Table Editor** → `admins` → **Insert row** → ইমেইল দাও (ছোট হাতের অক্ষরে)।
2. তারপর **Authentication → Users → Add user**-এ সেই ইমেইলের অ্যাকাউন্ট বানাও।

**পাসওয়ার্ড ভুলে গেলে:** Supabase → Authentication → Users → ইউজারের পাশের মেনু থেকে নতুন পাসওয়ার্ড দাও।

---

## ফ্রি প্ল্যানের সীমা (Supabase)

- **ফাইল সাইজ:** প্রতিটা ছবি বা ভিডিও সর্বোচ্চ **50 MB**। বড় ক্যামেরা ছবি ড্যাশবোর্ড নিজে ছোট করে নেয়।
- **মোট জায়গা:** **1 GB**।
- **মাসিক ডাউনলোড:** মাসে **5 GB** (egress)। ভিডিও এটা দ্রুত খরচ করে। লম্বা ফিল্ম YouTube বা Drive-এ রেখে প্রজেক্টে লিংক দাও, সাইটে শুধু ছোট কাট আপলোড করো।
- **Pause হওয়া:** এক সপ্তাহ কোনো activity না থাকলে ফ্রি প্রজেক্ট **pause** হয়ে যায়। তখন সাইটের লেখা দেখাবে, কিন্তু প্রজেক্ট আর গিয়ার আসবে না। Supabase-এ ঢুকে **Restore** চাপলেই আবার চালু।

---

## সমস্যা হলে

| কী দেখছ | কী করবে |
|---|---|
| সাইট খোলে, কিন্তু প্রজেক্ট/গিয়ার আসে না | `config.js`-এর URL আর key ঠিক আছে কিনা দেখো; `setup.sql` Run হয়েছে কিনা দেখো; Supabase প্রজেক্ট pause কিনা দেখো |
| `/#admin`-এ "Supabase is not connected yet" | `config.js`-এ মান বসাওনি, বা বসিয়ে GitHub-এ Commit করোনি |
| "Email or password is wrong" | Supabase → Authentication → Users-এ ইউজারটা আছে কিনা আর **Auto Confirm** হয়েছে কিনা দেখো |
| "This account is not an admin" | Supabase → Table Editor → `admins`-এ ইমেইলটা ঠিক বানানে আছে কিনা দেখো |
| আপলোডে "edit access" এরর | Log out করে আবার লগইন করো |
| আপলোডে "over 50 MB" | ভিডিও ছোট করে export করো (1080p, ~8–10 Mbps), অথবা YouTube/Drive লিংক দাও |
