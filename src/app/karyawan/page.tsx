"use client";

import React, { useState, useEffect } from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  LogOut,
  Send,
  Wrench,
  Building2,
  AlertTriangle,
  Clock,
  CheckCircle2,
  Laptop,
  Wifi,
  Zap,
  Wind,
  Tv,
  ArrowLeft,
  Loader2,
  RefreshCw,
  Copy,
  User as UserIcon,
  ShieldCheck,
  Flame,
  CheckCheck,
} from "lucide-react";

interface InternalReportItem {
  id: string;
  ticketNumber: string;
  title: string;
  roomLocation: string;
  techCategory: string;
  targetTechnician: string;
  urgency: "RENDAH" | "SEDANG" | "TINGGI" | "KRITIS";
  status: "TERKIRIM" | "DITERIMA_TEKNISI" | "SEDANG_DIKERJAKAN" | "SELESAI" | "TERKENDALA";
  description: string;
  technicianNotes?: string | null;
  startedAt?: string | null;
  completedAt?: string | null;
  createdAt: string;
}

const TECHNICIAN_UNITS = [
  "Teknisi Jaringan & Komputer (IT Support)",
  "Teknisi Sistem Informasi & Aplikasi",
  "Teknisi Kelistrikan & Genset (ME)",
  "Teknisi AC & Tata Udara (Gedung)",
  "Teknisi Audio Visual & Multimedia",
  "Teknisi Sarana Prasarana Umum",
];

