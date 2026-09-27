"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Wrench,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Flame,
  Search,
  Filter,
  MapPin,
  User,
  Phone,
  Calendar,
  LogOut,
  RefreshCw,
  ChevronRight,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Send,
  Loader2,
  HelpCircle,
  FileText,
  Building,
  Globe,
  Share2,
} from "lucide-react";

interface TechnicianTask {
  id: string;
  ticketNumber: string;
  sourceType: "INTERNAL" | "PUBLIC_DISPOSITION";
  title: string;
  description: string;
  locationOrRoom: string;
  categoryLabel: string;
  urgency: "RENDAH" | "SEDANG" | "TINGGI" | "KRITIS";
  status: string;
  targetTechnician: string;
  technicianNotes?: string | null;
  startedAt?: string | null;
  completedAt?: string | null;
  createdAt: string;
  reporterName?: string;
  reporterContact?: string;
  rawInternal?: any;
  rawPublic?: any;
}

export default function TeknisiPortalPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [tasks, setTasks] = useState<TechnicianTask[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [sourceTab, setSourceTab] = useState<"ALL" | "INTERNAL" | "PUBLIC_DISPOSITION">("ALL");
  const [filterStatus, setFilterStatus] = useState<string>("ALL");
  const [searchTerm, setSearchTerm] = useState("");

  // Modal Action State
  const [selectedTask, setSelectedTask] = useState<TechnicianTask | null>(null);
  const [modalAction, setModalAction] = useState<"PROSES" | "SELESAI" | "KENDALA" | null>(null);
  const [techNoteInput, setTechNoteInput] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notification, setNotification] = useState<{ message: string; type: "success" | "error" } | null>(null);

  useEffect(() => {
    document.title = "Workspace Teknisi - HumasMonitor";
  }, []);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login?callbackUrl=/teknisi");
    } else if (status === "authenticated") {
      fetchTasks();
    }
  }, [status, router]);

  const fetchTasks = async () => {
    setIsLoading(true);
    try {
      const [resInternal, resPublic] = await Promise.all([
        fetch("/api/internal-reports"),
        fetch("/api/reports"),
      ]);

      const internalData = resInternal.ok ? await resInternal.json() : { reports: [] };
      const publicData = resPublic.ok ? await resPublic.json() : { reports: [] };

      const internalTasks: TechnicianTask[] = (internalData.reports || []).map((ir: any) => ({
        id: ir.id,
        ticketNumber: ir.ticketNumber,
        sourceType: "INTERNAL",
        title: ir.title,
        description: ir.description,
        locationOrRoom: ir.roomLocation,
        categoryLabel: ir.techCategory?.replace(/_/g, " ") || "KENDALA RUANGAN",
        urgency: ir.urgency,
        status: ir.status,
        targetTechnician: ir.targetTechnician,
        technicianNotes: ir.technicianNotes,
        startedAt: ir.startedAt,
        completedAt: ir.completedAt,
        createdAt: ir.createdAt,
        reporterName: ir.reporter?.name || "Karyawan Staf",
        reporterContact: ir.reporter?.email || "-",
        rawInternal: ir,
      }));

      // Ambil aduan publik yang didisposisikan ke teknisi atau unit lapangan
      const dispositionTasks: TechnicianTask[] = (publicData.reports || [])
        .filter((pr: any) => {
          if (!pr.dispositionTo) return false;
          const toLower = pr.dispositionTo.toLowerCase();
          return (
            toLower.includes("teknisi") ||
            toLower.includes("it") ||
            toLower.includes("fasilitas") ||
            toLower.includes("gedung") ||
            toLower.includes("jaringan") ||
            toLower.includes("hardware")
          );
        })
        .map((pr: any) => ({
          id: pr.id,
          ticketNumber: pr.ticketNumber,
          sourceType: "PUBLIC_DISPOSITION",
          title: pr.title,
          description: `${pr.content}\n\n[Arahan Disposisi Humas]: ${pr.dispositionNote || "-"}`,
          locationOrRoom: "Pengaduan Publik Disposisi Humas",
          categoryLabel: pr.category?.replace(/_/g, " ") || "ADUAN PUBLIK",
          urgency: pr.urgency,
          status: pr.status === "DIDISPOSISIKAN" ? "DITERIMA_TEKNISI" : pr.status,
          targetTechnician: pr.dispositionTo,
          technicianNotes: pr.responseNote,
          startedAt: pr.dispositionedAt,
          completedAt: pr.respondedAt,
          createdAt: pr.createdAt,
          reporterName: pr.isAnonymous ? "Anonim (Warga)" : pr.reporterName || "Masyarakat",
          reporterContact: pr.reporterContact || "-",
          rawPublic: pr,
        }));

      setTasks([...internalTasks, ...dispositionTasks]);
    } catch (err) {
      console.error("Gagal mengambil data tugas teknisi:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateStatus = async (
    task: TechnicianTask,
    newStatus: string,
    notes?: string
  ) => {
    setIsSubmitting(true);
    try {
      let res: Response;

      if (task.sourceType === "INTERNAL") {
        res = await fetch(`/api/internal-reports/${task.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            status: newStatus,
            technicianNotes: notes || undefined,
            startedAt: newStatus === "SEDANG_DIKERJAKAN" ? new Date().toISOString() : undefined,
            completedAt: newStatus === "SELESAI" ? new Date().toISOString() : undefined,
          }),
        });
      } else {
        // Disposisi Aduan Publik
        const reportStatus = newStatus === "SELESAI" ? "SELESAI" : "SEDANG_DIPROSES";
        res = await fetch(`/api/reports/${task.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            status: reportStatus,
            responseNote: notes || undefined,
            action: newStatus === "SELESAI" ? "RESOLVE" : undefined,
          }),
        });
      }

      if (res.ok) {
        setNotification({
          message: `Status penanganan ${task.ticketNumber} berhasil diperbarui menjadi ${formatStatusLabel(newStatus)}.`,
          type: "success",
        });
        setSelectedTask(null);
        setModalAction(null);
        setTechNoteInput("");
        fetchTasks();
      } else {
        const errData = await res.json();
        setNotification({ message: errData.error || "Gagal memperbarui status.", type: "error" });
      }
    } catch (err) {
      setNotification({ message: "Terjadi kesalahan koneksi.", type: "error" });
    } finally {
      setIsSubmitting(false);
      setTimeout(() => setNotification(null), 4000);
    }
  };

  // Filter Data
  const filteredTasks = useMemo(() => {
    return tasks.filter((t) => {
      const matchesSource = sourceTab === "ALL" || t.sourceType === sourceTab;
      const matchesStatus =
        filterStatus === "ALL" ||
        t.status === filterStatus ||
        (filterStatus === "PROSES" &&
          (t.status === "DITERIMA_TEKNISI" ||
            t.status === "SEDANG_DIKERJAKAN" ||
            t.status === "SEDANG_DIPROSES"));

      const matchesSearch =
        t.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.locationOrRoom.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.ticketNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (t.reporterName || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.targetTechnician.toLowerCase().includes(searchTerm.toLowerCase());

      return matchesSource && matchesStatus && matchesSearch;
    });
  }, [tasks, sourceTab, filterStatus, searchTerm]);

  // Statistik
  const totalCount = tasks.length;
  const waitingCount = tasks.filter((t) => t.status === "TERKIRIM" || t.status === "BARU").length;
  const inProgressCount = tasks.filter(
    (t) =>
      t.status === "DITERIMA_TEKNISI" ||
      t.status === "SEDANG_DIKERJAKAN" ||
      t.status === "SEDANG_DIPROSES"
  ).length;
  const completedCount = tasks.filter((t) => t.status === "SELESAI").length;
  const internalCount = tasks.filter((t) => t.sourceType === "INTERNAL").length;
  const dispositionCount = tasks.filter((t) => t.sourceType === "PUBLIC_DISPOSITION").length;

  const formatStatusLabel = (st: string) => {
    switch (st) {
      case "TERKIRIM":
      case "BARU":
        return "Baru Masuk";
      case "DITERIMA_TEKNISI":
      case "SEDANG_DIPROSES":
        return "OTW / Menuju Lokasi";
      case "SEDANG_DIKERJAKAN":
        return "Sedang Dikerjakan";
      case "SELESAI":
        return "Selesai (Normal)";
      case "TERKENDALA":
        return "Terkendala";
      default:
        return st;
    }
  };

  const getUrgencyBadge = (urgency: string) => {
    switch (urgency) {
      case "KRITIS":
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-black bg-rose-600 text-white">
            <Flame className="w-3 h-3 mr-1 animate-pulse" />
            KRITIS
          </span>
        );
      case "TINGGI":
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500 text-white">
            <AlertTriangle className="w-3 h-3 mr-1" />
            TINGGI
          </span>
        );
      case "SEDANG":
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-sky-100 text-sky-800">
            SEDANG
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-700">
            RENDAH
          </span>
        );
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col text-slate-800">
      <title>Workspace Teknisi - HumasMonitor</title>
      {/* Header Teknisi */}
      <header className="bg-slate-900 text-white border-b border-slate-800 sticky top-0 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Link href="/" className="flex items-center space-x-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/LOGO DKH.png"
                alt="Logo Humas"
                className="w-9 h-9 object-contain rounded-xl bg-white p-0.5 shadow-md shadow-emerald-500/20"
              />
            </Link>
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-slate-950 font-bold shadow-md shadow-emerald-500/20">
              <Wrench className="w-4 h-4" />
            </div>
            <div>
              <span className="text-base sm:text-lg font-black tracking-tight text-white flex items-center gap-2">
                Workspace Teknisi
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  Operasional Lapangan
                </span>
              </span>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <div className="text-right hidden sm:block">
              <p className="text-xs font-semibold text-white">{session?.user?.name || "Teknisi"}</p>
              <p className="text-[10px] text-emerald-400 uppercase font-mono">
                {session?.user?.role} • {session?.user?.email}
              </p>
            </div>

            <button
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="p-2 rounded-lg text-slate-400 hover:text-red-400 hover:bg-slate-800 transition"
              title="Keluar / Logout"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
        {/* Toast Notifikasi */}
        {notification && (
          <div
            className={`p-4 rounded-xl text-xs font-semibold flex items-center justify-between shadow-xs animate-in fade-in ${
              notification.type === "success"
                ? "bg-emerald-50 text-emerald-900 border border-emerald-200"
                : "bg-red-50 text-red-900 border border-red-200"
            }`}
          >
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{notification.message}</span>
            </div>
            <button onClick={() => setNotification(null)} className="text-xs font-bold underline ml-4">
              ✕
            </button>
          </div>
        )}

        {/* 4 KPI Cards Teknisi */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
            <p className="text-xs font-bold text-slate-500 uppercase">Total Tugas Masuk</p>
            <p className="text-2xl font-black text-slate-800 mt-1">{totalCount}</p>
            <p className="text-[11px] text-slate-400 mt-1">
              {internalCount} kendala ruangan • {dispositionCount} disposisi Humas
            </p>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-amber-200 shadow-xs bg-gradient-to-br from-white to-amber-50/40">
            <p className="text-xs font-bold text-amber-800 uppercase flex items-center">
              <Clock className="w-3.5 h-3.5 mr-1" />
              Menunggu Respon
            </p>
            <p className="text-2xl font-black text-amber-900 mt-1">{waitingCount}</p>
            <p className="text-[11px] text-amber-700/80 mt-1">Tiket baru perlu ditindaklanjuti</p>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-blue-200 shadow-xs bg-gradient-to-br from-white to-blue-50/40">
            <p className="text-xs font-bold text-blue-800 uppercase flex items-center">
              <RefreshCw className="w-3.5 h-3.5 mr-1" />
              Sedang Dikerjakan
            </p>
            <p className="text-2xl font-black text-blue-900 mt-1">{inProgressCount}</p>
            <p className="text-[11px] text-blue-700/80 mt-1">Petugas OTW / perbaikan fisik</p>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-emerald-200 shadow-xs bg-gradient-to-br from-white to-emerald-50/40">
            <p className="text-xs font-bold text-emerald-800 uppercase flex items-center">
              <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
              Tuntas Selesai
            </p>
            <p className="text-2xl font-black text-emerald-900 mt-1">{completedCount}</p>
            <p className="text-[11px] text-emerald-700/80 mt-1">Selesai diperbaiki & berfungsi normal</p>
          </div>
        </div>

        {/* Toolbar Filter & Tab Pemilah Tugas */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            {/* Tab Sumber Tugas: Semua, Kendala Ruangan, Disposisi Humas */}
            <div className="inline-flex p-1 rounded-xl bg-slate-100 border border-slate-200 text-xs font-bold">
              <button
                onClick={() => setSourceTab("ALL")}
                className={`px-3 py-1.5 rounded-lg transition ${
                  sourceTab === "ALL" ? "bg-slate-900 text-white shadow-xs" : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Semua Tugas ({totalCount})
              </button>
              <button
                onClick={() => setSourceTab("INTERNAL")}
                className={`px-3 py-1.5 rounded-lg transition ${
                  sourceTab === "INTERNAL"
                    ? "bg-slate-900 text-white shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <Building className="w-3 h-3 inline mr-1" />
                Kendala Ruangan ({internalCount})
              </button>
              <button
                onClick={() => setSourceTab("PUBLIC_DISPOSITION")}
                className={`px-3 py-1.5 rounded-lg transition ${
                  sourceTab === "PUBLIC_DISPOSITION"
                    ? "bg-slate-900 text-white shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <Share2 className="w-3 h-3 inline mr-1" />
                Disposisi Humas ({dispositionCount})
              </button>
            </div>

            <button
              onClick={fetchTasks}
              className="p-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 transition self-start sm:self-auto"
              title="Perbarui daftar tugas"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>

          <div className="flex flex-col md:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Cari tiket, ruangan, judul, atau teknisi tujuan..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-slate-50"
              />
            </div>

            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="text-xs font-semibold px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="ALL">Semua Tahapan</option>
              <option value="TERKIRIM">Menunggu Respon (Baru)</option>
              <option value="PROSES">Sedang Berlangsung (OTW / Dikerjakan)</option>
              <option value="TERKENDALA">Terkendala Sparepart</option>
              <option value="SELESAI">Selesai</option>
            </select>
          </div>
        </div>

        {/* Antrean Kartu Tugas Teknisi */}
        <div className="space-y-3">
          {isLoading ? (
            <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center text-slate-500">
              <Loader2 className="w-6 h-6 animate-spin mx-auto text-emerald-600 mb-2" />
              <p className="font-semibold text-xs">Memuat antrean tugas teknisi...</p>
            </div>
          ) : filteredTasks.length === 0 ? (
            <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center text-slate-500">
              <CheckCircle2 className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p className="font-bold text-sm text-slate-800">Tidak ada tugas dalam antrean</p>
              <p className="text-xs text-slate-400 mt-0.5">Semua laporan telah tertangani atau filter tidak cocok.</p>
            </div>
          ) : (
            filteredTasks.map((task) => (
              <div
                key={`${task.sourceType}-${task.id}`}
                className={`p-5 rounded-2xl border transition bg-white shadow-xs ${
                  task.status === "SELESAI"
                    ? "border-emerald-200 bg-emerald-50/20"
                    : task.urgency === "KRITIS"
                    ? "border-rose-300 bg-rose-50/20"
                    : "border-slate-200 hover:border-slate-300"
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono font-bold text-xs bg-slate-100 text-slate-800 px-2 py-0.5 rounded border border-slate-200">
                      {task.ticketNumber}
                    </span>

                    {task.sourceType === "INTERNAL" ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded bg-purple-50 text-purple-700 border border-purple-200">
                        <Building className="w-3 h-3" />
                        Kendala Ruangan
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
                        <Share2 className="w-3 h-3" />
                        Disposisi Humas
                      </span>
                    )}

                    <span className="text-[10px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                      {task.categoryLabel}
                    </span>

                    {getUrgencyBadge(task.urgency)}
                  </div>

                  <div className="flex items-center gap-2 text-xs">
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                        task.status === "SELESAI"
                          ? "bg-emerald-100 text-emerald-900 border border-emerald-300"
                          : task.status === "SEDANG_DIKERJAKAN" || task.status === "DITERIMA_TEKNISI" || task.status === "SEDANG_DIPROSES"
                          ? "bg-blue-100 text-blue-900 border border-blue-300"
                          : task.status === "TERKENDALA"
                          ? "bg-rose-100 text-rose-900 border border-rose-300"
                          : "bg-amber-100 text-amber-900 border border-amber-300"
                      }`}
                    >
                      {formatStatusLabel(task.status)}
                    </span>
                  </div>
                </div>

                <div className="mt-3">
                  <h3 className="font-black text-slate-900 text-base">{task.title}</h3>
                  <p className="text-xs text-slate-600 mt-1 whitespace-pre-line">{task.description}</p>
                </div>

                {/* Catatan Teknis / Penyelesaian jika ada */}
                {task.technicianNotes && (
                  <div className="mt-3 p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs">
                    <span className="font-bold text-slate-700 block mb-0.5">Catatan Teknis / Respon:</span>
                    <p className="text-slate-600 italic">&ldquo;{task.technicianNotes}&rdquo;</p>
                  </div>
                )}

                {/* Meta info & Action Buttons */}
                <div className="mt-4 pt-3 border-t border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
                  <div className="space-y-1 text-slate-500 text-[11px]">
                    <div className="flex items-center gap-2">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" />
                      <span>{task.locationOrRoom}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <User className="w-3.5 h-3.5 text-slate-400" />
                      <span>Pelapor: <b>{task.reporterName}</b> ({task.reporterContact})</span>
                    </div>
                  </div>

                  {/* Tombol Pembaruan Status Lapangan */}
                  <div className="flex items-center gap-2 flex-wrap">
                    {task.status !== "SELESAI" && (
                      <>
                        {(task.status === "TERKIRIM" || task.status === "BARU") && (
                          <button
                            onClick={() => handleUpdateStatus(task, "DITERIMA_TEKNISI")}
                            className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold transition flex items-center shadow-xs"
                          >
                            <Send className="w-3 h-3 mr-1" />
                            Terima & OTW ke Lokasi
                          </button>
                        )}

                        {task.status === "DITERIMA_TEKNISI" && task.sourceType === "INTERNAL" && (
                          <button
                            onClick={() => handleUpdateStatus(task, "SEDANG_DIKERJAKAN")}
                            className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold transition flex items-center shadow-xs"
                          >
                            <Wrench className="w-3 h-3 mr-1" />
                            Mulai Pengerjaan Fisik
                          </button>
                        )}

                        <button
                          onClick={() => {
                            setSelectedTask(task);
                            setModalAction("SELESAI");
                            setTechNoteInput(task.technicianNotes || "");
                          }}
                          className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold transition flex items-center shadow-xs"
                        >
                          <CheckCircle2 className="w-3 h-3 mr-1" />
                          Selesaikan Tugas (Normal)
                        </button>

                        {task.sourceType === "INTERNAL" && (
                          <button
                            onClick={() => {
                              setSelectedTask(task);
                              setModalAction("KENDALA");
                              setTechNoteInput(task.technicianNotes || "");
                            }}
                            className="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-rose-50 text-slate-700 hover:text-rose-700 border border-slate-200 font-semibold transition"
                          >
                            <AlertTriangle className="w-3 h-3 mr-1 inline text-rose-500" />
                            Terkendala
                          </button>
                        )}
                      </>
                    )}

                    {task.status === "SELESAI" && (
                      <span className="text-xs text-emerald-700 font-bold flex items-center">
                        <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                        Pekerjaan Telah Tuntas Diselesaikan
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </main>

      {/* Modal Input Catatan Teknisi & Penyelesaian Tugas */}
      {selectedTask && modalAction && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in">
            <div className="flex items-center space-x-2 text-slate-900 font-bold text-base mb-1">
              <Wrench className="w-5 h-5 text-emerald-600" />
              <span>
                {modalAction === "SELESAI" ? "Tuntaskan Laporan Penugasan" : "Catat Kendala Lapangan"}
              </span>
            </div>
            <p className="text-xs text-slate-500 mb-3">
              Tiket: <strong className="font-mono">{selectedTask.ticketNumber}</strong> - {selectedTask.locationOrRoom}
            </p>

            <div className="mb-4">
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                {modalAction === "SELESAI"
                  ? "Catatan Respon / Hasil Tindak Lanjut Penanganan (Wajib):"
                  : "Deskripsi Kendala / Sparepart yang Diperlukan (Wajib):"}
              </label>
              <textarea
                rows={4}
                value={techNoteInput}
                onChange={(e) => setTechNoteInput(e.target.value)}
                placeholder={
                  modalAction === "SELESAI"
                    ? "Contoh: Kerusakan telah diperiksa dan diperbaiki tuntas, sistem/alat kini kembali berfungsi normal 100%."
                    : "Contoh: Diperlukan penggantian modul adaptor power supply baru, menunggu kedatangan stok dari gudang."
                }
                className="w-full text-xs sm:text-sm p-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
              />
            </div>

            <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => {
                  setSelectedTask(null);
                  setModalAction(null);
                }}
                disabled={isSubmitting}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => {
                  if (!techNoteInput.trim()) {
                    alert("Mohon isi catatan sebelum menyimpan.");
                    return;
                  }
                  handleUpdateStatus(
                    selectedTask,
                    modalAction === "SELESAI" ? "SELESAI" : "TERKENDALA",
                    techNoteInput.trim()
                  );
                }}
                disabled={isSubmitting}
                className={`px-4 py-2 rounded-xl text-xs font-bold text-white transition shadow-xs flex items-center ${
                  modalAction === "SELESAI"
                    ? "bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/20"
                    : "bg-rose-600 hover:bg-rose-700"
                }`}
              >
                {isSubmitting ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />
                ) : (
                  <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" />
                )}
                {modalAction === "SELESAI" ? "Simpan & Tutup Tiket Tuntas" : "Simpan Status Terkendala"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
