# 📘 DOKUMEN IMPLEMENTASI SISTEM INFORMASI TERPADU
## HumasMonitor: Portal Aspirasi Publik, Monitoring Humas & Penanganan Kendala Fasilitas

---

## 📑 DAFTAR ISI
1. [Ringkasan Eksekutif Sistem](#1-ringkasan-eksekutif-sistem)
2. [Arsitektur Teknologi & Spesifikasi Stack](#2-arsitektur-teknologi--spesifikasi-stack)
3. [Matriks Peran Pengguna (Multi-Role Architecture)](#3-matriks-peran-pengguna-multi-role-architecture)
4. [Penjabaran Fitur, Tampilan & Alur Kerja per Modul](#4-penjabaran-fitur-tampilan--alur-kerja-per-modul)
   - 4.1. [Modul 1: Landing Page & Portal Pengaduan Publik (`/`)](#41-modul-1-landing-page--portal-pengaduan-publik-)
   - 4.2. [Modul 2: Pelacakan Tiket Mandiri Real-Time](#42-modul-2-pelacakan-tiket-mandiri-real-time)
   - 4.3. [Modul 3: Portal Autentikasi Terpadu (`/login`)](#43-modul-3-portal-autentikasi-terpadu-login)
   - 4.4. [Modul 4: Pusat Komando & Disposisi Humas (`/dashboard`)](#44-modul-4-pusat-komando--disposisi-humas-dashboard)
   - 4.5. [Modul 5: Portal Kendala Fasilitas Karyawan (`/karyawan`)](#45-modul-5-portal-kendala-fasilitas-karyawan-karyawan)
   - 4.6. [Modul 6: Workspace Operasional Teknisi (`/teknisi`)](#46-modul-6-workspace-operasional-teknisi-teknisi)
   - 4.7. [Modul 7: Panel Konfigurasi & Link Portal Superadmin](#47-modul-7-panel-konfigurasi--link-portal-superadmin)
5. [Diagram Alur Sistem (End-to-End System Workflows)](#5-diagram-alur-sistem-end-to-end-system-workflows)
6. [Arsitektur Keamanan & Proteksi Sistem](#6-arsitektur-keamanan--proteksi-sistem)
7. [Matriks Poin Plus & Keunggulan Komparatif](#7-matriks-poin-plus--keunggulan-komparatif)
8. [Panduan Operasional & Deployment](#8-panduan-operasional--deployment)

---

## 1. Ringkasan Eksekutif Sistem

**HumasMonitor** adalah platform sistem informasi komprehensif yang dirancang untuk menjembatani komunikasi dua arah antara instansi pemerintah/publik dengan masyarakat luas, sekaligus mengintegrasikan tata kelola operasional sarana dan fasilitas internal instansi secara terpadu.

Sistem ini memadukan 3 domain layanan utama ke dalam satu ekosistem:
1. **Layanan Komunikasi Publik & Aspirasi Warga**: Gerbang pelaporan keluhan, aspirasi, dan permohonan informasi publik yang dapat diakses oleh masyarakat umum secara fleksibel tanpa hambatan birokrasi pendaftaran, dilengkapi opsi anonim dan pelacakan tiket transparan.
2. **Pusat Komando & Disposisi Humas (PR Command Center)**: Meja kerja digital bagi tim Humas dan pimpinan instansi untuk menelaah urgensi pengaduan, mendisposisikannya ke unit pelaksana berwenang, dan menerbitkan rilis jawaban resmi instansi.
3. **Sistem Tiket Pemeliharaan & Kendala Fasilitas Internal**: Meja kerja pelaporan kerusakan sarana kerja bagi seluruh karyawan internal yang langsung terdistribusi ke personil teknisi lapangan (IT Support, AC, Mekanikal/Listrik, Audio Visual, Gedung).

---

## 2. Arsitektur Teknologi & Spesifikasi Stack

Sistem dibangun menggunakan standar rekayasa perangkat lunak modern berbasis *Full-stack JavaScript/TypeScript* dengan performa tinggi, keamanan tipe data (*type safety*), dan skalabilitas cloud yang tinggi:

| Lapisan (Layer) | Teknologi | Versi | Peran & Alasan Pemilihan |
| :--- | :--- | :--- | :--- |
| **Framework Utama** | Next.js (App Router) | 14.2.x | Menyediakan Server-Side Rendering (SSR) untuk kecepatan muat, Route Handlers untuk REST API terpadu, dan optimasi aset modern. |
| **Bahasa Pemrograman** | TypeScript | 5.7.x | Menjamin *compile-time type safety*, meminimalkan *runtime error*, dan memudahkan pemeliharaan kode jangka panjang. |
| **User Interface (UI)** | React 18 & Tailwind CSS | 18.3.x / 3.4.x | Komponen reaktif interaktif dengan utilitas styling Tailwind yang ringan, fleksibel, responsif di ponsel maupun desktop, didukung ikonografi modern dari `lucide-react`. |
| **Database ORM** | Prisma ORM | 5.22.x | Abstraksi skema basis data yang deklaratif, migrasi otomatis, dan kueri terparameterisasi yang kebal terhadap serangan *SQL Injection*. |
| **Basis Data Relasional** | PostgreSQL | 15+ / Neon Serverless | Database ACID-compliant untuk konsistensi data transaksi tiket, relasi pengguna, dan histori penanganan. |
| **Autentikasi & Sesi** | NextAuth.js (Auth.js) | 4.24.x | Pengelolaan sesi berbasis JWT (*JSON Web Token*) yang aman, terlindung *middleware route guarding*, dan masa berlaku sesi 30 hari. |
| **Enkripsi Kredensial** | bcryptjs | 2.4.x | Enkripsi satu arah (*one-way hashing*) dengan salt round 10 untuk proteksi kata sandi pengguna di database. |

---

## 3. Matriks Peran Pengguna (Multi-Role Architecture)

Sistem menerapkan *Role-Based Access Control* (RBAC) dengan 5 tingkat hak akses yang memiliki wilayah kerja spesifik:

```mermaid
graph TD
    User([Pengguna Sistem])
    
    User -->|Masyarakat Luas| Publik[Masyarakat Publik<br/>Tanpa Login]
    User -->|Pegawai Terotentikasi| AuthUser[Pegawai Terdaftar]
    
    AuthUser -->|Role: STAFF| Karyawan[Karyawan Internal]
    AuthUser -->|Role: TEKNISI| Teknisi[Tim Teknisi Lapangan]
    AuthUser -->|Role: ADMIN / HUMAS| AdminHumas[Administrator Tim Humas]
    AuthUser -->|Role: SUPERADMIN| Superadmin[Super Administrator]

    Publik -->|Mengirim| AduanPublik[Aduan Publik & Lacak Tiket]
    Karyawan -->|Melaporkan| KendalaRuangan[Kendala Fasilitas Ruangan]
    Teknisi -->|Menangani| PerbaikanFisik[Perbaikan & Update Teknisi]
    AdminHumas -->|Mendisposisi| MejaKomando[Disposisi & Respon Humas]
    Superadmin -->|Mengatur| ParameterSistem[Konfigurasi & Manajemen Link]
```

| Peran (Role) | Hak Akses & Kewenangan | Modul Utama | Proteksi Akses |
| :--- | :--- | :--- | :--- |
| **PUBLIK (Warga)** | Mengajukan laporan/keluhan, mengunggah bukti foto/PDF, memilih opsi anonim, dan melacak status progres tiketnya. | `/` (Landing Page) | Terbuka (Dilindungi Anti-Spam Widget) |
| **STAFF (Karyawan)** | Melaporkan kerusakan sarana/fasilitas di ruangan kerja, memilih unit teknisi tujuan, memantau riwayat tiketnya. | `/karyawan` | Wajib Login (Role `STAFF`) |
| **TEKNISI** | Menerima penugasan perbaikan, memperbarui tahapan kerja (*Diterima*, *Sedang Dikerjakan*, *Selesai*, *Terkendala*), mengisi catatan teknis. | `/teknisi` & `/dashboard` (Tab Internal) | Wajib Login (Role `TEKNISI`) |
| **ADMIN / HUMAS** | Mengakses seluruh laporan masuk (publik & internal), menentukan skala urgensi, mendisposisikan laporan ke bidang terkait, menyusun rilis jawaban resmi. | `/dashboard` (Tab Laporan) | Wajib Login (Role `ADMIN` / `HUMAS`) |
| **SUPERADMIN** | Mengonfigurasi nama instansi, tagline, unit teknisi, pengumuman darurat, sakelar modul on/off, dan distribusi tautan resmi. | `/dashboard` (Tab Konfigurasi) | Wajib Login (Role `SUPERADMIN`) |

---

## 4. Penjabaran Fitur, Tampilan & Alur Kerja per Modul

### 4.1. Modul 1: Landing Page & Portal Pengaduan Publik (`/`)

Landing page dirancang dengan pendekatan *Citizen-Centric Design* mengusung palet warna hijau zamrud (*emerald*) yang melambangkan transparansi, keterbukaan, dan pelayanan publik yang ramah.

```text
+-----------------------------------------------------------------------------------+
|  [HumasMonitor]  Portal Aspirasi & Aduan Warga       [Lapor] [Lacak] [Login Staf] |
+-----------------------------------------------------------------------------------+
|                                                                                   |
|                   Komitmen Respons Cepat & Transparansi Humas                     |
|        Sampaikan keluhan dan permohonan informasi secara aman dan cepat           |
|                                                                                   |
|           [ Buat Laporan Sekarang ]       [ Lacak Status Laporan ]                |
|                                                                                   |
+-----------------------------------------------------------------------------------+
|  TRANSPARANSI DATA:                                                               |
|  [ Total Laporan: 1.248+ ] [ Selesai: 95.5% ] [ SLA: < 24 Jam ] [ Mutu: 98.4% ]  |
+-----------------------------------------------------------------------------------+
|  FORMULIR ADUAN RESMI                   |  CEK PROGRES TIKET                      |
|  [v] Kirim sebagai Anonim               |  [ Masukkan No. Tiket: HM-xxxxxxx ]     |
|  Kategori: [ Pelayanan Publik       v ] |  [ Cari Status Laporan ]                |
|  Lokasi  : [ Ruang Loket Terpadu      ] |  -------------------------------------  |
|  Judul   : [ Antrean Cetak Berkas     ] |  ALUR TINDAK LANJUT HUMAS               |
|  Kronologi: [ ....................... ] |  1. Laporan Diterima Meja Kerja         |
|  Lampiran : [ Unggah Foto / PDF       ] |  2. Verifikasi & Disposisi Bidang       |
|  Keamanan : [v] Verifikasi Anti-Spam    |  3. Tindak Lanjut Tuntas & Tanggapan    |
|  [ Kirim Laporan Resmi ]                |                                         |
+-----------------------------------------------------------------------------------+
```

#### Fitur Utama Halaman Depan:
1. **Hero Header & Branding Dinamis**: Menampilkan identitas instansi, slogan komitmen transparansi, dan tombol navigasi langsung (*smooth scrolling*).
2. **Indikator Transparansi & Akuntabilitas Data Publik**:
   - Menghitung metrik total laporan masyarakat yang telah diterima sistem.
   - Persentase tingkat penyelesaian keluhan (*completion rate*).
   - Rata-rata Service Level Agreement (SLA) respons awal tim verifikator.
   - Indeks kepuasan dan akuntabilitas mutu pelayanan.
3. **Formulir Pengaduan Publik Mandiri**:
   - **Mode Anonimitas Fleksibel**: Checkbox toggle "*Kirim sebagai Anonim*". Ketika diaktifkan, kolom identitas disembunyikan dan database menjamin tidak menyimpan identitas warga.
   - **Kategori Terstandar**: Pelayanan Publik, Fasilitas Infrastruktur, Etika/Nakes, Permohonan Informasi Publik, Klarifikasi Hoaks, dan Lainnya.
   - **Titik Lokasi Kejadian**: Input lokasi spesifik (nama ruangan, nomor loket, unit pelayanan) guna mempermudah penelusuran fisik.
   - **Unggah Lampiran Bukti Pendukung**: Dukungan unggah berkas foto (JPG, PNG, WEBP) atau dokumen PDF (maksimal 5 MB) dengan visualisasi pratinjau instan (*thumbnail preview*) dan tombol hapus cepat.
   - **Verifikasi Keamanan Anti-Spam Terintegrasi**: Komponen pelindung interaktif (bergaya modern Captcha/Turnstile) yang wajib dicentang sebelum tombol kirim aktif, mencegah serangan *bot submission* otomatis.
4. **Penerbitan Nomor Tiket Otomatis**:
   - Format tiket unik standar kedinasan: `HM-YYMMDD-[4 Karakter Acak]` (Contoh: `HM-260905-K3B9`).
   - Kotak notifikasi sukses dilengkapi fitur **1-Klik Salin Tiket** (*Copy to Clipboard*) agar warga dapat menyimpannya dengan mudah.

---

### 4.2. Modul 2: Pelacakan Tiket Mandiri Real-Time

Masyarakat tidak perlu menelepon atau mendatangi kantor instansi untuk mengetahui sejauh mana keluhannya diproses.

#### Fitur & Alur Tracking:
1. Warga memasukkan nomor tiket pada kotak pelacakan di sisi kanan formulir.
2. Tersedia fitur **"Coba Tiket Contoh"** bagi warga atau asesor yang ingin mencoba fitur pelacakan secara instan.
3. Sistem memanggil endpoint `/api/reports/track?ticket=...` dan menampilkan kartu status interaktif:
   - **Nomor Tiket & Tingkat Urgensi** (Kritis, Tinggi, Sedang, Rendah).
   - **Badge Status Penanganan** (*BARU*, *DIDISPOSISIKAN*, *SEDANG_DIPROSES*, *SELESAI*).
   - **Tanggal dan Waktu Masuk Laporan**.
   - **Informasi Bidang Disposisi** (Unit/dinas mana yang sedang menangani).
   - **Tanggapan Resmi & Hasil Penanganan Humas**: Kotak sorotan berlatar hijau yang memuat jawaban solusi resmi dari pimpinan/Humas beserta stempel waktu penyelesaiannya.

---

### 4.3. Modul 3: Portal Autentikasi Terpadu (`/login`)

Gerbang masuk terpusat bagi seluruh jajaran aparatur dan tim operasional internal.

```text
+-------------------------------------------------------------+
|                     [HumasMonitor]                          |
|                  Akses Masuk Terpadu                        |
|        Superadmin, Admin Humas, Karyawan & Teknisi          |
+-------------------------------------------------------------+
|                                                             |
|  Email Kedinasan : [ admin@humas.go.id                    ] |
|  Kata Sandi      : [ ••••••••••••                         ] |
|                                                             |
|  [ Masuk ke Sistem ]                                        |
|                                                             |
|  ---------------------------------------------------------  |
|  AKUN UJI COBA CEPAT (1-KLIK DEMO):                         |
|  [ Superadmin ]        [ Admin Humas ]                      |
|  [ Karyawan Staf ]     [ Tim Teknisi ]                      |
+-------------------------------------------------------------+
```

#### Fitur Utama Login:
1. **Validasi Kredensial Terenkripsi**: Memvalidasi kecocokan email dan hash password `bcrypt`.
2. **Tombol Pengisian Cepat (1-Click Demo Login)**: Memudahkan pimpinan, auditor, atau staf penguji untuk berganti peran secara instan (Superadmin, Admin Humas, Staf Karyawan, dan Teknisi) tanpa perlu mengingat kata sandi pengujian.
3. **Smart Role-Based Redirection**:
   - Pengguna dengan peran `STAFF` otomatis diarahkan ke `/karyawan`.
   - Pengguna dengan peran `TEKNISI` diarahkan ke workspace `/dashboard` (Tab Pantauan Kendala) atau `/teknisi`.
   - Pengguna `ADMIN` dan `SUPERADMIN` diarahkan ke meja kerja komando `/dashboard`.
   - Mendukung parameter `callbackUrl` untuk mengembalikan pengguna ke halaman yang awalnya ingin diakses setelah login sukses.

---

### 4.4. Modul 4: Pusat Komando & Disposisi Humas (`/dashboard`)

Halaman utama bagi Admin Humas untuk memantau, memfilter, dan menindaklanjuti seluruh laporan yang masuk ke instansi.

#### Fitur Unggulan Meja Kerja Humas:
1. **Unified Feed (Penyatuan Dua Aliran Laporan)**:
   Admin Humas dapat melihat aduan masyarakat publik dan laporan kendala ruangan dari karyawan dalam satu tabel terpadu tanpa berpindah-pindah aplikasi.
2. **6 Kartu Ringkasan Indikator (Executive Summary Cards)**:
   - Total Seluruh Laporan Masuk
   - Total Aduan Publik Terdata
   - Total Kendala Ruangan Pegawai
   - Total Laporan Berstatus Kritis (Memerlukan tindakan segera)
   - Total Laporan Baru yang Belum Disposisi
   - Total Laporan yang Telah Tuntas Diselesaikan
3. **Penyaringan Multi-Kriteria (Multi-Faceted Filtering & Sorting)**:
   - **Filter Sumber / Cara Masuk**: Memilah antara *Semua Sumber*, *Aduan Publik*, atau *Kendala Ruangan*.
   - **Sortir Tanggal Masuk**: Menata urutan berdasarkan *Terbaru Masuk* atau *Terlama Masuk*.
   - **Filter Status**: Memilih tiket yang *Baru*, *Sedang Proses/Disposisi*, *Selesai*, atau *Terkendala*.
   - **Filter Urgensi**: Memfilter derajat kedaruratan (*Kritis*, *Tinggi*, *Sedang*, *Rendah*).
   - **Pencarian Bebas (Instant Search)**: Mengetik nomor tiket, pengirim, kata kunci keluhan, atau ruangan kerja.
4. **Triase Cepat (Quick In-Table Urgency Update)**:
   Admin dapat langsung mengganti label urgensi tiket secara langsung pada baris tabel tanpa harus membuka formulir modal yang memakan waktu.
5. **Modal Disposisi Resmi**:
   - Memilih dinas/bidang pelaksana (Pelayanan Publik, Umum/SDM, TI, Aset/Keuangan, Pengawasan Internal, dll.).
   - Menambahkan catatan instruksi disposisi resmi dari pimpinan/Humas.
   - Status tiket otomatis beralih menjadi `DIDISPOSISIKAN` dan waktu disposisi tercatat sistem.
6. **Modal Selesaikan Laporan & Rilis Tanggapan Resmi**:
   - Menyusun draf tanggapan resmi yang menjawab permasalahan pelapor.
   - Begitu disimpan, status tiket berubah menjadi `SELESAI` dan jawaban tersebut langsung dapat dibaca oleh publik saat melacak nomor tiketnya.

---

### 4.5. Modul 5: Portal Kendala Fasilitas Karyawan (`/karyawan`)

Khusus diperuntukkan bagi aparatur/pegawai internal instansi untuk melaporkan kendala teknis atau kerusakan alat di ruang kerja masing-masing.

#### Fitur & Alur Kerja Pegawai:
1. **Formulir Kerusakan Fasilitas Cepat**:
   - Nama Pelapor otomatis terisi dari akun pegawai yang sedang aktif (terverifikasi).
   - Input Lokasi Ruangan (Contoh: "*Ruang Rapat Lantai 2*", "*Loket Pelayanan 4*", "*Gudang Arsip*").
   - Kategori Teknis: Jaringan & Internet, Komputer & Hardware, Sistem Aplikasi, Listrik/Mekanikal, AC Tata Udara, Audio Visual/Proyektor, Sarana Gedung.
   - Menentukan Unit Teknisi Tujuan secara langsung.
   - Memilih Tingkat Urgensi (Kritis, Tinggi, Sedang, Rendah).
2. **Penerbitan Tiket Kendala Internal (`KND-YYMMDD-XXXX`)**:
   Tiket otomatis tercatat dan langsung masuk ke daftar antrean kerja tim teknisi yang bersangkutan.
3. **Tabel Riwayat Kendala Mandiri**:
   Pegawai dapat memantau pergerakan teknisi dari meja kerjanya sendiri: apakah teknisi sudah menerima laporan, sedang berjalan menuju ruangan, sedang melakukan perbaikan fisik, atau memerlukan suku cadang pengganti.

---

### 4.6. Modul 6: Workspace Operasional Teknisi (`/teknisi`)

Dirancang khusus untuk tim teknisi lapangan agar mudah digunakan melalui perangkat tablet maupun ponsel saat berada di lapangan.

#### Alur Penanganan Teknisi:
```text
[ TIKET MASUK (TERKIRIM) ]
            |
            v  (Teknisi klik tombol "Terima Tiket")
[ DITERIMA TEKNISI ] -> Teknisi bersiap & membawa peralatan menuju ruangan
            |
            v  (Teknisi tiba di lokasi & mulai perbaikan)
[ SEDANG DIKERJAKAN ] -> Sistem mencatat timestamp startedAt
            |
            +-------------------------------+
            |                               |
            v (Berhasil diperbaiki)         v (Butuh suku cadang/vendor)
     [ SELESAI / TUNTAS ]             [ TERKENDALA ]
   Catatan: "Kabel LAN diganti"      Catatan: "Menunggu motor kipas AC"
```

1. **Pembaruan Tahapan Pekerjaan Fisik**:
   - Mengubah status pengerjaan secara bertahap.
   - Sistem secara otomatis mencatat stempel waktu mulai pengerjaan (*startedAt*) dan waktu tuntas pengerjaan (*completedAt*) untuk perhitungan durasi penanganan nyata.
2. **Catatan Lapangan Teknisi (*Technician Notes*)**:
   Teknisi dapat mendokumentasikan temuan teknis (misal: "*Kabel patch cord switch rusak dan telah diganti baru. Koneksi internet kembali normal 100 Mbps*").

---

### 4.7. Modul 7: Panel Konfigurasi & Link Portal Superadmin

Diakses eksklusif oleh pengguna dengan peran `SUPERADMIN` pada tab *Konfigurasi dan Link Portal*.

#### Fitur Utama Superadmin:
1. **Pusat Tautan & Manajemen Link Berbagi (Share Link Center)**:
   Menyediakan tombol 1-klik untuk menyalin tautan resmi sesuai audiens target:
   - **Tautan Portal Publik (`/`)**: Untuk dibagikan ke medsos, website dinas, atau media massa.
   - **Tautan Portal Kendala Pegawai (`/karyawan`)**: Untuk dibagikan di grup WhatsApp internal staf atau intranet.
   - **Tautan Portal Teknisi (`/teknisi`)**: Untuk dibagikan kepada koordinator dan teknisi lapangan.
2. **Pengaturan Parameter Organisasi Dinamis**:
   - Mengubah Nama Instansi dan Slogan/Tagline yang langsung tercermin ke seluruh tampilan sistem.
   - Menghidupkan/mematikan (*Toggle Switch*) modul publik, modul karyawan, dan modul teknisi.
   - Mengedit daftar ketersediaan unit teknisi instansi (disimpan dinamis ke tabel `system_settings` di PostgreSQL).
   - Memasang pengumuman darurat instansi (*system announcement banner*).

---

## 5. Diagram Alur Sistem (End-to-End System Workflows)

### 5.1. Alur Penanganan Pengaduan Publik (Citizen to Resolution)

```mermaid
sequenceDiagram
    autonumber
    actor Warga as Masyarakat (Publik)
    participant Web as Portal Web (Landing Page)
    participant API as Backend Route Handlers
    participant DB as PostgreSQL Database
    actor Humas as Admin Tim Humas
    actor Bidang as Bidang Pelaksana Terkait

    Warga->>Web: Isi formulir aduan (Judul, Lokasi, Bukti Foto/PDF)
    Warga->>Web: Centang verifikasi anti-spam
    Warga->>Web: Klik "Kirim Laporan Resmi"
    Web->>API: POST /api/reports (Payload aduan)
    API->>DB: Simpan ke public_reports & terbitkan No Tiket HM-xxxx
    DB-->>Web: Return ticketNumber
    Web-->>Warga: Tampilkan nomor tiket & opsi salin (copy)

    Note over Humas,DB: Humas memantau Dashboard secara berkala
    Humas->>DB: GET /api/reports (Melihat laporan status BARU)
    Humas->>DB: PATCH /api/reports/[id] (Disposisi ke Bidang & Atur Urgensi)
    
    Bidang->>Humas: Konfirmasi tindak lanjut fisik/lapangan selesai
    Humas->>DB: PATCH /api/reports/[id] (Status SELESAI + Response Note)
    
    Warga->>Web: Input No Tiket di fitur Lacak Tiket
    Web->>API: GET /api/reports/track?ticket=HM-xxxx
    API->>DB: Query data tiket & responseNote
    DB-->>Web: Data lengkap status & respon Humas
    Web-->>Warga: Menampilkan hasil penanganan tuntas instansi
```

---

### 5.2. Alur Penanganan Kendala Fasilitas Pegawai (Internal Maintenance)

```mermaid
sequenceDiagram
    autonumber
    actor Staf as Karyawan Staf
    participant Portal as Portal /karyawan
    participant DB as PostgreSQL Database
    actor Tek as Tim Teknisi Lapangan

    Staf->>Portal: Login dengan akun kredensial kedinasan
    Staf->>Portal: Isi form kendala ruangan & pilih unit teknisi
    Portal->>DB: POST /api/internal-reports (Status: TERKIRIM)
    DB-->>Staf: Tiket terbit: KND-xxxx

    Tek->>DB: GET /api/internal-reports (Filter unit teknisinya)
    Tek->>DB: Update Status -> DITERIMA_TEKNISI (Menuju lokasi)
    Tek->>DB: Update Status -> SEDANG_DIKERJAKAN (Mulai perbaikan)
    Tek->>DB: Update Status -> SELESAI (Mengisi catatan hasil kerja)
    
    Staf->>Portal: Cek daftar kendala saya (Status tertera SELESAI)
```

---

## 6. Arsitektur Keamanan & Proteksi Sistem

Keamanan dibangun secara berlapis (*defense-in-depth*) dari antarmuka pengguna hingga lapisan penyimpanan database:

```text
[ Internet / Publik / Aparatur ]
                |
                v
+-----------------------------------------------------------+
| 1. PERIMETER & ANTI-SPAM DEFENSE                          |
|    - Anti-Spam Interactive Challenge Verification         |
|    - Client & Server-Side Input Sanitization              |
|    - Payload Size Limiter (Attachment File Max 5 MB)      |
+-----------------------------------------------------------+
                |
                v
+-----------------------------------------------------------+
| 2. NETWORK & MIDDLEWARE GATEKEEPER                        |
|    - Next.js Middleware (/dashboard Route Guarding)       |
|    - Unauthenticated Request Interception -> 307 Redirect |
+-----------------------------------------------------------+
                |
                v
+-----------------------------------------------------------+
| 3. AUTHENTICATION & IDENTITY MANAGEMENT                   |
|    - NextAuth.js JWT Signed Session (NEXTAUTH_SECRET)     |
|    - Password Hashing (bcryptjs Salt Round 10)            |
|    - Zero Plaintext Password Stored                       |
+-----------------------------------------------------------+
                |
                v
+-----------------------------------------------------------+
| 4. AUTHORIZATION & ROLE-BASED ACCESS CONTROL (RBAC)       |
|    - Server-Side Role Validation in Route Handlers        |
|    - Strict Scope Isolation (Staff only see own reports)  |
|    - Superadmin Exclusive Execution on /api/settings      |
+-----------------------------------------------------------+
                |
                v
+-----------------------------------------------------------+
| 5. DATABASE PROTECTION LAYER                              |
|    - Prisma Parameterized Queries (Anti-SQL Injection)    |
|    - PostgreSQL Schema & Foreign Key Constraints          |
|    - Whistleblower / Citizen Identity Anonymization       |
+-----------------------------------------------------------+
```

### Rincian Fitur Keamanan:

#### 1. Enkripsi Kata Sandi & Manajemen Kredensial
- Setiap kata sandi akun diverifikasi dan disimpan menggunakan algoritma **bcrypt** dengan faktor biaya komputasi *salt rounds = 10*.
- Kata sandi teks biasa (*plaintext*) tidak pernah dicatat dalam log ataupun disimpan di database.
- Proteksi terhadap serangan *timing attack* dan *dictionary attack*.

#### 2. Keamanan Sesi Token JWT (JSON Web Token)
- Menggunakan strategi sesi JWT yang ditandatangani secara kriptografis menggunakan `NEXTAUTH_SECRET`.
- Token masa berlakunya dibatasi 30 hari (*maxAge*), dapat dibatalkan sewaktu-waktu melalui fitur *Sign Out*.
- Payload token membawa identitas penting (`id`, `email`, `role`) yang divalidasi ulang di setiap *handshake* API.

#### 3. Penjagaan Rute Otomatis (Next.js Middleware)
- File `src/middleware.ts` mengonfigurasi *matcher* pada rute `/dashboard/:path*`.
- Setiap pengguna anonim atau peretas yang mencoba mengakses `/dashboard` tanpa otentikasi akan otomatis diblokir di tingkat *edge* dan dialihkan ke `/login`.

#### 4. Validasi Sisi Server (Server-Side Authorization & RBAC)
- Bukan hanya di sisi antarmuka, setiap endpoint REST API (`POST`, `PATCH`, `PUT`) memverifikasi ulang sesi dan hak akses:
  - Endpoint `/api/settings`: Menolak eksekusi jika bukan akun bertipe `SUPERADMIN`.
  - Endpoint `/api/internal-reports`: Pegawai dengan peran `STAFF` hanya dapat melihat daftar laporan miliknya sendiri (`where: { reporterId: session.user.id }`).
  - Endpoint disposisi `/api/reports/[id]`: Hanya dapat dimutasi oleh `ADMIN`, `HUMAS`, atau `SUPERADMIN`.

#### 5. Proteksi Anti-Spam & Bot Abuse di Halaman Publik
- Formulir pengaduan publik dilengkapi widget verifikasi interaktif anti-spam.
- Validasi wajib di sisi browser dan server: formulir tidak akan diproses jika status verifikasi belum terpenuhi, mencegah banjir pengiriman formulir otomatis (*flood/spam bot attack*).

#### 6. Proteksi Data Privasi Warga (Whistleblower Protection)
- Sistem mendukung mode pelaporan anonim penuh. Jika opsi anonim dipilih:
  - Kolom `reporterName` dan `reporterContact` diubah menjadi `null` sebelum disimpan ke database.
  - Tim pelaksana bidang maupun teknisi tidak dapat melihat siapa yang mengirimkan laporan, melindungi keamanan pelapor.

#### 7. Pencegahan SQL Injection & Sanitasi Data
- Akses database dikontrol penuh oleh **Prisma ORM** yang secara default menggunakan kueri terparameterisasi (*prepared statements*).
- Celah *SQL Injection (SQLi)* tertutup sepenuhnya karena nilai input pengguna tidak pernah disambung langsung ke dalam klausa kueri SQL mentah.

#### 8. Pembatasan Unggahan Berkas (Attachment Hardening)
- Berkas dibatasi maksimal 5 MB untuk mencegah serangan *Denial of Service* (DoS) melalui penghabisan ruang disk server.
- Tipe berkas dibatasi ketat hanya pada format gambar standar (`image/*`) dan dokumen dokumen resmi (`application/pdf`).

---

## 7. Matriks Poin Plus & Keunggulan Komparatif

| Dimensi Evaluasi | Sistem Informasi Konvensional | HumasMonitor (Sistem Ini) | Nilai Keunggulan (Poin Plus) |
| :--- | :--- | :--- | :--- |
| **Akses Pelaporan Publik** | Warga wajib mendaftar akun, aktivasi email/KTP yang rumit. | Warga bisa langsung lapor dalam hitungan detik tanpa perlu registrasi akun. | **Tingkat partisipasi warga meningkat drastis** karena menghilangkan friksi pendaftaran. |
| **Perlindungan Identitas** | Data pelapor seringkali terekspos ke unit kerja yang dilaporkan. | Opsi Anonim terenkripsi dan otomatis menihilkan data identitas dari database. | **Memberikan rasa aman bagi pelapor (whistleblower)** saat melaporkan isu sensitif. |
| **Transparansi Kinerja** | Penanganan tertutup di internal; warga tidak tahu apakah aduan diproses. | Kotak Lacak Tiket mandiri + Dashboard Transparansi SLA dan Indeks Mutu. | **Meningkatkan kepercayaan publik (Public Trust)** terhadap integritas instansi. |
| **Integrasi Meja Kerja** | Aplikasi humas terpisah dari aplikasi pemeliharaan fasilitas kantor. | Meja kerja terpadu (Unified Feed) untuk aduan masyarakat & kendala ruangan. | **Efisiensi koordinasi**: Humas memiliki pandangan 360 derajat atas seluruh dinamika instansi. |
| **Penyaluran Kendala Internal** | Pegawai melapor via grup chat tidak resmi atau nota fisik lambat. | Portal khusus karyawan yang langsung terdistribusi ke unit teknisi terkait. | **Pemotongan birokrasi**: Kendala ruang kerja langsung diterima teknisi secara realtime. |
| **Operasional Teknisi** | Penugasan manual, tidak ada pencatatan waktu mulai & selesai perbaikan. | Workspace teknisi dengan tombol pembaruan status & pencatatan catatan teknis. | **Akuntabilitas pemeliharaan aset**: Histori SLA pengerjaan tercatat objektif. |
| **Kustomisasi Instansi** | Pengaturan nama instansi/unit kerja harus merombak kode program. | Panel Superadmin dinamis untuk konfigurasi nama, tagline, unit kerja, & on/off modul. | **Fleksibilitas tinggi**: Mudah diadaptasi oleh dinas/kementerian/badan usaha mana pun. |
| **Keamanan Sistem** | Password plaintext / hash MD5 usang, tidak ada middleware penjaga rute. | Bcrypt hashing + NextAuth JWT + Middleware Route Guarding + RBAC + Anti-Spam. | **Standar keamanan enterprise** yang mematuhi prinsip keandalan data dan privasi. |

---

## 8. Panduan Operasional & Deployment

### 8.1. Konfigurasi Variabel Lingkungan (`.env`)
Salin file `.env.example` ke `.env` dan lengkapi nilainya:
```env
# Koneksi Basis Data PostgreSQL (Lokal / Cloud Neon / Supabase)
DATABASE_URL="postgresql://username:password@localhost:5432/monitoring_humas?schema=public"

# Kunci Rahasia Enkripsi Sesi JWT NextAuth (Gunakan string acak panjang)
NEXTAUTH_SECRET="super-secret-key-monitoring-humas-2026-very-secure-random-token"

# URL Dasar Aplikasi
NEXTAUTH_URL="http://localhost:3000"
```

### 8.2. Langkah Inisialisasi Database
```bash
# 1. Pasang dependensi
npm install

# 2. Sinkronkan skema tabel ke database PostgreSQL
npm run db:push

# 3. Generate client Prisma
npm run db:generate

# 4. Isi akun uji coba bawaan & data awal
npm run db:seed
```

### 8.3. Menjalankan Server Aplikasi
```bash
# Mode Pengembangan (Development)
npm run dev

# Mode Produksi (Production Build & Start)
npm run build
npm run start
```
Buka peramban di: **`http://localhost:3000`**

### 8.4. Kredensial Akun Bawaan (Default Seed Credentials)
| Peran (Role) | Email Login | Kata Sandi | Deskripsi Penggunaan |
| :--- | :--- | :--- | :--- |
| **Superadmin** | `superadmin@humas.go.id` | `admin123` | Konfigurasi sistem, manajemen modul, dan link portal |
| **Admin Humas** | `admin@humas.go.id` | `admin123` | Disposisi laporan publik & penyelesaian tanggapan resmi |
| **Karyawan Staf** | `budi@instansi.go.id` | `karyawan123` | Pelaporan kendala fisik/IT di ruangan kerja kantor |
| **Tim Teknisi** | `teknisi@instansi.go.id` | `teknisi123` | Penanganan operasional teknis & update pergerakan perbaikan |

---

## 9. Kesimpulan

Sistem **HumasMonitor** berhasil menghadirkan solusi teknologi informasi yang holistik, menghubungkan kepentingan eksternal (masyarakat luas) dan operasional internal (pegawai & teknisi fasilitas).

Dengan fondasi arsitektur **Next.js 14**, **Prisma ORM**, dan **PostgreSQL**, sistem ini tidak hanya memberikan pengalaman antarmuka yang cepat dan responsif, tetapi juga menjamin keamanan data yang kuat, perlindungan privasi pelapor, serta akuntabilitas kinerja birokrasi yang terukur.