export default function KaryawanPage() {
  const { data: session, status: authStatus } = useSession();
  const router = useRouter();

  const [techList, setTechList] = useState<string[]>(TECHNICIAN_UNITS);

  // State kategori dinamis beserta pewarnaan dari Superadmin
    const [categoriesList, setCategoriesList] = useState<any[]>([]);

  // Form State
  const [title, setTitle] = useState("");
  const [roomLocation, setRoomLocation] = useState("");
  const [techCategory, setTechCategory] = useState("HARDWARE_KOMPUTER");
  const [targetTechnician, setTargetTechnician] = useState(TECHNICIAN_UNITS[0]);
  const [urgency, setUrgency] = useState<"RENDAH" | "SEDANG" | "TINGGI" | "KRITIS">("SEDANG");
  const [description, setDescription] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successTicket, setSuccessTicket] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isCopied, setIsCopied] = useState(false);

  // List State
  const [myReports, setMyReports] = useState<InternalReportItem[]>([]);
  const [isLoadingList, setIsLoadingList] = useState(true);

  // Set Document Title
  useEffect(() => {
    document.title = "Portal Layanan Karyawan - HumasMonitor";
  }, []);

  // Redirect jika belum login
  useEffect(() => {
    if (authStatus === "unauthenticated") {
      router.push("/login?callbackUrl=/karyawan");
    }
  }, [authStatus, router]);

  // Fetch daftar laporan saya dan konfigurasi teknisi
  const fetchMyReports = async () => {
    setIsLoadingList(true);
    try {
      const res = await fetch("/api/internal-reports");
      if (res.ok) {
        const data = await res.json();
        setMyReports(data.reports || []);
      }
    } catch (err) {
      console.error("Gagal memuat laporan kendala:", err);
    } finally {
      setIsLoadingList(false);
    }
  };

  const fetchSettings = async () => {
    try {
      const res = await fetch("/api/settings");
      if (res.ok) {
        const data = await res.json();
        if (data.availableTechnicians) {
          const list = data.availableTechnicians
            .split(",")
            .map((s: string) => s.trim())
            .filter(Boolean);
          if (list.length > 0) {
            setTechList(list);
            setTargetTechnician(list[0]);
          }
        }
      }
    } catch (err) {
      console.error("Gagal mengambil konfigurasi teknisi:", err);
    }
  };

  useEffect(() => {
    if (authStatus === "authenticated") {
      fetchMyReports();
      fetchSettings();
    }
  }, [authStatus]);

  // Submit laporan baru
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const res = await fetch("/api/internal-reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          roomLocation,
          techCategory,
          targetTechnician,
          urgency,
          description,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Gagal mengirim laporan kendala.");
      }

      setSuccessTicket(data.ticketNumber);
      // Reset form
      setTitle("");
      setRoomLocation("");
      setDescription("");
      setUrgency("SEDANG");

      // Refresh list
      fetchMyReports();
    } catch (err: any) {
      setErrorMessage(err.message || "Terjadi kesalahan sistem.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2500);
  };

  if (authStatus === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-600">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-600 mr-3" />
        <span className="font-semibold text-sm">Memverifikasi Identitas Karyawan Internal...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col text-slate-800">
      <title>Portal Layanan Internal - HumasMonitor</title>
      {/* Top Navbar */}
      <header className="bg-white border-b border-emerald-200 sticky top-0 z-40 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Link href="/" className="flex items-center space-x-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/LOGO DKH.png"
                alt="Logo Humas"
                className="w-9 h-9 object-contain rounded-xl shadow-xs border border-emerald-200 bg-white p-0.5"
              />
              <span className="text-lg font-black text-emerald-950 tracking-tight">HumasMonitor</span>
            </Link>
            <span className="hidden sm:inline-block text-xs px-2.5 py-0.5 bg-emerald-100 text-emerald-800 font-bold rounded-full border border-emerald-200">
              Portal Pelayanan Kendala Internal
            </span>
          </div>

          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2.5 text-right">
              <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-sm border border-emerald-200">
                <UserIcon className="w-4 h-4" />
              </div>
              <div className="hidden sm:block">
                <p className="text-xs font-bold text-slate-800">
                  {session?.user?.name || "Karyawan Terverifikasi"}
                </p>
                <p className="text-[11px] text-emerald-700 font-medium">
                  {session?.user?.role || "STAFF"} • {session?.user?.email}
                </p>
              </div>
            </div>

            {session?.user?.role === "ADMIN" || session?.user?.role === "HUMAS" ? (
              <Link
                href="/dashboard"
                className="inline-flex items-center px-3 py-1.5 text-xs font-bold rounded-lg text-emerald-800 bg-emerald-100 hover:bg-emerald-200 transition"
              >
                Dashboard Humas
              </Link>
            ) : null}

            <button
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="inline-flex items-center px-3 py-1.5 text-xs font-semibold rounded-lg text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 transition"
            >
              <LogOut className="w-3.5 h-3.5 mr-1" />
              Keluar
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Banner Selamat Datang */}
        <div className="bg-white p-6 rounded-2xl border border-emerald-200 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 mb-2">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              Identitas Karyawan Terverifikasi
            </div>
            <h1 className="text-2xl font-black text-emerald-950">
              Pelaporan Kendala & Fasilitas Ruangan Kerja
            </h1>
            <p className="text-slate-600 text-xs sm:text-sm mt-1">
              {/*Pergerakan penanganan dipantau terpadu oleh Tim Humas*/}
              Laporkan gangguan perangkat, jaringan, AC, atau listrik di ruangan langsung ke unit bersangkutan.
            </p>
          </div>

          {/*
          <Link
            href="/"
            className="inline-flex items-center text-xs font-bold text-slate-600 hover:text-emerald-700 bg-slate-100 px-3.5 py-2 rounded-xl border border-slate-200 transition shrink-0"
          >
            <ArrowLeft className="w-3.5 h-3.5 mr-1.5" />
            Kembali ke Beranda
          </Link>
          */}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Form Lapor Kendala Ruangan (Kiri) */}
          <div className="lg:col-span-5 bg-white rounded-2xl border border-emerald-200 p-6 shadow-sm">
            <div className="flex items-center space-x-2 text-emerald-700 mb-1">
              <Wrench className="w-5 h-5" />
              <span className="text-xs font-bold uppercase tracking-wider">Formulir Tiket Kendala</span>
            </div>
            <h2 className="text-xl font-black text-slate-900">
              Kirim Laporan ke Teknisi
            </h2>
            <p className="text-xs text-slate-500 mt-0.5 mb-5">
              Isi rincian lokasi ruangan dan pilih tim teknisi yang dituju.
            </p>

            {/* Tiket Sukses */}
            {successTicket && (
              <div className="mb-5 p-4 rounded-xl bg-emerald-50 border border-emerald-300">
                <div className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <h3 className="text-xs font-bold text-emerald-900">
                      Laporan Kendala Berhasil Dikirim ke Teknisi!
                    </h3>
                    <p className="text-[11px] text-emerald-700 mt-0.5">
                      Nomor tiket kendala Anda:
                    </p>
                    <div className="mt-2 flex items-center gap-2">
                      <span className="font-mono font-bold text-xs bg-white px-2.5 py-1 rounded-md border border-emerald-300 text-emerald-900">
                        {successTicket}
                      </span>
                      <button
                        type="button"
                        onClick={() => copyToClipboard(successTicket)}
                        className="inline-flex items-center px-2 py-1 text-[11px] font-bold rounded-md bg-emerald-600 hover:bg-emerald-700 text-white transition"
                      >
                        <Copy className="w-3 h-3 mr-1" />
                        {isCopied ? "Tersalin!" : "Salin"}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {errorMessage && (
              <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-3.5">
              {/* Lokasi Ruangan */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Ruangan *
                </label>
                <div className="relative">
                  <Building2 className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                  <input
                    type="text"
                    required
                    value={roomLocation}
                    onChange={(e) => setRoomLocation(e.target.value)}
                    placeholder=" Poli PD / Anggrek / Bidang Non Medik"
                    className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                  />
                </div>
              </div>

              {/* Judul Kendala */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Ringkasan Kendala *
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Komputer Tidak Nyala / AC Tidak Dingin"
                  className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                />
              </div>

              {/* Kategori Kendala */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Kategori Kendala *
                  </label>
                  <select
                    value={techCategory}
                    onChange={(e) => setTechCategory(e.target.value)}
                    className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white font-medium"
                  >
                    
                    <option value="HARDWARE_KOMPUTER">💻 Komputer / PC / Printer</option>
                    <option value="JARINGAN_INTERNET">🌐 Jaringan / Internet / Wifi</option>
                    <option value="SISTEM_APLIKASI">🖥️ Sistem & Aplikasi</option>
                    <option value="AC_TATA_UDARA">❄️ AC & Tata Udara</option>
                    <option value="LISTRIK_MEKANIKAL">⚡ Kelistrikan & Stop Kontak</option>
                    <option value="AUDIO_VISUAL">📽️ Audio Visual & Proyektor</option>
                    <option value="SARANA_GEDUNG">🏢 Sarana Prasarana Gedung</option>
                  </select>
                </div>

                {/* Ditujukan Langsung ke Teknisi */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Ditujukan ke Teknisi *
                  </label>
                  <select
                    value={targetTechnician}
                    onChange={(e) => setTargetTechnician(e.target.value)}
                    className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white font-medium"
                  >
                    {techList.map((unit) => (
                      <option key={unit} value={unit}>
                        {unit}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Tingkat Urgensi */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Tingkat Urgensi Gangguan
                </label>
                <div className="grid grid-cols-4 gap-2">
                  <button
                    type="button"
                    onClick={() => setUrgency("RENDAH")}
                    className={`py-1.5 px-2 text-center rounded-xl text-xs font-bold transition border ${
                      urgency === "RENDAH"
                        ? "bg-slate-700 text-white border-slate-700 shadow-xs"
                        : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                    }`}
                  >
                    ☕ Rendah
                  </button>
                  <button
                    type="button"
                    onClick={() => setUrgency("SEDANG")}
                    className={`py-1.5 px-2 text-center rounded-xl text-xs font-bold transition border ${
                      urgency === "SEDANG"
                        ? "bg-sky-600 text-white border-sky-600 shadow-xs"
                        : "bg-white text-sky-700 border-slate-200 hover:bg-sky-50"
                    }`}
                  >
                    ⚡ Sedang
                  </button>
                  <button
                    type="button"
                    onClick={() => setUrgency("TINGGI")}
                    className={`py-1.5 px-2 text-center rounded-xl text-xs font-bold transition border ${
                      urgency === "TINGGI"
                        ? "bg-amber-600 text-white border-amber-600 shadow-xs"
                        : "bg-white text-amber-700 border-slate-200 hover:bg-amber-50"
                    }`}
                  >
                    ⚠️ Tinggi
                  </button>
                  <button
                    type="button"
                    onClick={() => setUrgency("KRITIS")}
                    className={`py-1.5 px-2 text-center rounded-xl text-xs font-bold transition border ${
                      urgency === "KRITIS"
                        ? "bg-rose-600 text-white border-rose-600 shadow-xs"
                        : "bg-white text-rose-700 border-slate-200 hover:bg-rose-50"
                    }`}
                  >
                    🚨 Kritis
                  </button>
                </div>
              </div>

              {/* Rincian Deskripsi */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Rincian Deskripsi Gangguan *
                </label>
                <textarea
                  rows={3}
                  required
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Ceritakan detail kendala, nomor inventaris/PC (jika ada), serta dampaknya terhadap alur pelayanan..."
                  className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full inline-flex items-center justify-center py-2.5 px-4 rounded-xl text-xs sm:text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 shadow-md shadow-emerald-600/20 transition disabled:opacity-60"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    Mengirim Tiket ke Teknisi...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    Kirim ke Teknisi Sekarang
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Riwayat Laporan Kendala Ruangan Saya (Kanan) */}
          <div className="lg:col-span-7 space-y-4">
            <div className="bg-white p-5 rounded-2xl border border-emerald-200 shadow-sm flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-emerald-950">
                  Riwayat Laporan Kendala Ruangan Saya
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Pantau pergerakan teknisi menangani gangguan di ruangan Anda secara transparan.
                </p>
              </div>
              <button
                onClick={fetchMyReports}
                className="p-2 rounded-xl border border-emerald-200 text-emerald-700 hover:bg-emerald-50 transition"
                title="Segarkan data"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>

            {/* List Kendala */}
            <div className="space-y-3">
              {isLoadingList ? (
                <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center text-slate-500">
                  <Loader2 className="w-6 h-6 animate-spin mx-auto text-emerald-600 mb-2" />
                  <span className="text-xs font-semibold">Memuat riwayat kendala ruangan...</span>
                </div>
              ) : myReports.length === 0 ? (
                <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center text-slate-500">
                  <Wrench className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                  <p className="font-bold text-slate-700 text-sm">Belum Ada Kendala yang Dilaporkan</p>
                  <p className="text-xs text-slate-400 mt-1">
                    Gunakan formulir di samping untuk melaporkan kendala peralatan atau fasilitas di ruangan kerja Anda.
                  </p>
                </div>
              ) : (
                myReports.map((item) => (
                  <div
                    key={item.id}
                    className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 hover:border-emerald-200 transition shadow-xs space-y-2.5"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center space-x-2">
                        <span className="font-mono text-xs font-bold bg-slate-100 px-2 py-0.5 rounded border border-slate-200 text-slate-800">
                          {item.ticketNumber}
                        </span>
                        <span className="text-xs font-bold text-emerald-900 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                          📍 {item.roomLocation}
                        </span>
                      </div>

                      {/* Status Pergerakan Teknisi */}
                      <div>
                        {item.status === "TERKIRIM" && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200">
                            <Clock className="w-3 h-3" /> Menunggu Teknisi
                          </span>
                        )}
                        {item.status === "DITERIMA_TEKNISI" && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-sky-100 text-sky-800 border border-sky-200">
                            <Wrench className="w-3 h-3" /> Teknisi Menuju Lokasi
                          </span>
                        )}
                        {item.status === "SEDANG_DIKERJAKAN" && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-orange-100 text-orange-800 border border-orange-200 animate-pulse">
                            <Wrench className="w-3 h-3" /> Sedang Diperbaiki
                          </span>
                        )}
                        {item.status === "SELESAI" && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-teal-100 text-teal-800 border border-teal-200">
                            <CheckCheck className="w-3 h-3" /> Selesai / Tuntas
                          </span>
                        )}
                        {item.status === "TERKENDALA" && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-100 text-rose-800">
                            <AlertTriangle className="w-3 h-3" /> Menunggu Sparepart
                          </span>
                        )}
                      </div>
                    </div>

                    <div>
                      <h4 className="font-bold text-slate-900 text-sm">{item.title}</h4>
                      <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                        {item.description}
                      </p>
                    </div>

                    <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-slate-700">
                          🔧 Teknisi: <b>{item.targetTechnician}</b>
                        </span>
                        <span>•</span>
                        <span className="font-semibold text-slate-600">
                          Urgensi: <b>{item.urgency}</b>
                        </span>
                      </div>
                      <div>
                        {new Date(item.createdAt).toLocaleDateString("id-ID", {
                          day: "numeric",
                          month: "short",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </div>
                    </div>

                    {/* Catatan Progres Teknisi jika ada */}
                    {item.technicianNotes && (
                      <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700">
                        <span className="font-bold text-emerald-800 flex items-center gap-1">
                          <Wrench className="w-3.5 h-3.5 text-emerald-600" />
                          Catatan Perkembangan Teknisi:
                        </span>
                        <p className="mt-0.5 text-slate-600">{item.technicianNotes}</p>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
