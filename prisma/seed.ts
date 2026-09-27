import {
  PrismaClient,
  Role,
  Sentiment,
  MediaType,
  ReportStatus,
  ReportUrgency,
  InternalReportStatus,
  TechCategory,
} from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Memulai seeding data awal Monitoring Humas & Portal Kendala...");

  // 1. Bersihkan data lama jika ada
  await prisma.waBlastLog.deleteMany();
  await prisma.waTemplate.deleteMany();
  await prisma.departmentContact.deleteMany();
  await prisma.categoryConfig.deleteMany();
  await prisma.systemSetting.deleteMany();
  await prisma.internalReport.deleteMany();
  await prisma.publicReport.deleteMany();
  await prisma.mediaMonitoring.deleteMany();
  await prisma.user.deleteMany();

  // 2. Buat akun pengguna (Superadmin, Admin Humas, Pimpinan Manajemen, Karyawan Internal, Teknisi)
  const hashedAdminPassword = await bcrypt.hash("admin123", 10);
  const hashedStaffPassword = await bcrypt.hash("karyawan123", 10);
  const hashedTeknisiPassword = await bcrypt.hash("teknisi123", 10);
  const hashedManajemenPassword = await bcrypt.hash("manajemen123", 10);

  const superadmin = await prisma.user.create({
    data: {
      name: "Super Administrator",
      email: "superadmin@humas.go.id",
      password: hashedAdminPassword,
      role: Role.SUPERADMIN,
    },
  });

  const admin = await prisma.user.create({
    data: {
      name: "Administrator Humas",
      email: "admin@humas.go.id",
      password: hashedAdminPassword,
      role: Role.ADMIN,
    },
  });

  const manajemen = await prisma.user.create({
    data: {
      name: "Dr. H. Bambang Soediro, MM (Kepala Dinas / Manajemen)",
      email: "manajemen@humas.go.id",
      password: hashedManajemenPassword,
      role: Role.MANAJEMEN,
    },
  });

  const karyawan = await prisma.user.create({
    data: {
      name: "Budi Santoso (Divisi Pelayanan)",
      email: "budi@instansi.go.id",
      password: hashedStaffPassword,
      role: Role.STAFF,
    },
  });

  const teknisi = await prisma.user.create({
    data: {
      name: "Ahmad Fauzi (Tim Teknisi IT & Fasilitas)",
      email: "teknisi@instansi.go.id",
      password: hashedTeknisiPassword,
      role: Role.TEKNISI,
    },
  });

  // 2b. Buat Pengaturan Sistem Awal (SystemSetting)
  await prisma.systemSetting.upsert({
    where: { id: "default" },
    update: {},
    create: {
      id: "default",
      institutionName: "Dinas Komunikasi, Informatika dan Humas",
      institutionTagline: "Sistem Informasi Monitoring Humas, Aduan Publik & Kendala Fasilitas Terpadu",
      publicModuleActive: true,
      employeeModuleActive: true,
      technicianModuleActive: true,
      availableTechnicians: "Unit Teknisi Jaringan & IT,Unit Teknisi Hardware & Komputer,Unit Teknisi Tata Udara & AC,Unit Teknisi Listrik & Mekanikal,Unit Teknisi Audio Visual & Multimedia,Unit Teknisi Sarana Prasarana Gedung",
      systemAnnouncement: "Layanan pengaduan masyarakat publik dan kendala ruangan internal beroperasi 24/7.",
      waGatewayEnabled: true,
      waGatewayProvider: "SAUNG_WA",
      waGatewayUrl: "https://app.saungwa.com/api/create-message",
      waApiKey: "demo-authkey-saungwa-2026",
      waSenderNumber: "c0379471-demo-appkey",
      waAppKey: "c0379471-demo-appkey",
      waAuthKey: "demo-authkey-saungwa-2026",
    },
  });

  // 2c. Buat 4 Kategori Aduan Berdasarkan Tingkat Urgensi (Merah, Kuning, Hijau, Biru)
  const initialCategories = [
    {
      name: "Etika Pegawai & Pelanggaran Kritis",
      code: "PENGADUAN_PEGAWAI",
      color: "#DC2626", // Merah (Urgensi Kritis)
      bgLight: "bg-rose-50 text-rose-700 border-rose-200",
      textColor: "#FFFFFF",
      description: "Pengaduan tingkat Kritis terkait disiplin aparatur, etika pelayanan, pungli, atau keadaan mendesak.",
      orderIndex: 1,
    },
    {
      name: "Fasilitas & Infrastruktur",
      code: "FASILITAS_INFRASTRUKTUR",
      color: "#D97706", // Kuning / Amber (Urgensi Tinggi)
      bgLight: "bg-amber-50 text-amber-800 border-amber-200",
      textColor: "#FFFFFF",
      description: "Pengaduan tingkat Tinggi terkait kerusakan fasilitas gedung, sarana publik, dan utilitas penunjang.",
      orderIndex: 2,
    },
    {
      name: "Pelayanan Publik & Loket",
      code: "PELAYANAN_PUBLIK",
      color: "#059669", // Hijau (Urgensi Sedang)
      bgLight: "bg-emerald-50 text-emerald-800 border-emerald-200",
      textColor: "#FFFFFF",
      description: "Pengaduan tingkat Sedang terkait kecepatan loket terpadu, antrean warga, dan administrasi layanan.",
      orderIndex: 3,
    },
    {
      name: "Permohonan Informasi Publik",
      code: "PERMOHONAN_INFORMASI",
      color: "#2563EB", // Biru (Urgensi Rendah)
      bgLight: "bg-blue-50 text-blue-700 border-blue-200",
      textColor: "#FFFFFF",
      description: "Pengaduan/permohonan tingkat Rendah terkait data terbuka, PPID, statistik, dan publikasi umum.",
      orderIndex: 4,
    },
  ];

  for (const cat of initialCategories) {
    await prisma.categoryConfig.create({
      data: cat,
    });
  }

  // 2d. Buat Pemetaan Nomor Kontak Bidang (DepartmentContact)
  const initialDepartments = [
    {
      name: "Bidang Pelayanan Publik & Operasional",
      contactName: "Dra. Hj. Nurhayati, M.Si (Kabid Pelayanan)",
      phone: "081234567890",
      email: "pelayanan@humas.go.id",
      description: "Mengkoordinasikan loket pelayanan masyarakat, perizinan, dan antrean warga.",
    },
    {
      name: "Bidang Umum & Kepegawaian (SDM)",
      contactName: "Bambang Wijaya, S.Sos (Kabid Kepegawaian)",
      phone: "081298765432",
      email: "kepegawaian@humas.go.id",
      description: "Disposisi terkait disiplin aparatur, etika petugas, dan administrasi umum.",
    },
    {
      name: "Bidang Teknologi & Sistem Informasi",
      contactName: "Ir. Hendra Gunawan, M.Kom (Kabid TI)",
      phone: "081311223344",
      email: "it@humas.go.id",
      description: "Penanganan aplikasi, portal web, server, dan jaringan komunikasi digital.",
    },
    {
      name: "Bidang Keuangan & Perencanaan Aset",
      contactName: "Ratna Sari, SE, Ak (Kabid Aset)",
      phone: "081555667788",
      email: "keuangan@humas.go.id",
      description: "Penanganan sarana inventaris dan perencanaan anggaran pemeliharaan.",
    },
    {
      name: "Bidang Hukum, Kepatuhan & Pengawasan Internal",
      contactName: "Agus Prasetyo, SH, MH (Inspektorat Pembantu)",
      phone: "081799887766",
      email: "pengawasan@humas.go.id",
      description: "Investigasi aduan pelanggaran berat, mediasi, dan pendampingan regulasi.",
    },
    {
      name: "Tim Teknisi IT & Fasilitas Gedung",
      contactName: "Ahmad Fauzi (Koordinator Tim Teknisi Lapangan)",
      phone: "081800112233",
      email: "teknisi@instansi.go.id",
      description: "Unit lapangan perbaikan teknis komputer, LAN, AC, genset, dan fasilitas gedung.",
    },
    {
      name: "Sekretariat Pimpinan & Hubungan Antar Lembaga",
      contactName: "Dewi Lestari, S.AP (Sekretariat)",
      phone: "081922334455",
      email: "sekretariat@humas.go.id",
      description: "Penerimaan audiensi, disposisi pimpinan, dan koordinasi instansi mitra.",
    },
  ];

  for (const dept of initialDepartments) {
    await prisma.departmentContact.create({
      data: dept,
    });
  }

  // 2e. Buat Template WA Blast (WaTemplate)
  await prisma.waTemplate.createMany({
    data: [
      {
        code: "DISPOSISI_BIDANG",
        title: "Pemberitahuan Disposisi Aduan ke Bidang Terkait",
        content: `*NOTIFIKASI DISPOSISI PENGADUAN INSTANSI*\n*Sistem Terpadu HumasMonitor*\n\nYth. Bapak/Ibu di *{BIDANG}*,\n\nTerdapat laporan pengaduan masyarakat yang didisposisikan kepada bidang Anda:\n\n📋 *No. Tiket*: {NOMOR_TIKET}\n🏷️ *Kategori*: {KATEGORI}\n⚠️ *Tingkat Urgensi*: {URGENSI}\n📝 *Judul*: {JUDUL}\n🕒 *Waktu Disposisi*: {TANGGAL}\n\n📌 *Instruksi/Catatan Humas*:\n_{CATATAN_DISPOSISI}_\n\nMohon segera ditindaklanjuti sesuai standar SLA pelayanan.\nAkses sistem: {LINK_PORTAL}\n\n_Pesan otomatis dikirim melalui Sistem Informasi Monitoring Humas._`,
      },
      {
        code: "STATUS_SELESAI",
        title: "Konfirmasi Penyelesaian Pengaduan",
        content: `*KONFIRMASI PENYELESAIAN PENGADUAN*\n*Sistem Terpadu HumasMonitor*\n\nYth. Tim *{BIDANG}*,\n\nLaporan pengaduan *{NOMOR_TIKET}* ({JUDUL}) telah tuntas diselesaikan oleh Tim Humas dan diterbitkan tanggapan resmi ke publik.\n\nTerima kasih atas sinergi dan respon cepat bidang Anda.`,
      },
    ],
  });

  console.log(`✅ Pengguna berhasil dibuat:`);
  console.log(`   - Superadmin    : ${superadmin.email} (pass: admin123)`);
  console.log(`   - Admin Humas   : ${admin.email} (pass: admin123)`);
  console.log(`   - Pimpinan Manajemen : ${manajemen.email} (pass: manajemen123)`);
  console.log(`   - Karyawan Staf : ${karyawan.email} (pass: karyawan123)`);
  console.log(`   - Tim Teknisi   : ${teknisi.email} (pass: teknisi123)`);
  console.log(`✅ Konfigurasi kategori berwarna & nomor kontak bidang berhasil dibuat.`);

  // 3. Masukkan data awal monitoring media
  await prisma.mediaMonitoring.createMany({
    data: [
      {
        title: "Peluncuran Layanan Digital Baru Mendapat Apresiasi Luas dari Masyarakat",
        mediaName: "Kompas.com",
        mediaType: MediaType.ONLINE,
        sentiment: Sentiment.POSITIF,
        url: "https://kompas.com",
        summary: "Publik menyambut baik inovasi efisiensi birokrasi dan transparansi informasi publik.",
        authorId: admin.id,
      },
      {
        title: "Kunjungan Kerja Pimpinan Bahas Kesiapan Infrastruktur Pelayanan Publik",
        mediaName: "Antara News",
        mediaType: MediaType.ONLINE,
        sentiment: Sentiment.NETRAL,
        url: "https://antaranews.com",
        summary: "Liputan faktual mengenai inspeksi lapangan dan koordinasi lintas instansi.",
        authorId: admin.id,
      },
      {
        title: "Warga Keluhkan Antrean Panjang di Loket Pelayanan Terpadu",
        mediaName: "Detik.com",
        mediaType: MediaType.ONLINE,
        sentiment: Sentiment.NEGATIF,
        url: "https://detik.com",
        summary: "Ditemukan gangguan sistem antrean pada jam sibuk. Rekomendasi Humas: rilis klarifikasi cepat.",
        authorId: admin.id,
      },
    ],
  });

  // 4. Masukkan data awal laporan publik masyarakat dengan variasi kategori & status
  await prisma.publicReport.createMany({
    data: [
      {
        ticketNumber: "HM-260905-A101",
        title: "Kendala Mesin Antrean Otomatis di Ruang Pelayanan Utama",
        category: "PELAYANAN_PUBLIK",
        content: "Pagi tadi sekitar pukul 09.00 WIB nomor antrean macet sehingga terjadi penumpukan warga di loket verifikasi berkas.",
        isAnonymous: false,
        reporterName: "Rudi Hartono",
        reporterContact: "081234567890",
        status: ReportStatus.BARU,
        urgency: ReportUrgency.TINGGI,
      },
      {
        ticketNumber: "HM-260905-B202",
        title: "Klarifikasi Terkait Informasi Rekrutmen Pegawai yang Beredar di Media Sosial",
        category: "PENGADUAN_PEGAWAI",
        content: "Mohon konfirmasi resmi apakah seleksi penerimaan tenaga honorer yang beredar di grup WhatsApp berasal dari instansi resmi atau hoaks.",
        isAnonymous: true,
        reporterName: null,
        reporterContact: null,
        status: ReportStatus.DIDISPOSISIKAN,
        urgency: ReportUrgency.KRITIS,
        dispositionTo: "Bidang Umum & Kepegawaian (SDM)",
        dispositionTargetPhone: "081298765432",
        dispositionNote: "Mohon siapkan draf siaran pers resmi sanggahan hoaks untuk dipublikasikan kanal media sosial Humas.",
        dispositionedAt: new Date(Date.now() - 3600000 * 5),
      },
      {
        ticketNumber: "HM-260905-C303",
        title: "Permohonan Data Terbuka Laporan Tahunan Pelayanan Publik",
        category: "PERMOHONAN_INFORMASI",
        content: "Kami dari lembaga riset akademis mengajukan permohonan data ringkasan kepuasan masyarakat tahun 2025 untuk keperluan studi.",
        isAnonymous: false,
        reporterName: "Siti Rahmawati, M.Si",
        reporterContact: "siti.rahma@univ.ac.id",
        status: ReportStatus.SELESAI,
        urgency: ReportUrgency.RENDAH,
        dispositionTo: "Bidang Teknologi & Sistem Informasi",
        dispositionTargetPhone: "081311223344",
        dispositionNote: "Dokumen telah dikirimkan via email pemohon.",
        dispositionedAt: new Date(Date.now() - 3600000 * 24),
        responseNote: "Dokumen buku laporan ringkasan kepuasan masyarakat tahun 2025 versi PDF telah dikirimkan ke email pemohon melalui PPID Humas.",
        respondedAt: new Date(Date.now() - 3600000 * 18),
      },
      {
        ticketNumber: "HM-260905-D404",
        title: "Lampu Penerangan Halaman Parkir Belakang Mati",
        category: "FASILITAS_INFRASTRUKTUR",
        content: "Area parkir kendaraan roda dua sangat gelap pada malam hari, mohon bantuan perbaikan demi keamanan.",
        isAnonymous: false,
        reporterName: "Joko Susilo",
        reporterContact: "085678901234",
        status: ReportStatus.DIDISPOSISIKAN,
        urgency: ReportUrgency.SEDANG,
        dispositionTo: "Tim Teknisi IT & Fasilitas Gedung",
        dispositionTargetPhone: "081800112233",
        dispositionNote: "Disposisikan ke teknisi kelistrikan & genset gedung.",
        dispositionedAt: new Date(Date.now() - 3600000 * 2),
      },
      {
        ticketNumber: "HM-260905-E505",
        title: "Keluhan Sikap Petugas Loket Pendaftaran 2",
        category: "PENGADUAN_PEGAWAI",
        content: "Petugas loket terkesan kurang ramah dan meninggalkan meja saat jam ramai pukul 11.00.",
        isAnonymous: true,
        reporterName: null,
        reporterContact: null,
        status: ReportStatus.BARU,
        urgency: ReportUrgency.TINGGI,
      },
    ],
  });

  // 4b. Buat Log Riwayat WA Blast Awal
  await prisma.waBlastLog.create({
    data: {
      ticketNumber: "HM-260905-B202",
      department: "Bidang Umum & Kepegawaian (SDM)",
      recipientPhone: "081298765432",
      recipientName: "Bambang Wijaya, S.Sos",
      message: `*NOTIFIKASI DISPOSISI PENGADUAN INSTANSI*\nNo. Tiket: HM-260905-B202\nKlarifikasi Terkait Informasi Rekrutmen Pegawai`,
      status: "TERKIRIM",
      gateway: "WA_GATEWAY_TERPADU",
      response: '{"status":true,"message":"Pesan terkirim ke server WhatsApp"}',
    },
  });

  // 5. Masukkan data awal laporan kendala ruangan dari Karyawan Internal
  await prisma.internalReport.createMany({
    data: [
      {
        ticketNumber: "KND-260905-T001",
        title: "Koneksi Switch LAN & WiFi Terputus Tiba-tiba",
        roomLocation: "Ruang Rapat Utama Lantai 2",
        techCategory: TechCategory.JARINGAN_INTERNET,
        description: "Menjelang rapat pimpinan pukul 10.00, koneksi internet kabel LAN dan Access Point WiFi di ruang rapat mati total.",
        urgency: ReportUrgency.KRITIS,
        status: InternalReportStatus.SEDANG_DIKERJAKAN,
        targetTechnician: "Unit Teknisi Jaringan & IT",
        reporterId: karyawan.id,
        technicianNotes: "Teknisi Ahmad sudah di lokasi memeriksa switch hub rack di panel lantai 2. Ditemukan kabel patch cord rusak, sedang diganti.",
        startedAt: new Date(),
      },
      {
        ticketNumber: "KND-260905-T002",
        title: "AC Central Tidak Dingin dan Berdengung",
        roomLocation: "Ruang Kerja Staf Pelayanan Lt. 1",
        techCategory: TechCategory.AC_TATA_UDARA,
        description: "AC utama ruangan tidak mengeluarkan hembusan dingin dan mengeluarkan suara mendengung cukup keras mengganggu pelayanan.",
        urgency: ReportUrgency.TINGGI,
        status: InternalReportStatus.DITERIMA_TEKNISI,
        targetTechnician: "Unit Teknisi Tata Udara & AC",
        reporterId: karyawan.id,
        technicianNotes: "Tiket telah diterima teknisi fasilitas. Petugas sedang bersiap dengan peralatan tangga dan freon menuju lokasi.",
      },
      {
        ticketNumber: "KND-260905-T003",
        title: "Proyektor Ruang Seminar Mati Saat Presentasi",
        roomLocation: "Aula Serbaguna Lt. 3",
        techCategory: TechCategory.AUDIO_VISUAL,
        description: "Lampu proyektor berkedip merah dan proyektor mati mendadak saat simulasi pelatihan.",
        urgency: ReportUrgency.SEDANG,
        status: InternalReportStatus.SELESAI,
        targetTechnician: "Unit Teknisi Audio Visual & Multimedia",
        reporterId: karyawan.id,
        technicianNotes: "Filter udara proyektor dibersihkan dari debu tebal dan kabel HDMI diganti dengan kabel baru. Uji tampilan sukses 100%.",
        startedAt: new Date(Date.now() - 7200000),
        completedAt: new Date(Date.now() - 1800000),
      },
    ],
  });

  console.log("✅ Data monitoring media, laporan publik, kategori berwarna, dan laporan teknisi berhasil di-seed!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
