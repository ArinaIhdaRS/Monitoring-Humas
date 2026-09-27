import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    // Ambil data statistik riil murni dari database public_reports
    const [totalReports, completedReports, handledReports, completedList] = await Promise.all([
      db.publicReport.count(),
      db.publicReport.count({
        where: { status: "SELESAI" },
      }),
      db.publicReport.count({
        where: {
          status: {
            not: "BARU",
          },
        },
      }),
      db.publicReport.findMany({
        where: { status: "SELESAI" },
        select: {
          createdAt: true,
          respondedAt: true,
          updatedAt: true,
        },
      }),
    ]);

    // 1. Persentase Laporan Selesai Riil
    const completionRateVal =
      totalReports > 0 ? Math.round((completedReports / totalReports) * 1000) / 10 : 0;
    const completionRate = `${completionRateVal}%`;

    // 2. Rata-rata SLA Respons / Penanganan Riil
    let averageSla = "-";
    if (completedList.length > 0) {
      let totalHours = 0;
      let validCount = 0;

      for (const rep of completedList) {
        const finishTime = rep.respondedAt
          ? new Date(rep.respondedAt).getTime()
          : new Date(rep.updatedAt).getTime();
        const startTime = new Date(rep.createdAt).getTime();
        const diffHours = (finishTime - startTime) / (1000 * 3600);

        if (diffHours >= 0) {
          totalHours += diffHours;
          validCount += 1;
        }
      }

      if (validCount > 0) {
        const avgHours = totalHours / validCount;
        if (avgHours < 1) {
          const minutes = Math.max(1, Math.round(avgHours * 60));
          averageSla = `${minutes} Menit`;
        } else if (avgHours < 24) {
          averageSla = `${Math.round(avgHours * 10) / 10} Jam`;
        } else {
          averageSla = `${Math.round((avgHours / 24) * 10) / 10} Hari`;
        }
      }
    } else if (totalReports > 0) {
      averageSla = "Dalam Proses";
    } else {
      averageSla = "-";
    }

    // 3. Indeks Akuntabilitas Riil (Rasio Laporan Ditindaklanjuti & Disposisi terhadap Laporan Masuk)
    const accountabilityVal =
      totalReports > 0
        ? Math.round((handledReports / totalReports) * 1000) / 10
        : 100;
    const satisfactionIndex = `${accountabilityVal}%`;

    return NextResponse.json({
      success: true,
      stats: {
        totalReports: totalReports.toLocaleString("id-ID"),
        completedReports: completedReports.toLocaleString("id-ID"),
        completionRate,
        averageSla,
        satisfactionIndex,
        activeChannels: "Portal, Medsos & Tatap Muka",
      },
    });
  } catch (error) {
    console.error("Gagal mengambil statistik publik:", error);
    // Fallback data jika database sedang lambat/terkendala
    return NextResponse.json({
      success: true,
      stats: {
        totalReports: "0",
        completedReports: "0",
        completionRate: "0%",
        averageSla: "-",
        satisfactionIndex: "100%",
        activeChannels: "Portal, Medsos & Tatap Muka",
      },
    });
  }
}
