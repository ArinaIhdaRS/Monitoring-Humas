"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  CheckCircle2,
  Copy,
  Check,
  Calendar,
  Clock,
  MapPin,
  FileText,
  User,
  EyeOff,
  Building2,
  AlertTriangle,
  ArrowLeft,
  Printer,
  Search,
  ShieldCheck,
  Send,
  Loader2,
  ChevronRight,
  Sparkles,
  Paperclip,
  ZoomIn,
  Download,
  ExternalLink,
  X,
} from "lucide-react";

// Helper ekstraksi metadata dan lampiran file/gambar dari teks laporan
interface ParsedReportMeta {
  cleanContent: string;
  targetUnit: string | null;
  location: string | null;
  attachmentName: string | null;
  attachmentUrl: string | null;
  isImage: boolean;
  isPdf: boolean;
}

const parseReportDetails = (content: string, reportObj?: any): ParsedReportMeta => {
  let cleanContent = content || "";
  let targetUnit: string | null = reportObj?.targetUnit || null;
  let location: string | null = reportObj?.location || null;
  let attachmentName: string | null = reportObj?.attachmentName || null;
  let attachmentUrl: string | null = reportObj?.attachmentUrl || null;

  // Fallback untuk riwayat tiket lama yang menyertakan format "---" di dalam content
  const splitIndex = cleanContent.indexOf("\n\n---\n");
  if (splitIndex !== -1) {
    const metaText = cleanContent.slice(splitIndex + 6);
    cleanContent = cleanContent.slice(0, splitIndex).trim();

    if (!targetUnit) {
      const unitMatch = metaText.match(/🏛️ Unit\/Bidang Tujuan:\s*(.+)/);
      if (unitMatch) targetUnit = unitMatch[1].trim();
    }
    if (!location) {
      const locMatch = metaText.match(/📍 Lokasi Kejadian:\s*(.+)/);
      if (locMatch) location = locMatch[1].trim();
    }
    if (!attachmentName) {
      const attMatch = metaText.match(/📎 Lampiran Bukti:\s*(.+)/);
      if (attMatch) attachmentName = attMatch[1].trim();
    }
    if (!attachmentUrl) {
      const urlMatch = metaText.match(/🖼️ Berkas Data:\s*(.+)/);
      if (urlMatch) attachmentUrl = urlMatch[1].trim();
    }
  } else {
    const urlMatch = cleanContent.match(/🖼️ Berkas Data:\s*(.+)/);
    if (urlMatch) {
      if (!attachmentUrl) attachmentUrl = urlMatch[1].trim();
      cleanContent = cleanContent.replace(/🖼️ Berkas Data:\s*.+/g, "").trim();
    }
    const attMatch = cleanContent.match(/📎 Lampiran Bukti:\s*(.+)/);
    if (attMatch) {
      if (!attachmentName) attachmentName = attMatch[1].trim();
      cleanContent = cleanContent.replace(/📎 Lampiran Bukti:\s*.+/g, "").trim();
    }
    const locMatch = cleanContent.match(/📍 Lokasi Kejadian:\s*(.+)/);
    if (locMatch) {
      if (!location) location = locMatch[1].trim();
      cleanContent = cleanContent.replace(/📍 Lokasi Kejadian:\s*.+/g, "").trim();
    }
  }

  // Sanitasi XSS: Pastikan attachmentUrl hanya skema HTTP/HTTPS atau Data URI gambar/PDF aman
  let safeAttachmentUrl: string | null = null;
  if (attachmentUrl) {
    const trimmed = attachmentUrl.trim();
    const lower = trimmed.toLowerCase();
    if (
      !lower.startsWith("javascript:") &&
      !lower.startsWith("vbscript:") &&
      !lower.startsWith("data:text/html") &&
      !lower.startsWith("data:text/javascript") &&
      !lower.startsWith("data:image/svg+xml")
    ) {
      if (
        lower.startsWith("/uploads/") ||
        lower.startsWith("https://") ||
        lower.startsWith("http://") ||
        lower.startsWith("data:image/") ||
        lower.startsWith("data:application/pdf")
      ) {
        safeAttachmentUrl = trimmed;
      }
    }
  }

  const isImage = Boolean(
    safeAttachmentUrl?.startsWith("data:image/") ||
    (safeAttachmentUrl && /\.(jpeg|jpg|png|gif|webp)(\?.*)?$/i.test(safeAttachmentUrl)) ||
    (attachmentName && /\.(jpeg|jpg|png|gif|webp)$/i.test(attachmentName))
  );

  const isPdf = Boolean(
    safeAttachmentUrl?.startsWith("data:application/pdf") ||
    (safeAttachmentUrl && /\.pdf(\?.*)?$/i.test(safeAttachmentUrl)) ||
    (attachmentName && /\.pdf$/i.test(attachmentName))
  );

  return {
    cleanContent,
    targetUnit,
    location,
    attachmentName,
    attachmentUrl: safeAttachmentUrl,
    isImage,
    isPdf,
  };
};

