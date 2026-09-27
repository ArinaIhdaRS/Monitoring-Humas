"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Radio,
  BarChart3,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Flame,
  Search,
  Filter,
  RefreshCw,
  LogOut,
  Calendar,
  FileText,
  User,
  ShieldAlert,
  ChevronRight,
  TrendingUp,
  Download,
  Building2,
  Phone,
  Eye,
  CheckCheck,
  Send,
  Loader2,
  Activity,
  Layers,
  ArrowUpRight,
  Sparkles,
} from "lucide-react";

interface CategoryStat {
  name: string;
  code: string;
  color: string;
  bgLight: string;
  textColor: string;
  description?: string;
  categories?: string[];
  total: number;
  baru: number;
  proses: number;
  selesai: number;
  ditolak: number;
  percentage: number;
}

interface SlaData {
  targetResponseHours: number;
  targetResolveHours: number;
  avgResponseHours: number;
  avgResolveHours: number;
  responseComplianceRate: number;
  resolveComplianceRate: number;
  overallComplianceRate: number;
  departmentBreakdown: Record<string, { total: number; resolved: number; onTime: number }>;
}

interface UnhandledReport {
  id: string;
  ticketNumber: string;
  title: string;
  content: string;
  category: string;
  categoryName: string;
  categoryColor: string;
  categoryBgLight: string;
  urgency: string;
  status: string;
  isAnonymous: boolean;
  reporterName?: string;
  reporterContact?: string;
  createdAt: string;
  elapsedHours: number;
  isOverdue: boolean;
  dispositionTo?: string;
  dispositionNote?: string;
  supervisorWarning?: string | null;
  supervisorWarningAt?: string | null;
  supervisorWarningBy?: string | null;
  supervisorWarningWaSent?: boolean;
}

interface HistoryReport {
  id: string;
  ticketNumber: string;
  title: string;
  content: string;
  category: string;
  categoryName: string;
  categoryColor: string;
  categoryBgLight: string;
  urgency: string;
  status: string;
  isAnonymous: boolean;
  reporterName: string;
  reporterContact: string;
  createdAt: string;
  categoryChangeNote?: string;
  categoryChangedAt?: string;
  categoryChangedBy?: string;
  dispositionTo?: string;
  dispositionNote?: string;
  dispositionTargetPhone?: string;
  dispositionedAt?: string;
  responseNote?: string;
  respondedAt?: string;
  supervisorWarning?: string | null;
  supervisorWarningAt?: string | null;
  supervisorWarningBy?: string | null;
  supervisorWarningWaSent?: boolean;
  waBlast?: {
    status: string;
    recipientPhone: string;
    sentAt: string;
  } | null;
}

