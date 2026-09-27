import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createRateLimiter, getClientIp } from "@/lib/rate-limit";
import { sanitizeAttachmentUrl } from "@/lib/security";

export const dynamic = "force-dynamic";

// Rate limiter: max 5 laporan per 10 menit per IP
const reportPostRateLimiter = createRateLimiter({ interval: 10 * 60 * 1000 });

// POST: Publik membuat laporan tanpa login (opsi anonim)
export async function POST(req: NextRequest) {
  try {
    const clientIp = getClientIp(req);
    const rateCheck = reportPostRateLimiter.check(5, clientIp);
    if (!rateCheck.success) {
      return NextResponse.json(
        { error: `Terlalu banyak pengiriman laporan dari IP Anda. Silakan tunggu ${rateCheck.reset} detik sebelum mengirim kembali.` },
        { status: 429 }
      );
    }

    const body = await req.json();
    const {
      title,
      category,
      content,
      isAnonymous,
      reporterName,
      reporterContact,
      location,
      targetUnit,
      attachmentName,
      attachmentUrl,
    } = body;

    // Validasi keberadaan input wajib
    if (!title || typeof title !== "string" || !title.trim()) {
      return NextResponse.json(
        { error: "Judul laporan wajib diisi." },
        { status: 400 }
      );
    }

    if (!content || typeof content !== "string" || !content.trim()) {
      return NextResponse.json(
        { error: "Isi laporan wajib diisi." },
        { status: 400 }
      );
    }

    // Validasi panjang karakter (Payload / DoS Protection)
    const cleanTitle = title.trim();
    if (cleanTitle.length > 200) {
      return NextResponse.json(
        { error: "Judul laporan maksimal 200 karakter." },
        { status: 400 }
      );
    }

    const cleanContent = content.trim();
    if (cleanContent.length > 10000) {
      return NextResponse.json(
        { error: "Isi laporan maksimal 10.000 karakter." },
        { status: 400 }
      );
    }

    if (location && typeof location === "string" && location.trim().length > 200) {
      return NextResponse.json(
        { error: "Lokasi kejadian maksimal 200 karakter." },
        { status: 400 }
      );
    }

    if (targetUnit && typeof targetUnit === "string" && targetUnit.trim().length > 150) {
      return NextResponse.json(
        { error: "Unit target maksimal 150 karakter." },
        { status: 400 }
      );
    }

    // Validasi keamanan lampiran berkas
    let safeAttachment: string | null = null;
    if (attachmentUrl && typeof attachmentUrl === "string") {
      // Tolak payload file Base64 di atas ~7 MB
      if (attachmentUrl.length > 7 * 1024 * 1024) {
        return NextResponse.json(
          { error: "Ukuran berkas lampiran melebihi batas maksimum 5 MB." },
          { status: 400 }
        );
      }
      safeAttachment = sanitizeAttachmentUrl(attachmentUrl);
      if (!safeAttachment) {
        return NextResponse.json(
          { error: "Format lampiran tidak valid atau mengandung skema berbahaya (hanya gambar JPG/PNG/WEBP atau PDF yang diizinkan)." },
          { status: 400 }
        );
      }
    }

    // Generate nomor tiket unik: Contoh HM-240905-K3B9
    const datePart = new Date().toISOString().slice(2, 10).replace(/-/g, "");
    const randomPart = Math.random().toString(36).substring(2, 6).toUpperCase();
    const ticketNumber = `HM-${datePart}-${randomPart}`;

    const reportCategory = typeof category === "string" && category.trim() ? category.trim().slice(0, 50) : "PELAYANAN_PUBLIK";

    const newReport = await db.publicReport.create({
      data: {
        ticketNumber,
        title: cleanTitle,
        category: reportCategory,
        content: cleanContent,
        targetUnit: targetUnit && typeof targetUnit === "string" && targetUnit.trim() ? targetUnit.trim().slice(0, 150) : "Tim Humas",
        location: location && typeof location === "string" ? location.trim().slice(0, 200) : null,
        attachmentName: attachmentName && typeof attachmentName === "string" ? attachmentName.trim().slice(0, 200) : null,
        attachmentUrl: safeAttachment,
        isAnonymous: Boolean(isAnonymous),
        reporterName: isAnonymous ? null : (typeof reporterName === "string" ? reporterName.trim().slice(0, 100) : "Warga Masyarakat"),
        reporterContact: isAnonymous ? null : (typeof reporterContact === "string" ? reporterContact.trim().slice(0, 100) : null),
      },
    });

    return NextResponse.json(
      {
        message: "Laporan Anda berhasil dikirim ke Tim Humas",
        ticketNumber: newReport.ticketNumber,
        report: newReport,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating report:", error);
    return NextResponse.json(
      { error: "Gagal mengirim laporan. Silakan coba lagi nanti." },
      { status: 500 }
    );
  }
}

// GET: Mengambil daftar laporan untuk dashboard Humas & Manajemen (Wajib Login dengan Role yang sesuai)
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: "Akses ditolak. Silakan login terlebih dahulu." },
        { status: 401 }
      );
    }

    const role = session.user.role;
    if (
      role !== "SUPERADMIN" &&
      role !== "ADMIN" &&
      role !== "HUMAS" &&
      role !== "MANAJEMEN" &&
      role !== "TEKNISI"
    ) {
      return NextResponse.json(
        { error: "Akses ditolak. Anda tidak memiliki izin untuk melihat laporan aduan masyarakat." },
        { status: 403 }
      );
    }

    const reports = await db.publicReport.findMany({
      include: {
        auditLogs: {
          orderBy: { createdAt: "desc" },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ reports });
  } catch (error) {
    console.error("Error fetching reports:", error);
    return NextResponse.json(
      { error: "Gagal mengambil data laporan" },
      { status: 500 }
    );
  }
}
