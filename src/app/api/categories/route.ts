import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export const dynamic = "force-dynamic";

// GET: Ambil daftar seluruh kategori aduan beserta warna resminya
export async function GET() {
  try {
    const categories = await db.categoryConfig.findMany({
      where: { isActive: true },
      orderBy: { orderIndex: "asc" },
    });

    return NextResponse.json({ categories });
  } catch (error) {
    console.error("Error fetching categories:", error);
    return NextResponse.json(
      { error: "Gagal mengambil data kategori" },
      { status: 500 }
    );
  }
}

// POST: Tambah kategori baru (Khusus SUPERADMIN)
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "SUPERADMIN") {
      return NextResponse.json(
        { error: "Akses ditolak. Hanya Superadmin yang berwenang menambah kategori." },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { name, code, color, bgLight, textColor, description } = body;

    if (!name || !code) {
      return NextResponse.json(
        { error: "Nama dan kode kategori wajib diisi." },
        { status: 400 }
      );
    }

    const count = await db.categoryConfig.count();

    const newCategory = await db.categoryConfig.create({
      data: {
        name: name.trim(),
        code: code.trim().toUpperCase().replace(/\s+/g, "_"),
        color: color || "#10B981",
        bgLight: bgLight || "bg-emerald-50 text-emerald-800 border-emerald-200",
        textColor: textColor || "#FFFFFF",
        description: description?.trim() || null,
        orderIndex: count + 1,
      },
    });

    return NextResponse.json({
      message: "Kategori baru berhasil ditambahkan",
      category: newCategory,
    });
  } catch (error: any) {
    console.error("Error creating category:", error);
    if (error.code === "P2002") {
      return NextResponse.json(
        { error: "Nama atau kode kategori sudah digunakan." },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: "Gagal membuat kategori baru" },
      { status: 500 }
    );
  }
}

// PUT: Perbarui konfigurasi pewarnaan dan nama kategori (Khusus SUPERADMIN)
export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "SUPERADMIN") {
      return NextResponse.json(
        { error: "Akses ditolak. Hanya Superadmin yang berwenang mengubah kategori." },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { id, name, color, bgLight, textColor, description, isActive, orderIndex } = body;

    if (!id) {
      return NextResponse.json(
        { error: "ID kategori wajib disertakan." },
        { status: 400 }
      );
    }

    const updated = await db.categoryConfig.update({
      where: { id },
      data: {
        name: name !== undefined ? name.trim() : undefined,
        color: color !== undefined ? color.trim() : undefined,
        bgLight: bgLight !== undefined ? bgLight.trim() : undefined,
        textColor: textColor !== undefined ? textColor.trim() : undefined,
        description: description !== undefined ? description?.trim() : undefined,
        isActive: typeof isActive === "boolean" ? isActive : undefined,
        orderIndex: typeof orderIndex === "number" ? orderIndex : undefined,
      },
    });

    return NextResponse.json({
      message: "Pewarnaan kategori berhasil diperbarui",
      category: updated,
    });
  } catch (error) {
    console.error("Error updating category:", error);
    return NextResponse.json(
      { error: "Gagal memperbarui kategori" },
      { status: 500 }
    );
  }
}

// DELETE: Hapus kategori (Khusus SUPERADMIN)
export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "SUPERADMIN") {
      return NextResponse.json(
        { error: "Akses ditolak. Hanya Superadmin yang berwenang menghapus kategori." },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "ID kategori wajib disertakan" },
        { status: 400 }
      );
    }

    await db.categoryConfig.delete({ where: { id } });

    return NextResponse.json({ message: "Kategori berhasil dihapus" });
  } catch (error) {
    console.error("Error deleting category:", error);
    return NextResponse.json(
      { error: "Gagal menghapus kategori" },
      { status: 500 }
    );
  }
}
