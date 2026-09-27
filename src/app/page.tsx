"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ShieldCheck,
  Send,
  Search,
  CheckCircle2,
  Lock,
  EyeOff,
  User,
  Radio,
  FileText,
  Building2,
  ArrowRight,
  Copy,
  Clock,
  Sparkles,
  ChevronRight,
  AlertCircle,
  BarChart3,
  Loader2,
  Upload,
  FileUp,
  X,
  Check,
  Activity,
  Award,
  MapPin,
} from "lucide-react";

export default function HomePage() {
  const router = useRouter();

  // State untuk form laporan publik
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("");
  const [targetUnit, setTargetUnit] = useState("Tim Humas");
  const [location, setLocation] = useState("");
  const [content, setContent] = useState("");
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [reporterName, setReporterName] = useState("");
  const [reporterContact, setReporterContact] = useState("");

  // Modal Popup Sukses Terbit Tiket
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [createdTicketNumber, setCreatedTicketNumber] = useState<string | null>(null);

  // Upload Lampiran Bukti
  const [attachment, setAttachment] = useState<{
    file: File | null;
    name: string;
    size: string;
    previewUrl: string | null;
  } | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Anti-Spam Verification (reCAPTCHA / Turnstile style)
  const [isVerified, setIsVerified] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [captchaError, setCaptchaError] = useState<string | null>(null);

  // Status submission form
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccessTicket, setSubmitSuccessTicket] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isCopied, setIsCopied] = useState(false);

  // State untuk pelacakan tiket
  const [trackTicket, setTrackTicket] = useState("");
  const [trackResult, setTrackResult] = useState<any>(null);
  const [trackLoading, setTrackLoading] = useState(false);
  const [trackError, setTrackError] = useState<string | null>(null);

  // State statistik publik (Transparansi Data)
  const [publicStats, setPublicStats] = useState({
    totalReports: "1.234+",
    completedReports: "1.192",
    completionRate: "95.5%",
    averageSla: "< 24 Jam",
    satisfactionIndex: "98.4%",
    activeChannels: "Portal, Medsos & Tatap Muka",
  });

  // State kategori dinamis beserta pewarnaan dari Superadmin
  const [categoriesList, setCategoriesList] = useState<any[]>([]);

  // Muat data statistik publik dan konfigurasi kategori berwarna secara dinamis
  useEffect(() => {
    document.title = "Portal Aspirasi & Pengaduan Warga - HumasMonitor";

    fetch("/api/reports/stats")
      .then((res) => res.json())
      .then((data) => {
        if (data?.stats) {
          setPublicStats(data.stats);
        }
      })
      .catch((err) => {
        console.warn("Menggunakan nilai statistik cadangan:", err);
      });

    fetch("/api/categories")
      .then((res) => res.json())
      .then((data) => {
        if (data?.categories?.length) {
          setCategoriesList(data.categories);
        }
      })
      .catch((err) => {
        console.warn("Menggunakan kategori bawaan:", err);
      });
  }, []);

  // Handler Berkas Lampiran . Ukuran berkas melebihi batas maksimum 5 MB.
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert("File lebih dari 5 MB");
      return;
    }

    const isImage = file.type.startsWith("image/");
    const sizeStr =
      file.size > 1024 * 1024
        ? `${(file.size / (1024 * 1024)).toFixed(1)} MB`
        : `${Math.round(file.size / 1024)} KB`;

    const reader = new FileReader();
    reader.onload = () => {
      setAttachment({
        file,
        name: file.name,
        size: sizeStr,
        previewUrl: reader.result as string,
      });
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveAttachment = () => {
    setAttachment(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Handler Verifikasi Anti-Spam
  const handleVerifyCaptcha = () => {
    if (isVerified || isVerifying) return;
    setIsVerifying(true);
    setCaptchaError(null);
    setTimeout(() => {
      setIsVerifying(false);
      setIsVerified(true);
    }, 750);
  };

  // Handler Submit Laporan Publik
  const handleSubmitReport = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setCaptchaError(null);

    // Validasi Anti-Spam Wajib . Harap centang verifikasi keamanan anti-spam sebelum mengirim laporan. Silakan isi lokasi spesifik kejadian agar disposisi dapat diproses akurat.
    if (!isVerified) {
      setCaptchaError("Verifikasi anti-spam nya belum dicentang.");
      return;
    }

    if (!category) {
      setErrorMessage("Silakan pilih kategori laporan terlebih dahulu.");
      return;
    }

    if (!location.trim()) {
      setErrorMessage("Lokasi spesifik belum diisi.");
      return;
    }

    setIsSubmitting(true);

    try {
      // 1. Jika ada lampiran, unggah file fisik ke server melalui /api/upload
      let uploadedAttachmentUrl: string | null = null;
      let uploadedAttachmentName: string | null = null;

      if (attachment?.file) {
        const uploadFormData = new FormData();
        uploadFormData.append("file", attachment.file);

        const uploadRes = await fetch("/api/upload", {
          method: "POST",
          body: uploadFormData,
        });

        const uploadData = await uploadRes.json();
        if (!uploadRes.ok) {
          throw new Error(uploadData.error || "Gagal mengunggah berkas lampiran ke server.");
        }

        uploadedAttachmentUrl = uploadData.url;
        uploadedAttachmentName = uploadData.name;
      }

      // 2. Simpan data laporan dengan path/URL berkas (bukan string Base64)
      const res = await fetch("/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          category,
          targetUnit,
          location,
          content,
          attachmentName: uploadedAttachmentName,
          attachmentUrl: uploadedAttachmentUrl,
          isAnonymous,
          reporterName: isAnonymous ? "" : reporterName,
          reporterContact: isAnonymous ? "" : reporterContact,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Gagal mengirim laporan.");
      }

      setSubmitSuccessTicket(data.ticketNumber);
      setCreatedTicketNumber(data.ticketNumber);
      setShowSuccessModal(true);

      // Reset formulir
      setTitle("");
      setCategory("");
      setContent("");
      setLocation("");
      setReporterName("");
      setReporterContact("");
      setIsAnonymous(false);
      handleRemoveAttachment();
      setIsVerified(false);
    } catch (err: any) {
      setErrorMessage(err.message || "Terjadi kesalahan sistem.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handler Pelacakan Tiket (Mendukung klik demo instan)
  const handleTrackReport = async (e?: React.FormEvent, customTicket?: string) => {
    if (e) e.preventDefault();
    const query = customTicket || trackTicket;
    if (!query.trim()) return;

    if (customTicket) {
      setTrackTicket(customTicket);
    }

    setTrackLoading(true);
    setTrackError(null);
    setTrackResult(null);

    try {
      const res = await fetch(`/api/reports/track?ticket=${encodeURIComponent(query.trim())}`);
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Nomor tiket tidak ditemukan dalam sistem.");
      }

      setTrackResult(data.report);
    } catch (err: any) {
      setTrackError(err.message || "Gagal melacak laporan.");
    } finally {
      setTrackLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2500);
  };

  return (
    <div className="min-h-screen flex flex-col bg-emerald-50/30 text-slate-800">
      <title>Portal Aspirasi & Pengaduan Warga - HumasMonitor</title>

      {/* Navbar Nuansa Hijau & Penanda Akses Staf */}
      <header className="border-b border-emerald-100 bg-white/95 backdrop-blur sticky top-0 z-50 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <img
              src="/LOGO DKH.png"
              alt="Logo HumasMonitor"
              className="w-10 h-10 object-contain rounded-xl shadow-xs"
              onError={(e) => {
                (e.target as HTMLElement).style.display = "none";
              }}
            />
            <div>
              <span className="text-lg font-black text-emerald-950 tracking-tight">HumasMonitor</span>
              <span className="hidden sm:inline-block ml-2 px-2.5 py-0.5 text-xs font-semibold bg-emerald-100 text-emerald-800 rounded-full border border-emerald-200">
                Portal Aspirasi & Aduan Warga
              </span>
            </div>
          </div>

          <div className="flex items-center space-x-2 sm:space-x-3">
            <a
              href="#form-lapor"
              className="text-xs sm:text-sm font-bold text-emerald-800 hover:text-emerald-950 transition px-3 py-1.5 rounded-lg hover:bg-emerald-50"
            >
              Lapor Publik
            </a>
            <a
              href="#lacak-laporan"
              className="text-xs sm:text-sm font-bold text-emerald-800 hover:text-emerald-950 transition px-3 py-1.5 rounded-lg hover:bg-emerald-50 hidden sm:inline-block"
            >
              Lacak Tiket
            </a>
            <Link
              href="/login"
              className="inline-flex items-center text-xs sm:text-sm font-bold px-3.5 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white transition shadow-sm shadow-emerald-700/20"
            >
              <Lock className="w-3.5 h-3.5 mr-1.5" />
              Login
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1">
        <section className="relative overflow-hidden pt-12 pb-14 lg:pt-16 lg:pb-20 bg-gradient-to-b from-white via-emerald-50/40 to-emerald-50/20 border-b border-emerald-100">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-emerald-100/90 text-emerald-800 border border-emerald-200 mb-6 shadow-xs">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              Sistem Terpadu Pelayanan Komunikasi Publik & Pengaduan Masyarakat
            </div>

            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-emerald-950 tracking-tight leading-tight">
              Komitmen Respons Cepat & <br className="hidden sm:inline" />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 via-green-600 to-teal-600">
                 Transparansi Humas
              </span>
            </h1>

            <p className="mt-5 text-base sm:text-xl text-slate-600 max-w-3xl mx-auto leading-relaxed">
              Sampaikan aspirasi, keluhan pelayanan, atau permohonan informasi langsung kepada Tim Humas secara aman dan cepat. {/* Anda dapat memilih untuk mengirimkan laporan secara <b>anonim</b> tanpa perlu login. */}
            </p>

            {/* Tombol Aksi Utama untuk Publik */}
            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4">
              <a
                href="#form-lapor"
                className="w-full sm:w-auto inline-flex items-center justify-center px-6 py-3.5 text-sm sm:text-base font-bold rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 transition shadow-lg shadow-emerald-600/25"
              >
                <Send className="w-4 h-4 mr-2" />
                Buat Laporan Sekarang
              </a>
              <a
                href="#lacak-laporan"
                className="w-full sm:w-auto inline-flex items-center justify-center px-6 py-3.5 text-sm sm:text-base font-bold rounded-xl bg-white text-emerald-800 hover:bg-emerald-50 border border-emerald-300 transition shadow-xs"
              >
                <Search className="w-4 h-4 mr-2 text-emerald-600" />
                Lacak Status Laporan
              </a>
            </div>

            {/* Tombol Sekunder Penanda Jelas Akses Staf & Pimpinan 
            <div className="mt-7 pt-5 border-t border-emerald-200/60 max-w-xl mx-auto flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-3 text-xs text-slate-600">
              <span className="flex items-center gap-1.5 font-semibold text-emerald-950">
                <Lock className="w-3.5 h-3.5 text-emerald-700" />
                Khusus Pejabat & Staf Instansi:
              </span>
              <Link
                href="/dashboard"
                className="inline-flex items-center font-bold text-emerald-800 hover:text-emerald-950 bg-white hover:bg-emerald-50 px-3.5 py-1.5 rounded-lg border border-emerald-300 shadow-xs transition hover:border-emerald-400 group"
              >
                <BarChart3 className="w-3.5 h-3.5 mr-1.5 text-emerald-600 group-hover:scale-110 transition-transform" />
                Akses Portal Analitik Internal
                <ArrowRight className="w-3 h-3 ml-1 text-emerald-600" />
              </Link>
            </div> */}

            {/* Keunggulan Layanan Aduan Publik */}
            {/*
            <div className="mt-10 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto text-left">
              <div className="bg-white/90 p-3.5 rounded-xl border border-emerald-100 shadow-xs">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center mb-2">
                  <EyeOff className="w-4 h-4" />
                </div>
                <h4 className="text-xs font-bold text-slate-800">Opsi Anonim</h4>
                <p className="text-[11px] text-slate-500 mt-0.5">Identitas dapat dirahasiakan sepenuhnya</p>
              </div>

              <div className="bg-white/90 p-3.5 rounded-xl border border-emerald-100 shadow-xs">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center mb-2">
                  <Lock className="w-4 h-4" />
                </div>
                <h4 className="text-xs font-bold text-slate-800">Tanpa Login</h4>
                <p className="text-[11px] text-slate-500 mt-0.5">Masyarakat umum bisa langsung melapor</p>
              </div>

              <div className="bg-white/90 p-3.5 rounded-xl border border-emerald-100 shadow-xs">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center mb-2">
                  <Building2 className="w-4 h-4" />
                </div>
                <h4 className="text-xs font-bold text-slate-800">Disposisi Cepat</h4>
                <p className="text-[11px] text-slate-500 mt-0.5">Diteruskan ke divisi yang berwenang</p>
              </div>

              <div className="bg-white/90 p-3.5 rounded-xl border border-emerald-100 shadow-xs">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center mb-2">
                  <FileText className="w-4 h-4" />
                </div>
                <h4 className="text-xs font-bold text-slate-800">Tiket Terlacak</h4>
                <p className="text-[11px] text-slate-500 mt-0.5">Pantau progres laporan kapan saja</p>
              </div>
            </div> */}
          </div>
        </section>

        {/* Section 4: Elemen Transparansi Data Publik & Akuntabilitas Kinerja */}
        <section className="bg-white border-y border-emerald-100 py-10 relative shadow-xs">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-3">
              <div>
                <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-emerald-800 bg-emerald-100 px-3 py-1 rounded-full border border-emerald-200 mb-2">
                  <Activity className="w-3.5 h-3.5 text-emerald-700" />
                  Transparansi & Akuntabel
                </div>
                <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                  {/* Kinerja Pelayanan & Tindak Lanjut Aduan Warga */}
                  Rekapitulasi Laporan
                </h2>
              </div>
              <p className="text-xs text-slate-500 max-w-md">
                Pencatatan Pelaporan terintegrasi membuktikan respon aktif Tim Humas dalam menyikapi setiap laporan masyarakat.
              </p>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
              {/* Metrik 1: Total Laporan Masuk */}
              <div className="bg-gradient-to-br from-emerald-50/80 to-white p-5 rounded-2xl border border-emerald-200 shadow-xs hover:border-emerald-300 transition">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold text-emerald-900">Total Laporan Masuk</span>
                  <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                    <FileText className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-2xl sm:text-3xl font-black text-emerald-950 tracking-tight">
                  {publicStats.totalReports}
                </div>
                <p className="text-[11px] text-slate-500 mt-1">Laporan Terdata</p>
              </div>

              {/* Metrik 2: Persentase Laporan Selesai */}
              <div className="bg-gradient-to-br from-teal-50/80 to-white p-5 rounded-2xl border border-teal-200 shadow-xs hover:border-teal-300 transition">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold text-teal-900">Laporan Selesai</span>
                  <div className="w-8 h-8 rounded-xl bg-teal-100 text-teal-700 flex items-center justify-center">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-2xl sm:text-3xl font-black text-teal-950 tracking-tight">
                  {publicStats.completionRate}
                </div>
                <p className="text-[11px] text-slate-500 mt-1">{publicStats.completedReports} laporan selesai</p>
              </div>

              {/* Metrik 3: Rata-rata Waktu Penanganan (SLA) */}
              <div className="bg-gradient-to-br from-sky-50/80 to-white p-5 rounded-2xl border border-sky-200 shadow-xs hover:border-sky-300 transition">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold text-sky-900">Rata-rata SLA Respons</span>
                  <div className="w-8 h-8 rounded-xl bg-sky-100 text-sky-700 flex items-center justify-center">
                    <Clock className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-2xl sm:text-3xl font-black text-sky-950 tracking-tight">
                  {publicStats.averageSla}
                </div>
                <p className="text-[11px] text-slate-500 mt-1">Verifikasi cepat & disposisi bidang</p>
              </div>

              {/* Metrik 4: Indeks Akuntabilitas */}
              <div className="bg-gradient-to-br from-amber-50/80 to-white p-5 rounded-2xl border border-amber-200 shadow-xs hover:border-amber-300 transition">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold text-amber-900">Indeks Akuntabilitas</span>
                  <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center">
                    <Award className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-2xl sm:text-3xl font-black text-amber-950 tracking-tight">
                  {publicStats.satisfactionIndex}
                </div>
                <p className="text-[11px] text-slate-500 mt-1">Standar mutu pelayanan publik</p>
              </div>
            </div>
          </div>
        </section>

        {/* Section Formulir Pelaporan Publik & Lacak Tiket */}
        <section id="form-lapor" className="py-16 bg-slate-50/50">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
              {/* Kolom Kiri: Formulir Lapor Siap Pakai */}
              <div className="lg:col-span-7 bg-white rounded-2xl border border-emerald-200 p-6 sm:p-8 shadow-sm">
                <div className="flex items-center space-x-2 text-emerald-700 mb-1">
                  <FileText className="w-5 h-5" />
                  <span className="text-xs font-bold uppercase tracking-wider">Formulir Pengaduan Publik</span>
                </div>
                <h2 className="text-2xl font-black text-slate-900">
                  Buat Laporan/Aduan/Saran
                </h2>
                <p className="text-xs sm:text-sm text-slate-500 mt-1 mb-6">
                  Sampaikan keluhan, aspirasi, atau masukan Anda secara rinci agar dapat langsung ditindaklanjuti dengan tepat.
                </p>

                {/* Notifikasi Sukses Tiket Terbit */}
                {submitSuccessTicket && (
                  <div className="mb-6 p-5 rounded-xl bg-emerald-50 border border-emerald-200">
                    <div className="flex items-start gap-3">
                      <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <h3 className="text-sm font-bold text-emerald-900">
                          Laporan Anda Berhasil Diterima Sistem!
                        </h3>
                        <p className="text-xs text-emerald-700 mt-1">
                          Simpan nomor tiket ini untuk melacak status penanganan laporan Anda kapan saja:
                        </p>
                        <div className="mt-2.5 flex items-center gap-2">
                          <span className="font-mono font-bold text-base bg-white px-3 py-1.5 rounded-lg border border-emerald-300 text-emerald-900 shadow-xs">
                            {submitSuccessTicket}
                          </span>
                          <button
                            type="button"
                            onClick={() => copyToClipboard(submitSuccessTicket)}
                            className="inline-flex items-center px-3 py-1.5 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white transition cursor-pointer"
                          >
                            <Copy className="w-3.5 h-3.5 mr-1" />
                            {isCopied ? "Tersalin!" : "Salin Tiket"}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {errorMessage && (
                  <div className="mb-5 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                    <span>{errorMessage}</span>
                  </div>
                )}

                <form onSubmit={handleSubmitReport} className="space-y-4">
                  {/* Opsi Kirim Sebagai Anonim */}
                  <div className="p-3.5 rounded-xl bg-emerald-50/60 border border-emerald-200 flex items-center justify-between">
                    <div className="flex items-center space-x-2.5">
                      <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
                        <EyeOff className="w-4 h-4" />
                      </div>
                      <div>
                        <label htmlFor="anonymous-check" className="text-xs font-bold text-slate-900 cursor-pointer block">
                          Kirim sebagai Anonim
                        </label>
                        <span className="text-[11px] text-slate-500 block">
                          Nama & kontak Anda tidak akan ditampilkan
                        </span>
                      </div>
                    </div>
                    <input
                      id="anonymous-check"
                      type="checkbox"
                      checked={isAnonymous}
                      onChange={(e) => setIsAnonymous(e.target.checked)}
                      className="w-5 h-5 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500 cursor-pointer"
                    />
                  </div>

                  {/* Input Identitas (Hanya jika tidak anonim) */}
                  {!isAnonymous && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 rounded-xl bg-slate-50 border border-slate-200 animate-in fade-in duration-200">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          Nama Lengkap *
                        </label>
                        <input
                          type="text"
                          required={!isAnonymous}
                          value={reporterName}
                          onChange={(e) => setReporterName(e.target.value)}
                          placeholder="Rizki Febian"
                          className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          Kontak (No. WhatsApp / Email) *
                        </label>
                        <input
                          type="text"
                          required={!isAnonymous}
                          value={reporterContact}
                          onChange={(e) => setReporterContact(e.target.value)}
                          placeholder="0812xxxx / nama@email.com"
                          className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                        />
                      </div>
                    </div>
                  )}

                  {/* Kategori Laporan */}
                  <div className="relative">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Kategori Laporan *
                      </label>
                      <select
                        required
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                        className="w-full px-3 py-2.5 text-xs sm:text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white font-medium text-slate-800"
                      >
                        <option value="" disabled hidden>
                          -- Pilih Kategori Laporan --
                        </option>
                        {categoriesList.length > 0 ? (
                          categoriesList.map((cat) => (
                            <option key={cat.code} value={cat.code}>
                              {cat.name}
                            </option>
                          ))
                        ) : (
                          <>
                            <option value="PELAYANAN_PUBLIK">Pelayanan Publik & Loket</option>
                            <option value="FASILITAS_INFRASTRUKTUR">Fasilitas & Infrastruktur</option>
                            <option value="PENGADUAN_PEGAWAI">Etika Pegawai & Pelanggaran Kritis</option>
                            <option value="PERMOHONAN_INFORMASI">Permohonan Informasi Publik</option>
                          </>
                        )}
                      </select>
                    </div>

                    {/* 
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Unit/Instansi Tujuan *
                      </label>
                      <select
                        value={targetUnit}
                        onChange={(e) => setTargetUnit(e.target.value)}
                        className="w-full px-3 py-2.5 text-xs sm:text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white font-medium text-slate-800"
                      >
                        <option value="Pelayanan Publik & Loket Terpadu">Pelayanan Publik & Loket Terpadu</option>
                        <option value="Bidang Fasilitas & Sarana Prasarana">Bidang Fasilitas & Sarana Prasarana</option>
                        <option value="Bidang Kependudukan & Administrasi Warga">Bidang Kependudukan & Administrasi Warga</option>
                        <option value="Bidang Teknologi Informasi & Layanan Digital">Bidang Teknologi Informasi & Digital</option>
                        <option value="Bidang Umum, Kepegawaian & Pengawasan">Bidang Umum & Etika Petugas</option>
                        <option value="Lainnya / Ditetapkan Humas">Lainnya (Diverifikasi Tim Humas)</option>
                      </select>
                    </div> */}
                  </div>

                  {/* Lokasi Spesifik Kejadian */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Lokasi Kejadian *
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                        <MapPin className="w-4 h-4" />
                      </div>
                      <input
                        type="text"
                        required
                        value={location}
                        onChange={(e) => setLocation(e.target.value)}
                        placeholder="Loket / Ruang Rawat Inap / Apotek"
                        className="w-full pl-9 pr-3 py-2.5 text-xs sm:text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                      />
                    </div>
                    {/*
                    <span className="text-[11px] text-slate-500 mt-1 block">
                      Pisahkan nama ruangan, nomor loket, atau alamat jelas agar alur disposisi internal langsung tepat sasaran.
                    </span> */}
                  </div>

                  {/* Judul Laporan */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Judul Laporan / Ringkasan *
                    </label>
                    <input
                      type="text"
                      required
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="Kendala Pendaftaran Antrean di Loket Pelayanan"
                      className="w-full px-3 py-2.5 text-xs sm:text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                    />
                  </div>

                  {/* Isi Laporan */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Detail Isi Laporan / Kronologi *
                    </label>
                    <textarea
                      rows={4}
                      required
                      value={content}
                      onChange={(e) => setContent(e.target.value)}
                      placeholder="Tuliskan secara jelas kronologi kejadian, waktu/tanggal, atau kendala yang dialami ..."
                      className="w-full px-3 py-2.5 text-xs sm:text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                    />
                  </div>

                  {/* Upload Lampiran Bukti (Foto, Screenshot, PDF) */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Unggah Lampiran (Foto / PDF)
                    </label>
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileChange}
                      accept="image/*,application/pdf"
                      className="hidden"
                      id="attachment-file-input"
                    />
                    {!attachment ? (
                      <label
                        htmlFor="attachment-file-input"
                        className="border-2 border-dashed border-emerald-200 hover:border-emerald-400 rounded-xl p-4 flex flex-col items-center justify-center cursor-pointer bg-emerald-50/30 hover:bg-emerald-50/70 transition"
                      >
                        <FileUp className="w-6 h-6 text-emerald-600 mb-1" />
                        <span className="text-xs font-bold text-emerald-900">
                          Klik untuk Unggah (Foto/Dokumen)
                        </span>
                        <span className="text-[11px] text-slate-500 mt-0.5">
                          Mendukung Format Foto (JPG, PNG, WEBP) atau PDF (Maks. 5 MB)
                        </span>
                      </label>
                    ) : (
                      <div className="p-3.5 rounded-xl border border-emerald-200 bg-emerald-50/50 flex items-center justify-between">
                        <div className="flex items-center space-x-3 overflow-hidden">
                          {attachment.previewUrl ? (
                            <img
                              src={attachment.previewUrl}
                              alt="Pratinjau"
                              className="w-12 h-12 rounded-lg object-cover border border-emerald-200 shrink-0"
                            />
                          ) : (
                            <div className="w-12 h-12 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                              <FileText className="w-6 h-6" />
                            </div>
                          )}
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-bold text-slate-800 truncate">{attachment.name}</p>
                            <p className="text-[11px] text-slate-500">{attachment.size} • Berkas siap dikirimkan</p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={handleRemoveAttachment}
                          className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition ml-2 shrink-0 cursor-pointer"
                          title="Hapus berkas"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Widget Anti-Spam (reCAPTCHA / Turnstile Style) */}
                  <div className="pt-2">
                    <div
                      onClick={handleVerifyCaptcha}
                      className={`p-3 rounded-xl border transition cursor-pointer flex items-center justify-between select-none ${
                        isVerified
                          ? "bg-emerald-50 border-emerald-300 text-emerald-950 shadow-xs"
                          : captchaError
                          ? "bg-red-50/60 border-red-300 hover:border-red-400"
                          : "bg-slate-50 hover:bg-slate-100 border-slate-300"
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <div
                          className={`w-6 h-6 rounded-md border flex items-center justify-center transition ${
                            isVerified
                              ? "bg-emerald-600 border-emerald-600 text-white"
                              : "bg-white border-slate-400"
                          }`}
                        >
                          {isVerifying ? (
                            <Loader2 className="w-3.5 h-3.5 text-emerald-600 animate-spin" />
                          ) : isVerified ? (
                            <Check className="w-4 h-4 text-white stroke-[3]" />
                          ) : null}
                        </div>
                        <div>
                          <p className="text-xs font-bold text-slate-800">
                            {isVerified
                              ? "Verifikasi Keamanan Berhasil"
                              : isVerifying
                              ? "Memverifikasi Keamanan..."
                              : "Verifikasi Keamanan: Saya bukan robot"}
                          </p>
                          <p className="text-[10px] text-slate-500">
                            {isVerified
                              ? "Laporan terlindungi dari bot & spam otomatis"
                              : "Wajib verifikasi sebelum mengirim laporan publik"}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center space-x-1.5 opacity-80 text-[10px] font-semibold text-slate-500">
                        <ShieldCheck className={`w-4 h-4 ${isVerified ? "text-emerald-600" : "text-slate-400"}`} />
                        <span className="hidden sm:inline">Anti-Spam Shield</span>
                      </div>
                    </div>
                    {captchaError && (
                      <p className="text-[11px] text-red-600 font-medium mt-1 ml-1">{captchaError}</p>
                    )}
                  </div>

                  {/* Tombol Kirim Laporan Resmi */}
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full inline-flex items-center justify-center py-3.5 px-4 rounded-xl text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 shadow-md shadow-emerald-600/20 transition disabled:opacity-60 cursor-pointer"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                        Mengirim Laporan ke Tim Humas...
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4 mr-2" />
                        Kirim Laporan Resmi
                      </>
                    )}
                  </button>
                </form>
              </div>

              {/* Kolom Kanan: Pelacakan Tiket & Alur Penanganan */}
              <div className="lg:col-span-5 space-y-6">
                {/* Kotak Lacak Tiket */}
                <div id="lacak-laporan" className="bg-emerald-900 text-white rounded-2xl p-6 sm:p-7 shadow-lg">
                  <div className="flex items-center space-x-2 text-emerald-300 mb-1">
                    <Search className="w-4 h-4" />
                    <span className="text-xs font-bold uppercase tracking-wider">Cek Progres Laporan</span>
                  </div>
                  <h3 className="text-xl font-black">
                    Lacak Status Tiket Anda
                  </h3>
                  <p className="text-xs text-emerald-200 mt-1 mb-4">
                    Masukkan nomor tiket aduan yang Anda terima untuk memantau disposisi & respon penyelesaian dari instansi.
                  </p>

                  <form onSubmit={(e) => handleTrackReport(e)} className="space-y-3">
                    <div className="relative">
                      <input
                        type="text"
                        required
                        value={trackTicket}
                        onChange={(e) => setTrackTicket(e.target.value)}
                        placeholder="TKT-xxxx-xxxxx"
                        className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-lg text-slate-900 placeholder-slate-400 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-400 font-mono"
                      />
                    </div>
                    {/* <div className="flex items-center justify-between text-[11px] text-emerald-200/90 pt-0.5">
                      <span>Format: TKT-2026-XXXX atau HM-YYMMDD-XXXX</span>
                      <button
                        type="button"
                        onClick={() => handleTrackReport(undefined, "HM-260905-C303")}
                        className="underline font-bold text-teal-300 hover:text-white transition cursor-pointer"
                        title="Uji langsung dengan tiket laporan yang sudah selesai"
                      >
                        Coba Tiket Contoh
                      </button>
                    </div> */}

                    <button
                      type="submit"
                      disabled={trackLoading}
                      className="w-full inline-flex items-center justify-center py-2.5 px-4 rounded-lg text-xs sm:text-sm font-bold bg-emerald-500 hover:bg-emerald-400 text-white transition shadow-xs cursor-pointer"
                    >
                      {trackLoading ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin mr-2" />
                          Memeriksa Data Tiket...
                        </>
                      ) : (
                        "Cari Status Laporan"
                      )}
                    </button>
                  </form>

                  {/* Hasil Pencarian Tiket */}
                  {trackError && (
                    <div className="mt-4 p-3 rounded-lg bg-red-950/60 border border-red-500/40 text-red-200 text-xs flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                      <span>{trackError}</span>
                    </div>
                  )}

                  {trackResult && (
                    <div className="mt-4 p-4 rounded-xl bg-emerald-950/90 border border-emerald-700 text-xs space-y-2.5 animate-in fade-in duration-200">
                      <div className="flex items-center justify-between">
                        <span className="text-emerald-300 font-mono text-[11px] font-bold">
                          {trackResult.ticketNumber}
                        </span>
                        <div className="flex items-center gap-1.5">
                          {trackResult.urgency && (
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              trackResult.urgency === "KRITIS"
                                ? "bg-rose-500 text-white"
                                : trackResult.urgency === "TINGGI"
                                ? "bg-amber-500 text-white"
                                : "bg-emerald-800 text-emerald-200 border border-emerald-600"
                            }`}>
                              Urgensi: {trackResult.urgency}
                            </span>
                          )}
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            trackResult.status === "SELESAI"
                              ? "bg-teal-400 text-teal-950"
                              : "bg-emerald-400 text-emerald-950"
                          }`}>
                            {trackResult.status}
                          </span>
                        </div>
                      </div>

                      {/* Lencana Kategori Berwarna */}
                      {trackResult.categoryName && (
                        <div className="flex items-center gap-1.5 pt-0.5">
                          <span
                            className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold text-white shadow-xs"
                            style={{ backgroundColor: trackResult.categoryColor || "#2563EB" }}
                          >
                            ● {trackResult.categoryName}
                          </span>
                        </div>
                      )}

                      <p className="font-bold text-white text-sm line-clamp-2">
                        {trackResult.title}
                      </p>

                      {trackResult.content && (() => {
                        const splitIdx = trackResult.content.indexOf("\n\n---\n");
                        let text = splitIdx !== -1 ? trackResult.content.slice(0, splitIdx).trim() : trackResult.content;
                        text = text.replace(/🖼️ Berkas Data:\s*.+/g, "").trim();
                        const hasAttach = Boolean(
                          trackResult.attachmentUrl ||
                          trackResult.attachmentName ||
                          trackResult.content.includes("📎 Lampiran Bukti:") ||
                          trackResult.content.includes("🖼️ Berkas Data:")
                        );
                        return (
                          <div className="space-y-2">
                            <div className="p-2.5 rounded-lg bg-emerald-900/60 border border-emerald-800 text-[11px] text-emerald-100 whitespace-pre-line line-clamp-4">
                              {text}
                            </div>
                            {hasAttach && (
                              <div className="flex items-center gap-1.5 text-[10px] text-emerald-300 bg-emerald-900/40 px-2.5 py-1 rounded-md border border-emerald-800">
                                <span>📎 Berkas / Foto Lampiran Tersedia (Lihat di Rincian Tiket)</span>
                              </div>
                            )}
                          </div>
                        );
                      })()}

                      <div className="pt-2 border-t border-emerald-800 text-[11px] text-emerald-200 space-y-1.5">
                        <p>
                          📅 Tanggal Masuk: {new Date(trackResult.createdAt).toLocaleDateString("id-ID")}
                        </p>
                        {trackResult.dispositionTo && (
                          <p className="text-emerald-300 font-semibold">
                            🏢 Didisposisikan ke: <b>{trackResult.dispositionTo}</b>
                          </p>
                        )}
                        {trackResult.responseNote ? (
                          <div className="mt-2 p-2.5 rounded-lg bg-emerald-900/90 border border-emerald-600 text-emerald-100">
                            <p className="font-bold text-emerald-300 text-[11px] flex items-center gap-1">
                              <CheckCircle2 className="w-3.5 h-3.5 text-teal-300" />
                              Tanggapan Resmi & Hasil Penanganan Humas:
                            </p>
                            <p className="mt-1 text-xs text-white leading-relaxed">
                              {trackResult.responseNote}
                            </p>
                            {trackResult.respondedAt && (
                              <p className="text-[10px] text-emerald-400 mt-1">
                                Diselesaikan pada: {new Date(trackResult.respondedAt).toLocaleDateString("id-ID")}
                              </p>
                            )}
                          </div>
                        ) : (
                          !trackResult.dispositionTo && (
                            <p className="italic text-emerald-400">
                              ⏳ Status: Sedang dalam telaah awal oleh Tim Humas
                            </p>
                          )
                        )}
                        <div className="pt-2 flex flex-col gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setShowSuccessModal(false);
                            router.push(`/tiket/${trackTicket}`);
                          }}
                          className="w-full inline-flex items-center justify-center py-3 px-4 rounded-xl text-xs sm:text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 transition shadow-md shadow-emerald-600/20 cursor-pointer"
                        >
                        Buka Rincian Tiket
                        <ChevronRight className="w-4 h-4 ml-1.5" />
                        </button>
                        </div>
                      </div>
                    </div>
                  )
                }

                </div>

                {/* Alur Kerja Disposisi Laporan */}
                <div className="bg-emerald-50/50 rounded-2xl p-6 border border-emerald-200">
                  <h4 className="text-sm font-bold text-emerald-950 mb-3 flex items-center">
                    <Sparkles className="w-4 h-4 text-emerald-600 mr-1.5" />
                    Alur Tindak Lanjut Laporan Humas
                  </h4>
                  <ol className="space-y-3 text-xs text-slate-600">
                    <li className="flex items-start gap-2.5">
                      <span className="w-5 h-5 rounded-full bg-emerald-600 text-white font-bold text-[11px] flex items-center justify-center shrink-0 mt-0.5">
                        1
                      </span>
                      <div>
                        <b className="text-slate-800">Laporan Masuk:</b> Laporan publik otomatis diterima di meja kerja digital Tim Humas.
                      </div>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <span className="w-5 h-5 rounded-full bg-emerald-600 text-white font-bold text-[11px] flex items-center justify-center shrink-0 mt-0.5">
                        2
                      </span>
                      <div>
                        <b className="text-slate-800">Verifikasi & Disposisi:</b> Administrator Humas menelaah isi aduan dan mendisposisikannya langsung ke bidang yang berwenang.
                      </div>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <span className="w-5 h-5 rounded-full bg-emerald-600 text-white font-bold text-[11px] flex items-center justify-center shrink-0 mt-0.5">
                        3
                      </span>
                      <div>
                        <b className="text-slate-800">Tindak Lanjut & Respon:</b> Bidang terkait menindaklanjuti keluhan dan mengabari progres melalui sistem.
                      </div>
                    </li>
                  </ol>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Section 1: Komitmen Respons Cepat & Transparansi Humas (Masyarakat-Friendly Copywriting) */}
        <section className="py-16 bg-gradient-to-b from-white via-emerald-50/20 to-emerald-50/40 border-t border-emerald-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-emerald-800 bg-emerald-100 px-3.5 py-1 rounded-full border border-emerald-200 shadow-xs">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-700" />
                Komitmen Respons Cepat & Transparansi Humas
              </span>
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-emerald-950 mt-3 tracking-tight">
                Bagaimana Sistem Kami Memproses Laporan Anda
              </h2>
              <p className="mt-3 text-slate-600 text-xs sm:text-sm sm:max-w-3xl mx-auto leading-relaxed">
                Setiap aspirasi, aduan, dan masukan masyarakat diperlakukan secara transparan melalui standar operasional terpadu demi pelayanan publik yang akuntabel, cepat, dan terpercaya.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Pilar 1: Integrasi Lintas Saluran */}
              <div className="p-7 rounded-2xl bg-white border border-emerald-100 hover:border-emerald-300 transition-all hover:shadow-lg shadow-sm group">
                <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                  <Radio className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-black text-emerald-950 mb-2.5">
                  Integrasi Lintas Saluran
                </h3>
                <p className="text-slate-600 text-xs sm:text-sm leading-relaxed">
                  Memantau keluhan warga dari portal resmi, media sosial, dan berita secara real-time untuk respon cepat tanpa hambatan birokrasi berbelit.
                </p>
                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center text-xs font-semibold text-emerald-700">
                  <span>Respon Cepat Real-Time</span>
                  <ChevronRight className="w-3.5 h-3.5 ml-1" />
                </div>
              </div>

              {/* Pilar 2: Telaah Cepat & Skala Prioritas */}
              <div className="p-7 rounded-2xl bg-white border border-emerald-100 hover:border-emerald-300 transition-all hover:shadow-lg shadow-sm group">
                <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                  <Sparkles className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-black text-emerald-950 mb-2.5">
                  Telaah Cepat & Skala Prioritas
                </h3>
                <p className="text-slate-600 text-xs sm:text-sm leading-relaxed">
                  Laporan langsung dianalisis tingkat urgensinya oleh tim Humas guna memastikan masalah fasilitas vital dan keluhan mendesak tertangani lebih awal.
                </p>
                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center text-xs font-semibold text-emerald-700">
                  <span>Prioritisasi Adil & Transparan</span>
                  <ChevronRight className="w-3.5 h-3.5 ml-1" />
                </div>
              </div>

              {/* Pilar 3: Disposisi Tepat & SLA Terukur */}
              <div className="p-7 rounded-2xl bg-white border border-emerald-100 hover:border-emerald-300 transition-all hover:shadow-lg shadow-sm group">
                <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                  <Building2 className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-black text-emerald-950 mb-2.5">
                  Disposisi Tepat & Tindak Lanjut Terukur
                </h3>
                <p className="text-slate-600 text-xs sm:text-sm leading-relaxed">
                  Aduan diteruskan otomatis ke dinas atau unit kerja pelaksana berwenang dengan target Service Level Agreement (SLA) penanganan yang terdata rapi.
                </p>
                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center text-xs font-semibold text-emerald-700">
                  <span>SLA Penanganan Terpantau</span>
                  <ChevronRight className="w-3.5 h-3.5 ml-1" />
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer Nuansa Hijau & Akses Staf */}
      <footer className="border-t border-emerald-200 bg-white py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div className="flex items-center space-x-2">
            <img
              src="/LOGO DKH.png"
              alt="Logo"
              className="w-7 h-7 object-contain rounded-md"
              onError={(e) => {
                (e.target as HTMLElement).style.display = "none";
              }}
            />
            <span className="font-semibold text-slate-700">Portal Layanan Aspirasi Publik & Transparansi Informasi Humas</span>
          </div>
          <div className="flex flex-wrap items-center gap-4 text-emerald-700 font-medium">
            <a href="#form-lapor" className="hover:underline">Lapor Publik</a>
            <a href="#lacak-laporan" className="hover:underline">Lacak Tiket</a>
            <span className="text-slate-300">|</span>
            <Link href="/karyawan" className="text-slate-500 hover:text-emerald-700 hover:underline">Portal Karyawan</Link>
            <Link href="/teknisi" className="text-slate-500 hover:text-emerald-700 hover:underline">Portal Teknisi</Link>
            <Link href="/dashboard" className="text-emerald-700 hover:text-emerald-900 font-bold hover:underline">Portal Analitik</Link>
            <Link href="/login" className="text-slate-500 hover:text-emerald-700 hover:underline">Masuk Petugas</Link>
          </div>
        </div>
      </footer>

      {/* Modal Popup Warning/Notifikasi Sukses Laporan Terkirim */}
      {showSuccessModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 sm:p-7 shadow-2xl border border-emerald-200 space-y-4 animate-in zoom-in-95 duration-200">
            <div className="w-14 h-14 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto shadow-sm shadow-emerald-600/20">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div className="text-center space-y-2">
              <span className="inline-flex items-center gap-1 text-[11px] font-black uppercase tracking-wider text-emerald-800 bg-emerald-100 px-3 py-1 rounded-full border border-emerald-200">
                Pemberitahuan Sistem
              </span>
              <h3 className="text-xl font-black text-slate-900">
                Laporan Terkirim!
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Laporan Anda telah berhasil masuk dalam sistem <br></br> Monitoring Kendala RSUD Datu Kandang Haji 
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-emerald-200 text-center space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Nomor Tiket Aduan Anda
              </span>
              <span className="font-mono font-black text-xl text-emerald-950 tracking-wider">
                {createdTicketNumber}
              </span>
            </div>

            {/* }
            <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 flex items-start gap-2.5 text-xs text-amber-900">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <p className="text-[11px] leading-relaxed">
                <b>Penting:</b> Anda akan langsung diarahkan ke halaman rincian & pelacakan status penanganan tiket ini. Simpan atau catat nomor tiket tersebut.
              </p>
            </div>
              */}

            <div className="pt-2 flex flex-col gap-2">
              <button
                type="button"
                onClick={() => {
                  setShowSuccessModal(false);
                  router.push(`/tiket/${createdTicketNumber}`);
                }}
                className="w-full inline-flex items-center justify-center py-3 px-4 rounded-xl text-xs sm:text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 transition shadow-md shadow-emerald-600/20 cursor-pointer"
              >
                Buka Rincian Tiket
                <ChevronRight className="w-4 h-4 ml-1.5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
