"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Radio,
  LogOut,
  Plus,
  Search,
  ExternalLink,
  Newspaper,
  TrendingUp,
  AlertTriangle,
  Smile,
  Meh,
  Frown,
  Filter,
  User as UserIcon,
  FileText,
  Building2,
  EyeOff,
  Eye,
  CheckCircle2,
  Clock,
  Send,
  AlertCircle,
  Loader2,
  RefreshCw,
  Share2,
  Flame,
  CheckCheck,
  Wrench,
  Laptop,
  Check,
  Zap,
  Settings,
  Copy,
  Globe,
  Sliders,
  ArrowUpDown,
  Calendar,
  Users,
  Palette,
  MessageSquare,
  Phone,
  Trash2,
  Edit3,
  ShieldCheck,
  ChevronRight,
  ChevronLeft,
  ChevronDown,
  ArrowUpRight,
  Sparkles,
  Pencil,
  Paperclip,
  Download,
  ZoomIn,
  X,
  Lock,
  Unlock,
  RotateCcw,
  ShieldAlert,
  Image as ImageIcon,
} from "lucide-react";

interface PublicReportItem {
  id: string;
  ticketNumber: string;
  title: string;
  category: string;
  content: string;
  targetUnit?: string | null;
  location?: string | null;
  attachmentName?: string | null;
  attachmentUrl?: string | null;
  isAnonymous: boolean;
  reporterName?: string | null;
  reporterContact?: string | null;
  status: "BARU" | "DIDISPOSISIKAN" | "SEDANG_DIPROSES" | "SELESAI" | "DITOLAK";
  urgency: "RENDAH" | "SEDANG" | "TINGGI" | "KRITIS";
  dispositionTo?: string | null;
  dispositionNote?: string | null;
  dispositionTargetPhone?: string | null;
  dispositionedAt?: string | null;
  categoryChangeNote?: string | null;
  categoryChangedAt?: string | null;
  categoryChangedBy?: string | null;
  responseNote?: string | null;
  respondedAt?: string | null;
  supervisorWarning?: string | null;
  supervisorWarningAt?: string | null;
  supervisorWarningBy?: string | null;
  supervisorWarningWaSent?: boolean;
  auditLogs?: ReportAuditLogItem[];
  createdAt: string;
}

interface ReportAuditLogItem {
  id: string;
  reportId: string;
  action: string;
  actorName: string;
  actorRole?: string | null;
  previousVal?: string | null;
  newVal?: string | null;
  previousColor?: string | null;
  newColor?: string | null;
  note?: string | null;
  createdAt: string;
}

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
  reporter?: {
    id?: string;
    name?: string | null;
    email?: string | null;
    role?: string | null;
  } | null;
}

interface CategoryConfigItem {
  id: string;
  name: string;
  code: string;
  color: string;
  bgLight?: string | null;
  textColor?: string | null;
  description?: string | null;
  orderIndex: number;
  isActive: boolean;
}

interface DepartmentContactItem {
  id: string;
  name: string;
  contactName?: string | null;
  phone: string;
  email?: string | null;
  description?: string | null;
  isActive: boolean;
}

interface WaTemplateItem {
  id: string;
  code: string;
  title: string;
  content: string;
  isActive: boolean;
}

interface WaBlastLogItem {
  id: string;
  ticketNumber?: string | null;
  department?: string | null;
  recipientPhone: string;
  recipientName?: string | null;
  message: string;
  status: string;
  gateway?: string | null;
  createdAt: string;
}

interface UserItem {
  id: string;
  name: string;
  email: string;
  role: string;
  createdAt: string;
}

// Tipe untuk Laporan Masuk Terpadu (Admin Humas)
interface UnifiedReportItem {
  id: string;
  ticketNumber: string;
  sourceType: "PUBLIC" | "INTERNAL";
  title: string;
  content: string;
  categoryCode: string;
  categoryLabel: string;
  categoryColor: string;
  categoryBgLight: string;
  categoryChangeNote?: string | null;
  categoryChangedAt?: string | null;
  categoryChangedBy?: string | null;
  reporterName: string;
  reporterContactOrRoom: string;
  isAnonymous?: boolean;
  urgency: "RENDAH" | "SEDANG" | "TINGGI" | "KRITIS";
  status: string;
  statusGroup: "BARU" | "PROSES" | "SELESAI" | "TERKENDALA";
  dispositionOrTechnician: string;
  dispositionNote?: string | null;
  dispositionTargetPhone?: string | null;
  responseNote?: string | null;
  technicianNotes?: string | null;
  supervisorWarning?: string | null;
  supervisorWarningAt?: string | null;
  supervisorWarningBy?: string | null;
  supervisorWarningWaSent?: boolean;
  auditLogs?: ReportAuditLogItem[];
  createdAt: string;
  rawPublic?: PublicReportItem;
  rawInternal?: InternalReportItem;
}

// 4 Warna Kategori Resmi Berdasarkan Tingkat Urgensi
const URGENCY_PRESET_COLORS = [
  {
    label: "Merah (Kritis)",
    color: "#DC2626",
    urgency: "KRITIS",
    desc: "Darurat / Etika Pegawai / Dugaan Pungli / Kasus Berat",
  },
  {
    label: "Kuning (Urgen)",
    color: "#D97706",
    urgency: "URGEN",
    desc: "Fasilitas & Sarana Gedung / Kerusakan Infrastruktur Vital",
  },
  {
    label: "Hijau (Minor)",
    color: "#059669",
    urgency: "MINOR",
    desc: "Pelayanan Publik, Loket Terpadu, Antrean & Sarana Non-Vital",
  },
  {
    label: "Biru (Informasi)",
    color: "#2563EB",
    urgency: "INFORMASI",
    desc: "Permohonan Informasi Publik (PPID) & Keterbukaan Data",
  },
];

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

  // Fallback untuk riwayat lama yang menyertakan delimiter "---" di dalam content
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

