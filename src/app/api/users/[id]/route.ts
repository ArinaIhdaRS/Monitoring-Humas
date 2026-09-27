import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import bcrypt from "bcryptjs";
import { Role } from "@prisma/client";

export const dynamic = "force-dynamic";

// PATCH: Perbarui data akun pengguna (Nama, Role, Password)
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "SUPERADMIN") {
      return NextResponse.json(
        { error: "Akses ditolak. Hanya Superadmin yang berwenang mengubah akun." },
        { status: 403 }
      );
    }

    const { id } = params;
    const body = await req.json();
    const { name, email, password, role } = body;

    const existingUser = await db.user.findUnique({ where: { id } });
    if (!existingUser) {
      return NextResponse.json({ error: "Pengguna tidak ditemukan." }, { status: 404 });
    }

    const updateData: any = {};
    if (name) updateData.name = name.trim().slice(0, 100);
    if (email) {
      const normalizedEmail = email.toLowerCase().trim();
      const usernameRegex = /^[a-zA-Z0-9._@-]+$/;
      if (!usernameRegex.test(normalizedEmail) || normalizedEmail.length < 3 || normalizedEmail.length > 150) {
        return NextResponse.json(
          { error: "Username/Email minimal 3 karakter dan hanya boleh berisi huruf, angka, titik, strip, underscore, atau @." },
          { status: 400 }
        );
      }
      updateData.email = normalizedEmail;
    }
    if (role && Object.values(Role).includes(role as Role)) {
      updateData.role = role as Role;
    }
    if (password && password.trim().length > 0) {
      if (password.trim().length < 8) {
        return NextResponse.json(
          { error: "Kata sandi baru minimal harus 8 karakter demi keamanan sistem." },
          { status: 400 }
        );
      }
      updateData.password = await bcrypt.hash(password.trim(), 10);
    }

    const updated = await db.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({
      message: "Data akun berhasil diperbarui.",
      user: updated,
    });
  } catch (error: any) {
    console.error("Error updating user:", error);
    if (error.code === "P2002") {
      return NextResponse.json({ error: "Username atau email sudah digunakan oleh akun lain." }, { status: 400 });
    }
    return NextResponse.json({ error: "Gagal memperbarui akun pengguna." }, { status: 500 });
  }
}

// DELETE: Hapus akun pengguna
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "SUPERADMIN") {
      return NextResponse.json(
        { error: "Akses ditolak. Hanya Superadmin yang berwenang menghapus akun." },
        { status: 403 }
      );
    }

    const { id } = params;

    // Proteksi: jangan izinkan Superadmin menghapus dirinya sendiri
    if (session.user.id === id) {
      return NextResponse.json(
        { error: "Anda tidak dapat menghapus akun Anda sendiri yang sedang aktif." },
        { status: 400 }
      );
    }

    await db.user.delete({ where: { id } });

    return NextResponse.json({ message: "Akun berhasil dihapus dari sistem." });
  } catch (error) {
    console.error("Error deleting user:", error);
    return NextResponse.json({ error: "Gagal menghapus akun pengguna." }, { status: 500 });
  }
}
