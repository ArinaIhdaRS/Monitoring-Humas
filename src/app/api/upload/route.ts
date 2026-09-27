import { NextRequest, NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";
import crypto from "crypto";

export const dynamic = "force-dynamic";

// Maksimum ukuran file: 10 MB
const MAX_FILE_SIZE = 10 * 1024 * 1024;

// Ekstensi yang diizinkan
const ALLOWED_EXTENSIONS = new Set([
  ".jpg",
  ".jpeg",
  ".png",
  ".webp",
  ".gif",
  ".svg",
  ".pdf",
]);

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json(
        { error: "Berkas tidak ditemukan. Silakan pilih berkas yang akan diunggah." },
        { status: 400 }
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "Ukuran berkas melebihi batas maksimum 10 MB." },
        { status: 400 }
      );
    }

    const originalName = file.name || "lampiran";
    const rawExt = path.extname(originalName).toLowerCase();
    const ext = rawExt && ALLOWED_EXTENSIONS.has(rawExt) ? rawExt : ".png";

    // Validasi tipe berkas
    if (!ALLOWED_EXTENSIONS.has(ext)) {
      return NextResponse.json(
        { error: "Format berkas tidak didukung. Harap unggah foto (JPG, PNG, WEBP) atau PDF." },
        { status: 400 }
      );
    }

    // Buat nama file unik dan aman untuk server
    const randomHex = crypto.randomBytes(6).toString("hex");
    const safeFileName = `bukti-${Date.now()}-${randomHex}${ext}`;

    // Tentukan direktori penyimpanan di public/uploads/reports
    const uploadDir = path.join(process.cwd(), "public", "uploads", "reports");
    await fs.mkdir(uploadDir, { recursive: true });

    // Tulis berkas fisik ke disk server
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const destinationPath = path.join(uploadDir, safeFileName);
    await fs.writeFile(destinationPath, buffer);

    // URL publik yang dapat diakses browser dan disimpan ke database
    const fileUrl = `/uploads/reports/${safeFileName}`;

    return NextResponse.json({
      success: true,
      message: "Berkas berhasil diunggah ke server",
      url: fileUrl,
      name: originalName,
      size: file.size,
      mimeType: file.type || (ext === ".pdf" ? "application/pdf" : "image/png"),
    });
  } catch (error) {
    console.error("Error uploading file:", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan pada server saat mengunggah berkas." },
      { status: 500 }
    );
  }
}
