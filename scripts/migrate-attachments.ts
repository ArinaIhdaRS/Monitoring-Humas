import { db } from "../src/lib/db";
import { promises as fs } from "fs";
import path from "path";
import crypto from "crypto";

async function migrateLegacyReports() {
  console.log("🚀 Memulai migrasi data laporan & berkas lampiran...");

  const reports = await db.publicReport.findMany();
  console.log(`📋 Total laporan ditemukan: ${reports.length}`);

  const uploadDir = path.join(process.cwd(), "public", "uploads", "reports");
  await fs.mkdir(uploadDir, { recursive: true });

  let migratedCount = 0;

  for (const report of reports) {
    let cleanContent = report.content || "";
    let targetUnit: string | null = (report as any).targetUnit || null;
    let location: string | null = (report as any).location || null;
    let attachmentName: string | null = (report as any).attachmentName || null;
    let attachmentUrl: string | null = (report as any).attachmentUrl || null;
    let shouldUpdate = false;

    // 1. Ekstrak dari format delimiter "---"
    const splitIndex = cleanContent.indexOf("\n\n---\n");
    if (splitIndex !== -1) {
      const metaText = cleanContent.slice(splitIndex + 6);
      cleanContent = cleanContent.slice(0, splitIndex).trim();

      const unitMatch = metaText.match(/🏛️ Unit\/Bidang Tujuan:\s*(.+)/);
      if (unitMatch && !targetUnit) targetUnit = unitMatch[1].trim();

      const locMatch = metaText.match(/📍 Lokasi Kejadian:\s*(.+)/);
      if (locMatch && !location) location = locMatch[1].trim();

      const attMatch = metaText.match(/📎 Lampiran Bukti:\s*(.+)/);
      if (attMatch && !attachmentName) attachmentName = attMatch[1].trim();

      const urlMatch = metaText.match(/🖼️ Berkas Data:\s*(.+)/);
      if (urlMatch && !attachmentUrl) attachmentUrl = urlMatch[1].trim();

      shouldUpdate = true;
    }

    // 2. Ekstrak dari teks inline jika tidak ada delimiter
    const urlMatch = cleanContent.match(/🖼️ Berkas Data:\s*(.+)/);
    if (urlMatch) {
      if (!attachmentUrl) attachmentUrl = urlMatch[1].trim();
      cleanContent = cleanContent.replace(/🖼️ Berkas Data:\s*.+/g, "").trim();
      shouldUpdate = true;
    }
    const attMatch = cleanContent.match(/📎 Lampiran Bukti:\s*(.+)/);
    if (attMatch) {
      if (!attachmentName) attachmentName = attMatch[1].trim();
      cleanContent = cleanContent.replace(/📎 Lampiran Bukti:\s*.+/g, "").trim();
      shouldUpdate = true;
    }
    const locMatch = cleanContent.match(/📍 Lokasi Kejadian:\s*(.+)/);
    if (locMatch) {
      if (!location) location = locMatch[1].trim();
      cleanContent = cleanContent.replace(/📍 Lokasi Kejadian:\s*.+/g, "").trim();
      shouldUpdate = true;
    }

    // 3. Jika attachmentUrl masih berupa data:image Base64, konversi ke berkas fisik di server
    if (attachmentUrl && attachmentUrl.startsWith("data:")) {
      try {
        const matches = attachmentUrl.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
        if (matches && matches.length === 3) {
          const mimeType = matches[1];
          const base64Data = matches[2];
          const buffer = Buffer.from(base64Data, "base64");

          let ext = ".png";
          if (mimeType.includes("jpeg") || mimeType.includes("jpg")) ext = ".jpg";
          else if (mimeType.includes("webp")) ext = ".webp";
          else if (mimeType.includes("pdf")) ext = ".pdf";

          const randomHex = crypto.randomBytes(6).toString("hex");
          const fileName = `migrated-${report.ticketNumber}-${randomHex}${ext}`;
          const filePath = path.join(uploadDir, fileName);

          await fs.writeFile(filePath, buffer);
          attachmentUrl = `/uploads/reports/${fileName}`;
          shouldUpdate = true;
          console.log(`  ✅ Berkas Base64 tiket ${report.ticketNumber} berhasil dipindahkan ke file fisik: ${attachmentUrl}`);
        }
      } catch (err) {
        console.error(`  ⚠️ Gagal mengekstrak berkas base64 untuk tiket ${report.ticketNumber}:`, err);
      }
    }

    if (shouldUpdate) {
      await db.publicReport.update({
        where: { id: report.id },
        data: {
          content: cleanContent,
          targetUnit: targetUnit || undefined,
          location: location || undefined,
          attachmentName: attachmentName || undefined,
          attachmentUrl: attachmentUrl || undefined,
        },
      });
      migratedCount++;
    }
  }

  console.log(`\n🎉 Selesai! Sebanyak ${migratedCount} laporan berhasil dimigrasi dan dibersihkan dari Base64.`);
}

migrateLegacyReports()
  .catch((err) => {
    console.error("❌ Error saat migrasi:", err);
  })
  .finally(async () => {
    await db.$disconnect();
    process.exit(0);
  });
