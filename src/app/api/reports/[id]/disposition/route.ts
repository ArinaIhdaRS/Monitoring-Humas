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
        { error: "Akses ditolak. Silakan login sebagai Admin/Humas." },
        { status: 401 }
      );
    }

    const role = session.user.role;
    if (role !== "SUPERADMIN" && role !== "ADMIN" && role !== "HUMAS") {
      return NextResponse.json(
        { error: "Akses ditolak. Hanya Tim Admin dan Humas yang berwenang mendisposisikan laporan." },
        { status: 403 }
      );
    }

    const { id } = params;
    const body = await req.json();
    const { dispositionTo, dispositionNote, urgency } = body;

    if (!dispositionTo) {
      return NextResponse.json(
        { error: "Bidang tujuan disposisi wajib ditentukan" },
        { status: 400 }
      );
    }

    const existingReport = await db.publicReport.findUnique({
      where: { id },
    });

    if (!existingReport) {
      return NextResponse.json(
        { error: "Laporan tidak ditemukan" },
        { status: 404 }
      );
    }

    if (existingReport.status === ReportStatus.SELESAI && role !== "SUPERADMIN") {
      return NextResponse.json(
        { error: "Laporan sudah berstatus SELESAI dan dikunci. Hanya Super Admin yang berwenang membuka kembali status laporan sesuai SOP." },
        { status: 403 }
      );
    }

    const { dispositionTargetPhone } = body;
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

    const updateData: any = {
      dispositionTo: finalDept,
      dispositionNote: dispositionNote?.trim() || "Mohon ditindaklanjuti sesuai kewenangan bidang terkait.",
      dispositionTargetPhone: finalPhone,
      dispositionedAt: new Date(),
      status: ReportStatus.DIDISPOSISIKAN,
    };

    if (urgency && Object.values(ReportUrgency).includes(urgency as ReportUrgency)) {
      updateData.urgency = urgency as ReportUrgency;
    }

    const updatedReport = await db.publicReport.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({
      message: `Laporan berhasil didisposisikan ke ${dispositionTo}`,
      report: updatedReport,
    });
  } catch (error) {
    console.error("Error updating disposition:", error);
    return NextResponse.json(
      { error: "Gagal memproses disposisi laporan" },
      { status: 500 }
    );
  }
}
