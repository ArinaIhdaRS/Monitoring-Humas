import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export const dynamic = "force-dynamic";

// GET: Ambil konfigurasi sistem (Publik, tanpa membocorkan API key rahasia)
export async function GET() {
  try {
    const publicSelect = {
      id: true,
      institutionName: true,
      institutionTagline: true,
      publicModuleActive: true,
      employeeModuleActive: true,
      technicianModuleActive: true,
      availableTechnicians: true,
      systemAnnouncement: true,
      waGatewayEnabled: true,
      updatedAt: true,
    };

    let settings = await db.systemSetting.findUnique({
      where: { id: "default" },
      select: publicSelect,
    });

    if (!settings) {
      const created = await db.systemSetting.create({
        data: {
          id: "default",
          institutionName: "Dinas Komunikasi, Informatika dan Humas",
          institutionTagline:
            "Sistem Informasi Monitoring Humas, Aduan Publik & Kendala Fasilitas Terpadu",
          publicModuleActive: true,
          employeeModuleActive: true,
          technicianModuleActive: true,
          availableTechnicians:
            "Unit Teknisi Jaringan & IT,Unit Teknisi Hardware & Komputer,Unit Teknisi Tata Udara & AC,Unit Teknisi Listrik & Mekanikal,Unit Teknisi Audio Visual & Multimedia,Unit Teknisi Sarana Prasarana Gedung",
          systemAnnouncement:
            "Layanan pengaduan masyarakat publik dan kendala ruangan internal beroperasi 24/7.",
        },
        select: publicSelect,
      });
      settings = created;
    }

    return NextResponse.json(settings);
  } catch (error) {
    console.error("Error fetching settings:", error);
    return NextResponse.json(
      { error: "Gagal mengambil pengaturan sistem" },
      { status: 500 }
    );
  }
}

// PUT / POST: Update konfigurasi sistem (khusus ADMIN dan SUPERADMIN)
export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (
      !session?.user ||
      (session.user.role !== "SUPERADMIN" && session.user.role !== "ADMIN")
    ) {
      return NextResponse.json(
        { error: "Akses ditolak. Hanya Superadmin dan Admin yang dapat mengubah konfigurasi." },
        { status: 403 }
      );
    }

    const body = await req.json();
    const {
      institutionName,
      institutionTagline,
      publicModuleActive,
      employeeModuleActive,
      technicianModuleActive,
      availableTechnicians,
      systemAnnouncement,
    } = body;

    const updated = await db.systemSetting.upsert({
      where: { id: "default" },
      update: {
        institutionName: institutionName ?? undefined,
        institutionTagline: institutionTagline ?? undefined,
        publicModuleActive:
          typeof publicModuleActive === "boolean"
            ? publicModuleActive
            : undefined,
        employeeModuleActive:
          typeof employeeModuleActive === "boolean"
            ? employeeModuleActive
            : undefined,
        technicianModuleActive:
          typeof technicianModuleActive === "boolean"
            ? technicianModuleActive
            : undefined,
        availableTechnicians: availableTechnicians ?? undefined,
        systemAnnouncement: systemAnnouncement ?? undefined,
      },
      create: {
        id: "default",
        institutionName:
          institutionName || "Dinas Komunikasi, Informatika dan Humas",
        institutionTagline:
          institutionTagline ||
          "Sistem Informasi Monitoring Humas, Aduan Publik & Kendala Fasilitas Terpadu",
        publicModuleActive: publicModuleActive ?? true,
        employeeModuleActive: employeeModuleActive ?? true,
        technicianModuleActive: technicianModuleActive ?? true,
        availableTechnicians:
          availableTechnicians ||
          "Unit Teknisi Jaringan & IT,Unit Teknisi Hardware & Komputer,Unit Teknisi Tata Udara & AC,Unit Teknisi Listrik & Mekanikal,Unit Teknisi Audio Visual & Multimedia,Unit Teknisi Sarana Prasarana Gedung",
        systemAnnouncement: systemAnnouncement || null,
      },
    });

    return NextResponse.json({
      message: "Konfigurasi sistem berhasil diperbarui",
      settings: updated,
    });
  } catch (error) {
    console.error("Error updating settings:", error);
    return NextResponse.json(
      { error: "Gagal menyimpan konfigurasi sistem" },
      { status: 500 }
    );
  }
}
