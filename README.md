# MENTASKLITY — Website Manajemen Tugas Kuliah (dengan Pengingat Telegram)

Aplikasi web berbasis **Next.js App Router (TypeScript)**, **Prisma (PostgreSQL Neon)**, **shadcn/ui**, dan **grammY (Webhook)** untuk mencatat tugas kuliah per mata kuliah & per semester, dilengkapi pengingat otomatis via Bot Telegram saat sisa waktu menuju *deadline* kurang dari 24 jam.

---

## Struktur Folder (Sesuai Bagian 13 Spesifikasi)

```text
.
├─ prisma/
│  ├─ schema.prisma
│  └─ migrations/
├─ src/
│  ├─ app/
│  │  ├─ (auth)/
│  │  │  ├─ login/page.tsx
│  │  │  └─ register/page.tsx
│  │  ├─ (app)/
│  │  │  ├─ layout.tsx              # requireUser + guard onboarding + header
│  │  │  ├─ dashboard/page.tsx
│  │  │  ├─ semesters/page.tsx
│  │  │  └─ settings/page.tsx
│  │  ├─ onboarding/page.tsx
│  │  ├─ api/
│  │  │  ├─ cron/reminders/route.ts
│  │  │  └─ telegram/webhook/route.ts
│  │  ├─ layout.tsx
│  │  └─ page.tsx                   # redirect ke /dashboard atau /login
│  ├─ actions/                      # server actions (Bagian 11)
│  │  ├─ auth.ts
│  │  ├─ onboarding.ts
│  │  ├─ semester.ts
│  │  ├─ task.ts
│  │  └─ settings.ts
│  ├─ components/
│  │  ├─ ui/                        # shadcn/ui components
│  │  ├─ tasks/                     # task-card, task-list, task-dialog, filters, stats
│  │  ├─ semesters/                 # course-fields, semester-list
│  │  └─ layout/                    # app-header, theme-toggle, theme-provider, telegram-banner
│  ├─ lib/
│  │  ├─ prisma.ts                  # singleton PrismaClient
│  │  ├─ session.ts                 # JWT HS256 di cookie httpOnly (jose)
│  │  ├─ phone.ts                   # normalizePhone & formatPhoneDisplay
│  │  ├─ time.ts                    # format WIB, sisa waktu, parse datetime-local
│  │  ├─ env.ts                     # validasi zod untuk environment variables
│  │  ├─ validations.ts             # semua skema zod
│  │  └─ telegram/
│  │     ├─ bot.ts                  # instance grammY & handler perintah/kontak
│  │     └─ send.ts                 # kirim pesan & format pengingat HTML
│  └─ middleware.ts
├─ .env.example
├─ package.json                     # "postinstall": "prisma generate"
└─ README.md
```

---

## 1. Persiapan Environment Variables (`.env`)

Salin file `.env.example` menjadi `.env`:

```bash
cp .env.example .env
```

Isi seluruh variabel berikut:

| Variabel | Keterangan |
|---|---|
| `DATABASE_URL` | Connection string **pooled** dari Neon PostgreSQL (`?sslmode=require&pgbouncer=true`) |
| `DIRECT_URL` | Connection string **direct** dari Neon PostgreSQL (`?sslmode=require`) |
| `SESSION_SECRET` | String acak minimal 32 karakter (contoh: `openssl rand -hex 32`) |
| `TELEGRAM_BOT_TOKEN` | Token bot dari `@BotFather` |
| `TELEGRAM_BOT_USERNAME` | Username bot **tanpa** `@` (contoh: `MentaskBot` atau `MentasklityBot`) |
| `TELEGRAM_WEBHOOK_SECRET` | Token rahasia untuk header `X-Telegram-Bot-Api-Secret-Token` |
| `REQUIRE_PHONE_MATCH` | `"true"` (default: wajib verifikasi kontak nomor HP yang sama) atau `"false"` |
| `CRON_SECRET` | Token rahasia panjang untuk `Authorization: Bearer <CRON_SECRET>` |
| `NEXT_PUBLIC_APP_URL` | URL domain aplikasi (contoh: `https://mentasklity.vercel.app` atau `http://localhost:3000`) |

---

## 2. Cara Menjalankan di Lokal

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Jalankan migrasi database Prisma:**
   ```bash
   npx prisma migrate dev
   ```

3. **Jalankan unit test normalisasi nomor HP:**
   ```bash
   npm run test:phone
   ```

4. **Jalankan server development:**
   ```bash
   npm run dev
   ```
   Buka `http://localhost:3000`.

---

## 3. Cara Deploy ke Vercel (Gratis)

1. Push repositori ini ke GitHub/GitLab.
2. Buat project baru di **Vercel (Hobby)** dan hubungkan repositori.
3. Masukkan seluruh variabel dari `.env` ke menu **Settings → Environment Variables** di Vercel.
4. Klik **Deploy**. Script `"build": "prisma migrate deploy && next build"` dan `"postinstall": "prisma generate"` akan otomatis menyiapkan skema database di Neon.

---

## 4. Mendaftarkan Webhook Telegram

Setelah aplikasi ter-deploy ke Vercel, daftarkan URL webhook Telegram dengan perintah berikut (ganti `<TOKEN>`, `<DOMAIN>`, dan `<TELEGRAM_WEBHOOK_SECRET>`):

```bash
curl -X POST "https://api.telegram.org/bot<TOKEN>/setWebhook" \
  -d "url=https://<DOMAIN>/api/telegram/webhook" \
  -d "secret_token=<TELEGRAM_WEBHOOK_SECRET>"
```

---

## 5. Mengatur Pemicu Pengingat di cron-job.org (Gratis)

Karena paket gratis Vercel Hobby membatasi cron bawaan hanya 1x/hari, gunakan **cron-job.org**:

1. Daftar / masuk ke [https://cron-job.org](https://cron-job.org).
2. Klik **Create Cronjob**:
   - **Title:** `MENTASKLITY Reminder Cron`
   - **URL:** `https://<DOMAIN>/api/cron/reminders`
   - **Execution schedule:** Setiap **15 menit** (`*/15 * * * *`)
3. Buka tab **Advanced**:
   - **Request method:** `GET`
   - **Headers:** Tambahkan header:
     - Key: `Authorization`
     - Value: `Bearer <CRON_SECRET>`
4. Simpan dan aktifkan cronjob.

---

## Catatan Asumsi Teknis

- Bila user menghapus semester yang sedang berstatus **Aktif** (dan masih memiliki semester lain), sistem otomatis mengalihkan status **Aktif** ke semester terbaru berikutnya dalam satu transaksi database.
- Saat menghitung tugas dengan *deadline* `< 24 jam`, zona waktu acuan tampilan dan input adalah `Asia/Jakarta` (WIB / UTC+7), sedangkan penyimpanan di PostgreSQL selalu dalam UTC.