export default function TicketDetailPage() {
  const params = useParams();
  const router = useRouter();
  const ticketNumber = (params?.ticketNumber as string) || "";

  const [report, setReport] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [zoomedImage, setZoomedImage] = useState<string | null>(null);

  // Pasang title sesuai permintaan (tanpa nomor tiket)
  useEffect(() => {
    document.title = "Detail & Pelacakan Tiket - HumasMonitor";
  }, []);

  useEffect(() => {
    if (!ticketNumber) return;

    setLoading(true);
    setError(null);

    fetch(`/api/reports/track?ticket=${encodeURIComponent(ticketNumber)}`)
      .then((res) => {
        if (!res.ok) {
          throw new Error("Nomor tiket tidak ditemukan dalam sistem.");
        }
        return res.json();
      })
      .then((data) => {
        setReport(data.report);
      })
      .catch((err) => {
        setError(err.message || "Gagal memuat rincian tiket.");
      })
      .finally(() => {
        setLoading(false);
      });
  }, [ticketNumber]);

  const handleCopyTicket = () => {
    if (!report?.ticketNumber) return;
    navigator.clipboard.writeText(report.ticketNumber);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col text-slate-800 selection:bg-emerald-100 selection:text-emerald-900">
      <title>Detail & Pelacakan Tiket - HumasMonitor</title>

      {/* Top Navbar */}
      <header className="border-b border-emerald-100 bg-white/95 backdrop-blur sticky top-0 z-50 shadow-xs print:hidden">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center space-x-3">
            <img
              src="/LOGO DKH.png"
              alt="Logo HumasMonitor"
              className="w-10 h-10 object-contain rounded-xl shadow-xs"
              onError={(e) => {
                (e.target as HTMLElement).style.display = "none";
              }}
            />
            <div>
              <span className="text-lg font-black text-emerald-950 tracking-tight">
                HumasMonitor
              </span>
              <span className="hidden sm:inline-block ml-2 px-2.5 py-0.5 text-xs font-semibold bg-emerald-100 text-emerald-800 rounded-full border border-emerald-200">
                Portal Aspirasi & Pelacakan Resmi
              </span>
            </div>
          </Link>

          <div className="flex items-center space-x-2 sm:space-x-3">
            <Link
              href="/#form-lapor"
              className="inline-flex items-center text-xs sm:text-sm font-bold text-emerald-800 hover:text-emerald-950 px-3 py-1.5 rounded-lg hover:bg-emerald-50 transition"
            >
              <Send className="w-3.5 h-3.5 mr-1.5" />
              Buat Laporan Baru
            </Link>
            <Link
              href="/"
              className="inline-flex items-center text-xs sm:text-sm font-bold px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition"
            >
              <ArrowLeft className="w-3.5 h-3.5 mr-1.5" />
              Beranda
            </Link>
          </div>
        </div>
      </header>

      {/* Konten Utama */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 space-y-8">
        {loading ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-xs">
            <Loader2 className="w-10 h-10 animate-spin text-emerald-600 mx-auto mb-3" />
            <p className="text-sm font-bold text-slate-700">
              Memuat data tiket & pelacakan status...
            </p>
            <p className="text-xs text-slate-400 mt-1">Mohon tunggu sejenak</p>
          </div>
        ) : error || !report ? (
          <div className="bg-white rounded-2xl border border-red-200 p-8 sm:p-12 text-center shadow-xs space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-8 h-8" />
            </div>
            <h2 className="text-xl font-black text-slate-900">
              Nomor Tiket Tidak Ditemukan
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto">
              {error || "Laporan dengan nomor tiket tersebut tidak terdaftar di sistem. Silakan periksa kembali nomor tiket Anda."}
            </p>
            <div className="pt-2 flex items-center justify-center gap-3">
              <Link
                href="/#lacak-laporan"
                className="inline-flex items-center px-4 py-2 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 transition"
              >
                <Search className="w-3.5 h-3.5 mr-1.5" />
                Cari Tiket Lain
              </Link>
              <Link
                href="/"
                className="inline-flex items-center px-4 py-2 rounded-xl text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 transition"
              >
                Kembali ke Beranda
              </Link>
            </div>
          </div>
        ) : (
          <>
            {/* Banner Sukses Penerbitan Tiket (Bagus untuk print & web) */}
            <div className="p-6 sm:p-7 rounded-2xl bg-gradient-to-r from-emerald-700 via-emerald-600 to-teal-700 text-white shadow-md relative overflow-hidden print:bg-none print:text-slate-900 print:border print:border-slate-300 print:p-4">
              <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1.5">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-white/20 text-white border border-white/30 print:border-slate-400 print:text-slate-800">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-200 print:text-emerald-700" />
                    Laporan Berhasil Diterbitkan & Terdaftar Resmi
                  </div>
                  <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
                    Rincian & Resume Tiket Pengaduan
                  </h1>
                  <p className="text-xs sm:text-sm text-emerald-100 print:text-slate-600 max-w-2xl leading-relaxed">
                    Laporan Anda telah berhasil masuk ke meja kerja Tim Humas. Simpan nomor tiket ini untuk melacak disposisi, investigasi, serta tanggapan resmi penyelesaian.
                  </p>
                </div>

                {/* Nomor Tiket Card & Tombol Cetak */}
                <div className="bg-white/10 backdrop-blur border border-white/20 p-4 rounded-xl flex flex-col sm:flex-row md:flex-col items-start sm:items-center md:items-end gap-3 print:border-slate-400">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-emerald-200 print:text-slate-600 block">
                      Nomor Tiket Aduan
                    </span>
                    <span className="font-mono font-black text-xl sm:text-2xl text-white print:text-slate-900 tracking-wider">
                      {report.ticketNumber}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 print:hidden">
                    <button
                      type="button"
                      onClick={handleCopyTicket}
                      className="inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-bold bg-white text-emerald-800 hover:bg-emerald-50 transition shadow-xs cursor-pointer"
                    >
                      {copied ? (
                        <>
                          <Check className="w-3.5 h-3.5 mr-1 text-emerald-700" />
                          Tersalin!
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5 mr-1 text-emerald-700" />
                          Salin Nomor
                        </>
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={handlePrint}
                      className="inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-bold bg-emerald-800/80 hover:bg-emerald-800 text-white transition border border-white/20 cursor-pointer"
                      title="Cetak atau Simpan PDF Bukti Tiket"
                    >
                      <Printer className="w-3.5 h-3.5 mr-1" />
                      Cetak
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Layout Grid 2 Kolom: Kiri Resume Tiket, Kanan Linimasa & Audit Trail */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              {/* Kolom Kiri: Rincian Lengkap Tiket */}
              <div className="lg:col-span-7 space-y-6">
                <div className="bg-white rounded-2xl border border-emerald-200 p-6 sm:p-7 shadow-xs space-y-5">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                    <div className="flex items-center gap-2">
                      <span
                        className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold text-white shadow-xs"
                        style={{ backgroundColor: report.categoryColor || "#059669" }}
                      >
                        ● {report.categoryName}
                      </span>
                      <span
                        className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold ${
                          report.urgency === "KRITIS"
                            ? "bg-rose-100 text-rose-800 border border-rose-200"
                            : report.urgency === "TINGGI"
                            ? "bg-amber-100 text-amber-800 border border-amber-200"
                            : "bg-sky-100 text-sky-800 border border-sky-200"
                        }`}
                      >
                        Urgensi: {report.urgency}
                      </span>
                    </div>

                    <span
                      className={`px-3 py-1 rounded-full text-xs font-bold ${
                        report.status === "SELESAI"
                          ? "bg-teal-100 text-teal-900 border border-teal-300"
                          : report.status === "DIDISPOSISIKAN" || report.status === "SEDANG_DIPROSES"
                          ? "bg-blue-100 text-blue-900 border border-blue-300"
                          : "bg-amber-100 text-amber-900 border border-amber-300"
                      }`}
                    >
                      {report.status}
                    </span>
                  </div>

                  {/* Judul & Isi Laporan */}
                  <div>
                    <h2 className="text-xl font-black text-slate-900">
                      {report.title}
                    </h2>
                    <p className="text-xs text-slate-400 mt-1 flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5" />
                      Diajukan pada:{" "}
                      {new Date(report.createdAt).toLocaleDateString("id-ID", {
                        weekday: "long",
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>

                  {/* Kronologi Isi & Pratinjau Lampiran Bukti */}
                  {(() => {
                    const meta = parseReportDetails(report.content, report);
                    return (
                      <>
                        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2.5">
                          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                            Kronologi & Isi Aduan
                          </span>
                          <p className="text-xs sm:text-sm text-slate-700 whitespace-pre-line leading-relaxed">
                            {meta.cleanContent || report.content}
                          </p>

                          {/* Info Lokasi Kejadian */}
                          {meta.location && (
                            <div className="pt-2.5 mt-2 border-t border-slate-200/80 flex items-center gap-1.5 text-xs text-slate-600 font-medium">
                              <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                              <span>
                                Lokasi Kejadian: <strong className="text-slate-800">{meta.location}</strong>
                              </span>
                            </div>
                          )}

                          {/* Info Unit / Bidang Dituju */}
                          {meta.targetUnit && (
                            <div className="pt-1.5 border-t border-slate-200/50 flex items-center gap-1.5 text-xs text-slate-600 font-medium">
                              <Building2 className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                              <span>
                                Unit / Bidang Dituju: <strong className="text-slate-800">{meta.targetUnit}</strong>
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Berkas & Foto Lampiran Bukti */}
                        <div className="p-5 rounded-2xl bg-emerald-50/70 border border-emerald-200 space-y-3.5 print:bg-white print:border-slate-300">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-emerald-950 flex items-center gap-1.5 uppercase tracking-wider print:text-slate-900">
                              <Paperclip className="w-4 h-4 text-emerald-700 print:text-slate-700" />
                              Berkas & Foto Lampiran Bukti
                            </span>
                            {meta.attachmentUrl ? (
                              <span className="text-[11px] font-bold text-emerald-800 bg-emerald-100 border border-emerald-300 px-2.5 py-0.5 rounded-full print:hidden">
                                {meta.isImage ? "Foto / Gambar Bukti" : meta.isPdf ? "Dokumen PDF" : "Berkas Terlampir"}
                              </span>
                            ) : meta.attachmentName ? (
                              <span className="text-[11px] font-bold text-slate-600 bg-slate-100 px-2.5 py-0.5 rounded-full print:hidden">
                                Nama Berkas Tercatat
                              </span>
                            ) : null}
                          </div>

                          {meta.attachmentUrl ? (
                            meta.isImage ? (
                              <div className="space-y-3">
                                {/* Kotak Pratinjau Gambar */}
                                <div
                                  onClick={() => setZoomedImage(meta.attachmentUrl)}
                                  className="relative group cursor-pointer max-w-md rounded-2xl overflow-hidden border border-emerald-200 shadow-xs hover:shadow-md transition bg-slate-900/5 print:border-slate-400"
                                  title="Klik untuk memperbesar gambar"
                                >
                                  <img
                                    src={meta.attachmentUrl}
                                    alt={meta.attachmentName || "Lampiran Bukti Pengaduan"}
                                    className="w-full max-h-80 object-contain bg-slate-950/5 group-hover:scale-102 transition duration-200"
                                  />
                                  <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-xs font-bold transition print:hidden">
                                    <ZoomIn className="w-5 h-5 mr-1.5" /> Klik untuk Perbesar Gambar
                                  </div>
                                </div>

                                {/* Tombol Aksi Gambar */}
                                <div className="flex flex-wrap items-center gap-2 pt-0.5 print:hidden">
                                  <button
                                    type="button"
                                    onClick={() => setZoomedImage(meta.attachmentUrl)}
                                    className="text-xs font-bold text-emerald-900 bg-emerald-100 hover:bg-emerald-200 border border-emerald-300/70 px-3.5 py-1.5 rounded-xl flex items-center gap-1.5 transition cursor-pointer shadow-xs"
                                  >
                                    <ZoomIn className="w-3.5 h-3.5 text-emerald-700" /> Lihat Ukuran Penuh
                                  </button>
                                  <a
                                    href={meta.attachmentUrl}
                                    download={meta.attachmentName || `lampiran-${report.ticketNumber}.jpg`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-xs font-bold text-slate-700 hover:text-slate-900 bg-white border border-slate-300 hover:bg-slate-50 px-3.5 py-1.5 rounded-xl flex items-center gap-1.5 transition shadow-xs"
                                  >
                                    <Download className="w-3.5 h-3.5 text-slate-600" /> Unduh Berkas / Foto
                                  </a>
                                  {meta.attachmentName && (
                                    <span className="text-[11px] text-slate-500 font-medium pl-1 truncate max-w-xs">
                                      ({meta.attachmentName})
                                    </span>
                                  )}
                                </div>
                              </div>
                            ) : (
                              /* Berkas Dokumen (PDF dll) */
                              <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-white rounded-xl border border-emerald-200 gap-3 shadow-xs">
                                <div className="flex items-center gap-3 min-w-0">
                                  <div className="w-11 h-11 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold shrink-0">
                                    <FileText className="w-6 h-6" />
                                  </div>
                                  <div className="min-w-0">
                                    <p className="text-xs font-bold text-slate-900 truncate max-w-xs sm:max-w-md">
                                      {meta.attachmentName || "Berkas Dokumen Lampiran"}
                                    </p>
                                    <p className="text-[11px] text-slate-500">
                                      Berkas lampiran dokumen pendukung laporan
                                    </p>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2 shrink-0 print:hidden">
                                  <a
                                    href={meta.attachmentUrl}
                                    download={meta.attachmentName || `lampiran-${report.ticketNumber}.pdf`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs transition"
                                  >
                                    <Download className="w-3.5 h-3.5" /> Buka & Unduh Berkas
                                  </a>
                                </div>
                              </div>
                            )
                          ) : meta.attachmentName ? (
                            <div className="p-3.5 bg-white rounded-xl border border-slate-200 flex items-center gap-2.5 text-xs text-slate-700">
                              <Paperclip className="w-4 h-4 text-emerald-600 shrink-0" />
                              <span>Nama Berkas Terlampir: <b>{meta.attachmentName}</b></span>
                            </div>
                          ) : (
                            <div className="p-3 bg-white/60 rounded-xl border border-dashed border-emerald-200 text-center">
                              <p className="text-xs text-slate-500 italic">
                                Tidak ada berkas atau foto yang dilampirkan pada laporan ini.
                              </p>
                            </div>
                          )}
                        </div>
                      </>
                    );
                  })()}

                  {/* Identitas Pelapor */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                    <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                        Identitas Pelapor
                      </span>
                      <div className="mt-1 flex items-center gap-2">
                        {report.isAnonymous ? (
                          <>
                            <div className="w-7 h-7 rounded-lg bg-slate-200 text-slate-600 flex items-center justify-center shrink-0">
                              <EyeOff className="w-3.5 h-3.5" />
                            </div>
                            <div>
                              <p className="text-xs font-bold text-slate-800">
                                Mode Anonim
                              </p>
                              <p className="text-[10px] text-slate-500">
                                Identitas dirahasiakan
                              </p>
                            </div>
                          </>
                        ) : (
                          <>
                            <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                              <User className="w-3.5 h-3.5" />
                            </div>
                            <div>
                              <p className="text-xs font-bold text-slate-800">
                                {report.reporterName || "Warga Publik"}
                              </p>
                              <p className="text-[10px] text-slate-500">
                                {report.reporterContact || "Kontak terdaftar"}
                              </p>
                            </div>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                        Unit Kerja Disposisi
                      </span>
                      <div className="mt-1 flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
                          <Building2 className="w-3.5 h-3.5" />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-slate-800">
                            {report.dispositionTo || "Sedang Ditelaah Humas"}
                          </p>
                          <p className="text-[10px] text-slate-500">
                            {report.dispositionedAt
                              ? `Didisposisikan: ${new Date(report.dispositionedAt).toLocaleDateString("id-ID")}`
                              : "Antrean telaah awal"}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Catatan Respon Akhir Jika Selesai */}
                  {report.responseNote && (
                    <div className="p-4 rounded-xl bg-teal-50 border border-teal-200 text-teal-950 space-y-1.5 animate-in fade-in">
                      <div className="flex items-center gap-1.5 text-teal-800 font-bold text-xs">
                        <CheckCircle2 className="w-4 h-4 text-teal-600" />
                        Tanggapan Resmi & Hasil Penanganan Humas:
                      </div>
                      <p className="text-xs text-teal-900 leading-relaxed whitespace-pre-line pl-5">
                        {report.responseNote}
                      </p>
                      {report.respondedAt && (
                        <p className="text-[10px] text-teal-700 pl-5 pt-1">
                          Tuntas diselesaikan pada:{" "}
                          {new Date(report.respondedAt).toLocaleString("id-ID")}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Kolom Kanan: Linimasa Pelacakan Progres & Audit Trail */}
              <div className="lg:col-span-5 space-y-6">
                <div className="bg-white rounded-2xl border border-emerald-200 p-6 shadow-xs space-y-5">
                  <div className="flex items-center space-x-2 text-emerald-800">
                    <Clock className="w-4 h-4" />
                    <h3 className="text-sm font-black uppercase tracking-wider">
                      Tracking Laporan
                    </h3>
                  </div>

                  {/* Step Tracker Linimasa */}
                  <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-emerald-100">
                    {/* Tahap 1: Laporan Diterima */}
                    <div className="relative">
                      <div className="absolute -left-6 top-0.5 w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px] font-bold shadow-xs">
                        ✓
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-slate-900">
                          Laporan Masuk ke Sistem
                        </h4>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          {new Date(report.createdAt).toLocaleString("id-ID")}
                        </p>
                        <p className="text-[11px] text-slate-600 mt-1">
                          Laporan otomatis terdata dengan tiket resmi dan menunggu telaah Tim Humas.
                        </p>
                      </div>
                    </div>

                    {/* Tahap Atensi Atasan (Jika Ada Trigger Pimpinan) */}
                    {report.supervisorWarning && (
                      <div className="relative animate-in fade-in">
                        <div className="absolute -left-6 top-0.5 w-5 h-5 rounded-full bg-rose-600 text-white flex items-center justify-center text-[10px] font-bold shadow-xs">
                          !
                        </div>
                        <div className="p-3 rounded-xl bg-rose-50 border border-rose-200">
                          <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider text-rose-700 bg-rose-100 px-2 py-0.5 rounded">
                            <AlertTriangle className="w-3 h-3 text-rose-600" />
                            Atensi & Arahan Atasan
                          </span>
                          <p className="text-xs font-bold text-rose-950 mt-1">
                            {report.supervisorWarning}
                          </p>
                          <p className="text-[10px] text-rose-700 mt-1">
                            Diterbitkan oleh: <b>{report.supervisorWarningBy || "Pimpinan"}</b> •{" "}
                            {report.supervisorWarningAt
                              ? new Date(report.supervisorWarningAt).toLocaleString("id-ID")
                              : "Aktif"}
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Tahap Perubahan Kategori (Jika Ada) */}
                    {report.categoryChangeNote && (
                      <div className="relative">
                        <div className="absolute -left-6 top-0.5 w-5 h-5 rounded-full bg-amber-500 text-white flex items-center justify-center text-[10px] font-bold shadow-xs">
                          ✏️
                        </div>
                        <div>
                          <h4 className="text-xs font-bold text-slate-900">
                            Penyesuaian Kategori oleh Humas
                          </h4>
                          <p className="text-[11px] text-slate-500 mt-0.5">
                            {report.categoryChangedAt
                              ? new Date(report.categoryChangedAt).toLocaleString("id-ID")
                              : "-"}
                          </p>
                          <p className="text-[11px] text-amber-800 font-medium mt-1 bg-amber-50 p-2 rounded-lg border border-amber-200">
                            {report.categoryChangeNote}
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Tahap 2: Disposisi ke Bidang */}
                    <div className="relative">
                      <div
                        className={`absolute -left-6 top-0.5 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shadow-xs ${
                          report.dispositionTo
                            ? "bg-blue-600 text-white"
                            : "bg-slate-200 text-slate-400"
                        }`}
                      >
                        {report.dispositionTo ? "✓" : "2"}
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-slate-900">
                          Disposisi & Koordinasi Bidang
                        </h4>
                        {report.dispositionTo ? (
                          <>
                            <p className="text-[11px] text-slate-500 mt-0.5">
                              {report.dispositionedAt
                                ? new Date(report.dispositionedAt).toLocaleString("id-ID")
                                : "-"}
                            </p>
                            <p className="text-[11px] text-blue-900 font-semibold mt-1">
                              Tujuan Disposisi: {report.dispositionTo}
                            </p>
                            {report.dispositionNote && (
                              <p className="text-[11px] text-slate-600 mt-0.5 italic">
                                &quot;{report.dispositionNote}&quot;
                              </p>
                            )}
                          </>
                        ) : (
                          <p className="text-[11px] text-slate-400 mt-0.5">
                            Menunggu penelaahan awal dan penetapan bidang oleh Admin Humas.
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Tahap 3: Tindak Lanjut & Investigasi */}
                    <div className="relative">
                      <div
                        className={`absolute -left-6 top-0.5 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shadow-xs ${
                          report.status === "SEDANG_DIPROSES" || report.status === "SELESAI"
                            ? "bg-emerald-600 text-white"
                            : "bg-slate-200 text-slate-400"
                        }`}
                      >
                        {report.status === "SELESAI" ? "✓" : "3"}
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-slate-900">
                          Tindak Lanjut & Penanganan
                        </h4>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          {report.status === "SELESAI"
                            ? "Penanganan telah rampung"
                            : report.status === "SEDANG_DIPROSES" || report.status === "DIDISPOSISIKAN"
                            ? "Sedang dalam koordinasi penanganan teknis"
                            : "Tahap penanganan teknis bidang"}
                        </p>
                      </div>
                    </div>

                    {/* Tahap 4: Penyelesaian Resmi */}
                    <div className="relative">
                      <div
                        className={`absolute -left-6 top-0.5 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shadow-xs ${
                          report.status === "SELESAI"
                            ? "bg-teal-600 text-white"
                            : "bg-slate-200 text-slate-400"
                        }`}
                      >
                        {report.status === "SELESAI" ? "✓" : "4"}
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-slate-900">
                          Tuntas & Tanggapan Resmi
                        </h4>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          {report.status === "SELESAI"
                            ? `Selesai pada: ${
                                report.respondedAt
                                  ? new Date(report.respondedAt).toLocaleString("id-ID")
                                  : "-"
                              }`
                            : "Hasil penyelesaian resmi akan dipublikasikan di sini."}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Tombol Aksi Tambahan */}
                <div className="p-5 rounded-2xl bg-emerald-50 border border-emerald-200 space-y-3 print:hidden">
                  <span className="text-xs font-bold text-emerald-950 block">
                    Aksi Lanjutan:
                  </span>
                  <div className="flex flex-col gap-2">
                    <button
                      type="button"
                      onClick={handleCopyTicket}
                      className="w-full inline-flex items-center justify-center px-4 py-2.5 rounded-xl text-xs font-bold bg-white text-emerald-800 hover:bg-emerald-100 border border-emerald-300 transition cursor-pointer"
                    >
                      <Copy className="w-3.5 h-3.5 mr-2 text-emerald-600" />
                      {copied ? "Nomor Tiket Tersalin!" : "Salin Nomor Tiket"}
                    </button>
                    <button
                      type="button"
                      onClick={handlePrint}
                      className="w-full inline-flex items-center justify-center px-4 py-2.5 rounded-xl text-xs font-bold bg-emerald-600 text-white hover:bg-emerald-700 transition shadow-xs cursor-pointer"
                    >
                      <Printer className="w-3.5 h-3.5 mr-2" />
                      Cetak / Simpan Bukti Tiket
                    </button>
                    <Link
                      href="/#form-lapor"
                      className="w-full inline-flex items-center justify-center px-4 py-2.5 rounded-xl text-xs font-bold bg-emerald-100 text-emerald-900 hover:bg-emerald-200 transition"
                    >
                      <Send className="w-3.5 h-3.5 mr-2" />
                      Kirim Laporan Lainnya
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-emerald-100 bg-white py-6 print:hidden">
        <div className="max-w-6xl mx-auto px-4 text-center text-xs text-slate-500">
          <p>
            © {new Date().getFullYear()} HumasMonitor — Sistem Informasi Aspirasi Publik & Transparansi Layanan Humas.
          </p>
        </div>
      </footer>

      {/* Lightbox Modal Zoom Foto Lampiran */}
      {zoomedImage && (
        <div
          onClick={() => setZoomedImage(null)}
          className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4 cursor-zoom-out animate-in fade-in duration-200 print:hidden"
        >
          <div className="relative max-w-4xl max-h-[90vh] flex flex-col items-center">
            <button
              type="button"
              onClick={() => setZoomedImage(null)}
              className="absolute -top-10 right-0 text-white hover:text-rose-400 p-1.5 rounded-full bg-black/50 hover:bg-black/80 transition"
              title="Tutup Pratinjau"
            >
              <X className="w-6 h-6" />
            </button>
            <img
              src={zoomedImage}
              alt="Perbesaran Lampiran Bukti"
              className="max-w-full max-h-[80vh] object-contain rounded-xl shadow-2xl border border-white/20"
              onClick={(e) => e.stopPropagation()}
            />
            <div
              className="mt-3 flex items-center gap-3 bg-slate-900/90 text-white px-4 py-2 rounded-xl border border-white/10 text-xs font-bold"
              onClick={(e) => e.stopPropagation()}
            >
              <a
                href={zoomedImage}
                download="lampiran-bukti-laporan"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 hover:text-emerald-400 transition"
              >
                <Download className="w-3.5 h-3.5" /> Unduh Gambar
              </a>
              <span>•</span>
              <button
                type="button"
                onClick={() => setZoomedImage(null)}
                className="hover:text-rose-400 transition cursor-pointer"
              >
                Tutup Pratinjau
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
