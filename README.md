# 📢 Aplikasi Sistem Monitoring Humas

Platform monitoring pemberitaan media massa, analisis sentimen publik, dan pelaporan terpadu institusi berbasis **Next.js (App Router)**, **Prisma ORM (PostgreSQL)**, dan **NextAuth**.

---

## 📁 Struktur Direktori Proyek

```text
Monitoring Humas/
├── prisma/
│   ├── schema.prisma        # Model tabel database (User & MediaMonitoring)
│   └── seed.ts              # Data awal (Admin default & contoh berita)
├── src/
│   ├── app/
│   │   ├── api/             # BACKEND: API route handler
│   │   │   └── auth/
│   │   │       └── [...nextauth]/
│   │   │           └── route.ts  # Endpoint login/logout otomatis NextAuth
│   │   ├── dashboard/       # FRONTEND: Halaman dashboard tim Humas
│   │   │   └── page.tsx
│   │   ├── login/           # FRONTEND: Halaman login kredensial
│   │   │   └── page.tsx
│   │   ├── globals.css      # Desain dasar & konfigurasi Tailwind CSS
│   │   ├── layout.tsx       # Root layout aplikasi & SessionProvider
│   │   └── page.tsx         # Halaman utama (Portal Landing Page)
│   ├── components/
│   │   └── providers.tsx    # Wrapper SessionProvider untuk komponen klien
│   ├── lib/
│   │   ├── db.ts            # Singleton Prisma Client ke PostgreSQL
│   │   └── auth.ts          # Konfigurasi NextAuth (Credentials Provider & JWT)
│   ├── types/
│   │   └── next-auth.d.ts   # Tipe TypeScript kustom untuk sesi & user role
│   └── middleware.ts        # Penjaga gerbang (proteksi rute rahasia /dashboard)
├── .env                     # Kunci rahasia & koneksi database PostgreSQL
├── .env.example             # Contoh format variabel lingkungan
├── next.config.mjs          # Konfigurasi Next.js
├── tailwind.config.ts       # Konfigurasi Tailwind CSS
├── postcss.config.mjs       # Konfigurasi PostCSS
├── tsconfig.json            # Konfigurasi TypeScript
└── package.json             # Daftar pustaka dependensi & skrip
```

---

## 🚀 Panduan Memulai & Menjalankan Proyek

### 1. Pastikan Node.js Terpasang
Jika di terminal sistem Anda belum terdeteksi `node`, Anda dapat memasangnya dengan cepat di Windows menggunakan terminal PowerShell:
```powershell
winget install OpenJS.NodeJS.LTS
```
*Setelah instalasi selesai, buka kembali terminal Anda untuk memuat variabel PATH yang baru.*

### 2. Pasang Dependensi Proyek
Jalankan perintah berikut di folder proyek `d:\Monitoring Humas`:
```bash
npm install
```

### 3. Konfigurasi Database PostgreSQL
Buka file `.env` dan sesuaikan URL database PostgreSQL Anda:
```env
DATABASE_URL="postgresql://postgres:password@localhost:5432/monitoring_humas?schema=public"
NEXTAUTH_SECRET="super-secret-key-monitoring-humas-2026-very-secure"
NEXTAUTH_URL="http://localhost:3000"
```
> *Tips: Anda juga dapat menggunakan penyedia PostgreSQL cloud gratis seperti Supabase, Neon.tech, atau Railway.*

### 4. Sinkronisasi Skema Database & Seeding Data Awal
Sinkronkan tabel ke database PostgreSQL dan isi data contoh awal:
```bash
# Sinkronkan skema tabel ke database
npm run db:push

# Generate client Prisma terbaru
npm run db:generate

# Isi akun default & data contoh berita
npm run db:seed
```

### 5. Jalankan Server Pengembangan (Dev Server)
```bash
npm run dev
```
Buka peramban (browser) dan akses: **[http://localhost:3000](http://localhost:3000)**

---

## 🔑 Akun Uji Coba Bawaan (Default)
Setelah menjalankan `npm run db:seed`, Anda dapat masuk dengan akun berikut:
- **Email**: `admin@humas.go.id`
- **Password**: `admin123`
- **Peran (Role)**: `ADMIN`

---

## 🛡️ Alur Keamanan & Middleware
- Rute `/dashboard` dilindungi secara otomatis oleh `src/middleware.ts`.
- Pengguna yang mencoba mengakses `/dashboard` tanpa login akan otomatis dialihkan ke `/login`.
- Setelah login berhasil, pengguna akan langsung diarahkan ke `/dashboard`.
