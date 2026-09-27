import { db } from "../src/lib/db";

async function fixTargetUnits() {
  console.log("🔄 Memperbarui kolom targetUnit untuk seluruh laporan publik...");

  const reports = await db.publicReport.findMany();
  console.log(`📋 Ditemukan ${reports.length} laporan di database.`);

  let updatedCount = 0;

  for (const report of reports) {
    // Jika laporan sudah didisposisikan ke bidang tertentu, gunakan nama bidang tersebut
    // Jika belum didisposisikan, default ke "Tim Humas"
    const newTargetUnit = report.dispositionTo && report.dispositionTo.trim()
      ? report.dispositionTo.trim()
      : "Tim Humas";

    await db.publicReport.update({
      where: { id: report.id },
      data: {
        targetUnit: newTargetUnit,
      },
    });

    console.log(`  ✓ Tiket ${report.ticketNumber}: targetUnit -> "${newTargetUnit}" (Status: ${report.status})`);
    updatedCount++;
  }

  console.log(`\n🎉 Selesai! Sebanyak ${updatedCount} laporan berhasil diperbarui targetUnit-nya.`);
}

fixTargetUnits()
  .catch((err) => {
    console.error("❌ Gagal memperbarui targetUnit:", err);
  })
  .finally(async () => {
    await db.$disconnect();
    process.exit(0);
  });