export default function ManajemenDashboardPage() {
  const { data: session, status: sessionStatus } = useSession();
  const router = useRouter();

  const [isLoading, setIsLoading] = useState(true);
  const [activeView, setActiveView] = useState<"REKAP_WARNA" | "SLA" | "BELUM_DITANGANI" | "HISTORY">("REKAP_WARNA");

  const [summary, setSummary] = useState({
    totalReports: 0,
    totalCompleted: 0,
    totalPending: 0,
    totalCritical: 0,
    unhandledCount: 0,
  });

  const [categoryStats, setCategoryStats] = useState<CategoryStat[]>([]);
  const [sla, setSla] = useState<SlaData>({
    targetResponseHours: 24,
    targetResolveHours: 72,
    avgResponseHours: 2.5,
    avgResolveHours: 18.2,
    responseComplianceRate: 97.5,
    resolveComplianceRate: 94.8,
    overallComplianceRate: 96.2,
    departmentBreakdown: {},
  });
  const [unhandledReports, setUnhandledReports] = useState<UnhandledReport[]>([]);
  const [historyReports, setHistoryReports] = useState<HistoryReport[]>([]);

  // Filter History
  const [historySearch, setHistorySearch] = useState("");
  const [historyCategoryFilter, setHistoryCategoryFilter] = useState("ALL");
  const [historyStatusFilter, setHistoryStatusFilter] = useState("ALL");

  // Modal Detail Linimasa History
  const [selectedReportDetail, setSelectedReportDetail] = useState<HistoryReport | null>(null);

  // Modal Trigger Instruksi Atasan
  const [triggerWarningReport, setTriggerWarningReport] = useState<UnhandledReport | null>(null);
  const [triggerWarningInstruction, setTriggerWarningInstruction] = useState("");
  const [isSubmittingTriggerWarning, setIsSubmittingTriggerWarning] = useState(false);

  // Modal Trigger WhatsApp ke Admin Humas
  const [triggerWaReport, setTriggerWaReport] = useState<UnhandledReport | null>(null);
  const [triggerWaRecipient, setTriggerWaRecipient] = useState("");
  const [triggerWaMessage, setTriggerWaMessage] = useState("");
  const [isSubmittingTriggerWa, setIsSubmittingTriggerWa] = useState(false);

  // Toast Notification
  const [toastMessage, setToastMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

  const showToast = (text: string, type: "success" | "error" = "success") => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Set Document Title
  useEffect(() => {
    document.title = "Dashboard Eksekutif Manajemen - HumasMonitor";
  }, []);

  useEffect(() => {
    if (sessionStatus === "unauthenticated") {
      router.push("/login?callbackUrl=/manajemen");
    } else if (sessionStatus === "authenticated") {
      fetchStats();
    }
  }, [sessionStatus, router]);

  const fetchStats = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/management/stats");
      if (res.ok) {
        const data = await res.json();
        setSummary(data.summary || {});
        setCategoryStats(data.categoryStats || []);
        setSla(data.sla || {});
        setUnhandledReports(data.unhandledReports || []);
        setHistoryReports(data.historyReports || []);
      }
    } catch (err) {
      console.error("Gagal memuat statistik manajemen:", err);
    } finally {
      setIsLoading(false);
    }
  };

  // Filter History Data
  const filteredHistory = useMemo(() => {
    return historyReports.filter((item) => {
      const matchesSearch =
        item.ticketNumber.toLowerCase().includes(historySearch.toLowerCase()) ||
        item.title.toLowerCase().includes(historySearch.toLowerCase()) ||
        item.content.toLowerCase().includes(historySearch.toLowerCase()) ||
        item.reporterName.toLowerCase().includes(historySearch.toLowerCase()) ||
        (item.dispositionTo || "").toLowerCase().includes(historySearch.toLowerCase());

      const matchesCat = historyCategoryFilter === "ALL" || item.category === historyCategoryFilter;
      const matchesStatus = historyStatusFilter === "ALL" || item.status === historyStatusFilter;

      return matchesSearch && matchesCat && matchesStatus;
    });
  }, [historyReports, historySearch, historyCategoryFilter, historyStatusFilter]);

  // Export CSV Helper
  const handleExportCsv = () => {
    const headers = ["No Tiket", "Tanggal", "Kategori", "Urgensi", "Status", "Judul", "Pelapor", "Disposisi Ke", "Respon"];
    const rows = filteredHistory.map((r) => [
      r.ticketNumber,
      new Date(r.createdAt).toISOString().split("T")[0],
      r.categoryName,
      r.urgency,
      r.status,
      `"${r.title.replace(/"/g, '""')}"`,
      r.reporterName,
      `"${(r.dispositionTo || "-").replace(/"/g, '""')}"`,
      `"${(r.responseNote || "-").replace(/"/g, '""')}"`,
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Rekap_Aduan_Manajemen_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Handlers untuk Trigger Manajemen
  const handleOpenTriggerWarning = (report: UnhandledReport) => {
    setTriggerWarningReport(report);
    setTriggerWarningInstruction(
      report.supervisorWarning ||
        `Mohon Admin Humas segera prioritaskan dan disposisikan laporan tiket ${report.ticketNumber} ke bidang teknis terkait untuk penanganan secepatnya.`
    );
  };

  const handleSubmitTriggerWarning = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!triggerWarningReport || !triggerWarningInstruction.trim()) return;
    setIsSubmittingTriggerWarning(true);
    try {
      const res = await fetch(`/api/reports/${triggerWarningReport.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "TRIGGER_WARNING",
          supervisorWarning: triggerWarningInstruction.trim(),
        }),
      });

      if (res.ok) {
        showToast(
          "Instruksi Atasan berhasil diterbitkan! Keterangan Atensi Atasan aktif di Dashboard Humas dan tercatat dalam audit trail."
        );
        // Optimistic update
        setUnhandledReports((prev) =>
          prev.map((r) =>
            r.id === triggerWarningReport.id
              ? {
                  ...r,
                  supervisorWarning: triggerWarningInstruction.trim(),
                  supervisorWarningAt: new Date().toISOString(),
                  supervisorWarningBy: session?.user?.name || "Pimpinan Manajemen",
                }
              : r
          )
        );
        setTriggerWarningReport(null);
        fetchStats();
      } else {
        const data = await res.json();
        showToast(data.error || "Gagal menerbitkan instruksi atasan", "error");
      }
    } catch {
      showToast("Terjadi kesalahan sistem saat mengirim instruksi", "error");
    } finally {
      setIsSubmittingTriggerWarning(false);
    }
  };

  const handleOpenTriggerWa = (report: UnhandledReport) => {
    setTriggerWaReport(report);
    setTriggerWaRecipient("081234567890");
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    setTriggerWaMessage(
      `*PERINGATAN MANAJEMEN - PERLU ATENSI SEGERA*\n\n` +
      `Nomor Tiket: ${report.ticketNumber}\n` +
      `Urgensi: ${report.urgency}\n` +
      `Judul: ${report.title}\n` +
      `Lama Tertunda: ${report.elapsedHours} Jam\n\n` +
      `Instruksi Pimpinan:\n${report.supervisorWarning || "Mohon Admin Humas segera memprioritaskan penanganan dan disposisi laporan ini."}\n\n` +
      `Tautan Akses Humas:\n${origin}/dashboard`
    );
  };

  const handleSubmitTriggerWa = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!triggerWaReport || !triggerWaRecipient.trim()) return;
    setIsSubmittingTriggerWa(true);
    try {
      // 1. Kirim WA via wa-blast
      const waRes = await fetch("/api/wa-blast", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ticketNumber: triggerWaReport.ticketNumber,
          department: "Admin Humas",
          recipientName: "Admin Humas",
          recipientPhone: triggerWaRecipient.trim(),
          message: triggerWaMessage.trim(),
          urgency: triggerWaReport.urgency,
          reportTitle: triggerWaReport.title,
        }),
      });

      // 2. Tandai supervisorWarningWaSent di database
      await fetch(`/api/reports/${triggerWaReport.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          supervisorWarningWaSent: true,
        }),
      });

      // Optimistic update
      setUnhandledReports((prev) =>
        prev.map((r) =>
          r.id === triggerWaReport.id ? { ...r, supervisorWarningWaSent: true } : r
        )
      );

      showToast("Peringatan WhatsApp berhasil dikirim ke Admin Humas!");
      setTriggerWaReport(null);
      fetchStats();
    } catch {
      showToast("Gagal mengirim WhatsApp ke Admin Humas.", "error");
    } finally {
      setIsSubmittingTriggerWa(false);
    }
  };

  const userRole = session?.user?.role;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col text-slate-800">
      <title>Dashboard Eksekutif Manajemen - HumasMonitor</title>
      {/* Toast Notification */}
      {toastMessage && (
        <div
          className={`fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-3 rounded-xl shadow-xl text-xs font-bold transition animate-in slide-in-from-bottom-2 ${
            toastMessage.type === "success"
              ? "bg-slate-900 text-emerald-400 border border-emerald-500/30"
              : "bg-rose-900 text-rose-200 border border-rose-500/30"
          }`}
        >
          <span>{toastMessage.type === "success" ? "✓" : "⚠️"}</span>
          <span>{toastMessage.text}</span>
        </div>
      )}

      {/* Top Navbar Manajemen */}
      <header className="bg-white border-b border-indigo-100 sticky top-0 z-40 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Link href="/" className="flex items-center space-x-2.5">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/LOGO DKH.png"
                alt="Logo Humas"
                className="w-9 h-9 object-contain rounded-xl shadow-xs border border-indigo-100 bg-white p-0.5"
              />
              <span className="text-lg font-black text-slate-900 tracking-tight">HumasMonitor</span>
            </Link>
            <span className="hidden sm:inline-block text-xs px-2.5 py-0.5 bg-indigo-50 text-indigo-700 font-bold rounded-full border border-indigo-200">
              Dashboard Eksekutif Manajemen
            </span>
          </div>

          <div className="flex items-center space-x-3">
            {/* Tautan ke Meja Kerja Humas jika berhak */}
            {(userRole === "SUPERADMIN" || userRole === "ADMIN" || userRole === "HUMAS") && (
              <Link
                href="/dashboard"
                className="hidden md:inline-flex items-center text-xs font-semibold text-indigo-700 hover:text-indigo-900 px-3 py-1.5 rounded-lg hover:bg-indigo-50 transition border border-indigo-200"
              >
                Pusat Komando Humas
                <ArrowUpRight className="w-3.5 h-3.5 ml-1" />
              </Link>
            )}

            <div className="flex items-center space-x-2.5 text-right pl-2 border-l border-slate-200">
              <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-xs border border-indigo-200">
                <User className="w-4 h-4" />
              </div>
              <div className="hidden sm:block">
                <p className="text-xs font-bold text-slate-800">{session?.user?.name || "Pimpinan"}</p>
                <p className="text-[10px] text-indigo-600 font-semibold">{userRole} • {session?.user?.email}</p>
              </div>
            </div>

            <button
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="inline-flex items-center px-3 py-1.5 text-xs font-semibold rounded-lg text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 transition"
              title="Keluar"
            >
              <LogOut className="w-3.5 h-3.5 mr-1" />
              Keluar
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Executive Banner */}
        <div className="bg-white p-6 rounded-2xl border border-indigo-100 shadow-sm">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200 mb-1.5">
            <Activity className="w-3.5 h-3.5" />
            Executive Oversight & SLA Intelligence
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Dashboard Analitik & Monitoring Pimpinan
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5 max-w-3xl">
            Pantau rekap aduan berdasarkan warna kategori, kepatuhan Service Level Agreement (SLA), penanganan tertunda, dan riwayat laporan lengkap.
          </p>
        </div>

        {/* 4 Kartu Metrik Utama */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Aduan Masuk</span>
              <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <FileText className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-black text-slate-900 mt-2">{summary.totalReports}</div>
            <p className="text-[11px] text-slate-400 mt-1">Akumulasi Laporan</p>
          </div>

          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-teal-700 uppercase tracking-wider">Tuntas Diselesaikan</span>
              <div className="w-8 h-8 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center">
                <CheckCircle2 className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-black text-teal-900 mt-2">{summary.totalCompleted}</div>
            <p className="text-[11px] text-teal-600 mt-1">
              {summary.totalReports > 0 ? Math.round((summary.totalCompleted / summary.totalReports) * 100) : 0}% laporan terselesaikan
            </p>
          </div>

          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-indigo-700 uppercase tracking-wider">Tingkat Kepatuhan SLA</span>
              <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <TrendingUp className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-black text-indigo-900 mt-2">{sla.overallComplianceRate}%</div>
            <p className="text-[11px] text-indigo-600 mt-1">Target respons & penyelesaian on-time</p>
          </div>

          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-rose-200 shadow-xs bg-gradient-to-br from-white to-rose-50/30">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-rose-700 uppercase tracking-wider">Belum Ditangani / Overdue</span>
              <div className="w-8 h-8 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center">
                <ShieldAlert className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-black text-rose-950 mt-2">{summary.unhandledCount}</div>
            <p className="text-[11px] text-rose-600 mt-1">Memerlukan atensi & eskalasi pimpinan</p>
          </div>
        </div>

        {/* Tab Navigation Memanjang Relative di Bawah Rekap */}
        <div className="w-full bg-white p-2 rounded-2xl border border-indigo-100 shadow-xs flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-1.5 text-xs font-bold">
            <button
              onClick={() => setActiveView("REKAP_WARNA")}
              className={`px-4 py-2.5 rounded-xl transition inline-flex items-center ${
                activeView === "REKAP_WARNA"
                  ? "bg-indigo-600 text-white shadow-xs"
                  : "text-slate-600 hover:text-slate-900 hover:bg-indigo-50"
              }`}
            >
              <Layers className="w-4 h-4 mr-2" />
              Rekap Kategori Warna
            </button>

            <button
              onClick={() => setActiveView("SLA")}
              className={`px-4 py-2.5 rounded-xl transition inline-flex items-center ${
                activeView === "SLA"
                  ? "bg-indigo-600 text-white shadow-xs"
                  : "text-slate-600 hover:text-slate-900 hover:bg-indigo-50"
              }`}
            >
              <Clock className="w-4 h-4 mr-2" />
              Rekap SLA Layanan
            </button>

            <button
              onClick={() => setActiveView("BELUM_DITANGANI")}
              className={`px-4 py-2.5 rounded-xl transition relative inline-flex items-center ${
                activeView === "BELUM_DITANGANI"
                  ? "bg-rose-600 text-white shadow-xs"
                  : "text-slate-600 hover:text-rose-700 hover:bg-rose-50"
              }`}
            >
              <ShieldAlert className="w-4 h-4 mr-2" />
              Belum Ditangani
              {summary.unhandledCount > 0 && (
                <span className="ml-2 px-2 py-0.5 bg-amber-400 text-amber-950 rounded-full text-[10px] font-black">
                  {summary.unhandledCount}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveView("HISTORY")}
              className={`px-4 py-2.5 rounded-xl transition inline-flex items-center ${
                activeView === "HISTORY"
                  ? "bg-indigo-600 text-white shadow-xs"
                  : "text-slate-600 hover:text-slate-900 hover:bg-indigo-50"
              }`}
            >
              <FileText className="w-4 h-4 mr-2" />
              History Pengaduan
            </button>
          </div>

          <button
            onClick={fetchStats}
            className="p-2.5 rounded-xl text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 transition border border-slate-200"
            title="Perbarui Data"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>

        {/* ========================================================= */}
        {/* VIEW 1: REKAP ADUAN BERDASARKAN KATEGORI WARNA           */}
        {/* ========================================================= */}
        {activeView === "REKAP_WARNA" && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
                <div>
                  <h3 className="text-lg font-black text-slate-900">
                    Rekap Aduan Berdasarkan Warna Kategori Urgensi
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Dikelompokkan berdasarkan warna: Merah (Kritis), Kuning (Urgen), Hijau (Minor), dan Biru (Informasi).
                  </p>
                </div>
                <div className="text-xs font-bold text-slate-500 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200">
                  Total Grup Warna: <b>{categoryStats.length}</b>
                </div>
              </div>

              {/* Grid Kartu Kategori Warna */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {categoryStats.map((cat) => (
                  <div
                    key={cat.code}
                    className="p-4 rounded-xl border border-slate-200 hover:border-slate-300 hover:shadow-xs transition bg-white relative overflow-hidden group"
                  >
                    {/* Top Color Banner Strip */}
                    <div className="h-1.5 absolute top-0 inset-x-0" style={{ backgroundColor: cat.color }} />

                    <div className="flex items-start justify-between gap-2 mt-1">
                      <div className="flex items-center gap-2">
                        <span
                          className="w-3 h-3 rounded-full shrink-0 shadow-xs"
                          style={{ backgroundColor: cat.color }}
                        />
                        <h4 className="font-bold text-slate-900 text-sm">{cat.name}</h4>
                      </div>
                      <span
                        className="px-2 py-0.5 rounded text-[10px] font-black text-white shrink-0"
                        style={{ backgroundColor: cat.color }}
                      >
                        {cat.percentage}%
                      </span>
                    </div>

                    {cat.categories && cat.categories.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {cat.categories.map((cName: string, i: number) => (
                          <span
                            key={i}
                            className="inline-block text-[10px] font-semibold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700"
                          >
                            {cName}
                          </span>
                        ))}
                      </div>
                    )}

                    <p className="text-xs text-slate-500 mt-1 line-clamp-2 min-h-[32px]">
                      {cat.description || "Kategori pengaduan resmi terdaftar"}
                    </p>

                    {/* Progress Bar Volume */}
                    <div className="mt-3.5">
                      <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{ width: `${Math.max(5, cat.percentage)}%`, backgroundColor: cat.color }}
                        />
                      </div>
                    </div>

                    {/* Breakdown Sub-Status */}
                    <div className="mt-3 pt-3 border-t border-slate-100 grid grid-cols-3 gap-2 text-center text-[11px]">
                      <div className="bg-slate-50 p-1.5 rounded-lg">
                        <span className="text-slate-400 block text-[9px] uppercase font-bold">Baru</span>
                        <span className="font-black text-amber-700">{cat.baru}</span>
                      </div>
                      <div className="bg-slate-50 p-1.5 rounded-lg">
                        <span className="text-slate-400 block text-[9px] uppercase font-bold">Diproses</span>
                        <span className="font-black text-blue-700">{cat.proses}</span>
                      </div>
                      <div className="bg-slate-50 p-1.5 rounded-lg">
                        <span className="text-slate-400 block text-[9px] uppercase font-bold">Selesai</span>
                        <span className="font-black text-emerald-700">{cat.selesai}</span>
                      </div>
                    </div>

                    <div className="mt-2.5 text-right">
                      <span className="text-[11px] font-bold text-slate-600">
                        Total: <b>{cat.total}</b> Aduan
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* VIEW 2: REKAP SLA PENGADUAN (SERVICE LEVEL AGREEMENT)     */}
        {/* ========================================================= */}
        {activeView === "SLA" && (
          <div className="space-y-6 animate-in fade-in duration-200">
            {/* Indikator Target SLA */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white p-5 rounded-2xl border border-indigo-100 shadow-xs">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-indigo-900 uppercase">SLA Respons Disposisi</span>
                  <Clock className="w-4 h-4 text-indigo-600" />
                </div>
                <div className="mt-3 flex items-baseline gap-2">
                  <span className="text-3xl font-black text-indigo-950">{sla.avgResponseHours}</span>
                  <span className="text-xs font-bold text-slate-500">Jam (Rata-rata)</span>
                </div>
                <div className="mt-2 text-[11px] text-slate-500">
                  Target Standar: <b>&lt; 24 Jam</b> • Kepatuhan: <b>{sla.responseComplianceRate}%</b>
                </div>
                <div className="mt-2.5 w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-indigo-600 h-full rounded-full"
                    style={{ width: `${sla.responseComplianceRate}%` }}
                  />
                </div>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-teal-100 shadow-xs">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-teal-900 uppercase">SLA Tuntas Penyelesaian</span>
                  <CheckCheck className="w-4 h-4 text-teal-600" />
                </div>
                <div className="mt-3 flex items-baseline gap-2">
                  <span className="text-3xl font-black text-teal-950">{sla.avgResolveHours}</span>
                  <span className="text-xs font-bold text-slate-500">Jam (Rata-rata)</span>
                </div>
                <div className="mt-2 text-[11px] text-slate-500">
                  Target Standar: <b>&lt; 72 Jam</b> (3 Hari) • Kepatuhan: <b>{sla.resolveComplianceRate}%</b>
                </div>
                <div className="mt-2.5 w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-teal-600 h-full rounded-full"
                    style={{ width: `${sla.resolveComplianceRate}%` }}
                  />
                </div>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-emerald-100 shadow-xs">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-emerald-900 uppercase">Indeks Mutu Pelayanan</span>
                  <Sparkles className="w-4 h-4 text-emerald-600" />
                </div>
                <div className="mt-3 flex items-baseline gap-2">
                  <span className="text-3xl font-black text-emerald-950">{sla.overallComplianceRate}%</span>
                  <span className="text-xs font-bold text-emerald-700">Skor Kepatuhan</span>
                </div>
                <div className="mt-2 text-[11px] text-slate-500">
                  Status Standar Layanan: <b className="text-emerald-700">SANGAT PRIMA</b>
                </div>
                <div className="mt-2.5 w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-emerald-500 h-full rounded-full"
                    style={{ width: `${sla.overallComplianceRate}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Tabel Kinerja SLA per Bidang / Divisi Kerja */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6">
              <h3 className="text-lg font-black text-slate-900 mb-1">
                Kinerja Kepatuhan SLA per Bidang Penugasan
              </h3>
              <p className="text-xs text-slate-500 mb-5">
                Evaluasi kecepatan tindak lanjut dan penyelesaian aduan oleh masing-masing unit/bidang instansi.
              </p>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs sm:text-sm border-collapse">
                  <thead>
                    <tr className="bg-slate-50 text-slate-700 uppercase text-[11px] font-bold border-b border-slate-200">
                      <th className="py-3 px-4">Nama Bidang / Divisi Pelaksana</th>
                      <th className="py-3 px-4 text-center">Total Disposisi</th>
                      <th className="py-3 px-4 text-center">Tuntas Tepat Waktu</th>
                      <th className="py-3 px-4 text-center">% Kepatuhan SLA</th>
                      <th className="py-3 px-4 text-right">Status Kinerja</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {Object.entries(sla.departmentBreakdown).length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-8 text-center text-slate-500">
                          Belum ada aduan yang selesai untuk evaluasi SLA per bidang.
                        </td>
                      </tr>
                    ) : (
                      Object.entries(sla.departmentBreakdown).map(([deptName, data]) => {
                        const compliancePct =
                          data.total > 0 ? Math.round((data.onTime / data.total) * 100) : 100;
                        return (
                          <tr key={deptName} className="hover:bg-slate-50 transition">
                            <td className="py-3.5 px-4 font-bold text-slate-900 flex items-center gap-2">
                              <Building2 className="w-4 h-4 text-slate-400" />
                              {deptName}
                            </td>
                            <td className="py-3.5 px-4 text-center font-semibold">{data.total}</td>
                            <td className="py-3.5 px-4 text-center font-semibold text-emerald-700">
                              {data.onTime}
                            </td>
                            <td className="py-3.5 px-4 text-center font-bold">
                              <span
                                className={`px-2.5 py-0.5 rounded-full text-xs ${
                                  compliancePct >= 90
                                    ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                                    : compliancePct >= 75
                                    ? "bg-amber-50 text-amber-800 border border-amber-200"
                                    : "bg-rose-50 text-rose-800 border border-rose-200"
                                }`}
                              >
                                {compliancePct}%
                              </span>
                            </td>
                            <td className="py-3.5 px-4 text-right">
                              {compliancePct >= 90 ? (
                                <span className="inline-flex items-center text-xs font-bold text-emerald-700">
                                  <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Prima
                                </span>
                              ) : compliancePct >= 75 ? (
                                <span className="inline-flex items-center text-xs font-bold text-amber-700">
                                  <Clock className="w-3.5 h-3.5 mr-1" /> Waspada
                                </span>
                              ) : (
                                <span className="inline-flex items-center text-xs font-bold text-rose-700">
                                  <AlertTriangle className="w-3.5 h-3.5 mr-1" /> Perlu Eskalasi
                                </span>
                              )}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* VIEW 3: PENGADUAN YANG BELUM DITANGANI / OVERDUE         */}
        {/* ========================================================= */}
        {activeView === "BELUM_DITANGANI" && (
          <div className="space-y-4 animate-in fade-in duration-200">
            <div className="bg-white p-6 rounded-2xl border border-rose-200 shadow-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                <div>
                  <h3 className="text-lg font-black text-rose-950 flex items-center gap-2">
                    <ShieldAlert className="w-5 h-5 text-rose-600" />
                    Daftar Pengaduan yang Belum Ditangani / Overdue SLA
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Laporan berstatus BARU yang belum diverifikasi atau belum didisposisikan, diurutkan berdasarkan skala urgensi tertinggi.
                  </p>
                </div>
                <span className="text-xs font-bold px-3 py-1.5 rounded-lg bg-rose-50 text-rose-700 border border-rose-200 self-start sm:self-auto">
                  {unhandledReports.length} Laporan Memerlukan Tindakan
                </span>
              </div>

              {unhandledReports.length === 0 ? (
                <div className="py-12 text-center text-slate-500 bg-slate-50 rounded-xl border border-slate-200">
                  <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto mb-2" />
                  <p className="font-bold text-slate-800">Seluruh Pengaduan Telah Ditangani!</p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Tidak ada laporan berstatus baru atau melebihi batas waktu SLA saat ini.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {unhandledReports.map((item) => (
                    <div
                      key={item.id}
                      className={`p-4 rounded-xl border transition ${
                        item.isOverdue
                          ? "bg-rose-50/50 border-rose-300 shadow-xs"
                          : "bg-white border-slate-200 hover:border-slate-300"
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-xs bg-slate-100 text-slate-800 px-2 py-0.5 rounded border border-slate-200">
                            {item.ticketNumber}
                          </span>
                          <span
                            className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold text-white shadow-xs"
                            style={{ backgroundColor: item.categoryColor }}
                          >
                            ● {item.categoryName}
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-black ${
                              item.urgency === "KRITIS"
                                ? "bg-rose-600 text-white"
                                : item.urgency === "TINGGI"
                                ? "bg-amber-500 text-white"
                                : "bg-sky-100 text-sky-800"
                            }`}
                          >
                            {item.urgency}
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          {item.isOverdue && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-black px-2 py-0.5 rounded bg-rose-600 text-white animate-pulse">
                              <AlertTriangle className="w-3 h-3" /> OVERDUE SLA ({item.elapsedHours} Jam)
                            </span>
                          )}
                          <span className="text-[11px] text-slate-400">
                            Masuk: {new Date(item.createdAt).toLocaleString("id-ID")}
                          </span>
                        </div>
                      </div>

                      <h4 className="font-bold text-slate-900 text-sm mt-2">{item.title}</h4>
                      <p className="text-xs text-slate-600 mt-1 line-clamp-2">{item.content}</p>

                      {/* Banner Status Atensi Atasan Jika Sudah Pernah Diterbitkan */}
                      {item.supervisorWarning && (
                        <div className="mt-2.5 p-2.5 rounded-xl bg-gradient-to-r from-rose-50 to-amber-50 border border-rose-200 text-rose-950 text-xs">
                          <div className="flex flex-wrap items-center justify-between gap-1 font-bold text-rose-800">
                            <span className="flex items-center gap-1.5">
                              <AlertTriangle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                              ⚠️ Atensi Atasan Telah Aktif di Dashboard Humas
                            </span>
                            {item.supervisorWarningBy && (
                              <span className="text-[10px] text-slate-500 font-normal">
                                oleh {item.supervisorWarningBy}
                              </span>
                            )}
                          </div>
                          <p className="mt-1 italic text-rose-900 font-medium">
                            &ldquo;{item.supervisorWarning}&rdquo;
                          </p>
                          <div className="mt-1.5 flex flex-wrap items-center justify-between gap-1 text-[10px] text-slate-500 border-t border-rose-100 pt-1">
                            <span>
                              Waktu Instruksi:{" "}
                              {item.supervisorWarningAt
                                ? new Date(item.supervisorWarningAt).toLocaleString("id-ID")
                                : "-"}
                            </span>
                            {item.supervisorWarningWaSent ? (
                              <span className="font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">
                                ✓ Notifikasi WA Terkirim ke Admin Humas
                              </span>
                            ) : (
                              <span className="text-amber-700 font-semibold">
                                ⏳ Belum dikirim via WhatsApp
                              </span>
                            )}
                          </div>
                        </div>
                      )}

                      <div className="mt-3 pt-2.5 border-t border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs text-slate-500">
                        <div>
                          Pelapor: <b>{item.isAnonymous ? "Anonim" : item.reporterName || "Masyarakat"}</b>
                          {item.reporterContact && ` (${item.reporterContact})`}
                        </div>

                        {/* Dua Tombol Terpisah Sesuai Arahan */}
                        <div className="flex items-center gap-2 flex-wrap">
                          {/* 1. Tombol Trigger Instruksi Atasan */}
                          <button
                            type="button"
                            onClick={() => handleOpenTriggerWarning(item)}
                            className="inline-flex items-center font-bold text-rose-700 hover:text-rose-900 bg-rose-50 hover:bg-rose-100 px-3 py-1.5 rounded-xl border border-rose-300 transition text-xs shadow-xs"
                          >
                            <AlertTriangle className="w-3.5 h-3.5 mr-1 text-rose-600" />
                            {item.supervisorWarning ? "Perbarui Instruksi Atasan" : "Trigger Instruksi Atasan"}
                          </button>

                          {/* 2. Tombol Trigger WhatsApp ke Admin Humas */}
                          <button
                            type="button"
                            onClick={() => handleOpenTriggerWa(item)}
                            className="inline-flex items-center font-bold text-emerald-800 hover:text-emerald-950 bg-emerald-50 hover:bg-emerald-100 px-3 py-1.5 rounded-xl border border-emerald-300 transition text-xs shadow-xs"
                          >
                            <Phone className="w-3.5 h-3.5 mr-1 text-emerald-600" />
                            Trigger WhatsApp ke Admin Humas
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* VIEW 4: HISTORY PENGADUAN & AUDIT TRAIL LENGKAP          */}
        {/* ========================================================= */}
        {activeView === "HISTORY" && (
          <div className="space-y-4 animate-in fade-in duration-200">
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-5">
                <div>
                  <h3 className="text-lg font-black text-slate-900">
                    Histori & Rekam Jejak Pengaduan
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Audit trail lengkap setiap aduan masuk, perubahan kategori, disposisi bidang, trigger WA Blast, dan respon akhir.
                  </p>
                </div>

                <button
                  onClick={handleExportCsv}
                  className="inline-flex items-center px-3.5 py-2 text-xs font-bold rounded-xl bg-slate-900 text-white hover:bg-slate-800 transition shadow-xs self-start md:self-auto"
                >
                  <Download className="w-3.5 h-3.5 mr-1.5" />
                  Ekspor Laporan (CSV)
                </button>
              </div>

              {/* Filter Bar */}
              <div className="flex flex-col md:flex-row gap-2.5 mb-4">
                <div className="relative flex-1">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-400" />
                  <input
                    type="text"
                    value={historySearch}
                    onChange={(e) => setHistorySearch(e.target.value)}
                    placeholder="Cari nomor tiket, judul, pelapor, atau bidang..."
                    className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <select
                  value={historyCategoryFilter}
                  onChange={(e) => setHistoryCategoryFilter(e.target.value)}
                  className="text-xs border border-slate-300 rounded-xl px-3 py-2 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                >
                  <option value="ALL">Semua Kategori</option>
                  {categoryStats.map((c) => (
                    <option key={c.code} value={c.code}>
                      {c.name}
                    </option>
                  ))}
                </select>

                <select
                  value={historyStatusFilter}
                  onChange={(e) => setHistoryStatusFilter(e.target.value)}
                  className="text-xs border border-slate-300 rounded-xl px-3 py-2 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                >
                  <option value="ALL">Semua Status</option>
                  <option value="BARU">Baru</option>
                  <option value="DIDISPOSISIKAN">Didisposisikan</option>
                  <option value="SEDANG_DIPROSES">Sedang Diproses</option>
                  <option value="SELESAI">Selesai / Tuntas</option>
                  <option value="DITOLAK">Ditolak</option>
                </select>
              </div>

              {/* Tabel History */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50 text-slate-700 uppercase text-[10px] font-bold border-b border-slate-200">
                      <th className="py-3 px-3">No. Tiket & Tanggal</th>
                      <th className="py-3 px-3">Kategori Warna</th>
                      <th className="py-3 px-3">Judul & Isi Laporan</th>
                      <th className="py-3 px-3">Pelapor</th>
                      <th className="py-3 px-3">Status</th>
                      <th className="py-3 px-3">Disposisi & WA Blast</th>
                      <th className="py-3 px-3 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredHistory.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-8 text-center text-slate-400">
                          Tidak ditemukan data riwayat pengaduan.
                        </td>
                      </tr>
                    ) : (
                      filteredHistory.map((item) => (
                        <tr key={item.id} className="hover:bg-slate-50 transition">
                          <td className="py-3 px-3 whitespace-nowrap">
                            <span className="font-mono font-bold text-slate-800 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200 block w-fit">
                              {item.ticketNumber}
                            </span>
                            <span className="text-[10px] text-slate-400 mt-1 block">
                              {new Date(item.createdAt).toLocaleDateString("id-ID", {
                                day: "numeric",
                                month: "short",
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </span>
                          </td>

                          <td className="py-3 px-3 whitespace-nowrap">
                            <span
                              className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold text-white shadow-xs"
                              style={{ backgroundColor: item.categoryColor }}
                            >
                              ● {item.categoryName}
                            </span>
                            {item.categoryChangeNote && (
                              <span className="block text-[9px] text-amber-700 font-semibold mt-0.5">
                                ✏️ Pernah Diubah
                              </span>
                            )}
                          </td>

                          <td className="py-3 px-3">
                            <p className="font-bold text-slate-900 line-clamp-1">{item.title}</p>
                            <p className="text-slate-500 text-[11px] line-clamp-1">{item.content}</p>
                            {item.supervisorWarning && (
                              <span className="inline-flex items-center gap-1 mt-1 text-[10px] font-bold text-rose-700 bg-rose-50 border border-rose-200 px-1.5 py-0.5 rounded">
                                ⚠️ Atensi Atasan Aktif
                              </span>
                            )}
                          </td>

                          <td className="py-3 px-3 whitespace-nowrap">
                            <span className="font-medium text-slate-800 block">
                              {item.isAnonymous ? "Anonim" : item.reporterName}
                            </span>
                            <span className="text-[10px] text-slate-400 block">{item.reporterContact}</span>
                          </td>

                          <td className="py-3 px-3 whitespace-nowrap">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                item.status === "SELESAI"
                                  ? "bg-teal-50 text-teal-800 border border-teal-200"
                                  : item.status === "DIDISPOSISIKAN"
                                  ? "bg-blue-50 text-blue-800 border border-blue-200"
                                  : item.status === "BARU"
                                  ? "bg-amber-50 text-amber-800 border border-amber-200"
                                  : "bg-slate-100 text-slate-700"
                              }`}
                            >
                              {item.status}
                            </span>
                          </td>

                          <td className="py-3 px-3">
                            <span className="font-semibold text-slate-800 block line-clamp-1">
                              {item.dispositionTo || "-"}
                            </span>
                            {item.waBlast ? (
                              <span className="inline-flex items-center gap-1 text-[10px] text-emerald-700 font-bold">
                                💬 WA Blast: {item.waBlast.status}
                              </span>
                            ) : item.dispositionTo ? (
                              <span className="text-[10px] text-slate-400">Disposisi Internal</span>
                            ) : null}
                          </td>

                          <td className="py-3 px-3 text-right whitespace-nowrap">
                            <button
                              onClick={() => setSelectedReportDetail(item)}
                              className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold text-indigo-700 hover:bg-indigo-50 border border-indigo-200 transition"
                            >
                              <Eye className="w-3 h-3 mr-1" />
                              Audit Trail
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Modal Detail Audit Trail Linimasa */}
        {selectedReportDetail && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in duration-150">
            <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-indigo-200 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div>
                  <span className="font-mono text-xs font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                    {selectedReportDetail.ticketNumber}
                  </span>
                  <h3 className="text-base font-black text-slate-900 mt-1">
                    Audit Trail Linimasa Pengaduan
                  </h3>
                </div>
                <button
                  onClick={() => setSelectedReportDetail(null)}
                  className="text-slate-400 hover:text-slate-700 text-lg font-bold p-1"
                >
                  ✕
                </button>
              </div>

              {/* Rincian Laporan */}
              <div className="mt-4 p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1.5">
                <div className="flex items-center justify-between">
                  <span
                    className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold text-white shadow-xs"
                    style={{ backgroundColor: selectedReportDetail.categoryColor }}
                  >
                    ● {selectedReportDetail.categoryName}
                  </span>
                  <span className="font-bold text-slate-700">Urgensi: {selectedReportDetail.urgency}</span>
                </div>
                <h4 className="font-bold text-slate-900 text-sm">{selectedReportDetail.title}</h4>
                {(() => {
                  const splitIdx = selectedReportDetail.content.indexOf("\n\n---\n");
                  let text = splitIdx !== -1 ? selectedReportDetail.content.slice(0, splitIdx).trim() : selectedReportDetail.content;
                  text = text.replace(/🖼️ Berkas Data:\s*.+/g, "").trim();
                  const urlMatch = selectedReportDetail.content.match(/🖼️ Berkas Data:\s*(.+)/);
                  const attMatch = selectedReportDetail.content.match(/📎 Lampiran Bukti:\s*(.+)/);
                  const url = urlMatch ? urlMatch[1].trim() : null;
                  const name = attMatch ? attMatch[1].trim() : null;
                  const isImg = url?.startsWith("data:image/") || (url && /\.(jpeg|jpg|png|gif|webp|svg|bmp)(\?.*)?$/i.test(url)) || (name && /\.(jpeg|jpg|png|gif|webp|svg|bmp)$/i.test(name));

                  return (
                    <div className="space-y-2">
                      <p className="text-slate-600 whitespace-pre-line leading-relaxed">{text}</p>
                      {url && (
                        <div className="mt-2 p-2 bg-white rounded-lg border border-slate-200 space-y-1.5">
                          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                            📎 Berkas Lampiran Bukti
                          </span>
                          {isImg ? (
                            <a href={url} target="_blank" rel="noopener noreferrer" className="block group">
                              <img src={url} alt="Lampiran" className="max-h-40 rounded-lg object-contain border border-slate-200 group-hover:opacity-90" />
                              <span className="text-[10px] text-blue-600 hover:underline mt-1 block">Klik untuk membuka gambar penuh</span>
                            </a>
                          ) : (
                            <a href={url} download={name || "lampiran"} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:underline font-bold flex items-center gap-1">
                              Unduh Dokumen: {name || "Berkas Terlampir"}
                            </a>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })()}
                <div className="pt-2 border-t border-slate-200 text-[11px] text-slate-500">
                  Pelapor: <b>{selectedReportDetail.isAnonymous ? "Anonim" : selectedReportDetail.reporterName}</b>{" "}
                  {selectedReportDetail.reporterContact && `• Kontak: ${selectedReportDetail.reporterContact}`}
                </div>
              </div>

              {/* Linimasa Tahapan Kerja */}
              <div className="mt-5 space-y-3">
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Linimasa Perjalanan Aduan
                </h4>

                {/* Tahap 1: Laporan Diterima */}
                <div className="flex items-start gap-3 text-xs">
                  <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center shrink-0 font-bold mt-0.5">
                    1
                  </div>
                  <div className="flex-1 pb-3 border-b border-slate-100">
                    <p className="font-bold text-slate-800">Laporan Masuk ke Sistem</p>
                    <p className="text-slate-500 text-[11px]">
                      {new Date(selectedReportDetail.createdAt).toLocaleString("id-ID")}
                    </p>
                  </div>
                </div>

                {/* Tahap 1b: Ubah Kategori Jika Ada */}
                {selectedReportDetail.categoryChangeNote && (
                  <div className="flex items-start gap-3 text-xs">
                    <div className="w-6 h-6 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center shrink-0 font-bold mt-0.5">
                      ✏️
                    </div>
                    <div className="flex-1 pb-3 border-b border-slate-100">
                      <p className="font-bold text-amber-900">Perubahan Kategori oleh Humas</p>
                      <p className="text-slate-600 text-[11px] mt-0.5 bg-amber-50 p-2 rounded-lg border border-amber-200">
                        {selectedReportDetail.categoryChangeNote}
                      </p>
                      <p className="text-slate-400 text-[10px] mt-1">
                        Diubah oleh: <b>{selectedReportDetail.categoryChangedBy || "Admin Humas"}</b>{" "}
                        {selectedReportDetail.categoryChangedAt &&
                          `pada ${new Date(selectedReportDetail.categoryChangedAt).toLocaleString("id-ID")}`}
                      </p>
                    </div>
                  </div>
                )}

                {/* Tahap 1c: Atensi / Instruksi Pimpinan Manajemen Jika Ada */}
                {selectedReportDetail.supervisorWarning && (
                  <div className="flex items-start gap-3 text-xs">
                    <div className="w-6 h-6 rounded-full bg-rose-100 text-rose-700 flex items-center justify-center shrink-0 font-bold mt-0.5">
                      ⚠️
                    </div>
                    <div className="flex-1 pb-3 border-b border-slate-100">
                      <p className="font-bold text-rose-950">Atensi & Instruksi Pimpinan Manajemen</p>
                      <p className="text-rose-900 text-[11px] mt-0.5 bg-rose-50 p-2.5 rounded-lg border border-rose-200 italic font-medium">
                        &ldquo;{selectedReportDetail.supervisorWarning}&rdquo;
                      </p>
                      <div className="mt-1 text-[10px] text-slate-500 flex flex-wrap items-center justify-between gap-1">
                        <span>
                          Diberikan oleh: <b>{selectedReportDetail.supervisorWarningBy || "Pimpinan Manajemen"}</b>
                          {selectedReportDetail.supervisorWarningAt &&
                            ` • ${new Date(selectedReportDetail.supervisorWarningAt).toLocaleString("id-ID")}`}
                        </span>
                        {selectedReportDetail.supervisorWarningWaSent && (
                          <span className="font-bold text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded">
                            ✓ Alert WhatsApp Terkirim ke Admin Humas
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Tahap 2: Disposisi ke Bidang */}
                {selectedReportDetail.dispositionTo && (
                  <div className="flex items-start gap-3 text-xs">
                    <div className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center shrink-0 font-bold mt-0.5">
                      2
                    </div>
                    <div className="flex-1 pb-3 border-b border-slate-100">
                      <p className="font-bold text-indigo-950">Didisposisikan ke Bidang Terkait</p>
                      <p className="text-slate-700 text-[11px] font-semibold mt-0.5">
                        🏢 {selectedReportDetail.dispositionTo}
                      </p>
                      {selectedReportDetail.dispositionNote && (
                        <p className="text-slate-600 text-[11px] mt-1 italic bg-indigo-50/60 p-2 rounded-lg border border-indigo-100">
                          &ldquo;{selectedReportDetail.dispositionNote}&rdquo;
                        </p>
                      )}
                      {selectedReportDetail.dispositionTargetPhone && (
                        <p className="text-slate-500 text-[10px] mt-1 flex items-center gap-1">
                          <Phone className="w-3 h-3 text-slate-400" />
                          Kontak WA: <b>{selectedReportDetail.dispositionTargetPhone}</b>
                        </p>
                      )}
                      <p className="text-slate-400 text-[10px] mt-0.5">
                        Waktu Disposisi:{" "}
                        {selectedReportDetail.dispositionedAt
                          ? new Date(selectedReportDetail.dispositionedAt).toLocaleString("id-ID")
                          : "-"}
                      </p>
                    </div>
                  </div>
                )}

                {/* Tahap 3: Log WA Blast */}
                {selectedReportDetail.waBlast && (
                  <div className="flex items-start gap-3 text-xs">
                    <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 font-bold mt-0.5">
                      💬
                    </div>
                    <div className="flex-1 pb-3 border-b border-slate-100">
                      <p className="font-bold text-emerald-950">Notifikasi WA Blast Terkirim</p>
                      <p className="text-slate-600 text-[11px]">
                        Status: <b>{selectedReportDetail.waBlast.status}</b> ke nomor{" "}
                        <b>{selectedReportDetail.waBlast.recipientPhone}</b>
                      </p>
                      <p className="text-slate-400 text-[10px] mt-0.5">
                        {new Date(selectedReportDetail.waBlast.sentAt).toLocaleString("id-ID")}
                      </p>
                    </div>
                  </div>
                )}

                {/* Tahap 4: Penyelesaian / Respon Tuntas */}
                {selectedReportDetail.status === "SELESAI" && (
                  <div className="flex items-start gap-3 text-xs">
                    <div className="w-6 h-6 rounded-full bg-teal-100 text-teal-700 flex items-center justify-center shrink-0 font-bold mt-0.5">
                      ✓
                    </div>
                    <div className="flex-1">
                      <p className="font-bold text-teal-950">Laporan Tuntas Diselesaikan</p>
                      <div className="mt-1 p-2.5 rounded-lg bg-teal-50 border border-teal-200 text-teal-900 text-[11px]">
                        <span className="font-bold block mb-0.5">Tanggapan Resmi Instansi:</span>
                        {selectedReportDetail.responseNote || "Penanganan tuntas."}
                      </div>
                      <p className="text-slate-400 text-[10px] mt-1">
                        Selesai pada:{" "}
                        {selectedReportDetail.respondedAt
                          ? new Date(selectedReportDetail.respondedAt).toLocaleString("id-ID")
                          : "-"}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              <div className="mt-6 pt-3 border-t border-slate-100 text-right">
                <button
                  type="button"
                  onClick={() => setSelectedReportDetail(null)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition"
                >
                  Tutup Audit Trail
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* MODAL 1: TRIGGER INSTRUKSI ATASAN                         */}
        {/* ========================================================= */}
        {triggerWarningReport && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in duration-150">
            <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-rose-200">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center">
                    <AlertTriangle className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-slate-900">
                      Trigger Instruksi & Atensi Atasan
                    </h3>
                    <p className="text-[11px] text-slate-500">
                      Instruksi pimpinan akan tampil mencolok di Dashboard Humas dan tercatat di audit trail.
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setTriggerWarningReport(null)}
                  className="text-slate-400 hover:text-slate-700 text-lg font-bold p-1"
                >
                  ✕
                </button>
              </div>

              {/* Rincian Aduan */}
              <div className="mt-4 p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-mono font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                    {triggerWarningReport.ticketNumber}
                  </span>
                  <span className="font-bold text-rose-700">Urgensi: {triggerWarningReport.urgency}</span>
                </div>
                <p className="font-bold text-slate-900 text-sm mt-1">{triggerWarningReport.title}</p>
                <p className="text-slate-500 text-xs line-clamp-2">{triggerWarningReport.content}</p>
              </div>

              <form onSubmit={handleSubmitTriggerWarning} className="mt-4 space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Tuliskan Catatan / Instruksi Pimpinan Manajemen:
                  </label>
                  <textarea
                    rows={3}
                    value={triggerWarningInstruction}
                    onChange={(e) => setTriggerWarningInstruction(e.target.value)}
                    placeholder="Contoh: Mohon Admin Humas segera prioritaskan dan disposisikan laporan ini ke bidang terkait secepatnya."
                    className="w-full text-xs p-3 rounded-xl border border-rose-300 focus:outline-none focus:ring-2 focus:ring-rose-500 bg-rose-50/30 text-slate-800"
                    required
                  />
                  <p className="text-[11px] text-slate-400 mt-1">
                    Instruksi ini akan otomatis memicu badge <b>&ldquo;Atensi Atasan&rdquo;</b> pada kartu aduan di Meja Kerja Admin Humas.
                  </p>
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setTriggerWarningReport(null)}
                    className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmittingTriggerWarning}
                    className="inline-flex items-center px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition shadow-xs disabled:opacity-50"
                  >
                    {isSubmittingTriggerWarning ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                        Menerbitkan...
                      </>
                    ) : (
                      <>
                        <AlertTriangle className="w-3.5 h-3.5 mr-1.5" />
                        Terbitkan Instruksi Sekarang
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* MODAL 2: TRIGGER WHATSAPP KE ADMIN HUMAS                  */}
        {/* ========================================================= */}
        {triggerWaReport && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in duration-150">
            <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-emerald-200">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                    <Phone className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-slate-900">
                      Trigger WhatsApp ke Admin Humas
                    </h3>
                    <p className="text-[11px] text-slate-500">
                      Kirim pesan peringatan darurat langsung ke nomor WhatsApp Admin Humas.
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setTriggerWaReport(null)}
                  className="text-slate-400 hover:text-slate-700 text-lg font-bold p-1"
                >
                  ✕
                </button>
              </div>

              {/* Rincian Aduan */}
              <div className="mt-4 p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-mono font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    {triggerWaReport.ticketNumber}
                  </span>
                  <span className="font-bold text-rose-700">Urgensi: {triggerWaReport.urgency}</span>
                </div>
                <p className="font-bold text-slate-900 text-sm mt-1">{triggerWaReport.title}</p>
              </div>

              <form onSubmit={handleSubmitTriggerWa} className="mt-4 space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Nomor WhatsApp Admin Humas:
                  </label>
                  <input
                    type="tel"
                    value={triggerWaRecipient}
                    onChange={(e) => setTriggerWaRecipient(e.target.value)}
                    placeholder="Contoh: 081234567890"
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Isi Pesan WhatsApp Peringatan:
                  </label>
                  <textarea
                    rows={6}
                    value={triggerWaMessage}
                    onChange={(e) => setTriggerWaMessage(e.target.value)}
                    className="w-full font-mono text-[11px] p-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-slate-50 text-slate-800"
                    required
                  />
                  <p className="text-[11px] text-slate-400 mt-1">
                    Pesan akan diteruskan via WhatsApp Gateway dan dicatat ke log WA Blast sistem.
                  </p>
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setTriggerWaReport(null)}
                    className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmittingTriggerWa}
                    className="inline-flex items-center px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition shadow-xs disabled:opacity-50"
                  >
                    {isSubmittingTriggerWa ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                        Mengirim Pesan...
                      </>
                    ) : (
                      <>
                        <Send className="w-3.5 h-3.5 mr-1.5" />
                        Kirim WhatsApp Sekarang
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