export default function DashboardPage() {
  const { data: session, status: sessionStatus } = useSession();
  const router = useRouter();
  const userRole = session?.user?.role?.toUpperCase();

  const tabInitializedRef = React.useRef(false);

  // Tab State: default disesuaikan dengan role
  const [activeTab, setActiveTab] = useState<
    "REPORTS" | "INTERNAL" | "SETTINGS" | "USERS" | "CATEGORIES" | "WA_BLAST"
  >("REPORTS");

  // Inisialisasi tab berdasarkan role login (hanya sekali saat session pertama kali siap)
  useEffect(() => {
    if (!session) return;
    const role = session?.user?.role?.toUpperCase();

    if (role === "TEKNISI") {
      router.push("/teknisi");
      return;
    } else if (role === "MANAJEMEN") {
      router.push("/manajemen");
      return;
    } else if (role === "STAFF") {
      router.push("/karyawan");
      return;
    }

    if (!tabInitializedRef.current) {
      if (role === "SUPERADMIN") {
        setActiveTab("SETTINGS");
      } else {
        setActiveTab("REPORTS");
      }
      tabInitializedRef.current = true;
    }
  }, [session, router]);

  // Pasang title dinamis sesuai role
  useEffect(() => {
    document.title =
      userRole === "SUPERADMIN"
        ? "Sistem Super Administrator - HumasMonitor"
        : "Pusat Komando & Disposisi Humas - HumasMonitor";
  }, [userRole]);

  // Auto-polling pembaruan data setiap 12 detik secara background tanpa kedip refresh
  useEffect(() => {
    const timer = setInterval(() => {
      fetchReports(true);
      fetchInternalReports(true);
    }, 12000);
    return () => clearInterval(timer);
  }, []);

  // ==========================================
  // STATE 1: LAPORAN PUBLIK & DISPOSISI (ADMIN HUMAS)
  // ==========================================
  const [reports, setReports] = useState<PublicReportItem[]>([]);
  const [isReportsLoading, setIsReportsLoading] = useState(true);

  // Kategori Dinamis & Warna
  const [categories, setCategories] = useState<CategoryConfigItem[]>([]);
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>("ALL");
  const [selectedColorFilter, setSelectedColorFilter] = useState<string>("ALL");

  // Filter & Sort Khusus Semua Laporan Masuk
  const [sourceFilter, setSourceFilter] = useState<"ALL" | "PUBLIC" | "INTERNAL">("ALL");
  const [dateSort, setDateSort] = useState<"NEWEST" | "OLDEST">("NEWEST");
  const [reportSearch, setReportSearch] = useState("");
  const [reportStatusFilter, setReportStatusFilter] = useState("ALL");
  const [reportUrgencyFilter, setReportUrgencyFilter] = useState("ALL");
  const [updatingUrgencyId, setUpdatingUrgencyId] = useState<string | null>(null);
  const [updatingCategoryId, setUpdatingCategoryId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

  // Modal Ubah Kategori Disertai Catatan (Admin Humas)
  const [selectedReportForCategoryChange, setSelectedReportForCategoryChange] = useState<PublicReportItem | null>(null);
  const [newCategorySelection, setNewCategorySelection] = useState<string>("");
  const [categoryChangeReason, setCategoryChangeReason] = useState<string>("");
  const [isSubmittingCategoryChange, setIsSubmittingCategoryChange] = useState(false);

  // Modal Disposisi Laporan Publik + WA Blast
  const [selectedReportForDisposition, setSelectedReportForDisposition] = useState<PublicReportItem | null>(null);
  const [dispositionUrgency, setDispositionUrgency] = useState<PublicReportItem["urgency"]>("SEDANG");
  const [departmentContacts, setDepartmentContacts] = useState<DepartmentContactItem[]>([]);
  const [selectedDepartmentName, setSelectedDepartmentName] = useState<string>("");
  const [customTarget, setCustomTarget] = useState("");
  const [dispositionTargetPhone, setDispositionTargetPhone] = useState<string>("");
  const [dispositionNote, setDispositionNote] = useState("");
  const [sendWaBlastOnDisposition, setSendWaBlastOnDisposition] = useState(true);
  const [isSubmittingDisposition, setIsSubmittingDisposition] = useState(false);

  // Modal Selesaikan Laporan Publik
  const [selectedReportForResolve, setSelectedReportForResolve] = useState<PublicReportItem | null>(null);
  const [resolveUrgency, setResolveUrgency] = useState<PublicReportItem["urgency"]>("SEDANG");
  const [resolveNote, setResolveNote] = useState("");
  const [isSubmittingResolve, setIsSubmittingResolve] = useState(false);

  // Modal Audit Trail / Linimasa Terpadu (Admin Humas)
  const [selectedReportForAuditTrail, setSelectedReportForAuditTrail] = useState<UnifiedReportItem | null>(null);

  // Modal Rincian & Aksi Terpadu (Admin Humas)
  const [selectedReportForDetailAction, setSelectedReportForDetailAction] = useState<UnifiedReportItem | null>(null);
  const [detailActiveTab, setDetailActiveTab] = useState<"DETAIL" | "DISPOSISI" | "KATEGORI" | "SELESAI" | "AUDIT">("DETAIL");
  const [selectedDepartmentNames, setSelectedDepartmentNames] = useState<string[]>([]);
  const [showReopenForm, setShowReopenForm] = useState(false);
  const [reopenReason, setReopenReason] = useState("");
  const [reopenTargetStatus, setReopenTargetStatus] = useState<string>("DIDISPOSISIKAN");
  const [isSubmittingReopen, setIsSubmittingReopen] = useState(false);
  const [zoomedImage, setZoomedImage] = useState<string | null>(null);

  // Penomoran Halaman (Pagination) & Smooth Refresh
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);
  const [isSilentRefreshing, setIsSilentRefreshing] = useState(false);

  // ==========================================
  // STATE 2: KENDALA KARYAWAN & TEKNISI
  // ==========================================
  const [internalReports, setInternalReports] = useState<InternalReportItem[]>([]);
  const [isInternalLoading, setIsInternalLoading] = useState(true);

  // ==========================================
  // STATE 3: KONFIGURASI SISTEM & SUPERADMIN
  // ==========================================
  const [settings, setSettings] = useState({
    institutionName: "Dinas Komunikasi, Informatika dan Humas",
    institutionTagline: "Sistem Informasi Monitoring Humas, Aduan Publik & Kendala Fasilitas Terpadu",
    publicModuleActive: true,
    employeeModuleActive: true,
    technicianModuleActive: true,
    availableTechnicians:
      "Unit Teknisi Jaringan & IT,Unit Teknisi Hardware & Komputer,Unit Teknisi Tata Udara & AC,Unit Teknisi Listrik & Mekanikal,Unit Teknisi Audio Visual & Multimedia,Unit Teknisi Sarana Prasarana Gedung",
    systemAnnouncement: "Layanan pengaduan masyarakat publik dan kendala ruangan internal beroperasi 24/7.",
    waGatewayEnabled: true,
    waGatewayProvider: "SAUNG_WA",
    waGatewayUrl: "https://app.saungwa.com/api/create-message",
    waApiKey: "",
    waSenderNumber: "",
    waAppKey: "",
    waAuthKey: "",
  });
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const [copiedLink, setCopiedLink] = useState<string | null>(null);

  // ==========================================
  // STATE 4: SUPERADMIN - SETTING AKUN PENGGUNA
  // ==========================================
  const [usersList, setUsersList] = useState<UserItem[]>([]);
  const [isUsersLoading, setIsUsersLoading] = useState(false);
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [newUserName, setNewUserName] = useState("");
  const [newUserEmail, setNewUserEmail] = useState("");
  const [newUserPassword, setNewUserPassword] = useState("");
  const [newUserRole, setNewUserRole] = useState("STAFF");
  const [isSubmittingUser, setIsSubmittingUser] = useState(false);

  // Modal Edit Akun Pengguna (Superadmin)
  const [editingUser, setEditingUser] = useState<UserItem | null>(null);
  const [editUserName, setEditUserName] = useState("");
  const [editUserEmail, setEditUserEmail] = useState("");
  const [editUserPassword, setEditUserPassword] = useState("");
  const [editUserRole, setEditUserRole] = useState("STAFF");
  const [showEditPassword, setShowEditPassword] = useState(false);
  const [isSubmittingEditUser, setIsSubmittingEditUser] = useState(false);

  // ==========================================
  // STATE 5: SUPERADMIN - PEWARNAAN KATEGORI
  // ==========================================
  const [showAddCategoryModal, setShowAddCategoryModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<CategoryConfigItem | null>(null);
  const [catNameInput, setCatNameInput] = useState("");
  const [catCodeInput, setCatCodeInput] = useState("");
  const [catColorInput, setCatColorInput] = useState("#2563EB");
  const [catDescInput, setCatDescInput] = useState("");
  const [isSubmittingCategory, setIsSubmittingCategory] = useState(false);

  // ==========================================
  // STATE 6: SUPERADMIN - WA BLAST (SAUNG WA)
  // ==========================================
  const [waTemplates, setWaTemplates] = useState<WaTemplateItem[]>([]);
  const [waLogs, setWaLogs] = useState<WaBlastLogItem[]>([]);
  const [editingTemplate, setEditingTemplate] = useState<WaTemplateItem | null>(null);
  const [tplContentInput, setTplContentInput] = useState("");
  const [tplTitleInput, setTplTitleInput] = useState("");
  const [isSavingTemplate, setIsSavingTemplate] = useState(false);

  // Uji Coba & Gateway WA Blast
  const [testWaPhone, setTestWaPhone] = useState("");
  const [testWaMessage, setTestWaMessage] = useState(
    "Halo, ini pesan uji coba integrasi API Saung WA dari Sistem Informasi Monitoring Humas."
  );
  const [isSendingTestWa, setIsSendingTestWa] = useState(false);
  const [testWaResult, setTestWaResult] = useState<{
    success: boolean;
    message: string;
    response?: any;
  } | null>(null);
  const [isSavingGateway, setIsSavingGateway] = useState(false);

  // Kontak Bidang CRUD
  const [showAddContactModal, setShowAddContactModal] = useState(false);
  const [contactNameInput, setContactNameInput] = useState("");
  const [contactPicInput, setContactPicInput] = useState("");
  const [contactPhoneInput, setContactPhoneInput] = useState("");
  const [contactEmailInput, setContactEmailInput] = useState("");
  const [editingContactId, setEditingContactId] = useState<string | null>(null);
  const [isSubmittingContact, setIsSubmittingContact] = useState(false);

  // ==========================================
  // DATA FETCHING
  // ==========================================
  const fetchReports = async (isBackground = false) => {
    if (!isBackground && reports.length === 0) {
      setIsReportsLoading(true);
    }
    if (isBackground) {
      setIsSilentRefreshing(true);
    }
    try {
      const res = await fetch("/api/reports");
      if (res.ok) {
        const data = await res.json();
        setReports(data.reports || []);
      }
    } catch (err) {
      console.error("Gagal memuat laporan publik", err);
    } finally {
      setIsReportsLoading(false);
      setIsSilentRefreshing(false);
    }
  };

  const fetchInternalReports = async (isBackground = false) => {
    if (!isBackground && internalReports.length === 0) {
      setIsInternalLoading(true);
    }
    try {
      const res = await fetch("/api/internal-reports");
      if (res.ok) {
        const data = await res.json();
        setInternalReports(data.reports || []);
      }
    } catch (err) {
      console.error("Gagal memuat laporan kendala ruangan karyawan", err);
    } finally {
      setIsInternalLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await fetch("/api/categories");
      if (res.ok) {
        const data = await res.json();
        setCategories(data.categories || []);
      }
    } catch (err) {
      console.error("Gagal memuat kategori:", err);
    }
  };

  const fetchWaData = async () => {
    try {
      const res = await fetch("/api/wa-blast");
      if (res.ok) {
        const data = await res.json();
        setWaTemplates(data.templates || []);
        setDepartmentContacts(data.contacts || []);
        setWaLogs(data.logs || []);
        if (data.contacts && data.contacts.length > 0 && !selectedDepartmentName) {
          setSelectedDepartmentName(data.contacts[0].name);
          setDispositionTargetPhone(data.contacts[0].phone);
        }
        if (data.settings) {
          setSettings((prev) => ({
            ...prev,
            waGatewayEnabled: data.settings.waGatewayEnabled ?? true,
            waGatewayProvider: data.settings.waGatewayProvider || "SAUNG_WA",
            waGatewayUrl: data.settings.waGatewayUrl || "https://app.saungwa.com/api/create-message",
            waApiKey: data.settings.waApiKey || "",
            waSenderNumber: data.settings.waSenderNumber || "",
            waAppKey: data.settings.waAppKey || "",
            waAuthKey: data.settings.waAuthKey || "",
          }));
        }
      }
    } catch (err) {
      console.error("Gagal memuat konfigurasi WA Blast:", err);
    }
  };

  const fetchSettings = async () => {
    try {
      const res = await fetch("/api/settings");
      if (res.ok) {
        const data = await res.json();
        setSettings({
          institutionName: data.institutionName || "",
          institutionTagline: data.institutionTagline || "",
          publicModuleActive: data.publicModuleActive ?? true,
          employeeModuleActive: data.employeeModuleActive ?? true,
          technicianModuleActive: data.technicianModuleActive ?? true,
          availableTechnicians: data.availableTechnicians || "",
          systemAnnouncement: data.systemAnnouncement || "",
          waGatewayEnabled: data.waGatewayEnabled ?? true,
          waGatewayProvider: data.waGatewayProvider || "SAUNG_WA",
          waGatewayUrl: data.waGatewayUrl || "https://app.saungwa.com/api/create-message",
          waApiKey: data.waApiKey || "",
          waSenderNumber: data.waSenderNumber || "",
          waAppKey: data.waAppKey || "",
          waAuthKey: data.waAuthKey || "",
        });
      }
    } catch (err) {
      console.error("Gagal memuat pengaturan sistem", err);
    }
  };

  const fetchUsers = async () => {
    if (userRole !== "SUPERADMIN") return;
    setIsUsersLoading(true);
    try {
      const res = await fetch("/api/users");
      if (res.ok) {
        const data = await res.json();
        setUsersList(data.users || []);
      }
    } catch (err) {
      console.error("Gagal memuat pengguna:", err);
    } finally {
      setIsUsersLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
    fetchInternalReports();
    fetchCategories();
    fetchWaData();
    fetchSettings();
  }, []);

  useEffect(() => {
    if (activeTab === "USERS" && userRole === "SUPERADMIN") {
      fetchUsers();
    }
  }, [activeTab, userRole]);

  // Efek ganti pilihan bidang di modal disposisi -> otomatis pasang nomor WA
  useEffect(() => {
    if (selectedDepartmentName) {
      const matched = departmentContacts.find((c) => c.name === selectedDepartmentName);
      if (matched) {
        setDispositionTargetPhone(matched.phone);
      }
    }
  }, [selectedDepartmentName, departmentContacts]);

  const showToast = (text: string, type: "success" | "error" = "success") => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 4500);
  };

  // Helper Warna Kategori
  const getCategoryMeta = (categoryCode: string) => {
    const matched = categories.find((c) => c.code === categoryCode);
    if (matched) {
      return {
        name: matched.name,
        color: matched.color,
        bgLight: matched.bgLight || "bg-slate-100 text-slate-800 border-slate-200",
      };
    }
    return {
      name: categoryCode.replace(/_/g, " "),
      color: "#475569",
      bgLight: "bg-slate-100 text-slate-800 border-slate-200",
    };
  };

  // Helper memetakan warna hex kategori ke grup warna urgensi
  const getColorGroupKey = (hexColor: string) => {
    const c = (hexColor || "").toLowerCase();
    if (
      c.includes("dc2626") ||
      c.includes("ef4444") ||
      c.includes("e11d48") ||
      c.includes("b91c1c") ||
      c.includes("red")
    ) {
      return "RED";
    }
    if (
      c.includes("d97706") ||
      c.includes("f59e0b") ||
      c.includes("eab308") ||
      c.includes("ca8a04") ||
      c.includes("yellow") ||
      c.includes("amber")
    ) {
      return "YELLOW";
    }
    if (
      c.includes("059669") ||
      c.includes("10b981") ||
      c.includes("16a34a") ||
      c.includes("15803d") ||
      c.includes("green") ||
      c.includes("emerald")
    ) {
      return "GREEN";
    }
    if (
      c.includes("2563eb") ||
      c.includes("3b82f6") ||
      c.includes("0284c7") ||
      c.includes("1d4ed8") ||
      c.includes("blue")
    ) {
      return "BLUE";
    }
    return c || "OTHER";
  };

  // ==========================================
  // GABUNGKAN SEMUA LAPORAN MASUK (ADMIN HUMAS)
  // ==========================================
  const filteredUnifiedReports = useMemo(() => {
    const publicList: UnifiedReportItem[] = reports.map((r) => {
      const meta = getCategoryMeta(r.category);
      return {
        id: r.id,
        ticketNumber: r.ticketNumber,
        sourceType: "PUBLIC",
        title: r.title,
        content: r.content,
        categoryCode: r.category,
        categoryLabel: meta.name,
        categoryColor: meta.color,
        categoryBgLight: meta.bgLight,
        categoryChangeNote: r.categoryChangeNote,
        categoryChangedAt: r.categoryChangedAt,
        categoryChangedBy: r.categoryChangedBy,
        reporterName: r.isAnonymous ? "Anonim" : r.reporterName || "Masyarakat",
        reporterContactOrRoom: r.reporterContact || "-",
        isAnonymous: r.isAnonymous,
        urgency: r.urgency,
        status: r.status,
        statusGroup:
          r.status === "BARU"
            ? "BARU"
            : r.status === "SELESAI"
            ? "SELESAI"
            : r.status === "DITOLAK"
            ? "TERKENDALA"
            : "PROSES",
        dispositionOrTechnician: r.dispositionTo || "Belum Disposisi",
        dispositionNote: r.dispositionNote,
        dispositionTargetPhone: r.dispositionTargetPhone,
        responseNote: r.responseNote,
        supervisorWarning: r.supervisorWarning,
        supervisorWarningAt: r.supervisorWarningAt,
        supervisorWarningBy: r.supervisorWarningBy,
        supervisorWarningWaSent: r.supervisorWarningWaSent,
        auditLogs: r.auditLogs || [],
        createdAt: r.createdAt,
        rawPublic: r,
      };
    });

    const internalList: UnifiedReportItem[] = internalReports.map((ir) => ({
      id: ir.id,
      ticketNumber: ir.ticketNumber,
      sourceType: "INTERNAL",
      title: ir.title,
      content: ir.description,
      categoryCode: "INTERNAL_KENDALA",
      categoryLabel: ir.techCategory?.replace(/_/g, " ") || "KENDALA TEKNIS",
      categoryColor: "#7C3AED",
      categoryBgLight: "bg-purple-50 text-purple-800 border-purple-200",
      reporterName: ir.reporter?.name || "Karyawan Internal",
      reporterContactOrRoom: ir.roomLocation,
      isAnonymous: false,
      urgency: ir.urgency,
      status: ir.status,
      statusGroup:
        ir.status === "TERKIRIM"
          ? "BARU"
          : ir.status === "SELESAI"
          ? "SELESAI"
          : ir.status === "TERKENDALA"
          ? "TERKENDALA"
          : "PROSES",
      dispositionOrTechnician: ir.targetTechnician,
      dispositionNote: null,
      responseNote: ir.technicianNotes,
      technicianNotes: ir.technicianNotes,
      createdAt: ir.createdAt,
      rawInternal: ir,
    }));

    let combined = [...publicList, ...internalList];

    // Filter Cara Masuk
    if (sourceFilter === "PUBLIC") {
      combined = combined.filter((item) => item.sourceType === "PUBLIC");
    } else if (sourceFilter === "INTERNAL") {
      combined = combined.filter((item) => item.sourceType === "INTERNAL");
    }

    // Filter Kategori Berwarna
    if (selectedCategoryFilter !== "ALL") {
      combined = combined.filter((item) => item.categoryCode === selectedCategoryFilter);
    }

    // Filter Berdasarkan Grup Warna yang Dipilih di Rekap
    if (selectedColorFilter !== "ALL") {
      combined = combined.filter((item) => {
        const itemColorGroup = getColorGroupKey(item.categoryColor);
        return itemColorGroup === selectedColorFilter;
      });
    }

    // Filter Status
    if (reportStatusFilter !== "ALL") {
      combined = combined.filter((item) => item.statusGroup === reportStatusFilter);
    }

    // Filter Urgensi
    if (reportUrgencyFilter !== "ALL") {
      combined = combined.filter((item) => item.urgency === reportUrgencyFilter);
    }

    // Pencarian Teks Bebas
    if (reportSearch.trim()) {
      const q = reportSearch.toLowerCase();
      combined = combined.filter(
        (item) =>
          item.ticketNumber.toLowerCase().includes(q) ||
          item.title.toLowerCase().includes(q) ||
          item.content.toLowerCase().includes(q) ||
          item.reporterName.toLowerCase().includes(q) ||
          item.reporterContactOrRoom.toLowerCase().includes(q) ||
          item.dispositionOrTechnician.toLowerCase().includes(q)
      );
    }

    // Sortir Tanggal
    combined.sort((a, b) => {
      const timeA = new Date(a.createdAt).getTime();
      const timeB = new Date(b.createdAt).getTime();
      return dateSort === "NEWEST" ? timeB - timeA : timeA - timeB;
    });

    return combined;
  }, [
    reports,
    internalReports,
    categories,
    sourceFilter,
    selectedCategoryFilter,
    selectedColorFilter,
    reportStatusFilter,
    reportUrgencyFilter,
    reportSearch,
  ]);

  // ==========================================
  // PENOMORAN HALAMAN (PAGINATION) LAPORAN
  // ==========================================
  const totalReports = filteredUnifiedReports.length;
  const totalPages = Math.max(1, Math.ceil(totalReports / pageSize));

  // Reset halaman ke 1 setiap kali filter atau pencarian berubah
  useEffect(() => {
    setCurrentPage(1);
  }, [
    sourceFilter,
    selectedCategoryFilter,
    selectedColorFilter,
    reportStatusFilter,
    reportUrgencyFilter,
    reportSearch,
    dateSort,
    pageSize,
  ]);

  const paginatedUnifiedReports = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredUnifiedReports.slice(start, start + pageSize);
  }, [filteredUnifiedReports, currentPage, pageSize]);

  // Fungsi helper membuat penomoran halaman yang cerdas (e.g. 1, 2, 3 ... 10)
  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    if (totalPages <= 5) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      if (currentPage <= 3) {
        pages.push(1, 2, 3, 4, "...", totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1, "...", totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
      } else {
        pages.push(1, "...", currentPage - 1, currentPage, currentPage + 1, "...", totalPages);
      }
    }
    return pages;
  };

  // Helper Buka Modal Rincian & Aksi Terpadu
  const openDetailModal = (
    item: UnifiedReportItem,
    tab: "DETAIL" | "DISPOSISI" | "KATEGORI" | "SELESAI" | "AUDIT" = "DETAIL"
  ) => {
    setSelectedReportForDetailAction(item);
    setDetailActiveTab(tab);
    setShowReopenForm(false);
    setReopenReason("");
    setReopenTargetStatus("DIDISPOSISIKAN");
    if (item.rawPublic) {
      setNewCategorySelection(item.rawPublic.category);
      setCategoryChangeReason(item.rawPublic.categoryChangeNote || "");
      setDispositionUrgency(item.rawPublic.urgency);
      setDispositionNote(item.rawPublic.dispositionNote || "");
      setResolveUrgency(item.rawPublic.urgency);
      setResolveNote(item.rawPublic.responseNote || "");
      setCustomTarget("");

      // Inisialisasi daftar bidang & nomor WA yang telah terdisposisi sebelumnya
      if (item.rawPublic.dispositionTo && item.rawPublic.dispositionTo !== "Belum Disposisi") {
        const depts = item.rawPublic.dispositionTo
          .split(",")
          .map((d) => d.trim())
          .filter(Boolean);
        setSelectedDepartmentNames(depts);
        setDispositionTargetPhone(item.rawPublic.dispositionTargetPhone || "");
      } else if (departmentContacts.length > 0) {
        setSelectedDepartmentNames([departmentContacts[0].name]);
        setDispositionTargetPhone(departmentContacts[0].phone || "");
      } else {
        setSelectedDepartmentNames([]);
        setDispositionTargetPhone("");
      }
    }
  };

  // Helper centang/batalkan centang bidang tujuan disposisi & otomatis sinkronkan nomor WA
  const handleToggleDepartment = (deptName: string) => {
    setSelectedDepartmentNames((prev) => {
      const next = prev.includes(deptName)
        ? prev.filter((d) => d !== deptName)
        : [...prev, deptName];

      // Kumpulkan semua nomor telepon dari bidang-bidang yang terpilih
      const phones: string[] = [];
      next.forEach((name) => {
        const contact = departmentContacts.find((c) => c.name === name);
        if (contact && contact.phone) {
          const splitPhones = contact.phone
            .split(/[,;\n]+/)
            .map((p) => p.trim())
            .filter(Boolean);
          splitPhones.forEach((p) => {
            if (!phones.includes(p)) phones.push(p);
          });
        }
      });
      setDispositionTargetPhone(phones.join(", "));
      return next;
    });
  };

  // Handler Superadmin: Buka Modal & Update Akun Pengguna
  const handleOpenEditUser = (usr: UserItem) => {
    setEditingUser(usr);
    setEditUserName(usr.name);
    setEditUserEmail(usr.email);
    setEditUserPassword("");
    setEditUserRole(usr.role);
    setShowEditPassword(false);
  };

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    setIsSubmittingEditUser(true);
    try {
      const payload: any = {
        name: editUserName.trim(),
        email: editUserEmail.toLowerCase().trim(),
        role: editUserRole,
      };
      if (editUserPassword && editUserPassword.trim().length > 0) {
        payload.password = editUserPassword.trim();
      }

      const res = await fetch(`/api/users/${editingUser.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (res.ok) {
        showToast(data.message || "Data akun pengguna berhasil diperbarui.");
        setEditingUser(null);
        fetchUsers();
      } else {
        showToast(data.error || "Gagal memperbarui data akun.", "error");
      }
    } catch {
      showToast("Terjadi kesalahan koneksi saat memperbarui akun.", "error");
    } finally {
      setIsSubmittingEditUser(false);
    }
  };

  // Statistik Terpadu Admin Humas
  const totalAllIncoming = reports.length + internalReports.length;
  const countPublic = reports.length;
  const countInternal = internalReports.length;
  const countCritical =
    reports.filter((r) => r.urgency === "KRITIS").length +
    internalReports.filter((r) => r.urgency === "KRITIS").length;
  const countNeedAction =
    reports.filter((r) => r.status === "BARU").length +
    internalReports.filter((r) => r.status === "TERKIRIM").length;

  // Hitung Aduan per Warna Kategori untuk Rekap (Bukan Berdasarkan Kategori)
  // Standar: Merah (Kritis), Kuning (Urgen), Hijau (Minor), Biru (Informasi)
  const colorRecapList = useMemo(() => {
    const groups: Record<
      string,
      {
        key: string;
        title: string;
        shortLabel: string;
        urgency: string;
        color: string;
        bgLight: string;
        categories: string[];
        count: number;
        active: number;
        done: number;
      }
    > = {
      RED: {
        key: "RED",
        title: "Kategori Warna Merah (Kritis)",
        shortLabel: "Merah (Kritis)",
        urgency: "KRITIS",
        color: "#DC2626",
        bgLight: "bg-rose-50 text-rose-800 border-rose-200",
        categories: [],
        count: 0,
        active: 0,
        done: 0,
      },
      YELLOW: {
        key: "YELLOW",
        title: "Kategori Warna Kuning (Urgen)",
        shortLabel: "Kuning (Urgen)",
        urgency: "URGEN",
        color: "#D97706",
        bgLight: "bg-amber-50 text-amber-800 border-amber-200",
        categories: [],
        count: 0,
        active: 0,
        done: 0,
      },
      GREEN: {
        key: "GREEN",
        title: "Kategori Warna Hijau (Minor)",
        shortLabel: "Hijau (Minor)",
        urgency: "MINOR",
        color: "#059669",
        bgLight: "bg-emerald-50 text-emerald-800 border-emerald-200",
        categories: [],
        count: 0,
        active: 0,
        done: 0,
      },
      BLUE: {
        key: "BLUE",
        title: "Kategori Warna Biru (Informasi)",
        shortLabel: "Biru (Informasi)",
        urgency: "INFORMASI",
        color: "#2563EB",
        bgLight: "bg-blue-50 text-blue-700 border-blue-200",
        categories: [],
        count: 0,
        active: 0,
        done: 0,
      },
    };

    // Petakan nama kategori ke masing-masing grup warna
    categories.forEach((cat) => {
      const gKey = getColorGroupKey(cat.color);
      if (!groups[gKey]) {
        groups[gKey] = {
          key: gKey,
          title: `Kategori Warna ${cat.name}`,
          shortLabel: cat.name,
          urgency: "LAINNYA",
          color: cat.color,
          bgLight: cat.bgLight || "bg-slate-100 text-slate-800 border-slate-200",
          categories: [],
          count: 0,
          active: 0,
          done: 0,
        };
      }
      if (!groups[gKey].categories.includes(cat.name)) {
        groups[gKey].categories.push(cat.name);
      }
    });

    // Hitung aduan masuk berdasarkan warna kategori
    reports.forEach((r) => {
      const matchedCat = categories.find((c) => c.code === r.category);
      const hexColor = matchedCat?.color || "#475569";
      const gKey = getColorGroupKey(hexColor);
      const grp = groups[gKey] || groups["GREEN"];

      grp.count += 1;
      if (r.status === "SELESAI") {
        grp.done += 1;
      } else if (
        r.status === "BARU" ||
        r.status === "DIDISPOSISIKAN" ||
        r.status === "SEDANG_DIPROSES"
      ) {
        grp.active += 1;
      }
    });

    // Selalu tampilkan 3 grup warna utama (Merah, Kuning, Hijau)
    // Serta tampilkan Biru atau warna custom jika ada kategori atau aduan
    return Object.values(groups).filter((g) => {
      if (g.key === "RED" || g.key === "YELLOW" || g.key === "GREEN") return true;
      return g.categories.length > 0 || g.count > 0;
    });
  }, [categories, reports]);

  // ==========================================
  // HANDLERS ADMIN HUMAS
  // ==========================================

  // Handler Aksi dari Modal Terpadu (Detail & Kelola Laporan)
  const handleDetailModalDisposition = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedReportForDetailAction?.rawPublic) return;
    const targetReport = selectedReportForDetailAction.rawPublic;

    // Kunci jika laporan sudah selesai dan user bukan SUPERADMIN
    if (targetReport.status === "SELESAI" && userRole !== "SUPERADMIN") {
      alert("Laporan ini sudah berstatus SELESAI dan terkunci. Perubahan disposisi tidak diizinkan.");
      return;
    }

    const allSelectedDepts = [...selectedDepartmentNames];
    if (customTarget.trim() && !allSelectedDepts.includes(customTarget.trim())) {
      allSelectedDepts.push(customTarget.trim());
    }

    if (allSelectedDepts.length === 0) {
      alert("Pilih minimal satu bidang atau masukkan instansi tujuan disposisi.");
      return;
    }

    const targetDept = allSelectedDepts.join(", ");

    setIsSubmittingDisposition(true);
    try {
      const resReport = await fetch(`/api/reports/${targetReport.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "DISPOSE",
          dispositionTo: targetDept,
          dispositionNote: dispositionNote.trim() || "Mohon ditindaklanjuti sesuai kewenangan bidang.",
          dispositionTargetPhone: dispositionTargetPhone.trim() || null,
          urgency: dispositionUrgency,
        }),
      });

      if (!resReport.ok) {
        const errJson = await resReport.json().catch(() => null);
        throw new Error(errJson?.error || "Gagal menyimpan data disposisi.");
      }

      setReports((prev) =>
        prev.map((r) =>
          r.id === targetReport.id
            ? {
                ...r,
                status: "DIDISPOSISIKAN",
                targetUnit: targetDept,
                dispositionTo: targetDept,
                dispositionNote: dispositionNote.trim() || "Mohon ditindaklanjuti sesuai kewenangan bidang.",
                dispositionTargetPhone: dispositionTargetPhone.trim() || null,
                dispositionedAt: new Date().toISOString(),
                urgency: dispositionUrgency,
              }
            : r
        )
      );

      setSelectedReportForDetailAction((prev) =>
        prev
          ? {
              ...prev,
              status: "DIDISPOSISIKAN",
              statusGroup: "PROSES",
              dispositionOrTechnician: targetDept,
              dispositionNote: dispositionNote.trim(),
              dispositionTargetPhone: dispositionTargetPhone.trim(),
              urgency: dispositionUrgency,
              rawPublic: prev.rawPublic
                ? {
                    ...prev.rawPublic,
                    status: "DIDISPOSISIKAN",
                    targetUnit: targetDept,
                    dispositionTo: targetDept,
                    dispositionNote: dispositionNote.trim(),
                    dispositionTargetPhone: dispositionTargetPhone.trim(),
                    urgency: dispositionUrgency,
                    dispositionedAt: new Date().toISOString(),
                  }
                : undefined,
            }
          : null
      );

      let waBlastSuccess = false;
      if (sendWaBlastOnDisposition && dispositionTargetPhone.trim()) {
        try {
          const resWa = await fetch("/api/wa-blast", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              ticketNumber: targetReport.ticketNumber,
              department: targetDept,
              recipientPhone: dispositionTargetPhone.trim(),
              templateCode: "DISPOSISI_BIDANG",
              reportTitle: targetReport.title,
              category: targetReport.category,
              categoryLabel: getCategoryMeta(targetReport.category).name,
              urgency: dispositionUrgency,
              note: dispositionNote.trim(),
            }),
          });
          const waResult = await resWa.json();
          waBlastSuccess = waResult.success;
        } catch (waErr) {
          console.warn("Trigger WA Blast gagal dijalankan:", waErr);
        }
      }

      showToast(
        `Disposisi tiket ${targetReport.ticketNumber} ke ${targetDept} berhasil disimpan! ${
          waBlastSuccess ? "Pesan WA Blast terkirim ke kontak tujuan." : ""
        }`
      );
      setDetailActiveTab("DETAIL");
      fetchReports(true);
      fetchWaData();
    } catch (err: any) {
      showToast(err.message || "Gagal memproses disposisi.", "error");
    } finally {
      setIsSubmittingDisposition(false);
    }
  };

  const handleDetailModalCategoryChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedReportForDetailAction?.rawPublic || !newCategorySelection) return;
    const targetReport = selectedReportForDetailAction.rawPublic;

    // Kunci jika laporan sudah selesai dan user bukan SUPERADMIN
    if (targetReport.status === "SELESAI" && userRole !== "SUPERADMIN") {
      alert("Laporan ini sudah berstatus SELESAI dan terkunci. Perubahan kategori tidak diizinkan.");
      return;
    }

    if (!categoryChangeReason.trim()) {
      alert("Catatan alasan perubahan kategori wajib diisi.");
      return;
    }

    setIsSubmittingCategoryChange(true);
    try {
      const res = await fetch(`/api/reports/${targetReport.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "CHANGE_CATEGORY",
          category: newCategorySelection,
          categoryChangeNote: categoryChangeReason.trim(),
        }),
      });

      if (res.ok) {
        showToast(`Kategori tiket ${targetReport.ticketNumber} berhasil diubah.`);
        const catMeta = getCategoryMeta(newCategorySelection);
        setReports((prev) =>
          prev.map((r) =>
            r.id === targetReport.id
              ? {
                  ...r,
                  category: newCategorySelection,
                  categoryChangeNote: categoryChangeReason.trim(),
                  categoryChangedAt: new Date().toISOString(),
                  categoryChangedBy: session?.user?.name || "Admin Humas",
                }
              : r
          )
        );

        setSelectedReportForDetailAction((prev) =>
          prev
            ? {
                ...prev,
                categoryCode: newCategorySelection,
                categoryLabel: catMeta.name,
                categoryColor: catMeta.color,
                categoryBgLight: catMeta.bgLight,
                categoryChangeNote: categoryChangeReason.trim(),
                categoryChangedAt: new Date().toISOString(),
                categoryChangedBy: session?.user?.name || "Admin Humas",
                rawPublic: prev.rawPublic
                  ? {
                      ...prev.rawPublic,
                      category: newCategorySelection,
                      categoryChangeNote: categoryChangeReason.trim(),
                      categoryChangedAt: new Date().toISOString(),
                      categoryChangedBy: session?.user?.name || "Admin Humas",
                    }
                  : undefined,
              }
            : null
        );

        setDetailActiveTab("DETAIL");
        fetchReports(true);
      } else {
        const errData = await res.json().catch(() => null);
        showToast(errData?.error || "Gagal mengubah kategori.", "error");
      }
    } catch {
      showToast("Terjadi kesalahan saat mengubah kategori.", "error");
    } finally {
      setIsSubmittingCategoryChange(false);
    }
  };

  const handleDetailModalResolve = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedReportForDetailAction?.rawPublic) return;
    const targetReport = selectedReportForDetailAction.rawPublic;

    // Jika sudah selesai dan bukan SUPERADMIN
    if (targetReport.status === "SELESAI" && userRole !== "SUPERADMIN") {
      alert("Laporan ini sudah diselesaikan sebelumnya.");
      return;
    }

    if (!resolveNote.trim()) {
      alert("Catatan respon penyelesaian resmi wajib diisi.");
      return;
    }

    setIsSubmittingResolve(true);
    try {
      const res = await fetch(`/api/reports/${targetReport.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "RESOLVE",
          status: "SELESAI",
          urgency: resolveUrgency,
          responseNote: resolveNote.trim(),
        }),
      });

      if (res.ok) {
        showToast(
          `Laporan ${targetReport.ticketNumber} tuntas diselesaikan. Respon resmi telah diterbitkan.`
        );
        setReports((prev) =>
          prev.map((r) =>
            r.id === targetReport.id
              ? {
                  ...r,
                  status: "SELESAI",
                  urgency: resolveUrgency,
                  responseNote: resolveNote.trim(),
                  respondedAt: new Date().toISOString(),
                }
              : r
          )
        );

        setSelectedReportForDetailAction((prev) =>
          prev
            ? {
                ...prev,
                status: "SELESAI",
                statusGroup: "SELESAI",
                urgency: resolveUrgency,
                responseNote: resolveNote.trim(),
                rawPublic: prev.rawPublic
                  ? {
                      ...prev.rawPublic,
                      status: "SELESAI",
                      urgency: resolveUrgency,
                      responseNote: resolveNote.trim(),
                      respondedAt: new Date().toISOString(),
                    }
                  : undefined,
              }
            : null
        );

        setDetailActiveTab("DETAIL");
        fetchReports(true);
      } else {
        const errData = await res.json().catch(() => null);
        showToast(errData?.error || "Gagal menyelesaikan laporan.", "error");
      }
    } catch {
      showToast("Terjadi kesalahan saat menyelesaikan laporan.", "error");
    } finally {
      setIsSubmittingResolve(false);
    }
  };

  // Handler Super Admin: Membatalkan Status Selesai (Buka Kembali Tiket / Re-open Sesuai SOP)
  const handleReopenReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedReportForDetailAction?.rawPublic) return;
    const targetReport = selectedReportForDetailAction.rawPublic;

    if (userRole !== "SUPERADMIN") {
      alert("Hanya Super Administrator yang berwenang membatalkan status selesai.");
      return;
    }

    if (!reopenReason.trim()) {
      alert("Alasan pembatalan status selesai (sesuai SOP) wajib diisi.");
      return;
    }

    setIsSubmittingReopen(true);
    try {
      const res = await fetch(`/api/reports/${targetReport.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "REOPEN",
          targetStatus: reopenTargetStatus,
          cancelReason: reopenReason.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Gagal membatalkan status selesai.");
      }

      showToast(`Status selesai tiket ${targetReport.ticketNumber} berhasil dibatalkan.`);
      setShowReopenForm(false);
      setReopenReason("");

      // Update state laporan lokal
      setReports((prev) =>
        prev.map((r) =>
          r.id === targetReport.id
            ? {
                ...r,
                status: (reopenTargetStatus as any) || "DIDISPOSISIKAN",
                responseNote: null,
                respondedAt: null,
              }
            : r
        )
      );

      setSelectedReportForDetailAction((prev) =>
        prev
          ? {
              ...prev,
              status: (reopenTargetStatus as any) || "DIDISPOSISIKAN",
              statusGroup: "PROSES",
              responseNote: null,
              rawPublic: prev.rawPublic
                ? {
                    ...prev.rawPublic,
                    status: (reopenTargetStatus as any) || "DIDISPOSISIKAN",
                    responseNote: null,
                    respondedAt: null,
                  }
                : undefined,
            }
          : null
      );

      setDetailActiveTab("DETAIL");
      fetchReports(true);
    } catch (err: any) {
      showToast(err.message || "Gagal membatalkan status selesai.", "error");
    } finally {
      setIsSubmittingReopen(false);
    }
  };

  // 1. Ubah Kategori Disertai Catatan Alasan
  const handleSubmitCategoryChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedReportForCategoryChange || !newCategorySelection) return;

    if (!categoryChangeReason.trim()) {
      alert("Catatan alasan perubahan kategori wajib diisi.");
      return;
    }

    setIsSubmittingCategoryChange(true);
    try {
      const res = await fetch(`/api/reports/${selectedReportForCategoryChange.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "CHANGE_CATEGORY",
          category: newCategorySelection,
          categoryChangeNote: categoryChangeReason.trim(),
        }),
      });

      if (res.ok) {
        showToast(
          `Kategori tiket ${selectedReportForCategoryChange.ticketNumber} berhasil diubah dengan catatan.`
        );
        // Pembaruan instan tanpa refresh
        setReports((prev) =>
          prev.map((r) =>
            r.id === selectedReportForCategoryChange.id
              ? {
                  ...r,
                  category: newCategorySelection,
                  categoryChangeNote: categoryChangeReason.trim(),
                  categoryChangedAt: new Date().toISOString(),
                  categoryChangedBy: session?.user?.name || "Admin Humas",
                }
              : r
          )
        );
        setSelectedReportForCategoryChange(null);
        setNewCategorySelection("");
        setCategoryChangeReason("");
        fetchReports();
      } else {
        const err = await res.json();
        showToast(err.error || "Gagal mengubah kategori", "error");
      }
    } catch (err) {
      showToast("Terjadi kesalahan sistem saat mengubah kategori.", "error");
    } finally {
      setIsSubmittingCategoryChange(false);
    }
  };

  // Penyesuaian Kategori Cepat Langsung dari Meja Kerja Humas
  const handleQuickCategoryChange = async (reportId: string, newCategory: string) => {
    if (!newCategory) return;
    const targetReport = reports.find((r) => r.id === reportId);
    if (targetReport?.status === "SELESAI" && userRole !== "SUPERADMIN") {
      alert("Laporan ini sudah berstatus SELESAI dan terkunci. Perubahan kategori tidak diizinkan.");
      return;
    }
    setUpdatingCategoryId(reportId);
    try {
      const res = await fetch(`/api/reports/${reportId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "CHANGE_CATEGORY",
          category: newCategory,
          categoryChangeNote: `Kategori disesuaikan langsung oleh ${session?.user?.name || "Admin Humas"}`,
        }),
      });

      if (res.ok) {
        showToast("Kategori laporan berhasil disesuaikan.");
        // Pembaruan langsung di state
        setReports((prev) =>
          prev.map((r) =>
            r.id === reportId
              ? {
                  ...r,
                  category: newCategory,
                  categoryChangeNote: `Kategori disesuaikan langsung oleh ${session?.user?.name || "Admin Humas"}`,
                  categoryChangedAt: new Date().toISOString(),
                  categoryChangedBy: session?.user?.name || "Admin Humas",
                }
              : r
          )
        );
        fetchReports();
      } else {
        showToast("Gagal menyesuaikan kategori laporan.", "error");
      }
    } catch {
      showToast("Terjadi kesalahan koneksi saat menyesuaikan kategori.", "error");
    } finally {
      setUpdatingCategoryId(null);
    }
  };

  // 2. Disposisi ke Bidang Lain + Trigger WA Blast
  const handleSubmitDisposition = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedReportForDisposition) return;

    const targetDept =
      selectedDepartmentName === "LAINNYA" ? customTarget.trim() : selectedDepartmentName;

    if (!targetDept) {
      alert("Pilih atau ketik nama bidang tujuan disposisi.");
      return;
    }

    setIsSubmittingDisposition(true);
    try {
      // Step A: Update Disposisi di Database Laporan
      const resReport = await fetch(`/api/reports/${selectedReportForDisposition.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "DISPOSE",
          dispositionTo: targetDept,
          dispositionNote: dispositionNote.trim() || "Mohon ditindaklanjuti sesuai kewenangan bidang.",
          dispositionTargetPhone: dispositionTargetPhone.trim() || null,
          urgency: dispositionUrgency,
        }),
      });

      if (!resReport.ok) {
        throw new Error("Gagal menyimpan data disposisi di laporan.");
      }

      // Pembaruan instan tanpa refresh
      setReports((prev) =>
        prev.map((r) =>
          r.id === selectedReportForDisposition.id
            ? {
                ...r,
                status: "DIDISPOSISIKAN",
                targetUnit: targetDept,
                dispositionTo: targetDept,
                dispositionNote: dispositionNote.trim() || "Mohon ditindaklanjuti sesuai kewenangan bidang.",
                dispositionTargetPhone: dispositionTargetPhone.trim() || null,
                dispositionedAt: new Date().toISOString(),
                urgency: dispositionUrgency,
              }
            : r
        )
      );

      // Step B: Trigger WA Blast jika dicentang dan nomor ada
      let waBlastSuccess = false;
      if (sendWaBlastOnDisposition && dispositionTargetPhone.trim()) {
        try {
          const resWa = await fetch("/api/wa-blast", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              ticketNumber: selectedReportForDisposition.ticketNumber,
              department: targetDept,
              recipientPhone: dispositionTargetPhone.trim(),
              templateCode: "DISPOSISI_BIDANG",
              reportTitle: selectedReportForDisposition.title,
              category: selectedReportForDisposition.category,
              categoryLabel: getCategoryMeta(selectedReportForDisposition.category).name,
              urgency: dispositionUrgency,
              note: dispositionNote.trim(),
            }),
          });
          const waResult = await resWa.json();
          waBlastSuccess = waResult.success;
        } catch (waErr) {
          console.warn("Trigger WA Blast gagal dijalankan:", waErr);
        }
      }

      showToast(
        `Disposisi tiket ${selectedReportForDisposition.ticketNumber} ke ${targetDept} berhasil disimpan! ${
          waBlastSuccess ? "Pesan WA Blast terkirim ke " + dispositionTargetPhone : ""
        }`
      );

      setSelectedReportForDisposition(null);
      setDispositionNote("");
      setCustomTarget("");
      fetchReports();
      fetchWaData();
    } catch (err: any) {
      showToast(err.message || "Gagal memproses disposisi.", "error");
    } finally {
      setIsSubmittingDisposition(false);
    }
  };

  // 3. Selesaikan Aduan (Update Status SELESAI)
  const handleSubmitResolve = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedReportForResolve) return;

    if (!resolveNote.trim()) {
      alert("Catatan respon penyelesaian resmi wajib diisi.");
      return;
    }

    setIsSubmittingResolve(true);
    try {
      const res = await fetch(`/api/reports/${selectedReportForResolve.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "RESOLVE",
          status: "SELESAI",
          urgency: resolveUrgency,
          responseNote: resolveNote.trim(),
        }),
      });

      if (res.ok) {
        showToast(
          `Laporan ${selectedReportForResolve.ticketNumber} tuntas diselesaikan. Respon telah dipublikasikan ke pelacakan tiket.`
        );
        // Pembaruan instan tanpa refresh
        setReports((prev) =>
          prev.map((r) =>
            r.id === selectedReportForResolve.id
              ? {
                  ...r,
                  status: "SELESAI",
                  urgency: resolveUrgency,
                  responseNote: resolveNote.trim(),
                  respondedAt: new Date().toISOString(),
                }
              : r
          )
        );
        setSelectedReportForResolve(null);
        setResolveNote("");
        fetchReports();
      } else {
        const err = await res.json();
        showToast(err.error || "Gagal menyelesaikan laporan.", "error");
      }
    } catch (err) {
      showToast("Terjadi kesalahan sistem saat menyelesaikan laporan.", "error");
    } finally {
      setIsSubmittingResolve(false);
    }
  };

  // 4. Ubah Urgensi Cepat Langsung di Tabel
  const handleQuickUrgencyChange = async (
    reportId: string,
    newUrgency: PublicReportItem["urgency"]
  ) => {
    const targetReport = reports.find((r) => r.id === reportId);
    if (targetReport?.status === "SELESAI" && userRole !== "SUPERADMIN") {
      alert("Laporan ini sudah berstatus SELESAI dan terkunci. Perubahan urgensi tidak diizinkan.");
      return;
    }
    setUpdatingUrgencyId(reportId);
    // Pembaruan instan tanpa refresh
    setReports((prev) =>
      prev.map((r) => (r.id === reportId ? { ...r, urgency: newUrgency } : r))
    );
    try {
      const res = await fetch(`/api/reports/${reportId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ urgency: newUrgency }),
      });

      if (res.ok) {
        showToast("Tingkat urgensi berhasil diperbarui.");
        fetchReports();
      }
    } catch {
      showToast("Gagal mengubah urgensi.", "error");
    } finally {
      setUpdatingUrgencyId(null);
    }
  };

  // ==========================================
  // HANDLERS SUPERADMIN
  // ==========================================

  // Simpan Pengaturan Umum Sistem
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingSettings(true);
    try {
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });

      if (res.ok) {
        showToast("Konfigurasi sistem Superadmin berhasil disimpan.");
      } else {
        showToast("Gagal menyimpan konfigurasi", "error");
      }
    } catch {
      showToast("Terjadi kesalahan saat menyimpan pengaturan.", "error");
    } finally {
      setIsSavingSettings(false);
    }
  };

  // Salin Tautan Berbagi
  const copyShareLink = (path: string) => {
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    const fullUrl = `${origin}${path}`;
    navigator.clipboard.writeText(fullUrl);
    setCopiedLink(path);
    setTimeout(() => setCopiedLink(null), 2500);
  };

  // Tambah Pengguna Baru (Superadmin)
  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmittingUser(true);
    try {
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newUserName,
          email: newUserEmail,
          password: newUserPassword,
          role: newUserRole,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        showToast(data.message || "Pengguna baru berhasil dibuat.");
        setShowAddUserModal(false);
        setNewUserName("");
        setNewUserEmail("");
        setNewUserPassword("");
        setNewUserRole("STAFF");
        fetchUsers();
      } else {
        showToast(data.error || "Gagal membuat pengguna.", "error");
      }
    } catch {
      showToast("Terjadi kesalahan jaringan saat membuat akun.", "error");
    } finally {
      setIsSubmittingUser(false);
    }
  };

  // Hapus Laporan Aduan (Khusus Superadmin - Menangani Duplikat / Human Error)
  const handleDeleteReport = async (id: string, ticketNumber: string) => {
    if (
      !confirm(
        `PERINGATAN SUPERADMIN:\nApakah Anda yakin ingin menghapus permanen laporan #${ticketNumber}?\n\nTindakan ini HANYA digunakan jika terjadi human error atau pengiriman laporan ganda (duplikat) dari masyarakat.`
      )
    ) {
      return;
    }

    try {
      const res = await fetch(`/api/reports/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (res.ok) {
        showToast(data.message || `Laporan #${ticketNumber} berhasil dihapus permanen.`);
        setReports((prev) => prev.filter((r) => r.id !== id));
        if (selectedReportForDetailAction?.id === id) {
          setSelectedReportForDetailAction(null);
        }
        if (selectedReportForAuditTrail?.id === id) {
          setSelectedReportForAuditTrail(null);
        }
        fetchReports();
      } else {
        showToast(data.error || "Gagal menghapus laporan.", "error");
      }
    } catch {
      showToast("Terjadi kesalahan sistem saat menghapus laporan.", "error");
    }
  };

  // Hapus Pengguna (Superadmin)
  const handleDeleteUser = async (id: string, name: string) => {
    if (!confirm(`Apakah Anda yakin ingin menghapus akun pengguna "${name}"?`)) return;
    try {
      const res = await fetch(`/api/users/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (res.ok) {
        showToast(data.message || "Akun berhasil dihapus.");
        fetchUsers();
      } else {
        showToast(data.error || "Gagal menghapus pengguna.", "error");
      }
    } catch {
      showToast("Terjadi kesalahan saat menghapus pengguna.", "error");
    }
  };

  // Simpan / Perbarui Pewarnaan Kategori (Superadmin)
  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmittingCategory(true);
    try {
      if (editingCategory) {
        const res = await fetch("/api/categories", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: editingCategory.id,
            name: catNameInput,
            color: catColorInput,
            description: catDescInput,
          }),
        });
        if (res.ok) {
          showToast("Pewarnaan kategori berhasil diperbarui.");
          setEditingCategory(null);
          fetchCategories();
          fetchReports();
        }
      } else {
        const res = await fetch("/api/categories", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: catNameInput,
            code: catCodeInput,
            color: catColorInput,
            description: catDescInput,
          }),
        });
        if (res.ok) {
          showToast("Kategori baru berhasil ditambahkan.");
          setShowAddCategoryModal(false);
          setCatNameInput("");
          setCatCodeInput("");
          setCatDescInput("");
          fetchCategories();
          fetchReports();
        } else {
          const err = await res.json();
          showToast(err.error || "Gagal menambah kategori", "error");
        }
      }
    } catch {
      showToast("Terjadi kesalahan saat menyimpan kategori.", "error");
    } finally {
      setIsSubmittingCategory(false);
    }
  };

  // Simpan Template WA Blast (Superadmin)
  const handleSaveTemplate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTemplate) return;
    setIsSavingTemplate(true);
    try {
      const res = await fetch("/api/wa-blast", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "UPDATE_TEMPLATE",
          code: editingTemplate.code,
          title: tplTitleInput,
          content: tplContentInput,
        }),
      });

      if (res.ok) {
        showToast("Template pesan WA Blast berhasil diperbarui.");
        setEditingTemplate(null);
        fetchWaData();
      } else {
        showToast("Gagal menyimpan template.", "error");
      }
    } catch {
      showToast("Terjadi kesalahan saat menyimpan template.", "error");
    } finally {
      setIsSavingTemplate(false);
    }
  };

  // Tambah / Edit Kontak Bidang (Superadmin)
  const handleSaveContact = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmittingContact(true);
    try {
      const res = await fetch("/api/wa-blast", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "UPSERT_CONTACT",
          id: editingContactId || undefined,
          name: contactNameInput,
          contactName: contactPicInput,
          phone: contactPhoneInput,
          email: contactEmailInput,
        }),
      });

      if (res.ok) {
        showToast("Kontak WhatsApp bidang berhasil disimpan.");
        setShowAddContactModal(false);
        setEditingContactId(null);
        setContactNameInput("");
        setContactPicInput("");
        setContactPhoneInput("");
        setContactEmailInput("");
        fetchWaData();
      }
    } catch {
      showToast("Gagal menyimpan kontak bidang.", "error");
    } finally {
      setIsSubmittingContact(false);
    }
  };

  // Hapus Kontak Bidang (Superadmin)
  const handleDeleteContact = async (id: string) => {
    if (!confirm("Hapus kontak bidang ini?")) return;
    try {
      const res = await fetch("/api/wa-blast", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "DELETE_CONTACT",
          id,
        }),
      });
      if (res.ok) {
        showToast("Kontak bidang berhasil dihapus.");
        fetchWaData();
      }
    } catch {
      showToast("Gagal menghapus kontak bidang.", "error");
    }
  };

  // Hapus Kategori (Superadmin)
  const handleDeleteCategory = async (id: string, name: string) => {
    if (
      !confirm(
        `Apakah Anda yakin ingin menghapus kategori "${name}"? Seluruh konfigurasi pewarnaan kategori ini akan dihapus.`
      )
    )
      return;
    try {
      const res = await fetch(`/api/categories?id=${id}`, { method: "DELETE" });
      const data = await res.json();
      if (res.ok) {
        showToast(data.message || "Kategori berhasil dihapus.");
        fetchCategories();
        fetchReports();
      } else {
        showToast(data.error || "Gagal menghapus kategori.", "error");
      }
    } catch {
      showToast("Terjadi kesalahan saat menghapus kategori.", "error");
    }
  };

  // Simpan Pengaturan Gateway WA Blast (Saung WA)
  const handleSaveGatewaySettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingGateway(true);
    try {
      const res = await fetch("/api/wa-blast", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "UPDATE_GATEWAY",
          waGatewayEnabled: settings.waGatewayEnabled,
          waGatewayProvider: settings.waGatewayProvider,
          waGatewayUrl: settings.waGatewayUrl,
          waApiKey: settings.waApiKey,
          waSenderNumber: settings.waSenderNumber,
          waAppKey: settings.waAppKey,
          waAuthKey: settings.waAuthKey,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        showToast("Konfigurasi Gateway WhatsApp (Saung WA) berhasil disimpan.");
        fetchWaData();
        fetchSettings();
      } else {
        showToast(data.error || "Gagal menyimpan konfigurasi gateway.", "error");
      }
    } catch {
      showToast("Terjadi kesalahan saat menyimpan gateway WhatsApp.", "error");
    } finally {
      setIsSavingGateway(false);
    }
  };

  // Uji Coba Pengiriman Pesan WA Blast Langsung
  const handleSendTestWa = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!testWaPhone.trim()) {
      showToast("Nomor WhatsApp penerima wajib diisi.", "error");
      return;
    }

    setIsSendingTestWa(true);
    setTestWaResult(null);
    try {
      const res = await fetch("/api/wa-blast", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recipientPhone: testWaPhone.trim(),
          recipientName: "Test Pengujian Superadmin",
          department: "Uji Koneksi Gateway Saung WA",
          message: testWaMessage.trim(),
          reportTitle: "Uji Coba Integrasi Saung WA API",
          urgency: "SEDANG",
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setTestWaResult({
          success: true,
          message: data.message || "Pesan berhasil dikirimkan ke WhatsApp via Saung WA!",
          response: data.gatewayResponse,
        });
        showToast("Pesan tes WhatsApp berhasil terkirim!");
        fetchWaData();
      } else {
        setTestWaResult({
          success: false,
          message: data.error || data.message || "Gagal mengirim pesan melalui gateway.",
          response: data.gatewayResponse,
        });
        showToast(data.error || "Gagal mengirim pesan tes WA.", "error");
      }
    } catch (err: any) {
      setTestWaResult({
        success: false,
        message: err.message || "Terjadi kesalahan jaringan saat tes kirim.",
      });
      showToast("Terjadi kesalahan jaringan saat uji coba kirim WA.", "error");
    } finally {
      setIsSendingTestWa(false);
    }
  };

  // Render Bar Navigasi Tab Memanjang Relative
  const renderTabNavigation = () => (
    <div className="w-full bg-white p-2 rounded-2xl border border-emerald-200 shadow-xs flex flex-wrap items-center gap-1.5 text-xs font-bold">
      <button
        onClick={() => setActiveTab("REPORTS")}
        className={`inline-flex items-center px-4 py-2.5 rounded-xl transition ${
          activeTab === "REPORTS"
            ? "bg-emerald-600 text-white shadow-xs"
            : "text-emerald-800 hover:text-emerald-950 hover:bg-emerald-50"
        }`}
      >
        <FileText className="w-4 h-4 mr-2" />
        {userRole === "SUPERADMIN" ? "Data Laporan & Aduan" : "Laporan & Disposisi"}
        {countNeedAction > 0 && (
          <span className="ml-2 px-2 py-0.5 bg-amber-400 text-amber-950 text-[10px] font-black rounded-full">
            {countNeedAction}
          </span>
        )}
      </button>

      {userRole === "SUPERADMIN" && (
        <>
          <button
            onClick={() => setActiveTab("SETTINGS")}
            className={`inline-flex items-center px-4 py-2.5 rounded-xl transition ${
              activeTab === "SETTINGS"
                ? "bg-emerald-600 text-white shadow-xs"
                : "text-emerald-800 hover:text-emerald-950 hover:bg-emerald-50"
            }`}
          >
            <Settings className="w-4 h-4 mr-2" />
            Konfigurasi & Link Portal
          </button>

          <button
            onClick={() => setActiveTab("CATEGORIES")}
            className={`inline-flex items-center px-4 py-2.5 rounded-xl transition ${
              activeTab === "CATEGORIES"
                ? "bg-emerald-600 text-white shadow-xs"
                : "text-emerald-800 hover:text-emerald-950 hover:bg-emerald-50"
            }`}
          >
            <Palette className="w-4 h-4 mr-2" />
            Pewarnaan Kategori
          </button>

          <button
            onClick={() => setActiveTab("WA_BLAST")}
            className={`inline-flex items-center px-4 py-2.5 rounded-xl transition ${
              activeTab === "WA_BLAST"
                ? "bg-emerald-600 text-white shadow-xs"
                : "text-emerald-800 hover:text-emerald-950 hover:bg-emerald-50"
            }`}
          >
            <MessageSquare className="w-4 h-4 mr-2" />
            Setting WA Blast (Saung WA)
          </button>

          <button
            onClick={() => setActiveTab("USERS")}
            className={`inline-flex items-center px-4 py-2.5 rounded-xl transition ${
              activeTab === "USERS"
                ? "bg-emerald-600 text-white shadow-xs"
                : "text-emerald-800 hover:text-emerald-950 hover:bg-emerald-50"
            }`}
          >
            <Users className="w-4 h-4 mr-2" />
            Setting Akun
          </button>
        </>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col text-slate-800">
      <title>
        {userRole === "SUPERADMIN"
          ? "Sistem Super Administrator - HumasMonitor"
          : "Pusat Komando & Disposisi Humas - HumasMonitor"}
      </title>

      {/* Top Navbar */}
      <header className="bg-white border-b border-emerald-200 sticky top-0 z-40 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Link href="/" className="flex items-center space-x-2.5">
              <img
                src="/LOGO DKH.png"
                alt="Logo HumasMonitor"
                className="w-9 h-9 object-contain rounded-xl shadow-xs"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = "none";
                }}
              />
              <span className="text-lg font-black text-emerald-950 tracking-tight">
                HumasMonitor
              </span>
            </Link>
            <span className="hidden sm:inline-block text-xs px-2.5 py-0.5 bg-emerald-100 text-emerald-800 font-bold rounded-full border border-emerald-200">
              {userRole === "SUPERADMIN"
                ? "Sistem Super Administrator"
                : "Pusat Komando & Disposisi Humas"}
            </span>
          </div>
          
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2.5 text-right pl-2 border-l border-slate-200">
              <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-sm border border-emerald-200">
                <UserIcon className="w-4 h-4" />
              </div>
              <div className="hidden sm:block">
                <p className="text-xs font-bold text-slate-800">
                  {session?.user?.name || "Admin Humas"}
                </p>
                <p className="text-[11px] text-emerald-700 font-medium">
                  {userRole} • {session?.user?.email}
                </p>
              </div>
            </div>

            <button
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="inline-flex items-center px-3 py-1.5 text-xs font-semibold rounded-lg text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 transition"
              title="Keluar dari sistem"
            >
              <LogOut className="w-3.5 h-3.5 mr-1" />
              Keluar
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Kotak Judul Dashboard */}
        <div className="bg-white p-6 rounded-2xl border border-emerald-200 shadow-sm">
          <h1 className="text-2xl font-black text-emerald-950">
            {userRole === "SUPERADMIN" && activeTab === "SETTINGS"
              ? "Konfigurasi dan Link Portal"
              : userRole === "SUPERADMIN" && activeTab === "USERS"
              ? "Manajemen Akun Pengguna"
              : userRole === "SUPERADMIN" && activeTab === "CATEGORIES"
              ? "Pewarnaan & Konfigurasi Kategori"
              : userRole === "SUPERADMIN" && activeTab === "WA_BLAST"
              ? "Pengaturan & Integrasi WA Blast"
              : userRole === "SUPERADMIN" && activeTab === "REPORTS"
              ? "Manajemen Data Laporan & Aduan Publik"
              : "Pusat Komando Laporan & Disposisi Humas"}
          </h1>
          <p className="text-slate-600 text-xs sm:text-sm mt-1 max-w-4xl">
            {userRole === "SUPERADMIN" && activeTab === "REPORTS"
              ? "Pantau seluruh rekap aduan masuk, audit riwayat penanganan, serta lakukan penghapusan laporan duplikat atau human error jika diperlukan."
              : userRole === "SUPERADMIN"
              ? "Kelola data laporan, akun pengguna, konfigurasi pewarnaan 4 kategori urgensi, integrasikan API Saung WA, dan kelola parameter sistem."
              : "Pantau rekap 4 warna kategori, tangani aduan warga, ubah kategori dengan catatan, dan kirimkan disposisi resmi via WA Blast."}
          </p>
        </div>

        {/* Navigasi Tab Utama Memanjang */}
        {renderTabNavigation()}

        {/* Toast Notifikasi Aksi */}
        {toastMessage && (
          <div
            className={`p-4 rounded-xl text-xs font-semibold flex items-center justify-between shadow-xs animate-in fade-in ${
              toastMessage.type === "success"
                ? "bg-emerald-100 border border-emerald-300 text-emerald-900"
                : "bg-rose-100 border border-rose-300 text-rose-900"
            }`}
          >
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
              <span>{toastMessage.text}</span>
            </div>
            <button onClick={() => setToastMessage(null)} className="text-xs font-bold ml-4">
              ✕
            </button>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 1: MEJA KERJA LAPORAN & DISPOSISI                     */}
        {/* ========================================================= */}
        {activeTab === "REPORTS" && (
          <div className="space-y-6 animate-in fade-in duration-150">
            {/* 1. TAMPILAN REKAP ADUAN BERDASARKAN WARNA KATEGORI SAJA */}
            <div className="bg-white p-5 rounded-2xl border border-emerald-200 shadow-xs">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Palette className="w-4 h-4 text-emerald-600" />
                  <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                    Rekap Aduan Berdasarkan Warna Kategori Urgensi
                  </h3>
                </div>
                <span className="text-[11px] text-slate-400">
                  Dikelompokkan berdasarkan warna • Klik kartu untuk filter cepat
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                {colorRecapList.map((item) => (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() =>
                      setSelectedColorFilter(
                        selectedColorFilter === item.key ? "ALL" : item.key
                      )
                    }
                    className={`p-3.5 rounded-xl border text-left transition relative overflow-hidden ${
                      selectedColorFilter === item.key
                        ? "ring-2 ring-emerald-600 shadow-sm border-transparent bg-slate-50"
                        : "border-slate-200 hover:border-slate-300 bg-white"
                    }`}
                  >
                    <div className="h-1.5 absolute top-0 inset-x-0" style={{ backgroundColor: item.color }} />
                    <div className="flex items-center gap-1.5 mt-1">
                      <span className="w-2.5 h-2.5 rounded-full shrink-0 shadow-xs" style={{ backgroundColor: item.color }} />
                      <p className="text-xs font-bold text-slate-900 truncate">{item.title}</p>
                    </div>
                    {item.categories.length > 0 && (
                      <p className="text-[10px] text-slate-500 font-medium mt-1 truncate" title={item.categories.join(", ")}>
                        {item.categories.join(", ")}
                      </p>
                    )}
                    <div className="mt-2.5 flex items-baseline justify-between">
                      <span className="text-2xl font-black text-slate-900">{item.count}</span>
                      <span className="text-[11px] text-slate-500 font-semibold">{item.done} tuntas</span>
                    </div>
                  </button>
                ))}
              </div>

              {selectedColorFilter !== "ALL" && (
                <div className="mt-3 flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
                  <span className="text-slate-600">
                    Menampilkan hanya aduan: <b>{colorRecapList.find((c) => c.key === selectedColorFilter)?.title || selectedColorFilter}</b>
                  </span>
                  <button
                    onClick={() => setSelectedColorFilter("ALL")}
                    className="text-emerald-700 hover:text-emerald-900 font-bold underline"
                  >
                    Reset Filter Warna
                  </button>
                </div>
              )}
            </div>

            {/* Banner Mode Super Administrator Jika Sedang Memantau Laporan */}
            {userRole === "SUPERADMIN" && (
              <div className="p-3.5 rounded-2xl bg-purple-50 border border-purple-200 text-purple-950 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2 shadow-xs">
                <div className="flex items-center gap-2.5">
                  <ShieldCheck className="w-4 h-4 text-purple-700 shrink-0" />
                  <span>
                    <b>Mode Super Administrator:</b> Anda dapat memantau seluruh laporan masuk dan menghapus data aduan jika terjadi <b>human error atau laporan duplikat</b> dari masyarakat (gunakan tombol sampah merah di kolom aksi atau dalam rincian laporan).
                  </span>
                </div>
              </div>
            )}

            {/* 2. DAFTAR SELURUH ADUAN (TABEL LENGKAP SEPERTI YANG ADA SEKARANG) */}
            <div className="space-y-4">
              {/* Toolbar Filter & Pencarian */}
              <div className="bg-white p-4 rounded-2xl border border-emerald-200 shadow-xs flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={reportSearch}
                    onChange={(e) => setReportSearch(e.target.value)}
                    placeholder="Cari nomor tiket, judul, pelapor, atau bidang disposisi..."
                    className="w-full pl-9 pr-4 py-2 text-xs sm:text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-slate-50"
                  />
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {/* Filter Sumber */}
                  <select
                    value={sourceFilter}
                    onChange={(e) => setSourceFilter(e.target.value as any)}
                    className="text-xs border border-slate-300 rounded-xl px-2.5 py-2 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
                  >
                    <option value="ALL">Semua Sumber</option>
                    <option value="PUBLIC">🌐 Aduan Publik</option>
                    <option value="INTERNAL">🏢 Kendala Ruangan</option>
                  </select>

                  {/* Filter Status */}
                  <select
                    value={reportStatusFilter}
                    onChange={(e) => setReportStatusFilter(e.target.value)}
                    className="text-xs border border-slate-300 rounded-xl px-2.5 py-2 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
                  >
                    <option value="ALL">Semua Status</option>
                    <option value="BARU">Baru Masuk</option>
                    <option value="PROSES">Sedang Ditangani / Disposisi</option>
                    <option value="SELESAI">Selesai / Tuntas</option>
                    <option value="TERKENDALA">Terkendala</option>
                  </select>

                  {/* Filter Urgensi */}
                  <select
                    value={reportUrgencyFilter}
                    onChange={(e) => setReportUrgencyFilter(e.target.value)}
                    className="text-xs border border-slate-300 rounded-xl px-2.5 py-2 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
                  >
                    <option value="ALL">Semua Urgensi</option>
                    <option value="KRITIS">🚨 Kritis</option>
                    <option value="TINGGI">⚠️ Tinggi</option>
                    <option value="SEDANG">⚡ Sedang</option>
                    <option value="RENDAH">☕ Rendah</option>
                  </select>

                  <button
                    onClick={() => {
                      fetchReports(true);
                      fetchInternalReports(true);
                    }}
                    className="p-2 rounded-xl border border-emerald-200 text-emerald-700 hover:bg-emerald-50 transition"
                    title="Segarkan data secara cepat"
                  >
                    <RefreshCw className={`w-4 h-4 ${isSilentRefreshing ? "animate-spin text-emerald-600" : ""}`} />
                  </button>
                </div>
              </div>

              {/* Tampilan Responsif Laporan (Card View di Mobile/Tablet, Tabel Rapi Bebas Scroll di Desktop) */}
              <div className="space-y-4">
                {/* 1. Mobile & Tablet Card View (xl:hidden) - Benar-benar responsif, tanpa scroll ke samping */}
                <div className="block xl:hidden">
                  {reports.length === 0 && internalReports.length === 0 && (isReportsLoading || isInternalLoading) ? (
                    <div className="py-12 text-center text-slate-500 bg-white rounded-2xl border border-emerald-200">
                      <Loader2 className="w-6 h-6 animate-spin mx-auto text-emerald-600 mb-2" />
                      <span>Memuat laporan masuk...</span>
                    </div>
                  ) : filteredUnifiedReports.length === 0 ? (
                    <div className="py-12 text-center text-slate-500 bg-white rounded-2xl border border-emerald-200">
                      <FileText className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                      <p className="font-semibold text-slate-700">Tidak ada laporan yang sesuai filter</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {paginatedUnifiedReports.map((item) => (
                        <div
                          key={`card-${item.sourceType}-${item.id}`}
                          className={`bg-white p-4 sm:p-5 rounded-2xl border transition shadow-xs flex flex-col justify-between ${
                            item.supervisorWarning
                              ? "border-rose-300 bg-rose-50/20 ring-1 ring-rose-200"
                              : "border-slate-200 hover:border-emerald-300"
                          }`}
                        >
                          <div className="space-y-3">
                            {/* Header Card: Tiket, Tanggal, Sumber & Urgensi */}
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <div className="flex items-center gap-2">
                                <span className="font-mono font-bold text-xs bg-slate-100 text-slate-800 px-2.5 py-1 rounded-lg border border-slate-200">
                                  {item.ticketNumber}
                                </span>
                                {item.sourceType === "PUBLIC" ? (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                                    <Globe className="w-3 h-3 text-blue-600" /> Publik
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200">
                                    <Building2 className="w-3 h-3 text-purple-600" /> Internal
                                  </span>
                                )}
                              </div>

                              <div className="flex items-center gap-2">
                                {item.sourceType === "PUBLIC" ? (
                                  <select
                                    value={item.urgency}
                                    disabled={updatingUrgencyId === item.id}
                                    onChange={(e) =>
                                      handleQuickUrgencyChange(item.id, e.target.value as any)
                                    }
                                    className={`text-[11px] font-bold rounded-lg px-2 py-0.5 border cursor-pointer ${
                                      item.urgency === "KRITIS"
                                        ? "bg-rose-50 border-rose-300 text-rose-700"
                                        : item.urgency === "TINGGI"
                                        ? "bg-amber-50 border-amber-300 text-amber-800"
                                        : "bg-sky-50 border-sky-300 text-sky-800"
                                    }`}
                                  >
                                    <option value="KRITIS">🚨 Kritis</option>
                                    <option value="TINGGI">⚠️ Tinggi</option>
                                    <option value="SEDANG">⚡ Sedang</option>
                                    <option value="RENDAH">☕ Rendah</option>
                                  </select>
                                ) : (
                                  <span className="font-bold text-xs">{item.urgency}</span>
                                )}
                              </div>
                            </div>

                            {/* Banner Atensi Atasan Jika Ada */}
                            {item.supervisorWarning && (
                              <div className="p-3 rounded-xl bg-gradient-to-r from-rose-50 to-amber-50 border border-rose-300 text-rose-950 text-xs shadow-xs">
                                <div className="flex flex-wrap items-center justify-between gap-1 font-bold text-rose-800">
                                  <span className="flex items-center gap-1.5">
                                    <AlertTriangle className="w-4 h-4 text-rose-600 animate-pulse shrink-0" />
                                    ⚠️ ATENSI ATASAN / PIMPINAN
                                  </span>
                                  {item.supervisorWarningBy && (
                                    <span className="text-[10px] text-slate-500 font-normal">
                                      oleh {item.supervisorWarningBy}
                                    </span>
                                  )}
                                </div>
                                <p className="mt-1 text-xs text-rose-900 font-bold italic">
                                  &ldquo;{item.supervisorWarning}&rdquo;
                                </p>
                                {item.supervisorWarningAt && (
                                  <div className="mt-1 text-[10px] text-slate-400 flex items-center justify-between">
                                    <span>
                                      {new Date(item.supervisorWarningAt).toLocaleString("id-ID")}
                                    </span>
                                    {item.supervisorWarningWaSent && (
                                      <span className="font-bold text-emerald-700 bg-emerald-100 px-1.5 py-0.2 rounded">
                                        ✓ Alert WA Diterima
                                      </span>
                                    )}
                                  </div>
                                )}
                              </div>
                            )}

                            {/* Kategori Berwarna & Ubah Cepat */}
                            <div className="flex flex-wrap items-center gap-2">
                              <span
                                className="inline-flex items-center px-2.5 py-0.5 rounded text-[11px] font-bold text-white shadow-xs"
                                style={{ backgroundColor: item.categoryColor }}
                              >
                                ● {item.categoryLabel}
                              </span>
                              {item.sourceType === "PUBLIC" && (
                                <select
                                  value={item.categoryCode}
                                  disabled={updatingCategoryId === item.id}
                                  onChange={(e) => handleQuickCategoryChange(item.id, e.target.value)}
                                  className="text-[10px] font-semibold rounded-lg px-2 py-0.5 border border-slate-200 bg-slate-50 text-slate-700 cursor-pointer"
                                  title="Ubah kategori langsung"
                                >
                                  {categories.map((c) => (
                                    <option key={c.code} value={c.code}>
                                      {c.name}
                                    </option>
                                  ))}
                                </select>
                              )}
                              {item.categoryChangeNote && (
                                <span className="text-[10px] text-amber-700 font-semibold" title={item.categoryChangeNote}>
                                  ✏️ Diubah
                                </span>
                              )}
                            </div>

                            {/* Judul & Isi */}
                            <div>
                              <h4 className="font-bold text-slate-900 text-sm">{item.title}</h4>
                              <p className="text-xs text-slate-600 mt-1 line-clamp-3">{item.content}</p>
                            </div>

                            {/* Respon Humas jika ada */}
                            {item.responseNote && (
                              <div className="p-2 rounded-xl bg-teal-50 border border-teal-200 text-xs text-teal-950">
                                <b>Respon Humas:</b> {item.responseNote}
                              </div>
                            )}

                            {/* Pengirim & Waktu Masuk */}
                            <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between text-xs text-slate-500 gap-1">
                              <div>
                                {item.isAnonymous ? (
                                  <span className="inline-flex items-center gap-1 text-slate-500">
                                    <EyeOff className="w-3 h-3" /> Anonim
                                  </span>
                                ) : (
                                  <span>
                                    <b>{item.reporterName}</b> • {item.reporterContactOrRoom}
                                  </span>
                                )}
                              </div>
                              <span className="text-[10px] text-slate-400">
                                {new Date(item.createdAt).toLocaleDateString("id-ID", {
                                  day: "numeric",
                                  month: "short",
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </span>
                            </div>

                            {/* Status & Disposisi */}
                            <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                              <span
                                className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                                  item.status === "SELESAI"
                                    ? "bg-teal-100 text-teal-900 border border-teal-300"
                                    : item.status === "DIDISPOSISIKAN" || item.statusGroup === "PROSES"
                                    ? "bg-blue-100 text-blue-900 border border-blue-300"
                                    : "bg-amber-100 text-amber-900 border border-amber-300"
                                }`}
                              >
                                {item.status}
                              </span>
                              <span className="text-xs font-semibold text-slate-700">
                                {item.dispositionOrTechnician}
                              </span>
                            </div>
                          </div>

                          {/* Tombol Aksi Humas */}
                          <div className="mt-4 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
                            <span className="text-[11px] text-slate-400 font-semibold">Tindakan Laporan:</span>
                            <div className="flex items-center gap-1.5">
                              {/* Tombol Utama Terpadu: Detail & Kelola */}
                              <button
                                type="button"
                                onClick={() => openDetailModal(item, "DETAIL")}
                                className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white transition shadow-xs flex items-center gap-1.5"
                              >
                                <Eye className="w-3.5 h-3.5" />
                                <span>Detail & Aksi</span>
                              </button>

                              {/* Tombol Hapus Laporan (Khusus Superadmin) */}
                              {userRole === "SUPERADMIN" && item.sourceType === "PUBLIC" && item.rawPublic && (
                                <button
                                  type="button"
                                  onClick={() => handleDeleteReport(item.id, item.ticketNumber)}
                                  className="p-1.5 rounded-xl text-rose-600 bg-rose-50 hover:bg-rose-100 border border-rose-200 transition"
                                  title="Hapus Laporan (Khusus Superadmin - Duplikat / Human Error)"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* 2. Desktop Table View (hidden xl:block) - Lebar 100%, proporsional, tanpa scroll samping */}
                <div className="hidden xl:block bg-white rounded-2xl border border-emerald-200 shadow-xs overflow-hidden">
                  <table className="w-full text-left text-xs border-collapse table-fixed">
                    <thead>
                      <tr className="bg-emerald-50/70 text-emerald-950 uppercase text-[11px] font-black tracking-wider border-b border-emerald-200">
                        <th className="py-3.5 px-4 w-[16%]">Tiket, Tanggal & Sumber</th>
                        <th className="py-3.5 px-4 w-[15%]">Kategori & Ubah Cepat</th>
                        <th className="py-3.5 px-4 w-[13%]">Pengirim / Kontak</th>
                        <th className="py-3.5 px-4 w-[28%]">Judul, Isi & Atensi Atasan</th>
                        <th className="py-3.5 px-4 w-[10%]">Urgensi</th>
                        <th className="py-3.5 px-4 w-[18%] text-right">Status & Aksi Humas</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {reports.length === 0 && internalReports.length === 0 && (isReportsLoading || isInternalLoading) ? (
                        <tr>
                          <td colSpan={6} className="py-12 text-center text-slate-500">
                            <Loader2 className="w-6 h-6 animate-spin mx-auto text-emerald-600 mb-2" />
                            <span>Memuat laporan masuk...</span>
                          </td>
                        </tr>
                      ) : filteredUnifiedReports.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="py-12 text-center text-slate-500">
                            <FileText className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                            <p className="font-semibold text-slate-700">Tidak ada laporan yang sesuai filter</p>
                          </td>
                        </tr>
                      ) : (
                        paginatedUnifiedReports.map((item) => (
                          <tr
                            key={`${item.sourceType}-${item.id}`}
                            className={`transition ${
                              item.supervisorWarning
                                ? "bg-rose-50/40 hover:bg-rose-50/70 border-l-4 border-l-rose-500"
                                : "hover:bg-emerald-50/30"
                            }`}
                          >
                            {/* Kolom 1: Tiket, Tanggal & Sumber */}
                            <td className="py-3.5 px-4 align-top">
                              <span className="font-mono font-bold text-xs bg-slate-100 text-slate-800 px-2 py-0.5 rounded border border-slate-200">
                                {item.ticketNumber}
                              </span>
                              <div className="mt-1 flex items-center gap-1 text-[10px] text-slate-400">
                                <Calendar className="w-3 h-3 shrink-0" />
                                {new Date(item.createdAt).toLocaleDateString("id-ID", {
                                  day: "numeric",
                                  month: "short",
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </div>
                              <div className="mt-1">
                                {item.sourceType === "PUBLIC" ? (
                                  <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                                    <Globe className="w-3 h-3 text-blue-600" /> Publik
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200">
                                    <Building2 className="w-3 h-3 text-purple-600" /> Internal
                                  </span>
                                )}
                              </div>
                            </td>

                            {/* Kolom 2: Kategori & Ubah Cepat */}
                            <td className="py-3.5 px-4 align-top">
                              <span
                                className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold text-white shadow-xs max-w-full truncate"
                                style={{ backgroundColor: item.categoryColor }}
                              >
                                ● {item.categoryLabel}
                              </span>
                              {item.sourceType === "PUBLIC" && (
                                <div className="mt-1.5">
                                  <select
                                    value={item.categoryCode}
                                    disabled={updatingCategoryId === item.id || (item.status === "SELESAI" && userRole !== "SUPERADMIN")}
                                    onChange={(e) => handleQuickCategoryChange(item.id, e.target.value)}
                                    className="text-[10px] font-semibold rounded-md px-1.5 py-0.5 border border-slate-200 bg-white text-slate-700 cursor-pointer w-full max-w-[130px] truncate disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed"
                                    title={item.status === "SELESAI" && userRole !== "SUPERADMIN" ? "Terkunci: Laporan telah SELESAI" : "Ubah kategori cepat"}
                                  >
                                    {categories.map((c) => (
                                      <option key={c.code} value={c.code}>
                                        {c.name}
                                      </option>
                                    ))}
                                  </select>
                                </div>
                              )}
                              {item.categoryChangeNote && (
                                <span className="block text-[9px] text-amber-700 font-semibold mt-1 line-clamp-1" title={item.categoryChangeNote}>
                                  ✏️ Diubah ({item.categoryChangedBy || "Humas"})
                                </span>
                              )}
                            </td>

                            {/* Kolom 3: Pengirim / Kontak */}
                            <td className="py-3.5 px-4 align-top break-words">
                              {item.isAnonymous ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600">
                                  <EyeOff className="w-3 h-3" /> Anonim
                                </span>
                              ) : (
                                <div>
                                  <p className="font-bold text-slate-800 text-xs">{item.reporterName}</p>
                                  <p className="text-[10px] text-slate-400 mt-0.5">{item.reporterContactOrRoom}</p>
                                </div>
                              )}
                            </td>

                            {/* Kolom 4: Judul, Isi & Atensi Atasan */}
                            <td className="py-3.5 px-4 align-top">
                              {/* Banner Atensi Atasan Jika Ada */}
                              {item.supervisorWarning && (
                                <div className="mb-2 p-2 rounded-lg bg-gradient-to-r from-rose-50 to-amber-50 border border-rose-300 text-rose-950 text-xs shadow-xs">
                                  <div className="flex items-center justify-between font-bold text-rose-800 text-[11px]">
                                    <span className="flex items-center gap-1">
                                      <AlertTriangle className="w-3.5 h-3.5 text-rose-600 animate-pulse shrink-0" />
                                      ⚠️ ATENSI ATASAN
                                    </span>
                                    {item.supervisorWarningBy && (
                                      <span className="font-normal text-[10px] text-slate-500">
                                        oleh {item.supervisorWarningBy}
                                      </span>
                                    )}
                                  </div>
                                  <p className="italic text-[11px] font-semibold text-rose-900 mt-0.5 line-clamp-2">
                                    &ldquo;{item.supervisorWarning}&rdquo;
                                  </p>
                                </div>
                              )}
                              <p className="font-bold text-slate-900 text-xs sm:text-sm line-clamp-1">
                                {item.title}
                              </p>
                              <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{item.content}</p>
                              {item.responseNote && (
                                <div className="mt-1 p-1.5 rounded-lg bg-teal-50 border border-teal-200 text-[10px] text-teal-900">
                                  <b>Respon Humas:</b> {item.responseNote}
                                </div>
                              )}
                            </td>

                            {/* Kolom 5: Urgensi */}
                            <td className="py-3.5 px-4 align-top">
                              {item.sourceType === "PUBLIC" ? (
                                <select
                                  value={item.urgency}
                                  disabled={updatingUrgencyId === item.id || (item.status === "SELESAI" && userRole !== "SUPERADMIN")}
                                  onChange={(e) =>
                                    handleQuickUrgencyChange(item.id, e.target.value as any)
                                  }
                                  className={`text-xs font-bold rounded-lg px-2 py-1 border cursor-pointer disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed ${
                                    item.urgency === "KRITIS"
                                      ? "bg-rose-50 border-rose-300 text-rose-700"
                                      : item.urgency === "TINGGI"
                                      ? "bg-amber-50 border-amber-300 text-amber-800"
                                      : "bg-sky-50 border-sky-300 text-sky-800"
                                  }`}
                                  title={item.status === "SELESAI" && userRole !== "SUPERADMIN" ? "Terkunci: Laporan telah SELESAI" : "Ubah urgensi"}
                                >
                                  <option value="KRITIS">🚨 Kritis</option>
                                  <option value="TINGGI">⚠️ Tinggi</option>
                                  <option value="SEDANG">⚡ Sedang</option>
                                  <option value="RENDAH">☕ Rendah</option>
                                </select>
                              ) : (
                                <span className="font-bold text-xs">{item.urgency}</span>
                              )}
                            </td>

                            {/* Kolom 6: Status & Aksi Humas */}
                            <td className="py-3.5 px-4 align-top text-right">
                              <div className="flex flex-col items-end gap-1">
                                <span
                                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                    item.status === "SELESAI"
                                      ? "bg-teal-100 text-teal-900 border border-teal-300"
                                      : item.status === "DIDISPOSISIKAN" || item.statusGroup === "PROSES"
                                      ? "bg-blue-100 text-blue-900 border border-blue-300"
                                      : "bg-amber-100 text-amber-900 border border-amber-300"
                                  }`}
                                >
                                  {item.status}
                                </span>
                                <p className="text-[11px] font-semibold text-slate-700 truncate max-w-[150px]">
                                  {item.dispositionOrTechnician}
                                </p>
                              </div>

                              <div className="mt-2 flex items-center justify-end gap-1.5 flex-wrap">
                                {/* Tombol Utama Terpadu: Detail & Kelola */}
                                <button
                                  type="button"
                                  onClick={() => openDetailModal(item, "DETAIL")}
                                  className="px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white transition shadow-xs flex items-center gap-1.5"
                                  title="Lihat Rincian Laporan, Lampiran & Kelola"
                                >
                                  <Eye className="w-3.5 h-3.5" />
                                  <span>Detail & Aksi</span>
                                </button>

                                {/* Tombol Hapus Laporan (Khusus Superadmin - Duplikat / Human Error) */}
                                {userRole === "SUPERADMIN" && item.sourceType === "PUBLIC" && item.rawPublic && (
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteReport(item.id, item.ticketNumber)}
                                    className="p-1.5 rounded-xl text-rose-600 bg-rose-50 hover:bg-rose-100 border border-rose-200 transition"
                                    title="Hapus Laporan (Khusus Superadmin - Duplikat / Human Error)"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Kontrol Penomoran Halaman (Pagination) */}
                {totalPages > 1 && (
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 bg-white rounded-2xl border border-emerald-100 shadow-xs">
                    <div className="text-xs text-slate-500 font-medium">
                      Menampilkan{" "}
                      <span className="font-bold text-slate-800">
                        {totalReports === 0 ? 0 : (currentPage - 1) * pageSize + 1}
                      </span>{" "}
                      -{" "}
                      <span className="font-bold text-slate-800">
                        {Math.min(currentPage * pageSize, totalReports)}
                      </span>{" "}
                      dari <span className="font-bold text-slate-800">{totalReports}</span>{" "}
                      laporan
                    </div>

                    <div className="flex flex-wrap items-center gap-1.5">
                      {/* Tombol Sebelumnya */}
                      <button
                        onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                        className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
                      >
                        « Sebelumnya
                      </button>

                      {/* Nomor-nomor halaman */}
                      {getPageNumbers().map((page, idx) =>
                        page === "..." ? (
                          <span key={`ellipsis-${idx}`} className="px-1.5 text-slate-400 text-xs">
                            ...
                          </span>
                        ) : (
                          <button
                            key={`page-${page}`}
                            onClick={() => setCurrentPage(page as number)}
                            className={`w-8 h-8 rounded-xl text-xs font-bold transition ${
                              currentPage === page
                                ? "bg-emerald-600 text-white shadow-xs"
                                : "border border-slate-200 text-slate-700 hover:bg-slate-50"
                            }`}
                          >
                            {page}
                          </button>
                        )
                      )}

                      {/* Tombol Berikutnya */}
                      <button
                        onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                        disabled={currentPage === totalPages}
                        className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
                      >
                        Berikutnya »
                      </button>

                      {/* Pilihan jumlah per halaman */}
                      <select
                        value={pageSize}
                        onChange={(e) => setPageSize(Number(e.target.value))}
                        className="ml-2 text-xs font-semibold rounded-xl border border-slate-200 px-2 py-1.5 bg-white text-slate-700 focus:outline-none"
                      >
                        <option value={10}>10 / hal</option>
                        <option value={25}>25 / hal</option>
                        <option value={50}>50 / hal</option>
                      </select>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 2: PEWARNAAN KATEGORI (SUPERADMIN)                     */}
        {/* ========================================================= */}
        {activeTab === "CATEGORIES" && userRole === "SUPERADMIN" && (
          <div className="space-y-6 animate-in fade-in duration-150">
            <div className="bg-white p-6 rounded-2xl border border-emerald-200 shadow-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
                <div>
                  <h3 className="text-lg font-black text-slate-900">
                    Pengaturan Pewarnaan & Label Kategori Aduan
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Warna yang disetting di sini otomatis digunakan di formulir Landing Page, lencana seluruh dashboard, dan rekap analitik.
                  </p>
                </div>
                <button
                  onClick={() => {
                    setEditingCategory(null);
                    setCatNameInput("");
                    setCatCodeInput("");
                    setCatColorInput("#2563EB");
                    setCatDescInput("");
                    setShowAddCategoryModal(true);
                  }}
                  className="inline-flex items-center px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition shadow-xs"
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Tambah Kategori Baru
                </button>
              </div>

              {/* Tabel Kategori */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs sm:text-sm border-collapse">
                  <thead>
                    <tr className="bg-slate-50 text-slate-700 uppercase text-[11px] font-bold border-b border-slate-200">
                      <th className="py-3 px-4">Warna & Sampul</th>
                      <th className="py-3 px-4">Nama Kategori</th>
                      <th className="py-3 px-4">Kode Unik</th>
                      <th className="py-3 px-4">Deskripsi / Ruang Lingkup</th>
                      <th className="py-3 px-4 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {categories.map((cat) => (
                      <tr key={cat.id} className="hover:bg-slate-50 transition">
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-2">
                            <span
                              className="w-6 h-6 rounded-lg border shadow-xs"
                              style={{ backgroundColor: cat.color }}
                            />
                            <span className="font-mono text-xs font-bold text-slate-700">
                              {cat.color}
                            </span>
                          </div>
                        </td>
                        <td className="py-3.5 px-4 font-bold text-slate-900">{cat.name}</td>
                        <td className="py-3.5 px-4 font-mono text-xs text-slate-500">{cat.code}</td>
                        <td className="py-3.5 px-4 text-xs text-slate-500 max-w-sm">{cat.description || "-"}</td>
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => {
                                setEditingCategory(cat);
                                setCatNameInput(cat.name);
                                setCatCodeInput(cat.code);
                                setCatColorInput(cat.color);
                                setCatDescInput(cat.description || "");
                                setShowAddCategoryModal(true);
                              }}
                              className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold text-emerald-700 hover:bg-emerald-50 border border-emerald-200 transition"
                            >
                              <Edit3 className="w-3 h-3 mr-1" />
                              Ubah
                            </button>
                            <button
                              onClick={() => handleDeleteCategory(cat.id, cat.name)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition border border-transparent hover:border-rose-200"
                              title="Hapus Kategori"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 3: SETTING WA BLAST (SUPERADMIN)                       */}
        {/* ========================================================= */}
        {activeTab === "WA_BLAST" && userRole === "SUPERADMIN" && (
          <div className="space-y-6 animate-in fade-in duration-150">
            {/* 0. Konfigurasi Gateway WhatsApp Saung WA (app.saungwa.com) */}
            <div className="bg-white p-6 rounded-2xl border border-emerald-200 shadow-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
                <div>
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 mb-1.5 border border-emerald-200">
                    <Radio className="w-3.5 h-3.5 text-emerald-600 animate-pulse" />
                    Koneksi API WhatsApp Resmi
                  </div>
                  <h3 className="text-lg font-black text-slate-900">
                    Konfigurasi Gateway WhatsApp (Saung WA - https://app.saungwa.com/)
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Integrasikan akun WhatsApp instansi Anda melalui API Saung WA agar disposisi aduan dan pemicu WA Blast benar-benar terkirim otomatis ke ponsel penerima.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <a
                    href="https://app.saungwa.com/"
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center px-3 py-1.5 rounded-xl border border-emerald-300 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold transition"
                  >
                    Buka Portal Saung WA
                    <ExternalLink className="w-3.5 h-3.5 ml-1.5" />
                  </a>
                </div>
              </div>

              {/* Panduan Cepat Integrasi Saung WA */}
              <div className="mb-6 p-4 rounded-xl bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 text-xs space-y-2">
                <p className="font-bold text-emerald-950 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-700" />
                  Cara Menghubungkan API Saung WA (app.saungwa.com) ke Sistem:
                </p>
                <ol className="list-decimal list-inside space-y-1 text-slate-700 text-[11px]">
                  <li>
                    Login ke akun Anda di <b>https://app.saungwa.com/</b> (atau daftar jika belum punya akun).
                  </li>
                  <li>
                    Buka menu <b>Device Manager</b>, buat perangkat baru dan pindai (scan) kode QR WhatsApp menggunakan nomor WhatsApp dinas/resmi instansi Anda.
                  </li>
                  <li>
                    Setelah terhubung (status Online/Connected), salin kode <b>App Key</b> perangkat.
                  </li>
                  <li>
                    Buka menu profil atau dokumentasi API untuk mendapatkan <b>Auth Key</b> akun Anda.
                  </li>
                  <li>
                    Masukkan <b>App Key</b> dan <b>Auth Key</b> pada kolom di bawah, lalu klik <b>Simpan Pengaturan Gateway</b>.
                  </li>
                </ol>
              </div>

              {/* Form Pengaturan Gateway */}
              <form onSubmit={handleSaveGatewaySettings} className="space-y-4">
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                  <div>
                    <label className="text-xs font-bold text-slate-900 block cursor-pointer">
                      Status Pengiriman WA Blast Otomatis
                    </label>
                    <span className="text-[11px] text-slate-500 block">
                      Jika aktif, sistem akan langsung menembak API Saung WA saat admin Humas memilih opsi kirim notifikasi disposisi.
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.waGatewayEnabled}
                    onChange={(e) =>
                      setSettings({ ...settings, waGatewayEnabled: e.target.checked })
                    }
                    className="w-5 h-5 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500 cursor-pointer"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Penyedia Gateway (Provider) *
                    </label>
                    <select
                      value={settings.waGatewayProvider}
                      onChange={(e) =>
                        setSettings({ ...settings, waGatewayProvider: e.target.value })
                      }
                      className="w-full px-3.5 py-2.5 text-xs sm:text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white font-medium"
                    >
                      <option value="SAUNG_WA">Saung WA (https://app.saungwa.com/) [Aktif / Terintegrasi]</option>
                      <option value="FONNTE">Fonnte WhatsApp API (api.fonnte.com)</option>
                      <option value="WABLAS">Wablas Gateway API (wablas.com)</option>
                      <option value="SIMULASI_GATEWAY">Simulasi Internal (Hanya Catat Riwayat)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      URL Endpoint API Gateway *
                    </label>
                    <input
                      type="text"
                      required
                      value={settings.waGatewayUrl}
                      onChange={(e) =>
                        setSettings({ ...settings, waGatewayUrl: e.target.value })
                      }
                      placeholder="https://app.saungwa.com/api/create-message"
                      className="w-full px-3.5 py-2 text-xs sm:text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Saung WA App Key (Device Key) *
                    </label>
                    <input
                      type="text"
                      value={settings.waAppKey || settings.waSenderNumber || ""}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          waAppKey: e.target.value,
                          waSenderNumber: e.target.value,
                        })
                      }
                      placeholder="Contoh: c0379471-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                      className="w-full px-3.5 py-2 text-xs sm:text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white font-mono"
                    />
                    <span className="text-[10px] text-slate-400 mt-0.5 block">
                      Diambil dari menu Device Manager di https://app.saungwa.com/
                    </span>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Saung WA Auth Key (API Key Akun) *
                    </label>
                    <input
                      type="password"
                      value={settings.waAuthKey || settings.waApiKey || ""}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          waAuthKey: e.target.value,
                          waApiKey: e.target.value,
                        })
                      }
                      placeholder="Contoh: authkey-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                      className="w-full px-3.5 py-2 text-xs sm:text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white font-mono"
                    />
                    <span className="text-[10px] text-slate-400 mt-0.5 block">
                      Diambil dari menu Profile / Dokumentasi API di https://app.saungwa.com/
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-end pt-2">
                  <button
                    type="submit"
                    disabled={isSavingGateway}
                    className="inline-flex items-center px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition shadow-xs disabled:opacity-60"
                  >
                    {isSavingGateway ? (
                      <Loader2 className="w-4 h-4 animate-spin mr-1.5" />
                    ) : (
                      <Check className="w-4 h-4 mr-1.5" />
                    )}
                    Simpan Pengaturan Gateway
                  </button>
                </div>
              </form>

              {/* Uji Coba Pengiriman Pesan WhatsApp (Live Test) */}
              <div className="mt-6 pt-6 border-t border-slate-100">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                    <Send className="w-4 h-4 text-indigo-600" />
                    Uji Coba Pengiriman Pesan WhatsApp Langsung (Live Test)
                  </h4>
                  <span className="text-[11px] text-slate-400">
                    Kirim pesan nyata ke nomor HP untuk menguji gateway
                  </span>
                </div>

                <form onSubmit={handleSendTestWa} className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
                  <div className="md:col-span-4">
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Nomor WhatsApp Tujuan *
                    </label>
                    <input
                      type="text"
                      required
                      value={testWaPhone}
                      onChange={(e) => setTestWaPhone(e.target.value)}
                      placeholder="Contoh: 081234567890 / 6281234567890"
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white font-mono"
                    />
                  </div>

                  <div className="md:col-span-6">
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Teks Pesan Uji Coba *
                    </label>
                    <input
                      type="text"
                      required
                      value={testWaMessage}
                      onChange={(e) => setTestWaMessage(e.target.value)}
                      placeholder="Tuliskan pesan uji coba..."
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <button
                      type="submit"
                      disabled={isSendingTestWa}
                      className="w-full py-2 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition flex items-center justify-center gap-1 shadow-xs disabled:opacity-60"
                    >
                      {isSendingTestWa ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Send className="w-3.5 h-3.5" />
                      )}
                      Kirim Tes
                    </button>
                  </div>
                </form>

                {/* Hasil Respon Live Test */}
                {testWaResult && (
                  <div
                    className={`mt-3 p-3.5 rounded-xl border text-xs animate-in fade-in ${
                      testWaResult.success
                        ? "bg-emerald-50 border-emerald-200 text-emerald-900"
                        : "bg-rose-50 border-rose-200 text-rose-900"
                    }`}
                  >
                    <div className="flex items-center gap-2 font-bold">
                      {testWaResult.success ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      ) : (
                        <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                      )}
                      <span>{testWaResult.message}</span>
                    </div>
                    {testWaResult.response && (
                      <pre className="mt-2 p-2 rounded-lg bg-white/80 border border-slate-200 font-mono text-[10px] overflow-x-auto text-slate-700">
                        {JSON.stringify(testWaResult.response, null, 2)}
                      </pre>
                    )}

                    {/* Panduan Pemecahan Masalah "Invalid Auth and AppKey" */}
                    {!testWaResult.success &&
                      JSON.stringify(testWaResult.response).includes("Invalid Auth and AppKey") && (
                        <div className="mt-3 p-3.5 bg-amber-50/90 border border-amber-300 rounded-xl text-amber-950 text-xs space-y-2">
                          <div className="font-bold flex items-center gap-1.5 text-amber-900">
                            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                            <span>Penyebab Pesan Error &quot;Invalid Auth and AppKey&quot; dari Server Saung WA:</span>
                          </div>
                          <ol className="list-decimal list-inside space-y-1.5 text-[11px] text-amber-900/90 pl-1 leading-relaxed">
                            <li>
                              <b>Perangkat (Device) Belum Terhubung (Connected):</b> Di dashboard{" "}
                              <a
                                href="https://app.saungwa.com/"
                                target="_blank"
                                rel="noreferrer"
                                className="underline font-bold text-amber-950"
                              >
                                https://app.saungwa.com/
                              </a>
                              , buka menu <b>Device / Perangkat</b>. Status perangkat wajib berwarna hijau <b>Connected</b>. Jika berstatus <i>Disconnected</i> atau <i>Need Scan</i>, klik tombol scan QR dan tautkan via WhatsApp di ponsel Anda (menu <i>Perangkat Tertaut</i>).
                            </li>
                            <li>
                              <b>App Key Harus Sesuai Perangkat:</b> Pastikan App Key yang diisi di atas adalah milik perangkat yang sedang Connected tersebut. Jika Anda pernah menghapus dan membuat device baru, App Key yang lama otomatis tidak berlaku lagi.
                            </li>
                            <li>
                              <b>Auth Key Harus Sesuai Akun:</b> Pastikan Auth Key disalin langsung dari menu profil/API akun Saung WA Anda dan akun memiliki paket/kuota pengiriman pesan yang aktif.
                            </li>
                          </ol>
                        </div>
                      )}
                  </div>
                )}
              </div>
            </div>

            {/* 1. Pemetaan Nomor Kontak Bidang */}
            <div className="bg-white p-6 rounded-2xl border border-emerald-200 shadow-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
                <div>
                  <h3 className="text-lg font-black text-slate-900">
                    Pemetaan Nomor Kontak WhatsApp Bidang
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Nomor kontak ini otomatis menjadi target tujuan pengiriman notifikasi WA Blast saat Humas melakukan disposisi aduan.
                  </p>
                </div>
                <button
                  onClick={() => {
                    setEditingContactId(null);
                    setContactNameInput("");
                    setContactPicInput("");
                    setContactPhoneInput("");
                    setContactEmailInput("");
                    setShowAddContactModal(true);
                  }}
                  className="inline-flex items-center px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition shadow-xs"
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Tambah Kontak Bidang
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs sm:text-sm border-collapse">
                  <thead>
                    <tr className="bg-slate-50 text-slate-700 uppercase text-[11px] font-bold border-b border-slate-200">
                      <th className="py-3 px-4">Nama Bidang / Divisi</th>
                      <th className="py-3 px-4">Nama PIC / Pejabat</th>
                      <th className="py-3 px-4">Nomor WhatsApp</th>
                      <th className="py-3 px-4">Email</th>
                      <th className="py-3 px-4 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {departmentContacts.map((c) => (
                      <tr key={c.id} className="hover:bg-slate-50 transition">
                        <td className="py-3.5 px-4 font-bold text-slate-900 flex items-center gap-2">
                          <Building2 className="w-4 h-4 text-slate-400" />
                          {c.name}
                        </td>
                        <td className="py-3.5 px-4 font-semibold text-slate-700">{c.contactName || "-"}</td>
                        <td className="py-3.5 px-4 font-mono font-bold text-emerald-800">
                          {c.phone}
                        </td>
                        <td className="py-3.5 px-4 text-slate-500 text-xs">{c.email || "-"}</td>
                        <td className="py-3.5 px-4 text-right whitespace-nowrap">
                          <button
                            onClick={() => {
                              setEditingContactId(c.id);
                              setContactNameInput(c.name);
                              setContactPicInput(c.contactName || "");
                              setContactPhoneInput(c.phone);
                              setContactEmailInput(c.email || "");
                              setShowAddContactModal(true);
                            }}
                            className="p-1.5 rounded-lg text-slate-600 hover:text-emerald-700 hover:bg-emerald-50 transition mr-1"
                            title="Edit Kontak"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteContact(c.id)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                            title="Hapus Kontak"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* 2. Manajemen Template WA Blast */}
            <div className="bg-white p-6 rounded-2xl border border-emerald-200 shadow-xs">
              <h3 className="text-lg font-black text-slate-900 mb-1">
                Manajemen Template Pesan WA Blast
              </h3>
              <p className="text-xs text-slate-500 mb-4">
                Konfigurasi draf pesan otomatis dengan tag variabel: <code>&#123;NOMOR_TIKET&#125;</code>, <code>&#123;JUDUL&#125;</code>, <code>&#123;KATEGORI&#125;</code>, <code>&#123;URGENSI&#125;</code>, <code>&#123;BIDANG&#125;</code>, <code>&#123;CATATAN_DISPOSISI&#125;</code>, <code>&#123;TANGGAL&#125;</code>, <code>&#123;LINK_PORTAL&#125;</code>.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {waTemplates.map((tpl) => (
                  <div key={tpl.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-mono text-xs font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded">
                          {tpl.code}
                        </span>
                        <button
                          onClick={() => {
                            setEditingTemplate(tpl);
                            setTplTitleInput(tpl.title);
                            setTplContentInput(tpl.content);
                          }}
                          className="text-xs font-bold text-emerald-700 hover:underline inline-flex items-center"
                        >
                          <Edit3 className="w-3 h-3 mr-1" /> Edit Template
                        </button>
                      </div>
                      <h4 className="font-bold text-slate-900 text-sm">{tpl.title}</h4>
                      <pre className="mt-2 p-2.5 rounded-lg bg-white border border-slate-200 text-[11px] text-slate-700 font-mono whitespace-pre-wrap max-h-48 overflow-y-auto">
                        {tpl.content}
                      </pre>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 3. Pengaturan Gateway & Log Riwayat WA Blast */}
            <div className="bg-white p-6 rounded-2xl border border-emerald-200 shadow-xs">
              <h3 className="text-lg font-black text-slate-900 mb-1">
                Riwayat Log Pengiriman WA Blast
              </h3>
              <p className="text-xs text-slate-500 mb-4">
                Daftar pengiriman pesan notifikasi otomatis yang telah disalurkan melalui gateway WhatsApp.
              </p>

              <div className="overflow-x-auto max-h-64 overflow-y-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50 text-slate-700 uppercase text-[10px] font-bold border-b border-slate-200">
                      <th className="py-2.5 px-3">Waktu Kirim</th>
                      <th className="py-2.5 px-3">Tiket</th>
                      <th className="py-2.5 px-3">Bidang Penerima</th>
                      <th className="py-2.5 px-3">No. WhatsApp</th>
                      <th className="py-2.5 px-3">Pesan Cuplikan</th>
                      <th className="py-2.5 px-3 text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {waLogs.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-6 text-center text-slate-400">
                          Belum ada log pengiriman WA Blast tercatat.
                        </td>
                      </tr>
                    ) : (
                      waLogs.map((log) => (
                        <tr key={log.id} className="hover:bg-slate-50 transition">
                          <td className="py-2 px-3 whitespace-nowrap text-slate-400">
                            {new Date(log.createdAt).toLocaleString("id-ID")}
                          </td>
                          <td className="py-2 px-3 font-mono font-bold text-slate-800">{log.ticketNumber || "-"}</td>
                          <td className="py-2 px-3 font-semibold text-slate-700">{log.department || "-"}</td>
                          <td className="py-2 px-3 font-mono text-emerald-800">{log.recipientPhone}</td>
                          <td className="py-2 px-3 text-slate-500 max-w-xs truncate">{log.message}</td>
                          <td className="py-2 px-3 text-right">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                log.status === "TERKIRIM"
                                  ? "bg-emerald-100 text-emerald-900 border border-emerald-300"
                                  : "bg-rose-100 text-rose-900 border border-rose-300"
                              }`}
                            >
                              {log.status}
                            </span>
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

        {/* ========================================================= */}
        {/* TAB 4: SETTING AKUN PENGGUNA (SUPERADMIN)                  */}
        {/* ========================================================= */}
        {activeTab === "USERS" && userRole === "SUPERADMIN" && (
          <div className="space-y-6 animate-in fade-in duration-150">
            <div className="bg-white p-6 rounded-2xl border border-emerald-200 shadow-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
                <div>
                  <h3 className="text-lg font-black text-slate-900">
                    Manajemen Akun Pengguna Sistem
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Kelola seluruh akun aparatur, hak akses peran (Superadmin, Admin Humas, Manajemen, Teknisi, Staf), dan kredensial.
                  </p>
                </div>

                <button
                  onClick={() => setShowAddUserModal(true)}
                  className="inline-flex items-center px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition shadow-xs"
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Buat Akun Baru
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs sm:text-sm border-collapse">
                  <thead>
                    <tr className="bg-slate-50 text-slate-700 uppercase text-[11px] font-bold border-b border-slate-200">
                      <th className="py-3 px-4">Nama Lengkap</th>
                      <th className="py-3 px-4">Username / Email</th>
                      <th className="py-3 px-4">Peran (Role)</th>
                      <th className="py-3 px-4">Tanggal Dibuat</th>
                      <th className="py-3 px-4 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {isUsersLoading ? (
                      <tr>
                        <td colSpan={5} className="py-8 text-center text-slate-400">
                          <Loader2 className="w-5 h-5 animate-spin mx-auto text-emerald-600 mb-2" />
                          Memuat data pengguna...
                        </td>
                      </tr>
                    ) : (
                      usersList.map((usr) => (
                        <tr key={usr.id} className="hover:bg-slate-50 transition">
                          <td className="py-3.5 px-4 font-bold text-slate-900">{usr.name}</td>
                          <td className="py-3.5 px-4 font-mono text-slate-700">{usr.email}</td>
                          <td className="py-3.5 px-4">
                            <span
                              className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                                usr.role === "SUPERADMIN"
                                  ? "bg-purple-100 text-purple-900 border border-purple-300"
                                  : usr.role === "ADMIN" || usr.role === "HUMAS"
                                  ? "bg-emerald-100 text-emerald-900 border border-emerald-300"
                                  : usr.role === "MANAJEMEN"
                                  ? "bg-indigo-100 text-indigo-900 border border-indigo-300"
                                  : usr.role === "TEKNISI"
                                  ? "bg-amber-100 text-amber-900 border border-amber-300"
                                  : "bg-slate-100 text-slate-800"
                              }`}
                            >
                              {usr.role}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-slate-400 text-xs">
                            {new Date(usr.createdAt).toLocaleDateString("id-ID")}
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            <div className="flex items-center justify-end gap-1">
                              <button
                                onClick={() => handleOpenEditUser(usr)}
                                className="p-1.5 rounded-lg text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 transition"
                                title="Edit Akun Pengguna (Username, Password, Role)"
                              >
                                <Pencil className="w-4 h-4" />
                              </button>
                              {usr.id !== session?.user?.id && (
                                <button
                                  onClick={() => handleDeleteUser(usr.id, usr.name)}
                                  className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                                  title="Hapus Akun"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              )}
                            </div>
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

        {/* ========================================================= */}
        {/* TAB 5: KONFIGURASI PARAMETER SISTEM & LINK PORTAL         */}
        {/* ========================================================= */}
        {activeTab === "SETTINGS" && userRole === "SUPERADMIN" && (
          <div className="space-y-6 animate-in fade-in duration-150">
            {/* Pusat Tautan & Link Portal */}
            <div className="bg-white p-6 rounded-2xl border border-emerald-200 shadow-xs">
              <h3 className="text-lg font-black text-slate-900 mb-1">
                Pusat Tautan Resmi Sistem (Share Link Center)
              </h3>
              <p className="text-xs text-slate-500 mb-4">
                Salin tautan resmi sistem untuk dibagikan kepada publik, staf, maupun pimpinan instansi.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3">
                <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 flex flex-col justify-between">
                  <div>
                    <span className="text-[10px] font-bold text-blue-700 uppercase">Masyarakat Umum</span>
                    <h4 className="font-bold text-slate-900 text-sm mt-0.5">Portal Aduan Publik</h4>
                    <p className="text-[11px] text-slate-500 mt-1">Halaman depan pelaporan warga</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => copyShareLink("/")}
                    className="mt-3 w-full py-1.5 px-3 rounded-lg bg-white border border-slate-300 text-xs font-bold text-slate-700 hover:bg-slate-100 flex items-center justify-center gap-1"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    {copiedLink === "/" ? "Tersalin!" : "Salin Link Portal"}
                  </button>
                </div>

                <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/40 flex flex-col justify-between">
                  <div>
                    <span className="text-[10px] font-bold text-emerald-800 uppercase">Tim Humas & Operasional</span>
                    <h4 className="font-bold text-slate-900 text-sm mt-0.5">Dashboard Humas</h4>
                    <p className="text-[11px] text-slate-500 mt-1">Pusat komando disposisi & meja kerja aduan</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => copyShareLink("/dashboard")}
                    className="mt-3 w-full py-1.5 px-3 rounded-lg bg-white border border-emerald-300 text-xs font-bold text-emerald-800 hover:bg-emerald-50 flex items-center justify-center gap-1"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    {copiedLink === "/dashboard" ? "Tersalin!" : "Salin Link Humas"}
                  </button>
                </div>

                <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 flex flex-col justify-between">
                  <div>
                    <span className="text-[10px] font-bold text-indigo-700 uppercase">Pimpinan / Manajemen</span>
                    <h4 className="font-bold text-slate-900 text-sm mt-0.5">Dashboard Manajemen</h4>
                    <p className="text-[11px] text-slate-500 mt-1">Rekap warna kategori & analisis SLA</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => copyShareLink("/manajemen")}
                    className="mt-3 w-full py-1.5 px-3 rounded-lg bg-white border border-slate-300 text-xs font-bold text-slate-700 hover:bg-slate-100 flex items-center justify-center gap-1"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    {copiedLink === "/manajemen" ? "Tersalin!" : "Salin Link Manajemen"}
                  </button>
                </div>

                <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 flex flex-col justify-between">
                  <div>
                    <span className="text-[10px] font-bold text-amber-700 uppercase">Tim Lapangan</span>
                    <h4 className="font-bold text-slate-900 text-sm mt-0.5">Workspace Teknisi</h4>
                    <p className="text-[11px] text-slate-500 mt-1">Antrean tugas kendala & disposisi</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => copyShareLink("/teknisi")}
                    className="mt-3 w-full py-1.5 px-3 rounded-lg bg-white border border-slate-300 text-xs font-bold text-slate-700 hover:bg-slate-100 flex items-center justify-center gap-1"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    {copiedLink === "/teknisi" ? "Tersalin!" : "Salin Link Teknisi"}
                  </button>
                </div>

                <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 flex flex-col justify-between">
                  <div>
                    <span className="text-[10px] font-bold text-purple-700 uppercase">Karyawan Internal</span>
                    <h4 className="font-bold text-slate-900 text-sm mt-0.5">Portal Staf Pegawai</h4>
                    <p className="text-[11px] text-slate-500 mt-1">Lapor kerusakan sarana ruangan</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => copyShareLink("/karyawan")}
                    className="mt-3 w-full py-1.5 px-3 rounded-lg bg-white border border-slate-300 text-xs font-bold text-slate-700 hover:bg-slate-100 flex items-center justify-center gap-1"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    {copiedLink === "/karyawan" ? "Tersalin!" : "Salin Link Staf"}
                  </button>
                </div>
              </div>
            </div>

            {/* Formulir Konfigurasi Organisasi */}
            <div className="bg-white p-6 rounded-2xl border border-emerald-200 shadow-xs">
              <h3 className="text-lg font-black text-slate-900 mb-1">
                Parameter Konfigurasi Organisasi
              </h3>
              <p className="text-xs text-slate-500 mb-6">
                Identitas instansi, slogan resmi, serta daftar ketersediaan unit teknisi.
              </p>

              <form onSubmit={handleSaveSettings} className="space-y-4 max-w-3xl">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Nama Resmi Instansi
                  </label>
                  <input
                    type="text"
                    value={settings.institutionName}
                    onChange={(e) => setSettings({ ...settings, institutionName: e.target.value })}
                    className="w-full px-3.5 py-2 text-xs sm:text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Slogan / Tagline Instansi
                  </label>
                  <input
                    type="text"
                    value={settings.institutionTagline}
                    onChange={(e) => setSettings({ ...settings, institutionTagline: e.target.value })}
                    className="w-full px-3.5 py-2 text-xs sm:text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Pengumuman Darurat Sistem (Opsional)
                  </label>
                  <input
                    type="text"
                    value={settings.systemAnnouncement || ""}
                    onChange={(e) => setSettings({ ...settings, systemAnnouncement: e.target.value })}
                    placeholder="Contoh: Pemeliharaan berkala server pada hari Minggu."
                    className="w-full px-3.5 py-2 text-xs sm:text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-end">
                  <button
                    type="submit"
                    disabled={isSavingSettings}
                    className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition shadow-xs disabled:opacity-60 flex items-center"
                  >
                    {isSavingSettings ? (
                      <Loader2 className="w-4 h-4 animate-spin mr-1.5" />
                    ) : (
                      <CheckCircle2 className="w-4 h-4 mr-1.5" />
                    )}
                    Simpan Konfigurasi Superadmin
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* MODAL 1: UBAH KATEGORI DENGAN CATATAN (ADMIN HUMAS)       */}
        {/* ========================================================= */}
        {selectedReportForCategoryChange && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in">
            <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-emerald-200">
              <div className="flex items-center space-x-2 text-emerald-700 mb-1">
                <Palette className="w-5 h-5" />
                <span className="text-xs font-bold uppercase tracking-wider">Ubah Kategori Laporan</span>
              </div>
              <h3 className="text-lg font-black text-slate-900">
                Ubah Kategori Disertai Catatan Alasan
              </h3>

              <div className="mt-3 p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1">
                <div className="flex items-center justify-between text-slate-500 text-[11px]">
                  <span>Tiket: <b>{selectedReportForCategoryChange.ticketNumber}</b></span>
                  <span>
                    Kategori Sekarang:{" "}
                    <b>{getCategoryMeta(selectedReportForCategoryChange.category).name}</b>
                  </span>
                </div>
                <p className="font-bold text-slate-900 text-sm mt-1">{selectedReportForCategoryChange.title}</p>
              </div>

              <form onSubmit={handleSubmitCategoryChange} className="mt-4 space-y-3.5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Pilih Kategori Baru *
                  </label>
                  <select
                    value={newCategorySelection}
                    onChange={(e) => setNewCategorySelection(e.target.value)}
                    className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white font-medium"
                  >
                    {categories.map((c) => (
                      <option key={c.code} value={c.code}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Catatan / Alasan Perubahan Kategori (Wajib) *
                  </label>
                  <textarea
                    rows={3}
                    required
                    value={categoryChangeReason}
                    onChange={(e) => setCategoryChangeReason(e.target.value)}
                    placeholder="Contoh: Kesalahan pemilihan kategori oleh pelapor, dialihkan ke Fasilitas agar langsung ditangani teknisi gedung."
                    className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setSelectedReportForCategoryChange(null)}
                    className="px-4 py-2 text-xs font-semibold rounded-xl text-slate-600 hover:bg-slate-100 transition"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmittingCategoryChange}
                    className="inline-flex items-center px-4 py-2 text-xs font-bold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white transition shadow-xs disabled:opacity-60"
                  >
                    {isSubmittingCategoryChange ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />
                    ) : (
                      <Check className="w-3.5 h-3.5 mr-1.5" />
                    )}
                    Simpan Perubahan Kategori
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* MODAL 2: DISPOSISI BIDANG + TRIGGER WA BLAST              */}
        {/* ========================================================= */}
        {selectedReportForDisposition && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in">
            <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-indigo-200">
              <div className="flex items-center space-x-2 text-indigo-700 mb-1">
                <Share2 className="w-5 h-5" />
                <span className="text-xs font-bold uppercase tracking-wider">
                  Disposisi & Pemicu WA Blast
                </span>
              </div>
              <h3 className="text-lg font-black text-slate-900">
                Disposisikan ke Bidang & Picu Notifikasi WhatsApp
              </h3>

              <div className="mt-3 p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1">
                <div className="flex items-center justify-between text-slate-500 text-[11px]">
                  <span>Tiket: <b>{selectedReportForDisposition.ticketNumber}</b></span>
                  <span>Urgensi: <b>{dispositionUrgency}</b></span>
                </div>
                <p className="font-bold text-slate-900 text-sm mt-1">{selectedReportForDisposition.title}</p>
              </div>

              <form onSubmit={handleSubmitDisposition} className="mt-4 space-y-3.5">
                {/* Pilihan Urgensi */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Tingkat Urgensi Laporan
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    <button
                      type="button"
                      onClick={() => setDispositionUrgency("RENDAH")}
                      className={`py-1.5 text-center rounded-xl text-xs font-bold transition border ${
                        dispositionUrgency === "RENDAH"
                          ? "bg-slate-700 text-white"
                          : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                      }`}
                    >
                      ☕ Rendah
                    </button>
                    <button
                      type="button"
                      onClick={() => setDispositionUrgency("SEDANG")}
                      className={`py-1.5 text-center rounded-xl text-xs font-bold transition border ${
                        dispositionUrgency === "SEDANG"
                          ? "bg-sky-600 text-white"
                          : "bg-white text-sky-700 border-slate-200 hover:bg-sky-50"
                      }`}
                    >
                      ⚡ Sedang
                    </button>
                    <button
                      type="button"
                      onClick={() => setDispositionUrgency("TINGGI")}
                      className={`py-1.5 text-center rounded-xl text-xs font-bold transition border ${
                        dispositionUrgency === "TINGGI"
                          ? "bg-amber-600 text-white"
                          : "bg-white text-amber-700 border-slate-200 hover:bg-amber-50"
                      }`}
                    >
                      ⚠️ Tinggi
                    </button>
                    <button
                      type="button"
                      onClick={() => setDispositionUrgency("KRITIS")}
                      className={`py-1.5 text-center rounded-xl text-xs font-bold transition border ${
                        dispositionUrgency === "KRITIS"
                          ? "bg-rose-600 text-white"
                          : "bg-white text-rose-700 border-slate-200 hover:bg-rose-50"
                      }`}
                    >
                      🚨 Kritis
                    </button>
                  </div>
                </div>

                {/* Pilih Bidang */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Pilih Bidang / Unit Pelaksana Tujuan *
                  </label>
                  <select
                    value={selectedDepartmentName}
                    onChange={(e) => setSelectedDepartmentName(e.target.value)}
                    className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white font-medium"
                  >
                    {departmentContacts.map((c) => (
                      <option key={c.id} value={c.name}>
                        {c.name}
                      </option>
                    ))}
                    <option value="LAINNYA">Lainnya (Ketik Manual)...</option>
                  </select>
                </div>

                {selectedDepartmentName === "LAINNYA" && (
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Ketik Nama Bidang *
                    </label>
                    <input
                      type="text"
                      required
                      value={customTarget}
                      onChange={(e) => setCustomTarget(e.target.value)}
                      placeholder="Contoh: Unit Pengadaan & Logistik"
                      className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                    />
                  </div>
                )}

                {/* Nomor WhatsApp Kontak Bidang */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Nomor WhatsApp Tujuan (Pemetaan Kontak Bidang) *
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                    <input
                      type="text"
                      required={sendWaBlastOnDisposition}
                      value={dispositionTargetPhone}
                      onChange={(e) => setDispositionTargetPhone(e.target.value)}
                      placeholder="Contoh: 081234567890"
                      className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white font-mono"
                    />
                  </div>
                </div>

                {/* Catatan Disposisi */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Catatan / Instruksi Disposisi dari Humas
                  </label>
                  <textarea
                    rows={2}
                    value={dispositionNote}
                    onChange={(e) => setDispositionNote(e.target.value)}
                    placeholder="Tuliskan instruksi tindak lanjut atau batas waktu pengerjaan..."
                    className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                  />
                </div>

                {/* Trigger WA Blast Checkbox & Preview */}
                <div className="p-3 rounded-xl bg-emerald-50/70 border border-emerald-200">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={sendWaBlastOnDisposition}
                      onChange={(e) => setSendWaBlastOnDisposition(e.target.checked)}
                      className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500 cursor-pointer"
                    />
                    <span className="text-xs font-bold text-emerald-950">
                      Kirimkan Trigger Notifikasi via WA Blast ke Nomor Bidang
                    </span>
                  </label>
                  {sendWaBlastOnDisposition && (
                    <p className="text-[11px] text-emerald-700 mt-1 pl-6">
                      Sistem akan menyalurkan template pesan resmi beserta nomor tiket, urgensi, dan catatan disposisi ini ke WhatsApp bidang terkait secara otomatis.
                    </p>
                  )}
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setSelectedReportForDisposition(null)}
                    className="px-4 py-2 text-xs font-semibold rounded-xl text-slate-600 hover:bg-slate-100 transition"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmittingDisposition}
                    className="inline-flex items-center px-4 py-2 text-xs font-bold rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white transition shadow-xs disabled:opacity-60"
                  >
                    {isSubmittingDisposition ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />
                    ) : (
                      <Send className="w-3.5 h-3.5 mr-1.5" />
                    )}
                    Kirim Disposisi & WA Blast
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* MODAL 3: SELESAIKAN LAPORAN (ADMIN HUMAS)                  */}
        {/* ========================================================= */}
        {selectedReportForResolve && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in">
            <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-teal-200">
              <div className="flex items-center space-x-2 text-teal-700 mb-1">
                <CheckCheck className="w-5 h-5" />
                <span className="text-xs font-bold uppercase tracking-wider">Penyelesaian Aduan Resmi</span>
              </div>
              <h3 className="text-lg font-black text-slate-900">
                Tandai Laporan Selesai / Tuntas
              </h3>

              <div className="mt-3 p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1">
                <div className="flex items-center justify-between text-slate-500 text-[11px]">
                  <span>Tiket: <b>{selectedReportForResolve.ticketNumber}</b></span>
                  <span>Penanganan: <b>{selectedReportForResolve.dispositionTo || "Humas Langsung"}</b></span>
                </div>
                <p className="font-bold text-slate-900 text-sm mt-1">{selectedReportForResolve.title}</p>
              </div>

              <form onSubmit={handleSubmitResolve} className="mt-4 space-y-3.5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Catatan Respon & Tindak Lanjut Resmi Instansi (Wajib) *
                  </label>
                  <textarea
                    rows={4}
                    required
                    value={resolveNote}
                    onChange={(e) => setResolveNote(e.target.value)}
                    placeholder="Tuliskan hasil konfirmasi perbaikan atau penjelasan resmi yang langsung dapat dibaca oleh pelapor pada fitur Lacak Tiket..."
                    className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white"
                  />
                  <span className="text-[11px] text-slate-400 mt-1 block">
                    Jawaban ini akan langsung tampil saat masyarakat melacak nomor tiket di portal depan.
                  </span>
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setSelectedReportForResolve(null)}
                    className="px-4 py-2 text-xs font-semibold rounded-xl text-slate-600 hover:bg-slate-100 transition"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmittingResolve}
                    className="inline-flex items-center px-4 py-2 text-xs font-bold rounded-xl bg-teal-600 hover:bg-teal-700 text-white transition shadow-xs disabled:opacity-60"
                  >
                    {isSubmittingResolve ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />
                    ) : (
                      <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" />
                    )}
                    Simpan & Terbitkan Respon Tuntas
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* MODAL 3B: AUDIT TRAIL LINIMASA TERPADU (ADMIN HUMAS)       */}
        {/* ========================================================= */}
        {selectedReportForAuditTrail && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in">
            <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-indigo-200 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div>
                  <span className="font-mono text-xs font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                    {selectedReportForAuditTrail.ticketNumber}
                  </span>
                  <h3 className="text-base font-black text-slate-900 mt-1">
                    Audit Trail & Rekam Jejak Aduan
                  </h3>
                </div>
                <button
                  onClick={() => setSelectedReportForAuditTrail(null)}
                  className="text-slate-400 hover:text-slate-700 text-lg font-bold p-1"
                >
                  ✕
                </button>
              </div>

              {/* Rincian Aduan Singkat */}
              <div className="mt-4 p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1.5">
                <div className="flex items-center justify-between">
                  <span
                    className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold text-white shadow-xs"
                    style={{ backgroundColor: selectedReportForAuditTrail.categoryColor }}
                  >
                    ● {selectedReportForAuditTrail.categoryLabel}
                  </span>
                  <span className="font-bold text-slate-700">
                    Urgensi: {selectedReportForAuditTrail.urgency}
                  </span>
                </div>
                <h4 className="font-bold text-slate-900 text-sm">{selectedReportForAuditTrail.title}</h4>
                <p className="text-slate-600 line-clamp-3">{selectedReportForAuditTrail.content}</p>
                <div className="pt-2 border-t border-slate-200 text-[11px] text-slate-500">
                  Pelapor: <b>{selectedReportForAuditTrail.isAnonymous ? "Anonim" : selectedReportForAuditTrail.reporterName}</b>{" "}
                  • Kontak/Ruang: {selectedReportForAuditTrail.reporterContactOrRoom}
                </div>
              </div>

              {/* Linimasa Perjalanan Aduan */}
              <div className="mt-5 space-y-3">
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Linimasa Perjalanan Aduan
                </h4>

                {/* 1. Laporan Masuk */}
                <div className="flex items-start gap-3 text-xs">
                  <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center shrink-0 font-bold mt-0.5">
                    1
                  </div>
                  <div className="flex-1 pb-3 border-b border-slate-100">
                    <p className="font-bold text-slate-800">Laporan Masuk ke Meja Kerja Humas</p>
                    <p className="text-slate-500 text-[11px]">
                      {new Date(selectedReportForAuditTrail.createdAt).toLocaleString("id-ID")}
                    </p>
                  </div>
                </div>

                {/* 1b. Riwayat Perubahan Kategori & Tindakan (Audit Log) */}
                {selectedReportForAuditTrail.auditLogs && selectedReportForAuditTrail.auditLogs.length > 0 ? (
                  selectedReportForAuditTrail.auditLogs.map((log, idx) => (
                    <div key={log.id || `audit-${idx}`} className="flex items-start gap-3 text-xs">
                      <div className="w-6 h-6 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center shrink-0 font-bold mt-0.5">
                        {log.action === "CHANGE_CATEGORY" ? "🏷️" : log.action === "DISPOSITION" ? "🏢" : log.action === "RESOLVE" ? "✓" : "📝"}
                      </div>
                      <div className="flex-1 pb-3 border-b border-slate-100">
                        <div className="flex items-center justify-between">
                          <p className="font-bold text-slate-800">
                            {log.action === "CHANGE_CATEGORY"
                              ? "Perubahan Kategori oleh Humas"
                              : log.action === "DISPOSITION"
                              ? "Disposisi Laporan"
                              : log.action === "RESOLVE"
                              ? "Penyelesaian Aduan"
                              : "Catatan Tindak Lanjut"}
                          </p>
                          <span className="text-[10px] text-slate-400">
                            {new Date(log.createdAt).toLocaleString("id-ID")}
                          </span>
                        </div>

                        {/* Indikator Visual Perubahan Kategori (Warna & Nama Kategori) */}
                        {log.action === "CHANGE_CATEGORY" && log.previousVal && log.newVal && (
                          <div className="mt-1.5 flex flex-wrap items-center gap-1.5 text-[11px] font-semibold">
                            <span
                              className="px-2 py-0.5 rounded text-white text-[10px] font-bold shadow-xs inline-flex items-center gap-1"
                              style={{ backgroundColor: log.previousColor || "#64748B" }}
                            >
                              ● {log.previousVal}
                            </span>
                            <span className="text-slate-400 font-bold">➔</span>
                            <span
                              className="px-2 py-0.5 rounded text-white text-[10px] font-bold shadow-xs inline-flex items-center gap-1"
                              style={{ backgroundColor: log.newColor || "#10B981" }}
                            >
                              ● {log.newVal}
                            </span>
                          </div>
                        )}

                        {log.note && (
                          <p className="text-slate-600 text-[11px] mt-1.5 bg-amber-50/70 p-2 rounded-lg border border-amber-200/80">
                            &ldquo;{log.note}&rdquo;
                          </p>
                        )}

                        <p className="text-slate-400 text-[10px] mt-1">
                          Diubah oleh: <b>{log.actorName}</b> {log.actorRole ? `(${log.actorRole})` : ""}
                        </p>
                      </div>
                    </div>
                  ))
                ) : selectedReportForAuditTrail.categoryChangeNote ? (
                  <div className="flex items-start gap-3 text-xs">
                    <div className="w-6 h-6 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center shrink-0 font-bold mt-0.5">
                      ✏️
                    </div>
                    <div className="flex-1 pb-3 border-b border-slate-100">
                      <p className="font-bold text-amber-900">Perubahan Kategori oleh Humas</p>
                      <p className="text-slate-600 text-[11px] mt-0.5 bg-amber-50 p-2 rounded-lg border border-amber-200">
                        {selectedReportForAuditTrail.categoryChangeNote}
                      </p>
                      <p className="text-slate-400 text-[10px] mt-1">
                        Diubah oleh: <b>{selectedReportForAuditTrail.categoryChangedBy || "Admin Humas"}</b>{" "}
                        {selectedReportForAuditTrail.categoryChangedAt &&
                          `pada ${new Date(selectedReportForAuditTrail.categoryChangedAt).toLocaleString("id-ID")}`}
                      </p>
                    </div>
                  </div>
                ) : null}

                {/* 1c. Atensi & Instruksi Pimpinan Manajemen Jika Ada */}
                {selectedReportForAuditTrail.supervisorWarning && (
                  <div className="flex items-start gap-3 text-xs">
                    <div className="w-6 h-6 rounded-full bg-rose-100 text-rose-700 flex items-center justify-center shrink-0 font-bold mt-0.5 animate-pulse">
                      ⚠️
                    </div>
                    <div className="flex-1 pb-3 border-b border-slate-100">
                      <p className="font-bold text-rose-950">Atensi & Instruksi Pimpinan Manajemen</p>
                      <p className="text-rose-900 text-[11px] mt-0.5 bg-rose-50 p-2.5 rounded-lg border border-rose-200 italic font-medium">
                        &ldquo;{selectedReportForAuditTrail.supervisorWarning}&rdquo;
                      </p>
                      <div className="mt-1 text-[10px] text-slate-500 flex flex-wrap items-center justify-between gap-1">
                        <span>
                          Diberikan oleh: <b>{selectedReportForAuditTrail.supervisorWarningBy || "Pimpinan Manajemen"}</b>
                          {selectedReportForAuditTrail.supervisorWarningAt &&
                            ` • ${new Date(selectedReportForAuditTrail.supervisorWarningAt).toLocaleString("id-ID")}`}
                        </span>
                        {selectedReportForAuditTrail.supervisorWarningWaSent && (
                          <span className="font-bold text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded">
                            ✓ Alert WhatsApp Terkirim
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* 2. Disposisi ke Bidang */}
                {selectedReportForAuditTrail.dispositionOrTechnician &&
                  selectedReportForAuditTrail.dispositionOrTechnician !== "Belum Disposisi" && (
                    <div className="flex items-start gap-3 text-xs">
                      <div className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center shrink-0 font-bold mt-0.5">
                        2
                      </div>
                      <div className="flex-1 pb-3 border-b border-slate-100">
                        <p className="font-bold text-indigo-950">Didisposisikan ke Bidang / Teknisi</p>
                        <p className="text-slate-700 text-[11px] font-semibold mt-0.5">
                          🏢 {selectedReportForAuditTrail.dispositionOrTechnician}
                        </p>
                        {selectedReportForAuditTrail.dispositionNote && (
                          <p className="text-slate-600 text-[11px] mt-1 italic bg-indigo-50/60 p-2 rounded-lg border border-indigo-100">
                            &ldquo;{selectedReportForAuditTrail.dispositionNote}&rdquo;
                          </p>
                        )}
                        {selectedReportForAuditTrail.dispositionTargetPhone && (
                          <p className="text-slate-500 text-[10px] mt-1 flex items-center gap-1">
                            <Phone className="w-3 h-3 text-slate-400" />
                            Kontak WA Bidang: <b>{selectedReportForAuditTrail.dispositionTargetPhone}</b>
                          </p>
                        )}
                        {selectedReportForAuditTrail.rawPublic?.dispositionedAt && (
                          <p className="text-slate-400 text-[10px] mt-0.5">
                            Waktu Disposisi:{" "}
                            {new Date(selectedReportForAuditTrail.rawPublic.dispositionedAt).toLocaleString("id-ID")}
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                {/* 3. Penyelesaian Laporan */}
                {selectedReportForAuditTrail.status === "SELESAI" && (
                  <div className="flex items-start gap-3 text-xs">
                    <div className="w-6 h-6 rounded-full bg-teal-100 text-teal-700 flex items-center justify-center shrink-0 font-bold mt-0.5">
                      ✓
                    </div>
                    <div className="flex-1">
                      <p className="font-bold text-teal-950">Laporan Tuntas Diselesaikan</p>
                      <div className="mt-1 p-2.5 rounded-lg bg-teal-50 border border-teal-200 text-teal-900 text-[11px]">
                        <span className="font-bold block mb-0.5">Respon Resmi Humas:</span>
                        {selectedReportForAuditTrail.responseNote || "Penanganan tuntas."}
                      </div>
                      {selectedReportForAuditTrail.rawPublic?.respondedAt && (
                        <p className="text-slate-400 text-[10px] mt-1">
                          Selesai pada:{" "}
                          {new Date(selectedReportForAuditTrail.rawPublic.respondedAt).toLocaleString("id-ID")}
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>

              <div className="mt-6 pt-3 border-t border-slate-100 text-right">
                <button
                  type="button"
                  onClick={() => setSelectedReportForAuditTrail(null)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition"
                >
                  Tutup Audit Trail
                </button>
              </div>
            </div>
          </div>
        )}
        {showAddUserModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in">
            <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
              <div className="flex items-center space-x-2 text-emerald-700 mb-1">
                <Users className="w-5 h-5" />
                <span className="text-xs font-bold uppercase tracking-wider">Setting Akun Pengguna</span>
              </div>
              <h3 className="text-lg font-black text-slate-900">
                Buat Akun Pengguna Baru
              </h3>

              <form onSubmit={handleCreateUser} className="mt-4 space-y-3.5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Nama Lengkap *
                  </label>
                  <input
                    type="text"
                    required
                    value={newUserName}
                    onChange={(e) => setNewUserName(e.target.value)}
                    placeholder="Contoh: Budi Santoso, S.Kom"
                    className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Username / Email Kedinasan *
                  </label>
                  <input
                    type="text"
                    required
                    value={newUserEmail}
                    onChange={(e) => setNewUserEmail(e.target.value)}
                    placeholder="Contoh: admin_humas atau nama@humas.go.id"
                    className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white font-mono"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">
                    Bisa berupa username biasa (tanpa format @) atau alamat email resmi.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Kata Sandi *
                  </label>
                  <input
                    type="password"
                    required
                    value={newUserPassword}
                    onChange={(e) => setNewUserPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Peran / Hak Akses (Role) *
                  </label>
                  <select
                    value={newUserRole}
                    onChange={(e) => setNewUserRole(e.target.value)}
                    className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white font-medium"
                  >
                    <option value="ADMIN">Admin Humas</option>
                    <option value="MANAJEMEN">Manajemen / Pimpinan Eksekutif</option>
                    <option value="TEKNISI">Tim Teknisi Lapangan</option>
                    <option value="STAFF">Karyawan Staf</option>
                    <option value="SUPERADMIN">Super Administrator</option>
                  </select>
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setShowAddUserModal(false)}
                    className="px-4 py-2 text-xs font-semibold rounded-xl text-slate-600 hover:bg-slate-100 transition"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmittingUser}
                    className="inline-flex items-center px-4 py-2 text-xs font-bold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white transition shadow-xs disabled:opacity-60"
                  >
                    {isSubmittingUser ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />
                    ) : (
                      <Check className="w-3.5 h-3.5 mr-1.5" />
                    )}
                    Buat Akun
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* MODAL 5: PEWARNAAN KATEGORI (SUPERADMIN)                   */}
        {/* ========================================================= */}
        {showAddCategoryModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in">
            <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
              <div className="flex items-center space-x-2 text-emerald-700 mb-1">
                <Palette className="w-5 h-5" />
                <span className="text-xs font-bold uppercase tracking-wider">Setting Warna Kategori</span>
              </div>
              <h3 className="text-lg font-black text-slate-900">
                {editingCategory ? "Ubah Warna & Nama Kategori" : "Tambah Kategori Baru"}
              </h3>

              <form onSubmit={handleSaveCategory} className="mt-4 space-y-3.5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Nama Kategori *
                  </label>
                  <input
                    type="text"
                    required
                    value={catNameInput}
                    onChange={(e) => setCatNameInput(e.target.value)}
                    placeholder="Contoh: Fasilitas & Infrastruktur"
                    className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                  />
                </div>

                {!editingCategory && (
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Kode Unik (UPPERCASE) *
                    </label>
                    <input
                      type="text"
                      required
                      value={catCodeInput}
                      onChange={(e) => setCatCodeInput(e.target.value)}
                      placeholder="Contoh: FASILITAS_INFRASTRUKTUR"
                      className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white font-mono"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Pilih 4 Warna Kategori Berdasarkan Tingkat Urgensi *
                  </label>
                  <div className="grid grid-cols-2 gap-2 mb-3">
                    {URGENCY_PRESET_COLORS.map((preset) => (
                      <button
                        key={preset.color}
                        type="button"
                        onClick={() => setCatColorInput(preset.color)}
                        className={`p-2.5 rounded-xl border text-left transition flex items-center gap-2.5 ${
                          catColorInput.toLowerCase() === preset.color.toLowerCase()
                            ? "ring-2 ring-emerald-600 bg-emerald-50/50 border-emerald-300"
                            : "border-slate-200 hover:border-slate-300 bg-white"
                        }`}
                      >
                        <span
                          className="w-4 h-4 rounded-full shrink-0 shadow-xs"
                          style={{ backgroundColor: preset.color }}
                        />
                        <div>
                          <p className="text-xs font-bold text-slate-900 leading-tight">
                            {preset.label}
                          </p>
                          <p className="text-[10px] text-slate-500 leading-tight mt-0.5">
                            {preset.desc}
                          </p>
                        </div>
                      </button>
                    ))}
                  </div>

                  <div className="flex items-center gap-3 p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                    <input
                      type="color"
                      value={catColorInput}
                      onChange={(e) => setCatColorInput(e.target.value)}
                      className="w-8 h-8 rounded-lg border border-slate-300 cursor-pointer p-0.5 shrink-0"
                    />
                    <div className="flex-1">
                      <span className="text-[10px] font-bold text-slate-500 block">Kode Hex Terpilih</span>
                      <input
                        type="text"
                        value={catColorInput}
                        onChange={(e) => setCatColorInput(e.target.value)}
                        className="w-full px-2 py-1 font-mono text-xs border border-slate-300 rounded-lg bg-white mt-0.5"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Deskripsi Ringkas
                  </label>
                  <textarea
                    rows={2}
                    value={catDescInput}
                    onChange={(e) => setCatDescInput(e.target.value)}
                    placeholder="Penjelasan cakupan kategori pengaduan..."
                    className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setShowAddCategoryModal(false)}
                    className="px-4 py-2 text-xs font-semibold rounded-xl text-slate-600 hover:bg-slate-100 transition"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmittingCategory}
                    className="inline-flex items-center px-4 py-2 text-xs font-bold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white transition shadow-xs disabled:opacity-60"
                  >
                    {isSubmittingCategory ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />
                    ) : (
                      <Check className="w-3.5 h-3.5 mr-1.5" />
                    )}
                    Simpan Kategori
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* MODAL 6: EDIT TEMPLATE WA BLAST (SUPERADMIN)               */}
        {/* ========================================================= */}
        {editingTemplate && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in">
            <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-emerald-200">
              <div className="flex items-center space-x-2 text-emerald-700 mb-1">
                <MessageSquare className="w-5 h-5" />
                <span className="text-xs font-bold uppercase tracking-wider">Editor Template WA Blast</span>
              </div>
              <h3 className="text-lg font-black text-slate-900">
                Edit Template: {editingTemplate.code}
              </h3>

              <form onSubmit={handleSaveTemplate} className="mt-4 space-y-3.5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Judul Template *
                  </label>
                  <input
                    type="text"
                    required
                    value={tplTitleInput}
                    onChange={(e) => setTplTitleInput(e.target.value)}
                    className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Isi Konten Pesan WhatsApp *
                  </label>
                  <textarea
                    rows={8}
                    required
                    value={tplContentInput}
                    onChange={(e) => setTplContentInput(e.target.value)}
                    className="w-full p-3 font-mono text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                  />
                  <p className="text-[11px] text-slate-500 mt-1">
                    Variabel tag: <code>&#123;NOMOR_TIKET&#125;</code>, <code>&#123;JUDUL&#125;</code>, <code>&#123;KATEGORI&#125;</code>, <code>&#123;URGENSI&#125;</code>, <code>&#123;BIDANG&#125;</code>, <code>&#123;CATATAN_DISPOSISI&#125;</code>, <code>&#123;TANGGAL&#125;</code>, <code>&#123;LINK_PORTAL&#125;</code>.
                  </p>
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setEditingTemplate(null)}
                    className="px-4 py-2 text-xs font-semibold rounded-xl text-slate-600 hover:bg-slate-100 transition"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={isSavingTemplate}
                    className="inline-flex items-center px-4 py-2 text-xs font-bold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white transition shadow-xs disabled:opacity-60"
                  >
                    {isSavingTemplate ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />
                    ) : (
                      <Check className="w-3.5 h-3.5 mr-1.5" />
                    )}
                    Simpan Template
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* MODAL 7: TAMBAH / EDIT KONTAK BIDANG (SUPERADMIN)         */}
        {/* ========================================================= */}
        {showAddContactModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in">
            <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-emerald-200">
              <div className="flex items-center space-x-2 text-emerald-700 mb-1">
                <Phone className="w-5 h-5" />
                <span className="text-xs font-bold uppercase tracking-wider">Pemetaan Nomor Kontak Bidang</span>
              </div>
              <h3 className="text-lg font-black text-slate-900">
                {editingContactId ? "Edit Kontak Bidang" : "Tambah Kontak Bidang Baru"}
              </h3>

              <form onSubmit={handleSaveContact} className="mt-4 space-y-3.5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Nama Bidang / Divisi *
                  </label>
                  <input
                    type="text"
                    required
                    value={contactNameInput}
                    onChange={(e) => setContactNameInput(e.target.value)}
                    placeholder="Contoh: Bidang Pelayanan Publik & Operasional"
                    className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Nama PIC / Pejabat
                  </label>
                  <input
                    type="text"
                    value={contactPicInput}
                    onChange={(e) => setContactPicInput(e.target.value)}
                    placeholder="Contoh: Dra. Hj. Nurhayati, M.Si"
                    className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Nomor WhatsApp Resmi (Target Disposisi) *
                  </label>
                  <input
                    type="text"
                    required
                    value={contactPhoneInput}
                    onChange={(e) => setContactPhoneInput(e.target.value)}
                    placeholder="Contoh: 081234567890"
                    className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Email Kontak (Opsional)
                  </label>
                  <input
                    type="email"
                    value={contactEmailInput}
                    onChange={(e) => setContactEmailInput(e.target.value)}
                    placeholder="bidang@humas.go.id"
                    className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setShowAddContactModal(false)}
                    className="px-4 py-2 text-xs font-semibold rounded-xl text-slate-600 hover:bg-slate-100 transition"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmittingContact}
                    className="inline-flex items-center px-4 py-2 text-xs font-bold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white transition shadow-xs disabled:opacity-60"
                  >
                    {isSubmittingContact ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />
                    ) : (
                      <Check className="w-3.5 h-3.5 mr-1.5" />
                    )}
                    Simpan Kontak Bidang
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* MODAL 8: RINCIAN & AKSI TERPADU LAPORAN (ADMIN HUMAS)     */}
        {/* ========================================================= */}
        {selectedReportForDetailAction && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-3 sm:p-4 animate-in fade-in overflow-y-auto">
            <div className="bg-white rounded-3xl max-w-3xl w-full shadow-2xl border border-emerald-200 overflow-hidden my-auto max-h-[92vh] flex flex-col">
              {/* Header Modal */}
              <div className="bg-gradient-to-r from-emerald-900 via-teal-900 to-slate-900 px-6 py-4 text-white flex items-center justify-between shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20">
                    <FileText className="w-5 h-5 text-emerald-400" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold bg-white/20 px-2 py-0.5 rounded text-emerald-200">
                        {selectedReportForDetailAction.ticketNumber}
                      </span>
                      <span className="text-xs text-slate-300">
                        {selectedReportForDetailAction.sourceType === "PUBLIC"
                          ? "🌐 Laporan Publik"
                          : "🏢 Kendala Karyawan"}
                      </span>
                    </div>
                    <h3 className="text-base font-black text-white mt-0.5 truncate max-w-md">
                      {selectedReportForDetailAction.title}
                    </h3>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {userRole === "SUPERADMIN" && selectedReportForDetailAction.sourceType === "PUBLIC" && (
                    <button
                      type="button"
                      onClick={() => handleDeleteReport(selectedReportForDetailAction.id, selectedReportForDetailAction.ticketNumber)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-600/80 hover:bg-rose-600 text-white text-xs font-bold transition shadow-xs border border-rose-400/30"
                      title="Hapus Laporan Ini (Khusus Superadmin - Duplikat / Human Error)"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Hapus Laporan (Duplikat)</span>
                    </button>
                  )}
                  <button
                    onClick={() => setSelectedReportForDetailAction(null)}
                    className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition"
                    title="Tutup Modal"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Tab Navigasi Aksi Modal */}
              <div className="bg-slate-100 px-6 pt-3 border-b border-slate-200 flex items-center gap-2 overflow-x-auto shrink-0">
                <button
                  type="button"
                  onClick={() => setDetailActiveTab("DETAIL")}
                  className={`px-4 py-2 text-xs font-bold rounded-t-xl transition border-b-2 flex items-center gap-1.5 ${
                    detailActiveTab === "DETAIL"
                      ? "bg-white text-emerald-800 border-emerald-600 shadow-xs"
                      : "text-slate-600 hover:text-slate-900 border-transparent hover:bg-slate-200/60"
                  }`}
                >
                  <FileText className="w-3.5 h-3.5" />
                  Rincian & Lampiran
                </button>

                {selectedReportForDetailAction.sourceType === "PUBLIC" && (
                  <>
                    <button
                      type="button"
                      onClick={() => setDetailActiveTab("DISPOSISI")}
                      className={`px-4 py-2 text-xs font-bold rounded-t-xl transition border-b-2 flex items-center gap-1.5 ${
                        detailActiveTab === "DISPOSISI"
                          ? "bg-white text-indigo-800 border-indigo-600 shadow-xs"
                          : "text-slate-600 hover:text-slate-900 border-transparent hover:bg-slate-200/60"
                      }`}
                    >
                      <Share2 className="w-3.5 h-3.5" />
                      Disposisi & WA
                    </button>
                    <button
                      type="button"
                      onClick={() => setDetailActiveTab("KATEGORI")}
                      className={`px-4 py-2 text-xs font-bold rounded-t-xl transition border-b-2 flex items-center gap-1.5 ${
                        detailActiveTab === "KATEGORI"
                          ? "bg-white text-amber-800 border-amber-600 shadow-xs"
                          : "text-slate-600 hover:text-slate-900 border-transparent hover:bg-slate-200/60"
                      }`}
                    >
                      <Palette className="w-3.5 h-3.5" />
                      Ubah Kategori
                    </button>
                    <button
                      type="button"
                      onClick={() => setDetailActiveTab("SELESAI")}
                      className={`px-4 py-2 text-xs font-bold rounded-t-xl transition border-b-2 flex items-center gap-1.5 ${
                        detailActiveTab === "SELESAI"
                          ? "bg-white text-teal-800 border-teal-600 shadow-xs"
                          : "text-slate-600 hover:text-slate-900 border-transparent hover:bg-slate-200/60"
                      }`}
                    >
                      <CheckCheck className="w-3.5 h-3.5" />
                      Selesaikan
                    </button>
                  </>
                )}

                <button
                  type="button"
                  onClick={() => setDetailActiveTab("AUDIT")}
                  className={`px-4 py-2 text-xs font-bold rounded-t-xl transition border-b-2 flex items-center gap-1.5 ${
                    detailActiveTab === "AUDIT"
                      ? "bg-white text-purple-800 border-purple-600 shadow-xs"
                      : "text-slate-600 hover:text-slate-900 border-transparent hover:bg-slate-200/60"
                  }`}
                >
                  <Clock className="w-3.5 h-3.5" />
                  Linimasa Audit
                </button>
              </div>

              {/* Badan Konten Modal */}
              <div className="p-6 overflow-y-auto flex-1 space-y-5">
                {/* TAB 1: DETAIL LENGKAP & LAMPIRAN BERKAS */}
                {detailActiveTab === "DETAIL" && (
                  <div className="space-y-5 animate-in fade-in">
                    {/* Bar Indikator Status & Urgensi */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                        <span className="text-[10px] uppercase font-bold text-slate-400 block">Status Laporan</span>
                        <span className="text-xs font-bold text-slate-800 mt-0.5 inline-block">
                          {selectedReportForDetailAction.status}
                        </span>
                      </div>
                      <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                        <span className="text-[10px] uppercase font-bold text-slate-400 block">Tingkat Urgensi</span>
                        <span className="text-xs font-bold text-slate-800 mt-0.5 inline-block">
                          {selectedReportForDetailAction.urgency}
                        </span>
                      </div>
                      <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                        <span className="text-[10px] uppercase font-bold text-slate-400 block">Kategori</span>
                        <span
                          className="text-xs font-bold mt-0.5 inline-block px-2 py-0.5 rounded text-white"
                          style={{ backgroundColor: selectedReportForDetailAction.categoryColor }}
                        >
                          ● {selectedReportForDetailAction.categoryLabel}
                        </span>
                      </div>
                      <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                        <span className="text-[10px] uppercase font-bold text-slate-400 block">Waktu Lapor</span>
                        <span className="text-xs font-semibold text-slate-700 mt-0.5 inline-block">
                          {new Date(selectedReportForDetailAction.createdAt).toLocaleString("id-ID")}
                        </span>
                      </div>
                    </div>

                    {/* Atensi Pimpinan Jika Ada */}
                    {selectedReportForDetailAction.supervisorWarning && (
                      <div className="p-4 rounded-xl bg-rose-50 border border-rose-300 text-rose-950 text-xs">
                        <div className="flex items-center gap-1.5 font-bold text-rose-700">
                          <AlertTriangle className="w-4 h-4 text-rose-600 animate-pulse" />
                          ATENSI / INSTRUKSI PIMPINAN:
                        </div>
                        <p className="mt-1 italic font-medium">{selectedReportForDetailAction.supervisorWarning}</p>
                      </div>
                    )}

                    {/* Identitas Pelapor & Unit Tujuan */}
                    <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <span className="text-[10px] uppercase font-bold text-slate-400 block">Identitas Pelapor</span>
                        {selectedReportForDetailAction.isAnonymous ? (
                          <p className="font-bold text-slate-700 mt-1 flex items-center gap-1">
                            <EyeOff className="w-3.5 h-3.5 text-slate-400" /> Anonim (Identitas Dirahasiakan)
                          </p>
                        ) : (
                          <div className="mt-1">
                            <p className="font-bold text-slate-900 text-sm">{selectedReportForDetailAction.reporterName}</p>
                            <p className="text-slate-500 text-xs">{selectedReportForDetailAction.reporterContactOrRoom}</p>
                          </div>
                        )}
                      </div>
                      <div>
                        <span className="text-[10px] uppercase font-bold text-slate-400 block">Unit Disposisi / Penanganan</span>
                        <p className="font-bold text-slate-900 mt-1 text-sm">
                          {selectedReportForDetailAction.dispositionOrTechnician}
                        </p>
                        {selectedReportForDetailAction.dispositionTargetPhone && (
                          <p className="text-slate-500 text-xs">No. WA: {selectedReportForDetailAction.dispositionTargetPhone}</p>
                        )}
                      </div>
                    </div>

                    {/* Kronologi & Isi Aduan Lengkap */}
                    <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                        Kronologi & Isi Aduan Lengkap
                      </span>
                      <p className="text-xs sm:text-sm text-slate-800 whitespace-pre-line leading-relaxed font-normal">
                        {parseReportDetails(selectedReportForDetailAction.content, selectedReportForDetailAction.rawPublic).cleanContent}
                      </p>
                    </div>

                    {/* Pratinjau File / Foto Lampiran */}
                    {(() => {
                      const meta = parseReportDetails(selectedReportForDetailAction.content, selectedReportForDetailAction.rawPublic);
                      return (
                        <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-200 space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-emerald-950 flex items-center gap-1.5 uppercase tracking-wider">
                              <Paperclip className="w-4 h-4 text-emerald-700" />
                              Berkas & Foto Lampiran Bukti
                            </span>
                            {meta.attachmentUrl && (
                              <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-100 px-2.5 py-0.5 rounded-full">
                                {meta.isImage ? "Gambar / Foto" : meta.isPdf ? "Dokumen PDF" : "Berkas Terlampir"}
                              </span>
                            )}
                          </div>

                          {meta.attachmentUrl ? (
                            meta.isImage ? (
                              <div className="space-y-3">
                                <div
                                  onClick={() => setZoomedImage(meta.attachmentUrl)}
                                  className="relative group cursor-pointer max-w-sm rounded-2xl overflow-hidden border border-emerald-200 shadow-xs hover:shadow-md transition bg-black/5"
                                >
                                  <img
                                    src={meta.attachmentUrl}
                                    alt="Lampiran Bukti"
                                    className="w-full max-h-72 object-contain bg-slate-900/5 group-hover:scale-102 transition duration-200"
                                  />
                                  <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-xs font-bold transition">
                                    <ZoomIn className="w-5 h-5 mr-1.5" /> Klik untuk Perbesar Gambar
                                  </div>
                                </div>
                                <div className="flex items-center gap-2">
                                  <button
                                    type="button"
                                    onClick={() => setZoomedImage(meta.attachmentUrl)}
                                    className="text-xs font-bold text-emerald-800 hover:text-emerald-900 bg-emerald-100 hover:bg-emerald-200 px-3 py-1.5 rounded-xl flex items-center gap-1 transition"
                                  >
                                    <ZoomIn className="w-3.5 h-3.5" /> Lihat Ukuran Penuh
                                  </button>
                                  <a
                                    href={meta.attachmentUrl}
                                    download={meta.attachmentName || "lampiran-bukti"}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-xs font-bold text-slate-700 hover:text-slate-900 bg-white border border-slate-200 hover:bg-slate-50 px-3 py-1.5 rounded-xl flex items-center gap-1 transition"
                                  >
                                    <Download className="w-3.5 h-3.5" /> Unduh Foto
                                  </a>
                                </div>
                              </div>
                            ) : (
                              <div className="flex items-center justify-between p-3.5 bg-white rounded-xl border border-emerald-200">
                                <div className="flex items-center gap-3">
                                  <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold shrink-0">
                                    <FileText className="w-5 h-5" />
                                  </div>
                                  <div className="min-w-0">
                                    <p className="text-xs font-bold text-slate-900 truncate max-w-xs sm:max-w-md">
                                      {meta.attachmentName || "Berkas Dokumen Lampiran"}
                                    </p>
                                    <p className="text-[11px] text-slate-500">Klik tombol di samping untuk mengunduh berkas</p>
                                  </div>
                                </div>
                                <a
                                  href={meta.attachmentUrl}
                                  download={meta.attachmentName || "lampiran-dokumen"}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1 shadow-xs transition shrink-0"
                                >
                                  <Download className="w-3.5 h-3.5" /> Unduh
                                </a>
                              </div>
                            )
                          ) : meta.attachmentName ? (
                            <div className="p-3 bg-white rounded-xl border border-slate-200 flex items-center gap-2 text-xs text-slate-700">
                              <Paperclip className="w-4 h-4 text-slate-400 shrink-0" />
                              <span>Nama Berkas Terlampir: <b>{meta.attachmentName}</b> (Tercatat pada teks kronologi)</span>
                            </div>
                          ) : (
                            <p className="text-xs text-slate-500 italic">Tidak ada berkas atau foto yang dilampirkan pada laporan ini.</p>
                          )}
                        </div>
                      );
                    })()}

                    {/* Tombol Aksi Cepat Bawah */}
                    {selectedReportForDetailAction.sourceType === "PUBLIC" && (
                      <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
                        <span className="text-xs text-slate-400 font-semibold">Tindakan Cepat Humas:</span>
                        <div className="flex flex-wrap items-center gap-2">
                          <button
                            type="button"
                            onClick={() => setDetailActiveTab("DISPOSISI")}
                            className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold flex items-center gap-1 shadow-xs transition"
                          >
                            <Share2 className="w-3.5 h-3.5" /> Disposisi ke Bidang
                          </button>
                          <button
                            type="button"
                            onClick={() => setDetailActiveTab("KATEGORI")}
                            className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold border border-slate-300 flex items-center gap-1 transition"
                          >
                            <Palette className="w-3.5 h-3.5" /> Ubah Kategori
                          </button>
                          <button
                            type="button"
                            onClick={() => setDetailActiveTab("SELESAI")}
                            className="px-3 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold flex items-center gap-1 shadow-xs transition"
                          >
                            <CheckCheck className="w-3.5 h-3.5" /> Selesaikan Aduan
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* TAB 2: DISPOSISI & WA BLAST */}
                {detailActiveTab === "DISPOSISI" && selectedReportForDetailAction.rawPublic && (() => {
                  const isReportCompleted = selectedReportForDetailAction.status === "SELESAI";
                  const isDispositionLocked = isReportCompleted && userRole !== "SUPERADMIN";

                  return (
                    <form onSubmit={handleDetailModalDisposition} className="space-y-4 animate-in fade-in">
                      {isDispositionLocked ? (
                        <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-300 text-amber-900 text-xs flex items-start gap-2.5">
                          <Lock className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                          <div>
                            <p className="font-bold">Laporan Telah Berstatus Selesai (Disposisi Terkunci)</p>
                            <p className="text-[11px] text-amber-800 mt-0.5">
                              Laporan aduan ini telah diselesaikan secara tuntas. Tindakan perubahan disposisi dan pengiriman ulang dikunci untuk menjaga validitas data dan SOP pelayanan.
                            </p>
                          </div>
                        </div>
                      ) : isReportCompleted && userRole === "SUPERADMIN" ? (
                        <div className="p-3 rounded-xl bg-purple-50 border border-purple-200 text-xs text-purple-900 flex items-center gap-2">
                          <ShieldAlert className="w-4 h-4 text-purple-600 shrink-0" />
                          <span>Mode Super Administrator: Anda memiliki wewenang khusus untuk mendisposisikan ulang tiket ini jika diperlukan.</span>
                        </div>
                      ) : (
                        <div className="p-3 rounded-xl bg-indigo-50 border border-indigo-200 text-xs text-indigo-950">
                          Disposisikan laporan ini ke satu atau lebih bidang teknis berwenang dan kirimkan instruksi otomatis via WhatsApp Blast.
                        </div>
                      )}

                      {/* Multi-Bidang Selection */}
                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <label className="block text-xs font-bold text-slate-700">
                            Pilih Bidang / Unit Tujuan Disposisi (Multi-Bidang) *
                          </label>
                          <span className="px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 text-[11px] font-bold">
                            {selectedDepartmentNames.length} Bidang Dipilih
                          </span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 p-2.5 bg-slate-50 border border-slate-200 rounded-xl max-h-48 overflow-y-auto">
                          {departmentContacts.map((c) => {
                            const isChecked = selectedDepartmentNames.includes(c.name);
                            return (
                              <label
                                key={c.id}
                                className={`flex items-start gap-2.5 p-2 rounded-lg border text-xs cursor-pointer transition select-none ${
                                  isChecked
                                    ? "bg-indigo-50 border-indigo-300 text-indigo-950 font-semibold"
                                    : "bg-white border-slate-200 text-slate-700 hover:bg-slate-100"
                                } ${isDispositionLocked ? "opacity-60 cursor-not-allowed" : ""}`}
                              >
                                <input
                                  type="checkbox"
                                  disabled={isDispositionLocked}
                                  checked={isChecked}
                                  onChange={() => handleToggleDepartment(c.name)}
                                  className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500 mt-0.5"
                                />
                                <div className="flex-1 min-w-0">
                                  <p className="truncate font-medium">{c.name}</p>
                                  {c.contactName && (
                                    <p className="text-[10px] text-slate-500 truncate">PIC: {c.contactName}</p>
                                  )}
                                  {c.phone && (
                                    <p className="text-[10px] text-indigo-600 font-mono truncate">{c.phone}</p>
                                  )}
                                </div>
                              </label>
                            );
                          })}
                        </div>
                      </div>

                      {/* Bidang Lainnya */}
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          Bidang / Instansi Tambahan Lainnya (Opsional)
                        </label>
                        <input
                          type="text"
                          disabled={isDispositionLocked}
                          value={customTarget}
                          onChange={(e) => setCustomTarget(e.target.value)}
                          placeholder="Ketik jika ada nama bidang/dinas lain di luar daftar..."
                          className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white disabled:bg-slate-100 disabled:cursor-not-allowed"
                        />
                      </div>

                      {/* Multi-Kontak WhatsApp */}
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="block text-xs font-bold text-slate-700">
                            Nomor WhatsApp Tujuan (Multi-Kontak, dipisahkan koma)
                          </label>
                          <span className="text-[10px] text-slate-500 font-mono">Format: 08xx / 628xx</span>
                        </div>
                        <input
                          type="text"
                          disabled={isDispositionLocked}
                          value={dispositionTargetPhone}
                          onChange={(e) => setDispositionTargetPhone(e.target.value)}
                          placeholder="Contoh: 081234567890, 08987654321"
                          className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white font-mono disabled:bg-slate-100 disabled:cursor-not-allowed"
                        />
                        <p className="text-[11px] text-slate-500 mt-1">
                          💡 Kontak otomatis terisi saat mencentang bidang di atas. Anda juga bisa menambah kontak lain secara manual (pisahkan dengan koma).
                        </p>
                      </div>

                      <div className="flex items-center gap-2 p-3 bg-slate-50 rounded-xl border border-slate-200">
                        <input
                          type="checkbox"
                          id="detail-send-wa-blast"
                          disabled={isDispositionLocked}
                          checked={sendWaBlastOnDisposition}
                          onChange={(e) => setSendWaBlastOnDisposition(e.target.checked)}
                          className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500 disabled:cursor-not-allowed"
                        />
                        <label htmlFor="detail-send-wa-blast" className="text-xs font-semibold text-slate-800 cursor-pointer">
                          Kirim notifikasi otomatis WhatsApp Blast ke semua kontak tujuan di atas ({dispositionTargetPhone.split(/[,;\n]+/).filter(Boolean).length} kontak)
                        </label>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          Catatan Arahan Disposisi ke Bidang
                        </label>
                        <textarea
                          rows={3}
                          disabled={isDispositionLocked}
                          value={dispositionNote}
                          onChange={(e) => setDispositionNote(e.target.value)}
                          placeholder="Tuliskan arahan, instruksi tindak lanjut, atau batas waktu..."
                          className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white disabled:bg-slate-100 disabled:cursor-not-allowed"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          Tingkat Urgensi Laporan
                        </label>
                        <select
                          disabled={isDispositionLocked}
                          value={dispositionUrgency}
                          onChange={(e) => setDispositionUrgency(e.target.value as any)}
                          className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white font-bold disabled:bg-slate-100 disabled:cursor-not-allowed"
                        >
                          <option value="KRITIS">🚨 Kritis</option>
                          <option value="TINGGI">⚠️ Tinggi</option>
                          <option value="SEDANG">⚡ Sedang</option>
                          <option value="RENDAH">☕ Rendah</option>
                        </select>
                      </div>

                      <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                        <button
                          type="button"
                          onClick={() => setDetailActiveTab("DETAIL")}
                          className="px-4 py-2 text-xs font-semibold rounded-xl text-slate-600 hover:bg-slate-100 transition"
                        >
                          Kembali ke Rincian
                        </button>
                        {isDispositionLocked ? (
                          <button
                            type="button"
                            disabled
                            className="inline-flex items-center px-4 py-2 text-xs font-bold rounded-xl bg-slate-200 text-slate-500 cursor-not-allowed shadow-none"
                          >
                            <Lock className="w-3.5 h-3.5 mr-1.5" /> Disposisi Terkunci (Selesai)
                          </button>
                        ) : (
                          <button
                            type="submit"
                            disabled={isSubmittingDisposition}
                            className="inline-flex items-center px-4 py-2 text-xs font-bold rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white transition shadow-xs disabled:opacity-60"
                          >
                            {isSubmittingDisposition ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />
                            ) : (
                              <Share2 className="w-3.5 h-3.5 mr-1.5" />
                            )}
                            Simpan Disposisi & Kirim WA
                          </button>
                        )}
                      </div>
                    </form>
                  );
                })()}

                {/* TAB 3: UBAH KATEGORI */}
                {detailActiveTab === "KATEGORI" && selectedReportForDetailAction.rawPublic && (() => {
                  const isCategoryLocked = selectedReportForDetailAction.status === "SELESAI" && userRole !== "SUPERADMIN";

                  return (
                    <form onSubmit={handleDetailModalCategoryChange} className="space-y-4 animate-in fade-in">
                      {isCategoryLocked ? (
                        <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-300 text-amber-900 text-xs flex items-start gap-2.5">
                          <Lock className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                          <div>
                            <p className="font-bold">Laporan Telah Berstatus Selesai (Kategori Terkunci)</p>
                            <p className="text-[11px] text-amber-800 mt-0.5">
                              Perubahan kategori telah dinonaktifkan karena laporan aduan ini telah berstatus Selesai.
                            </p>
                          </div>
                        </div>
                      ) : (
                        <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-950">
                          Kategori saat ini: <b>{selectedReportForDetailAction.categoryLabel}</b>. Silakan pilih kategori baru beserta alasan penyesuaian.
                        </div>
                      )}

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          Pilih Kategori Baru *
                        </label>
                        <select
                          disabled={isCategoryLocked}
                          value={newCategorySelection}
                          onChange={(e) => setNewCategorySelection(e.target.value)}
                          className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white font-medium disabled:bg-slate-100 disabled:cursor-not-allowed"
                        >
                          {categories.map((c) => (
                            <option key={c.code} value={c.code}>
                              {c.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          Catatan Alasan Perubahan Kategori *
                        </label>
                        <textarea
                          rows={3}
                          required
                          disabled={isCategoryLocked}
                          value={categoryChangeReason}
                          onChange={(e) => setCategoryChangeReason(e.target.value)}
                          placeholder="Contoh: Berdasarkan kronologi isi laporan, substansi aduan lebih relevan ke kategori Fasilitas..."
                          className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white disabled:bg-slate-100 disabled:cursor-not-allowed"
                        />
                      </div>

                      <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                        <button
                          type="button"
                          onClick={() => setDetailActiveTab("DETAIL")}
                          className="px-4 py-2 text-xs font-semibold rounded-xl text-slate-600 hover:bg-slate-100 transition"
                        >
                          Kembali ke Rincian
                        </button>
                        {isCategoryLocked ? (
                          <button
                            type="button"
                            disabled
                            className="inline-flex items-center px-4 py-2 text-xs font-bold rounded-xl bg-slate-200 text-slate-500 cursor-not-allowed shadow-none"
                          >
                            <Lock className="w-3.5 h-3.5 mr-1.5" /> Kategori Terkunci (Selesai)
                          </button>
                        ) : (
                          <button
                            type="submit"
                            disabled={isSubmittingCategoryChange}
                            className="inline-flex items-center px-4 py-2 text-xs font-bold rounded-xl bg-amber-600 hover:bg-amber-700 text-white transition shadow-xs disabled:opacity-60"
                          >
                            {isSubmittingCategoryChange ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />
                            ) : (
                              <Palette className="w-3.5 h-3.5 mr-1.5" />
                            )}
                            Simpan Perubahan Kategori
                          </button>
                        )}
                      </div>
                    </form>
                  );
                })()}

                {/* TAB 4: SELESAIKAN LAPORAN */}
                {detailActiveTab === "SELESAI" && selectedReportForDetailAction.rawPublic && (() => {
                  const isReportCompleted = selectedReportForDetailAction.status === "SELESAI";

                  return (
                    <div className="space-y-4 animate-in fade-in">
                      {isReportCompleted ? (
                        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-950 text-xs space-y-3">
                          <div className="flex items-center gap-2 font-bold text-emerald-900 text-sm">
                            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                            Laporan Telah Berstatus SELESAI (Tuntas)
                          </div>
                          <p className="text-slate-700">
                            Respon resmi penanganan telah diterbitkan dan dipublikasikan ke portal aduan publik.
                          </p>
                          {selectedReportForDetailAction.responseNote && (
                            <div className="p-3.5 bg-white rounded-xl border border-emerald-200 shadow-2xs">
                              <span className="font-bold text-[11px] text-slate-500 uppercase tracking-wide block mb-1">
                                Isi Respon Resmi yang Telah Diterbitkan:
                              </span>
                              <p className="text-slate-800 italic whitespace-pre-wrap text-xs">
                                "{selectedReportForDetailAction.responseNote}"
                              </p>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="p-3 rounded-xl bg-teal-50 border border-teal-200 text-xs text-teal-950">
                          Selesaikan laporan aduan ini dan publikasikan tanggapan resmi agar dapat dibaca oleh pelapor di portal publik.
                        </div>
                      )}

                      <form onSubmit={handleDetailModalResolve} className="space-y-4">
                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1">
                            Catatan Tanggapan / Respon Resmi Humas *
                          </label>
                          <textarea
                            rows={4}
                            required
                            disabled={isReportCompleted}
                            value={resolveNote}
                            onChange={(e) => setResolveNote(e.target.value)}
                            placeholder="Contoh: Permasalahan telah ditindaklanjuti oleh Bidang Operasional dan saat ini sistem loket telah beroperasi normal kembali..."
                            className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white disabled:bg-slate-100 disabled:cursor-not-allowed"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1">
                            Konfirmasi Urgensi Akhir
                          </label>
                          <select
                            disabled={isReportCompleted}
                            value={resolveUrgency}
                            onChange={(e) => setResolveUrgency(e.target.value as any)}
                            className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white font-bold disabled:bg-slate-100 disabled:cursor-not-allowed"
                          >
                            <option value="SEDANG">⚡ Sedang</option>
                            <option value="RENDAH">☕ Rendah</option>
                            <option value="TINGGI">⚠️ Tinggi</option>
                            <option value="KRITIS">🚨 Kritis</option>
                          </select>
                        </div>

                        <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                          <button
                            type="button"
                            onClick={() => setDetailActiveTab("DETAIL")}
                            className="px-4 py-2 text-xs font-semibold rounded-xl text-slate-600 hover:bg-slate-100 transition"
                          >
                            Kembali ke Rincian
                          </button>
                          {isReportCompleted ? (
                            <button
                              type="button"
                              disabled
                              className="inline-flex items-center px-4 py-2 text-xs font-bold rounded-xl bg-slate-200 text-slate-500 cursor-not-allowed shadow-none"
                            >
                              <Lock className="w-3.5 h-3.5 mr-1.5" />
                              Laporan Telah Diselesaikan (Terkunci)
                            </button>
                          ) : (
                            <button
                              type="submit"
                              disabled={isSubmittingResolve}
                              className="inline-flex items-center px-4 py-2 text-xs font-bold rounded-xl bg-teal-600 hover:bg-teal-700 text-white transition shadow-xs disabled:opacity-60"
                            >
                              {isSubmittingResolve ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />
                              ) : (
                                <CheckCheck className="w-3.5 h-3.5 mr-1.5" />
                              )}
                              Simpan & Terbitkan Respon Tuntas
                            </button>
                          )}
                        </div>
                      </form>

                      {/* KHUSUS SUPERADMIN: SOP PEMBATALAN STATUS SELESAI (RE-OPEN) */}
                      {isReportCompleted && userRole === "SUPERADMIN" && (
                        <div className="mt-6 pt-5 border-t-2 border-dashed border-rose-200">
                          <div className="p-4 rounded-xl bg-rose-50 border border-rose-300 space-y-3">
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex items-start gap-2.5">
                                <ShieldAlert className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                                <div>
                                  <h4 className="text-xs font-bold text-rose-900 uppercase tracking-wider">
                                    Wewenang Super Administrator (SOP Pembatalan Status Selesai)
                                  </h4>
                                  <p className="text-[11px] text-rose-700 mt-0.5">
                                    Super Admin berwenang membatalkan status Selesai dan membuka kembali tiket untuk penanganan lebih lanjut sesuai SOP yang berlaku.
                                  </p>
                                </div>
                              </div>
                              {!showReopenForm && (
                                <button
                                  type="button"
                                  onClick={() => setShowReopenForm(true)}
                                  className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition shrink-0"
                                >
                                  <RotateCcw className="w-3.5 h-3.5" /> Batalkan Selesai (Re-open)
                                </button>
                              )}
                            </div>

                            {showReopenForm && (
                              <form onSubmit={handleReopenReport} className="space-y-3 pt-3 border-t border-rose-200 mt-2">
                                <div>
                                  <label className="block text-xs font-bold text-rose-900 mb-1">
                                    Kembalikan Status Tiket Ke:
                                  </label>
                                  <select
                                    value={reopenTargetStatus}
                                    onChange={(e) => setReopenTargetStatus(e.target.value)}
                                    className="w-full px-3 py-2 text-xs border border-rose-300 rounded-xl bg-white font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-rose-500"
                                  >
                                    <option value="DIDISPOSISIKAN">🔄 Didisposisikan (Proses kembali oleh bidang teknis)</option>
                                    <option value="BARU">📥 Baru (Kembali ke meja telaah awal Humas)</option>
                                  </select>
                                </div>

                                <div>
                                  <label className="block text-xs font-bold text-rose-900 mb-1">
                                    Catatan Alasan Pembatalan Status Selesai (Wajib Sesuai SOP) *
                                  </label>
                                  <textarea
                                    rows={3}
                                    required
                                    value={reopenReason}
                                    onChange={(e) => setReopenReason(e.target.value)}
                                    placeholder="Tuliskan alasan pembukaan kembali tiket (misal: penanganan aduan belum tuntas di lapangan, sanggahan lanjutan pelapor, hasil verifikasi ulang)..."
                                    className="w-full px-3 py-2 text-xs border border-rose-300 rounded-xl bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-rose-500"
                                  />
                                </div>

                                <div className="flex items-center justify-end gap-2 pt-2">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setShowReopenForm(false);
                                      setReopenReason("");
                                    }}
                                    className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-200 rounded-xl transition"
                                  >
                                    Tutup / Batal
                                  </button>
                                  <button
                                    type="submit"
                                    disabled={isSubmittingReopen}
                                    className="px-4 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-xs transition disabled:opacity-60"
                                  >
                                    {isSubmittingReopen ? (
                                      <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" />
                                    ) : (
                                      <RotateCcw className="w-3.5 h-3.5 mr-1" />
                                    )}
                                    Konfirmasi Buka Kembali Tiket
                                  </button>
                                </div>
                              </form>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })()}

                {/* TAB 5: AUDIT TRAIL / LINIMASA */}
                {detailActiveTab === "AUDIT" && (
                  <div className="space-y-4 animate-in fade-in">
                    <div className="p-3 rounded-xl bg-purple-50 border border-purple-200 text-xs text-purple-950 font-medium">
                      Linimasa & audit trail kronologis penanganan laporan dari awal diterima hingga tuntas.
                    </div>

                    <div className="space-y-3">
                      {/* 1. Laporan Masuk */}
                      <div className="flex items-start gap-3 text-xs">
                        <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center shrink-0 font-bold mt-0.5">
                          1
                        </div>
                        <div className="flex-1 pb-3 border-b border-slate-100">
                          <p className="font-bold text-slate-800">Laporan Masuk ke Meja Kerja Humas</p>
                          <p className="text-slate-500 text-[11px]">
                            {new Date(selectedReportForDetailAction.createdAt).toLocaleString("id-ID")}
                          </p>
                        </div>
                      </div>

                      {/* 2. Riwayat Perubahan Kategori & Tindakan (Audit Log) */}
                      {selectedReportForDetailAction.auditLogs && selectedReportForDetailAction.auditLogs.length > 0 ? (
                        selectedReportForDetailAction.auditLogs.map((log, idx) => (
                          <div key={log.id || `detail-audit-${idx}`} className="flex items-start gap-3 text-xs">
                            <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 font-bold mt-0.5 ${
                              log.action === "REOPEN"
                                ? "bg-rose-100 text-rose-700"
                                : log.action === "RESOLVE"
                                ? "bg-teal-100 text-teal-700"
                                : "bg-amber-100 text-amber-700"
                            }`}>
                              {log.action === "CHANGE_CATEGORY"
                                ? "🏷️"
                                : log.action === "DISPOSITION"
                                ? "🏢"
                                : log.action === "RESOLVE"
                                ? "✓"
                                : log.action === "REOPEN"
                                ? "🔄"
                                : "📝"}
                            </div>
                            <div className="flex-1 pb-3 border-b border-slate-100">
                              <div className="flex items-center justify-between">
                                <p className={`font-bold ${log.action === "REOPEN" ? "text-rose-900" : "text-slate-800"}`}>
                                  {log.action === "CHANGE_CATEGORY"
                                    ? "Perubahan Kategori oleh Humas"
                                    : log.action === "DISPOSITION"
                                    ? "Disposisi Laporan"
                                    : log.action === "RESOLVE"
                                    ? "Penyelesaian Aduan"
                                    : log.action === "REOPEN"
                                    ? "Pembatalan Status Selesai (SOP Re-open oleh Super Admin)"
                                    : "Catatan Tindak Lanjut"}
                                </p>
                                <span className="text-[10px] text-slate-400">
                                  {new Date(log.createdAt).toLocaleString("id-ID")}
                                </span>
                              </div>

                              {/* Indikator Visual Perubahan Kategori (Warna & Nama Kategori) */}
                              {log.action === "CHANGE_CATEGORY" && log.previousVal && log.newVal && (
                                <div className="mt-1.5 flex flex-wrap items-center gap-1.5 text-[11px] font-semibold">
                                  <span
                                    className="px-2 py-0.5 rounded text-white text-[10px] font-bold shadow-xs inline-flex items-center gap-1"
                                    style={{ backgroundColor: log.previousColor || "#64748B" }}
                                  >
                                    ● {log.previousVal}
                                  </span>
                                  <span className="text-slate-400 font-bold">➔</span>
                                  <span
                                    className="px-2 py-0.5 rounded text-white text-[10px] font-bold shadow-xs inline-flex items-center gap-1"
                                    style={{ backgroundColor: log.newColor || "#10B981" }}
                                  >
                                    ● {log.newVal}
                                  </span>
                                </div>
                              )}

                              {log.note && (
                                <p className="text-slate-600 text-[11px] mt-1.5 bg-amber-50/70 p-2 rounded-lg border border-amber-200/80">
                                  {log.note}
                                </p>
                              )}

                              <p className="text-slate-400 text-[10px] mt-1">
                                Diubah oleh: <b>{log.actorName}</b> {log.actorRole ? `(${log.actorRole})` : ""}
                              </p>
                            </div>
                          </div>
                        ))
                      ) : selectedReportForDetailAction.categoryChangeNote ? (
                        <div className="flex items-start gap-3 text-xs">
                          <div className="w-6 h-6 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center shrink-0 font-bold mt-0.5">
                            ✏️
                          </div>
                          <div className="flex-1 pb-3 border-b border-slate-100">
                            <p className="font-bold text-amber-900">Perubahan Kategori oleh Humas</p>
                            <p className="text-slate-600 text-[11px] mt-0.5 bg-amber-50 p-2 rounded-lg border border-amber-200">
                              {selectedReportForDetailAction.categoryChangeNote}
                            </p>
                            <p className="text-slate-400 text-[10px] mt-1">
                              Diubah oleh: <b>{selectedReportForDetailAction.categoryChangedBy || "Admin Humas"}</b>{" "}
                              {selectedReportForDetailAction.categoryChangedAt &&
                                `pada ${new Date(selectedReportForDetailAction.categoryChangedAt).toLocaleString("id-ID")}`}
                            </p>
                          </div>
                        </div>
                      ) : null}

                      {/* 3. Atensi Atasan */}
                      {selectedReportForDetailAction.supervisorWarning && (
                        <div className="flex items-start gap-3 text-xs">
                          <div className="w-6 h-6 rounded-full bg-rose-100 text-rose-700 flex items-center justify-center shrink-0 font-bold mt-0.5 animate-pulse">
                            ⚠️
                          </div>
                          <div className="flex-1 pb-3 border-b border-slate-100">
                            <p className="font-bold text-rose-950">Atensi & Instruksi Pimpinan Manajemen</p>
                            <p className="text-rose-900 text-[11px] mt-0.5 bg-rose-50 p-2.5 rounded-lg border border-rose-200 italic font-medium">
                              &ldquo;{selectedReportForDetailAction.supervisorWarning}&rdquo;
                            </p>
                          </div>
                        </div>
                      )}

                      {/* 4. Disposisi Bidang */}
                      {selectedReportForDetailAction.dispositionOrTechnician &&
                        selectedReportForDetailAction.dispositionOrTechnician !== "Belum Disposisi" && (
                          <div className="flex items-start gap-3 text-xs">
                            <div className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center shrink-0 font-bold mt-0.5">
                              2
                            </div>
                            <div className="flex-1 pb-3 border-b border-slate-100">
                              <p className="font-bold text-indigo-950">Didisposisikan ke Bidang / Teknisi</p>
                              <p className="text-slate-700 text-[11px] font-semibold mt-0.5">
                                🏢 {selectedReportForDetailAction.dispositionOrTechnician}
                              </p>
                              {selectedReportForDetailAction.dispositionNote && (
                                <p className="text-slate-600 text-[11px] mt-1 italic bg-indigo-50/60 p-2 rounded-lg border border-indigo-100">
                                  &ldquo;{selectedReportForDetailAction.dispositionNote}&rdquo;
                                </p>
                              )}
                              {selectedReportForDetailAction.dispositionTargetPhone && (
                                <p className="text-slate-500 text-[10px] mt-1 flex items-center gap-1">
                                  <Phone className="w-3 h-3 text-slate-400" />
                                  Kontak WA Bidang: <b>{selectedReportForDetailAction.dispositionTargetPhone}</b>
                                </p>
                              )}
                            </div>
                          </div>
                        )}

                      {/* 5. Penyelesaian Laporan */}
                      {selectedReportForDetailAction.status === "SELESAI" && (
                        <div className="flex items-start gap-3 text-xs">
                          <div className="w-6 h-6 rounded-full bg-teal-100 text-teal-700 flex items-center justify-center shrink-0 font-bold mt-0.5">
                            ✓
                          </div>
                          <div className="flex-1">
                            <p className="font-bold text-teal-950">Laporan Tuntas Diselesaikan</p>
                            <div className="mt-1 p-2.5 rounded-lg bg-teal-50 border border-teal-200 text-teal-900 text-[11px]">
                              <span className="font-bold block mb-0.5">Respon Resmi Humas:</span>
                              {selectedReportForDetailAction.responseNote || "Penanganan tuntas."}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* MODAL LIGHTBOX: ZOOM FOTO LAMPIRAN                        */}
        {/* ========================================================= */}
        {zoomedImage && (
          <div
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/85 backdrop-blur-sm p-4 animate-in fade-in"
            onClick={() => setZoomedImage(null)}
          >
            <div
              className="relative max-w-4xl max-h-[90vh] flex flex-col items-center"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="w-full flex items-center justify-between pb-2 text-white">
                <span className="text-xs font-bold flex items-center gap-1.5">
                  <ImageIcon className="w-4 h-4 text-emerald-400" /> Pratinjau Foto Lampiran
                </span>
                <button
                  onClick={() => setZoomedImage(null)}
                  className="text-white/80 hover:text-white p-1 rounded-lg bg-white/10 hover:bg-white/20 transition flex items-center gap-1 text-xs font-bold"
                >
                  <X className="w-4 h-4" /> Tutup
                </button>
              </div>
              <img
                src={zoomedImage}
                alt="Foto Lampiran Diperbesar"
                className="max-h-[80vh] max-w-full object-contain rounded-2xl shadow-2xl border border-white/20"
              />
              <div className="mt-3 flex items-center gap-3">
                <a
                  href={zoomedImage}
                  download="lampiran-bukti"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-lg transition"
                >
                  <Download className="w-4 h-4" /> Unduh Gambar Asli
                </a>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* MODAL 9: EDIT AKUN PENGGUNA (SUPERADMIN)                  */}
        {/* ========================================================= */}
        {editingUser && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in">
            <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center space-x-2 text-emerald-700">
                  <Pencil className="w-5 h-5" />
                  <h3 className="text-base font-black text-slate-900">
                    Edit Akun Pengguna
                  </h3>
                </div>
                <button
                  onClick={() => setEditingUser(null)}
                  className="text-slate-400 hover:text-slate-700 font-bold p-1"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleUpdateUser} className="mt-4 space-y-3.5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Nama Lengkap *
                  </label>
                  <input
                    type="text"
                    required
                    value={editUserName}
                    onChange={(e) => setEditUserName(e.target.value)}
                    className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Username / Email Kedinasan (Login) *
                  </label>
                  <input
                    type="text"
                    required
                    value={editUserEmail}
                    onChange={(e) => setEditUserEmail(e.target.value)}
                    placeholder="Contoh: admin_humas atau nama@humas.go.id"
                    className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Kata Sandi Baru (Opsional)
                  </label>
                  <div className="relative">
                    <input
                      type={showEditPassword ? "text" : "password"}
                      value={editUserPassword}
                      onChange={(e) => setEditUserPassword(e.target.value)}
                      placeholder="Kosongkan jika tidak ingin mengubah sandi"
                      className="w-full px-3 py-2 pr-10 text-xs sm:text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                    />
                    <button
                      type="button"
                      onClick={() => setShowEditPassword(!showEditPassword)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
                    >
                      {showEditPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Biarkan kosong jika tetap menggunakan kata sandi yang sekarang.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Peran / Hak Akses (Role) *
                  </label>
                  <select
                    value={editUserRole}
                    onChange={(e) => setEditUserRole(e.target.value)}
                    className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white font-medium"
                  >
                    <option value="ADMIN">Admin Humas</option>
                    <option value="HUMAS">Humas</option>
                    <option value="MANAJEMEN">Manajemen / Pimpinan Eksekutif</option>
                    <option value="TEKNISI">Tim Teknisi Lapangan</option>
                    <option value="STAFF">Karyawan Staf</option>
                    <option value="SUPERADMIN">Super Administrator</option>
                  </select>
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setEditingUser(null)}
                    className="px-4 py-2 text-xs font-semibold rounded-xl text-slate-600 hover:bg-slate-100 transition"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmittingEditUser}
                    className="inline-flex items-center px-4 py-2 text-xs font-bold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white transition shadow-xs disabled:opacity-60"
                  >
                    {isSubmittingEditUser ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />
                    ) : (
                      <Check className="w-3.5 h-3.5 mr-1.5" />
                    )}
                    Simpan Perubahan
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
