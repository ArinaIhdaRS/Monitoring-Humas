import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { TechCategory, ReportUrgency } from "@prisma/client";

export const dynamic = "force-dynamic";

// POST: Karyawan internal membuat laporan kendala ruangan (Wajib Login)
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Akses ditolak. Silakan login sebagai karyawan internal terlebih dahulu." },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { title, roomLocation, techCategory, targetTechnician, urgency, description } = body;

    if (!title || !roomLocation || !description || !targetTechnician) {
      return NextResponse.json(
        { error: "Judul kendala, lokasi ruangan, deskripsi, dan teknisi tujuan wajib diisi." },
        { status: 400 }
      );
    }

    // Generate tiket kendala internal: Contoh KND-260905-B7K2
    const datePart = new Date().toISOString().slice(2, 10).replace(/-/g, "");
    const randomPart = Math.random().toString(36).substring(2, 6).toUpperCase();
    const ticketNumber = `KND-${datePart}-${randomPart}`;

    let validCategory: TechCategory = TechCategory.HARDWARE_KOMPUTER;
    if (techCategory && Object.values(TechCategory).includes(techCategory as TechCategory)) {
      validCategory = techCategory as TechCategory;
    }

    let validUrgency: ReportUrgency = ReportUrgency.SEDANG;
    if (urgency && Object.values(ReportUrgency).includes(urgency as ReportUrgency)) {
      validUrgency = urgency as ReportUrgency;
    }

    const newReport = await db.internalReport.create({
      data: {
        ticketNumber,
        title: title.trim(),
        roomLocation: roomLocation.trim(),
        techCategory: validCategory,
        targetTechnician: targetTechnician.trim(),
        urgency: validUrgency,
        description: description.trim(),
        reporterId: session.user.id,
      },
      include: {
        reporter: {
          select: { id: true, name: true, email: true, role: true },
        },
      },
    });

    return NextResponse.json(
      {
        message: "Laporan kendala ruangan berhasil dikirim langsung ke teknisi.",
        ticketNumber: newReport.ticketNumber,
        report: newReport,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating internal report:", error);
    return NextResponse.json(
      { error: "Gagal mengirim laporan kendala ruangan. Silakan coba lagi." },
      { status: 500 }
    );
  }
}

// GET: Mengambil daftar kendala ruangan
// - Admin/Humas/Teknisi: Melihat seluruh pergerakan kendala di semua ruangan
// - Karyawan (Staff): Melihat riwayat kendala yang dilaporkan oleh dirinya
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Akses ditolak. Silakan login terlebih dahulu." },
        { status: 401 }
      );
    }

    const userRole = session.user.role;
    const isPrivileged =
      userRole === "SUPERADMIN" ||
      userRole === "ADMIN" ||
      userRole === "HUMAS" ||
      userRole === "TEKNISI";

    const { searchParams } = new URL(req.url);
    const filterStatus = searchParams.get("status");
    const filterTechnician = searchParams.get("technician");

    let whereClause: any = isPrivileged ? {} : { reporterId: session.user.id };

    if (filterStatus && filterStatus !== "ALL") {
      whereClause.status = filterStatus;
    }
    if (filterTechnician && filterTechnician !== "ALL") {
      whereClause.targetTechnician = {
        contains: filterTechnician,
        mode: "insensitive",
      };
    }

    const reports = await db.internalReport.findMany({
      where: whereClause,
      include: {
        reporter: {
          select: { id: true, name: true, email: true, role: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ reports });
  } catch (error) {
    console.error("Error fetching internal reports:", error);
    return NextResponse.json(
      { error: "Gagal mengambil data laporan kendala ruangan." },
      { status: 500 }
    );
  }
}
