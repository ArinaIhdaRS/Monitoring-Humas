import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { ReportStatus, ReportUrgency } from "@prisma/client";

export const dynamic = "force-dynamic";

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
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
        { error: "Akses ditolak. Anda tidak memiliki wewenang untuk mengubah data laporan masyarakat." },
        { status: 403 }
      );
    }

    const { id } = params;
    const body = await req.json();
    const {
      action,
      status,
      urgency,
      category,
      categoryChangeNote,
      dispositionTo,
      dispositionNote,
      dispositionTargetPhone,
      responseNote,
      supervisorWarning,
      supervisorWarningWaSent,
    } = body;

    // Khusus TRIGGER_WARNING: hanya MANAJEMEN, ADMIN, atau SUPERADMIN yang berwenang
    if (action === "TRIGGER_WARNING" && role !== "MANAJEMEN" && role !== "SUPERADMIN" && role !== "ADMIN") {
      return NextResponse.json(
        { error: "Akses ditolak. Hanya Pimpinan Manajemen dan Administrator yang berhak menerbitkan arahan/warning atasan." },
        { status: 403 }
      );
    }

    const existing = await db.publicReport.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { error: "Laporan tidak ditemukan" },
        { status: 404 }
      );
    }

    // Jika laporan sudah SELESAI, kunci semua perubahan KECUALI jika aksi adalah REOPEN (khusus Superadmin)
    // atau jika aksi berasal dari SUPERADMIN
    if (
      existing.status === ReportStatus.SELESAI &&
      action !== "REOPEN" &&
      action !== "TRIGGER_WARNING" &&
      role !== "SUPERADMIN"
    ) {
      return NextResponse.json(
        {
          error:
            "Laporan ini telah berstatus SELESAI dan dikunci. Tindakan disposisi atau perubahan kategori tidak dapat dilakukan kecuali dibuka kembali oleh Super Admin sesuai SOP.",
        },
        { status: 403 }
      );
    }

    const updateData: any = {};
    const auditLogsToCreate: any[] = [];

    // Khusus Aksi: REOPEN / Pembatalan Status Selesai oleh SUPERADMIN
    if (action === "REOPEN") {
      if (role !== "SUPERADMIN") {
        return NextResponse.json(
          { error: "Akses ditolak. Hanya Super Administrator yang berwenang membatalkan status selesai sesuai SOP." },
          { status: 403 }
        );
      }

      const targetReopenStatus =
        body.targetStatus && Object.values(ReportStatus).includes(body.targetStatus as ReportStatus)
          ? (body.targetStatus as ReportStatus)
          : existing.dispositionTo
          ? ReportStatus.DIDISPOSISIKAN
          : ReportStatus.BARU;

      const reason =
        body.cancelReason?.trim() ||
        "Status Selesai dibatalkan oleh Super Admin untuk peninjauan/penanganan lanjutan sesuai SOP.";

      updateData.status = targetReopenStatus;
      updateData.responseNote = null;
      updateData.respondedAt = null;

      auditLogsToCreate.push({
        reportId: id,
        action: "REOPEN",
        actorName: session.user.name || session.user.email || "Super Administrator",
        actorRole: "SUPERADMIN",
        previousVal: "SELESAI",
        newVal: targetReopenStatus,
        note: `SOP Pembatalan Status Selesai: ${reason}`,
      });
    }

    // 1. Validasi & update Urgensi
    if (urgency && Object.values(ReportUrgency).includes(urgency as ReportUrgency)) {
      if (urgency !== existing.urgency) {
        updateData.urgency = urgency as ReportUrgency;
        auditLogsToCreate.push({
          reportId: id,
          action: "UPDATE_URGENCY",
          actorName: session.user.name || session.user.email || "Admin Humas",
          actorRole: session.user.role || "HUMAS",
          previousVal: existing.urgency,
          newVal: urgency,
          note: `Urgensi laporan disesuaikan dari ${existing.urgency} ke ${urgency}`,
        });
      }
    }

    // 2. Aksi: Ubah Kategori dengan Catatan & Audit Log Lengkap (Warna & Nama)
    if (action === "CHANGE_CATEGORY" || category) {
      if (category && category !== existing.category) {
        const newCatCode = category.trim();

        // Cari metadata warna dan nama kategori lama & baru
        const [oldCatConfig, newCatConfig] = await Promise.all([
          db.categoryConfig.findUnique({ where: { code: existing.category } }),
          db.categoryConfig.findUnique({ where: { code: newCatCode } }),
        ]);

        const oldName = oldCatConfig?.name || existing.category;
        const newName = newCatConfig?.name || newCatCode;
        const oldColor = oldCatConfig?.color || "#475569";
        const newColor = newCatConfig?.color || "#10B981";

        const noteText =
          categoryChangeNote?.trim() ||
          `Kategori diubah dari "${oldName}" menjadi "${newName}" oleh ${session.user.name || session.user.email}`;

        updateData.category = newCatCode;
        updateData.categoryChangeNote = noteText;
        updateData.categoryChangedAt = new Date();
        updateData.categoryChangedBy = session.user.name || session.user.email || "Admin Humas";

        auditLogsToCreate.push({
          reportId: id,
          action: "CHANGE_CATEGORY",
          actorName: session.user.name || session.user.email || "Admin Humas",
          actorRole: session.user.role || "HUMAS",
          previousVal: oldName,
          newVal: newName,
          previousColor: oldColor,
          newColor: newColor,
          note: noteText,
        });
      }
    }

    // 3. Aksi: Disposisi ke Bidang Lain (Dukungan Multi-Bidang & Multi-Kontak)
    if (action === "DISPOSE" || (dispositionTo && status !== "SELESAI")) {
      const finalDept = Array.isArray(dispositionTo)
        ? dispositionTo.filter(Boolean).join(", ")
        : typeof dispositionTo === "string"
        ? dispositionTo.trim()
        : "";

      const finalPhone = Array.isArray(dispositionTargetPhone)
        ? dispositionTargetPhone.filter(Boolean).join(", ")
        : typeof dispositionTargetPhone === "string"
        ? dispositionTargetPhone.trim()
        : null;

      updateData.status = ReportStatus.DIDISPOSISIKAN;
      updateData.dispositionTo = finalDept;
      updateData.targetUnit = finalDept;
      updateData.dispositionNote = dispositionNote?.trim() || "Mohon ditindaklanjuti sesuai kewenangan bidang.";
      updateData.dispositionTargetPhone = finalPhone;
      updateData.dispositionedAt = new Date();

      auditLogsToCreate.push({
        reportId: id,
        action: "DISPOSITION",
        actorName: session.user.name || session.user.email || "Admin Humas",
        actorRole: session.user.role || "HUMAS",
        previousVal: existing.dispositionTo || "Belum Disposisi",
        newVal: finalDept,
        note: `${dispositionNote?.trim() || "Didisposisikan ke unit/bidang terkait"}${finalPhone ? ` (Kontak WA: ${finalPhone})` : ""}`,
      });
    }

    // 4. Aksi: Selesaikan Laporan (Update Status Jadi SELESAI)
    if (action === "RESOLVE" || status === "SELESAI") {
      updateData.status = ReportStatus.SELESAI;
      const finalResponse =
        responseNote?.trim() ||
        "Laporan telah ditindaklanjuti dan diselesaikan oleh Tim Humas beserta bidang terkait.";
      updateData.responseNote = finalResponse;
      updateData.respondedAt = new Date();

      auditLogsToCreate.push({
        reportId: id,
        action: "RESOLVE",
        actorName: session.user.name || session.user.email || "Admin Humas",
        actorRole: session.user.role || "HUMAS",
        previousVal: existing.status,
        newVal: "SELESAI",
        note: finalResponse,
      });
    } else if (status && Object.values(ReportStatus).includes(status as ReportStatus) && action !== "REOPEN") {
      updateData.status = status as ReportStatus;
    }

    // 5. Aksi: Trigger Warning / Atensi Atasan
    if (action === "TRIGGER_WARNING") {
      const warnNote = supervisorWarning?.trim() || "Mohon Admin Humas segera menindaklanjuti laporan ini.";
      updateData.supervisorWarning = warnNote;
      updateData.supervisorWarningAt = new Date();
      updateData.supervisorWarningBy =
        session.user.name || session.user.email || "Pimpinan Manajemen";
      if (typeof supervisorWarningWaSent === "boolean") {
        updateData.supervisorWarningWaSent = supervisorWarningWaSent;
      }

      auditLogsToCreate.push({
        reportId: id,
        action: "WARNING",
        actorName: session.user.name || session.user.email || "Pimpinan Manajemen",
        actorRole: session.user.role || "MANAJEMEN",
        newVal: "ATENSI_MANAJEMEN",
        note: warnNote,
      });
    } else if (typeof supervisorWarningWaSent === "boolean") {
      updateData.supervisorWarningWaSent = supervisorWarningWaSent;
    }

    const updated = await db.publicReport.update({
      where: { id },
      data: updateData,
    });

    // Simpan audit logs ke database
    if (auditLogsToCreate.length > 0) {
      await db.reportAuditLog.createMany({
        data: auditLogsToCreate,
      });
    }

    // Ambil data terbaru beserta audit logs
    const fullUpdatedReport = await db.publicReport.findUnique({
      where: { id },
      include: {
        auditLogs: {
          orderBy: { createdAt: "desc" },
        },
      },
    });

    return NextResponse.json({
      message: "Data laporan berhasil diperbarui",
      report: fullUpdatedReport || updated,
    });
  } catch (error) {
    console.error("Error updating report:", error);
    return NextResponse.json(
      { error: "Gagal memperbarui status laporan" },
      { status: 500 }
    );
  }
}

// DELETE: Menghapus laporan publik (Khusus SUPERADMIN)
// Berfungsi menangani kasus human error / laporan duplikat dari masyarakat
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: "Akses ditolak. Silakan login terlebih dahulu." },
        { status: 401 }
      );
    }

    if (session.user.role !== "SUPERADMIN") {
      return NextResponse.json(
        { error: "Akses ditolak. Hanya Super Administrator yang berwenang menghapus laporan." },
        { status: 403 }
      );
    }

    const { id } = params;
    const existing = await db.publicReport.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { error: "Laporan tidak ditemukan atau sudah dihapus." },
        { status: 404 }
      );
    }

    await db.publicReport.delete({
      where: { id },
    });

    return NextResponse.json({
      message: `Laporan tiket #${existing.ticketNumber} berhasil dihapus permanen oleh Superadmin.`,
    });
  } catch (error) {
    console.error("Error deleting report:", error);
    return NextResponse.json(
      { error: "Gagal menghapus laporan." },
      { status: 500 }
    );
  }
}
