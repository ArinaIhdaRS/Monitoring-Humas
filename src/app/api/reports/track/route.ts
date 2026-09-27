import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { createRateLimiter, getClientIp } from "@/lib/rate-limit";
import { maskContact, sanitizeAttachmentUrl } from "@/lib/security";

export const dynamic = "force-dynamic";

const trackRateLimiter = createRateLimiter({ interval: 60000 }); // 1 menit

export async function GET(req: NextRequest) {
  try {
    // Rate limiting: cegah enumerasi / brute-force nomor tiket warga (max 40 req/menit per IP)
    const clientIp = getClientIp(req);
    const rateCheck = trackRateLimiter.check(40, clientIp);
    if (!rateCheck.success) {
      return NextResponse.json(
        { error: `Terlalu banyak permintaan pelacakan tiket. Silakan tunggu ${rateCheck.reset} detik.` },
        { status: 429 }
      );
    }

    const { searchParams } = new URL(req.url);
    const ticket = searchParams.get("ticket");

    if (!ticket) {
      return NextResponse.json(
        { error: "Nomor tiket wajib diisi" },
        { status: 400 }
      );
    }

    const report = await db.publicReport.findUnique({
      where: { ticketNumber: ticket.trim().toUpperCase() },
      select: {
        id: true,
        ticketNumber: true,
        title: true,
        category: true,
        content: true,
        targetUnit: true,
        location: true,
        attachmentName: true,
        attachmentUrl: true,
        isAnonymous: true,
        reporterName: true,
        reporterContact: true,
        status: true,
        urgency: true,
        dispositionTo: true,
        dispositionNote: true,
        // dispositionTargetPhone: REDACTED (Privasi kontak staf instansi)
        dispositionedAt: true,
        categoryChangeNote: true,
        categoryChangedAt: true,
        categoryChangedBy: true,
        responseNote: true,
        respondedAt: true,
        supervisorWarning: true,
        supervisorWarningAt: true,
        // supervisorWarningBy: REDACTED (Privasi identitas internal pimpinan)
        supervisorWarningWaSent: false,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!report) {
      return NextResponse.json(
        { error: "Nomor tiket tidak ditemukan dalam sistem kami." },
        { status: 404 }
      );
    }

    // Cari warna dan nama kategori resmi dari CategoryConfig
    const catConfig = await db.categoryConfig.findUnique({
      where: { code: report.category },
    });

    // Sanitasi data privasi (PII) dan tautan lampiran
    const safeReporterContact = report.isAnonymous
      ? null
      : maskContact(report.reporterContact);

    const safeAttachment = sanitizeAttachmentUrl(report.attachmentUrl);

    return NextResponse.json({
      report: {
        ...report,
        reporterContact: safeReporterContact,
        attachmentUrl: safeAttachment,
        categoryName: catConfig?.name || report.category.replace(/_/g, " "),
        categoryColor: catConfig?.color || "#2563EB",
        categoryBgLight: catConfig?.bgLight || "bg-blue-50 text-blue-800 border-blue-200",
      },
    });
  } catch (error) {
    console.error("Error tracking report:", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan saat melacak laporan." },
      { status: 500 }
    );
  }
}
