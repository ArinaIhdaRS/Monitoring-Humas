import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import bcrypt from "bcryptjs";
import { Role } from "@prisma/client";

export const dynamic = "force-dynamic";

// GET: Mengambil daftar seluruh akun pengguna (Khusus SUPERADMIN)
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "SUPERADMIN") {
      return NextResponse.json(
        { error: "Akses ditolak. Hanya Superadmin yang dapat mengakses data akun pengguna." },
        { status: 403 }
      );
    }

    const users = await db.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        image: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ users });
  } catch (error) {
    console.error("Error fetching users:", error);
    return NextResponse.json(
      { error: "Gagal mengambil daftar pengguna" },
      { status: 500 }
    );
  }
}

// POST: Membuat akun pengguna baru (Khusus SUPERADMIN)
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "SUPERADMIN") {
      return NextResponse.json(
        { error: "Akses ditolak. Hanya Superadmin yang dapat membuat akun pengguna baru." },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { name, email, password, role } = body;

    if (!name || !email || !password) {
      return NextResponse.json(
        { error: "Nama, email, dan kata sandi wajib diisi." },
        { status: 400 }
      );
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Validasi format username / email (hanya huruf, angka, titik, underscore, strip, dan @)
    const usernameRegex = /^[a-zA-Z0-9._@-]+$/;
    if (!usernameRegex.test(normalizedEmail) || normalizedEmail.length < 3 || normalizedEmail.length > 150) {
      return NextResponse.json(
        { error: "Username/Email minimal 3 karakter dan hanya boleh berisi huruf, angka, titik, strip, underscore, atau @." },
        { status: 400 }
      );
    }

    // Validasi kekuatan kata sandi minimal
    if (typeof password !== "string" || password.length < 8) {
      return NextResponse.json(
        { error: "Kata sandi minimal harus 8 karakter demi keamanan sistem." },
        { status: 400 }
      );
    }

    // Cek duplikasi email / username
    const existing = await db.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (existing) {
      return NextResponse.json(
        { error: "Username/Email sudah terdaftar dalam sistem." },
        { status: 400 }
      );
    }

    // Hash kata sandi
    const hashedPassword = await bcrypt.hash(password, 10);

    // Validasi role
    let validRole: Role = Role.STAFF;
    if (role && Object.values(Role).includes(role as Role)) {
      validRole = role as Role;
    }

    const newUser = await db.user.create({
      data: {
        name: name.trim(),
        email: normalizedEmail,
        password: hashedPassword,
        role: validRole,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      },
    });

    return NextResponse.json({
      message: `Akun untuk ${newUser.name} (${newUser.role}) berhasil dibuat.`,
      user: newUser,
    });
  } catch (error) {
    console.error("Error creating user:", error);
    return NextResponse.json(
      { error: "Gagal membuat akun pengguna baru." },
      { status: 500 }
    );
  }
}
