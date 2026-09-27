import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { InternalReportStatus, ReportUrgency } from "@prisma/client";

export const dynamic = "force-dynamic";

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Akses ditolak. Silakan login terlebih dahulu." },
        { status: 401 }
      );
    }

    const { id } = params;
    const body = await req.json();
    const { status, urgency, technicianNotes, targetTechnician } = body;

    const existing = await db.internalReport.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { error: "Laporan kendala ruangan tidak ditemukan." },
        { status: 404 }
      );
    }

    const userRole = session.user.role;
    const isOwner = existing.reporterId === session.user.id;
    const isPrivileged = userRole === "SUPERADMIN" || userRole === "ADMIN" || userRole === "TEKNISI";

    // Proteksi IDOR: Tolak jika bukan pemilik laporan dan bukan teknisi/admin
    if (!isPrivileged && !isOwner) {
      return NextResponse.json(
        { error: "Akses ditolak. Anda tidak berhak mengubah tiket kendala pengguna lain (IDOR Protection)." },
        { status: 403 }
      );
    }

    // Jika user adalah staf pelapor biasa (bukan teknisi), tolak pengisian catatan teknisi
    if (!isPrivileged && technicianNotes !== undefined) {
      return NextResponse.json(
        { error: "Akses ditolak. Catatan perbaikan hanya dapat diisi oleh Tim Teknisi." },
        { status: 403 }
      );
    }

    const updateData: any = {};

    if (urgency && Object.values(ReportUrgency).includes(urgency as ReportUrgency)) {
      updateData.urgency = urgency as ReportUrgency;
    }

    if (targetTechnician) {
      updateData.targetTechnician = targetTechnician.trim();
    }

    if (technicianNotes !== undefined) {
      updateData.technicianNotes = technicianNotes.trim();
    }

    if (status && Object.values(InternalReportStatus).includes(status as InternalReportStatus)) {
      updateData.status = status as InternalReportStatus;
      
      // Jika teknisi mulai pengerjaan fisik di ruangan
      if (status === "SEDANG_DIKERJAKAN" && !existing.startedAt) {
        updateData.startedAt = new Date();
      }
      // Jika perbaikan selesai
      if (status === "SELESAI" && !existing.completedAt) {
        updateData.completedAt = new Date();
      }
    }

    const updated = await db.internalReport.update({
      where: { id },
      data: updateData,
      include: {
        reporter: {
          select: { id: true, name: true, email: true, role: true },
        },
      },
    });

    return NextResponse.json({
      message: "Status pergerakan teknisi berhasil diperbarui.",
      report: updated,
    });
  } catch (error) {
    console.error("Error updating internal report:", error);
    return NextResponse.json(
      { error: "Gagal memperbarui pergerakan teknisi." },
      { status: 500 }
    );
  }
}
