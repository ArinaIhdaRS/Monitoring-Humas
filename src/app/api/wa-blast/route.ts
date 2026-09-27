import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createRateLimiter, getClientIp } from "@/lib/rate-limit";
import { isSafeOutboundUrl } from "@/lib/security";

export const dynamic = "force-dynamic";

const waRateLimiter = createRateLimiter({ interval: 60000 }); // 1 menit

// GET: Mengambil data template, pemetaan kontak bidang, log pengiriman, dan status gateway WA
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: "Akses ditolak. Silakan login terlebih dahulu." },
        { status: 401 }
      );
    }

    const role = session.user.role;
    if (role !== "SUPERADMIN" && role !== "ADMIN") {
      return NextResponse.json(
        { error: "Akses ditolak. Hanya Administrator yang dapat melihat konfigurasi WhatsApp." },
        { status: 403 }
      );
    }

    const [templates, contacts, logs, settings] = await Promise.all([
      db.waTemplate.findMany({ orderBy: { code: "asc" } }),
      db.departmentContact.findMany({ orderBy: { name: "asc" } }),
      db.waBlastLog.findMany({
        take: 50,
        orderBy: { createdAt: "desc" },
      }),
      db.systemSetting.findUnique({
        where: { id: "default" },
        select: {
          waGatewayEnabled: true,
          waGatewayProvider: true,
          waGatewayUrl: true,
          waApiKey: role === "SUPERADMIN",
          waSenderNumber: true,
          waAppKey: role === "SUPERADMIN",
          waAuthKey: role === "SUPERADMIN",
        },
      }),
    ]);

    return NextResponse.json({
      templates,
      contacts,
      logs,
      settings: settings || {
        waGatewayEnabled: true,
        waGatewayProvider: "SAUNG_WA",
        waGatewayUrl: "https://app.saungwa.com/api/create-message",
        waApiKey: "",
        waSenderNumber: "",
        waAppKey: "",
        waAuthKey: "",
      },
    });
  } catch (error) {
    console.error("Error fetching WA Blast data:", error);
    return NextResponse.json(
      { error: "Gagal mengambil konfigurasi WA Blast" },
      { status: 500 }
    );
  }
}

// POST: Memicu pengiriman pesan WA Blast (misal saat Disposisi Bidang)
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: "Akses ditolak. Silakan login terlebih dahulu." },
        { status: 401 }
      );
    }

    const role = session.user.role;
    if (role !== "SUPERADMIN" && role !== "ADMIN" && role !== "MANAJEMEN" && role !== "HUMAS") {
      return NextResponse.json(
        { error: "Akses ditolak. Anda tidak memiliki wewenang untuk mengirim WA Blast." },
        { status: 403 }
      );
    }

    // Rate limiting: max 20 permintaan per menit per IP/User
    const clientIp = getClientIp(req);
    const rateCheck = waRateLimiter.check(20, `${clientIp}_${session.user.id}`);
    if (!rateCheck.success) {
      return NextResponse.json(
        { error: `Terlalu banyak permintaan pengiriman WA Blast. Silakan tunggu ${rateCheck.reset} detik.` },
        { status: 429 }
      );
    }

    const body = await req.json();
    const {
      ticketNumber,
      department,
      recipientPhone,
      recipientPhones,
      recipientName,
      message,
      templateCode,
      reportTitle,
      urgency,
      category,
      categoryLabel,
      note,
    } = body;

    // Kumpulkan daftar nomor telepon penerima (bisa berupa array atau dipisah tanda koma/titik koma/baris baru)
    let phoneList: string[] = [];
    if (Array.isArray(recipientPhones) && recipientPhones.length > 0) {
      phoneList = recipientPhones.map((p: any) => String(p).trim()).filter(Boolean);
    } else if (recipientPhone) {
      phoneList = String(recipientPhone)
        .split(/[,;\n]+/)
        .map((p) => p.trim())
        .filter(Boolean);
    }

    if (phoneList.length === 0) {
      return NextResponse.json(
        { error: "Nomor WhatsApp penerima wajib diisi" },
        { status: 400 }
      );
    }

    // Ambil setting WA Gateway
    const settings = await db.systemSetting.findUnique({
      where: { id: "default" },
    });

    // Susun pesan jika templateCode disediakan atau gunakan message yang dikirim
    let finalMessage = message;
    if (!finalMessage && templateCode) {
      const tpl = await db.waTemplate.findUnique({ where: { code: templateCode } });
      if (tpl) {
        const origin = req.nextUrl.origin || "http://localhost:3000";
        finalMessage = tpl.content
          .replace(/{NOMOR_TIKET}/g, ticketNumber || "HM-TIKET")
          .replace(/{JUDUL}/g, reportTitle || "Laporan Pengaduan Masyarakat")
          .replace(/{KATEGORI}/g, categoryLabel || category || "Pengaduan Umum")
          .replace(/{BIDANG}/g, department || "Bidang Terkait")
          .replace(/{URGENSI}/g, urgency || "SEDANG")
          .replace(/{CATATAN_DISPOSISI}/g, note || "Mohon ditindaklanjuti.")
          .replace(/{TANGGAL}/g, new Date().toLocaleString("id-ID"))
          .replace(/{LINK_PORTAL}/g, `${origin}/dashboard`);
      }
    }

    if (!finalMessage) {
      finalMessage = `[HumasMonitor] Notifikasi Pengaduan ${ticketNumber || ""}: ${reportTitle || ""}. Mohon segera ditindaklanjuti.`;
    }

    const provider = settings?.waGatewayProvider || "SAUNG_WA";
    const sendResults: any[] = [];
    let successCount = 0;
    let failCount = 0;

    for (const rawPhone of phoneList) {
      // Normalisasi nomor telepon (Contoh: 0812 -> 62812 atau tetap standar WA)
      let formattedPhone = rawPhone.replace(/[^0-9]/g, "");
      if (formattedPhone.startsWith("0")) {
        formattedPhone = "62" + formattedPhone.slice(1);
      }
      if (!formattedPhone) continue;

      let gatewayStatus = "TERKIRIM";
      let gatewayResponse: any = {};

      // Eksekusi pengiriman nyata jika terkonfigurasi dengan provider gateway
      if (settings?.waGatewayEnabled && provider !== "SIMULASI_GATEWAY") {
        try {
          if (provider === "SAUNG_WA") {
            const endpoint = settings.waGatewayUrl || "https://app.saungwa.com/api/create-message";
            const appkey =
              settings.waAppKey || settings.waSenderNumber || process.env.SAUNGWA_APPKEY || "";
            const authkey =
              settings.waAuthKey || settings.waApiKey || process.env.SAUNGWA_AUTHKEY || "";

            if (!appkey || !authkey) {
              gatewayStatus = "GAGAL";
              gatewayResponse = {
                status: false,
                message:
                  "Kredensial Saung WA belum lengkap. Harap masukkan App Key dan Auth Key di menu Setting WA Blast Superadmin.",
              };
            } else {
              const formData = new FormData();
              formData.append("appkey", appkey.trim());
              formData.append("authkey", authkey.trim());
              formData.append("to", formattedPhone);
              formData.append("message", finalMessage);
              formData.append("sandbox", "false");

              const res = await fetch(endpoint, {
                method: "POST",
                body: formData,
              });

              const rawText = await res.text();
              try {
                gatewayResponse = JSON.parse(rawText);
              } catch {
                gatewayResponse = { raw: rawText };
              }

              if (
                rawText.includes("Invalid Auth and AppKey") ||
                gatewayResponse?.error === "Invalid Auth and AppKey"
              ) {
                gatewayStatus = "GAGAL";
                gatewayResponse = {
                  error: "Invalid Auth and AppKey",
                  hint: "Kredensial Saung WA ditolak oleh server https://app.saungwa.com/. Periksa: 1. Status Device di app.saungwa.com harus CONNECTED. 2. App Key & Auth Key harus sesuai.",
                  raw: gatewayResponse,
                };
              } else if (
                !res.ok ||
                gatewayResponse?.status === false ||
                gatewayResponse?.status === "false" ||
                gatewayResponse?.error
              ) {
                gatewayStatus = "GAGAL";
              } else {
                gatewayStatus = "TERKIRIM";
              }
            }
          } else if (provider === "FONNTE") {
            const endpoint = settings.waGatewayUrl || "https://api.fonnte.com/send";
            const res = await fetch(endpoint, {
              method: "POST",
              headers: {
                Authorization: settings.waApiKey || "",
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                target: formattedPhone,
                message: finalMessage,
                countryCode: "62",
              }),
            });
            gatewayResponse = await res.json();
            if (!res.ok) {
              gatewayStatus = "GAGAL";
            }
          } else if (provider === "WABLAS") {
            const endpoint = settings.waGatewayUrl || "https://kudus.wablas.com/api/send-message";
            const res = await fetch(endpoint, {
              method: "POST",
              headers: {
                Authorization: settings.waApiKey || "",
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                phone: formattedPhone,
                message: finalMessage,
              }),
            });
            gatewayResponse = await res.json();
            if (!res.ok) {
              gatewayStatus = "GAGAL";
            }
          } else {
            // Custom HTTP Webhook
            const endpoint = settings.waGatewayUrl;
            if (endpoint) {
              if (!isSafeOutboundUrl(endpoint)) {
                throw new Error("URL Gateway eksternal diblokir karena mengarah ke alamat jaringan lokal/privat (SSRF Protection).");
              }
              const res = await fetch(endpoint, {
                method: "POST",
                headers: {
                  Authorization: settings.waApiKey ? `Bearer ${settings.waApiKey}` : "",
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  phone: formattedPhone,
                  message: finalMessage,
                  ticketNumber,
                  department,
                }),
              });
              gatewayResponse = await res.json();
            }
          }
        } catch (err: any) {
          console.error("Gagal mengirim WA Blast melalui API Gateway eksternal:", err);
          gatewayStatus = "GAGAL";
          gatewayResponse = { error: err?.message || "Koneksi gateway eksternal terputus" };
        }
      } else {
        // Simulasi Pengiriman Gateway Terpadu
        gatewayResponse = {
          status: true,
          message: "Pesan terverifikasi dan berhasil disalurkan ke gateway WhatsApp (Mode Simulasi)",
          deliveryId: `WA-MSG-${Date.now()}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`,
          simulated: true,
        };
      }

      if (gatewayStatus === "TERKIRIM") {
        successCount++;
      } else {
        failCount++;
      }

      // Catat ke log pengiriman
      const log = await db.waBlastLog.create({
        data: {
          ticketNumber: ticketNumber || null,
          department: department || null,
          recipientPhone: formattedPhone,
          recipientName: recipientName || null,
          message: finalMessage,
          status: gatewayStatus,
          gateway: provider,
          response: JSON.stringify(gatewayResponse),
        },
      });

      sendResults.push({
        phone: formattedPhone,
        status: gatewayStatus,
        logId: log.id,
      });
    }

    return NextResponse.json({
      success: successCount > 0,
      message:
        successCount > 0
          ? `Notifikasi WA Blast berhasil dikirim ke ${successCount} kontak${failCount > 0 ? ` (${failCount} gagal)` : ""}`
          : "Gagal mengirimkan notifikasi WA Blast ke gateway",
      recipientCount: phoneList.length,
      successCount,
      failCount,
      results: sendResults,
      finalMessage,
    });
  } catch (error) {
    console.error("Error triggering WA Blast:", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan saat mengeksekusi WA Blast" },
      { status: 500 }
    );
  }
}

// PUT: Memperbarui Pengaturan WA Blast di Superadmin (Template, Kontak Bidang, Gateway)
export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "SUPERADMIN") {
      return NextResponse.json(
        { error: "Akses ditolak. Hanya Superadmin yang dapat mengubah pengaturan WA Blast." },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { action } = body;

    // 1. Perbarui Template WA
    if (action === "UPDATE_TEMPLATE") {
      const { id, code, title, content } = body;
      if (!id && !code) {
        return NextResponse.json({ error: "Kode template wajib diisi" }, { status: 400 });
      }

      const tpl = await db.waTemplate.upsert({
        where: { code: code.trim() },
        update: {
          title: title?.trim() || undefined,
          content: content?.trim() || undefined,
        },
        create: {
          code: code.trim(),
          title: title?.trim() || "Template Pesan",
          content: content?.trim() || "",
        },
      });

      return NextResponse.json({ message: "Template WA Blast berhasil disimpan", template: tpl });
    }

    // 2. Perbarui Kontak Bidang (Tambah / Edit)
    if (action === "UPSERT_CONTACT") {
      const { id, name, contactName, phone, email, description } = body;
      if (!name || !phone) {
        return NextResponse.json({ error: "Nama bidang dan nomor WA wajib diisi" }, { status: 400 });
      }

      if (id) {
        const updated = await db.departmentContact.update({
          where: { id },
          data: {
            name: name.trim(),
            contactName: contactName?.trim() || null,
            phone: phone.trim(),
            email: email?.trim() || null,
            description: description?.trim() || null,
          },
        });
        return NextResponse.json({ message: "Kontak bidang berhasil diperbarui", contact: updated });
      } else {
        const created = await db.departmentContact.create({
          data: {
            name: name.trim(),
            contactName: contactName?.trim() || null,
            phone: phone.trim(),
            email: email?.trim() || null,
            description: description?.trim() || null,
          },
        });
        return NextResponse.json({ message: "Kontak bidang baru berhasil ditambahkan", contact: created });
      }
    }

    // 3. Hapus Kontak Bidang
    if (action === "DELETE_CONTACT") {
      const { id } = body;
      if (!id) return NextResponse.json({ error: "ID kontak bidang wajib diisi" }, { status: 400 });
      await db.departmentContact.delete({ where: { id } });
      return NextResponse.json({ message: "Kontak bidang berhasil dihapus" });
    }

    // 4. Perbarui Konfigurasi Gateway WA
    if (action === "UPDATE_GATEWAY") {
      const {
        waGatewayEnabled,
        waGatewayProvider,
        waGatewayUrl,
        waApiKey,
        waSenderNumber,
        waAppKey,
        waAuthKey,
      } = body;

      if (waGatewayUrl && !isSafeOutboundUrl(waGatewayUrl)) {
        return NextResponse.json(
          { error: "URL Gateway tidak valid atau mengarah ke alamat jaringan lokal/privat terlarang." },
          { status: 400 }
        );
      }

      const updated = await db.systemSetting.upsert({
        where: { id: "default" },
        update: {
          waGatewayEnabled: typeof waGatewayEnabled === "boolean" ? waGatewayEnabled : undefined,
          waGatewayProvider: waGatewayProvider || undefined,
          waGatewayUrl: waGatewayUrl || undefined,
          waApiKey: waApiKey !== undefined ? waApiKey : undefined,
          waSenderNumber: waSenderNumber !== undefined ? waSenderNumber : undefined,
          waAppKey: waAppKey !== undefined ? waAppKey : undefined,
          waAuthKey: waAuthKey !== undefined ? waAuthKey : undefined,
        },
        create: {
          id: "default",
          waGatewayEnabled: waGatewayEnabled ?? true,
          waGatewayProvider: waGatewayProvider || "SAUNG_WA",
          waGatewayUrl: waGatewayUrl || "https://app.saungwa.com/api/create-message",
          waApiKey: waApiKey || "",
          waSenderNumber: waSenderNumber || "",
          waAppKey: waAppKey || "",
          waAuthKey: waAuthKey || "",
        },
      });

      return NextResponse.json({
        message: "Konfigurasi Gateway WA Blast berhasil disimpan",
        settings: updated,
      });
    }

    return NextResponse.json({ error: "Aksi tidak dikenali" }, { status: 400 });
  } catch (error) {
    console.error("Error updating WA Blast settings:", error);
    return NextResponse.json(
      { error: "Gagal memperbarui pengaturan WA Blast" },
      { status: 500 }
    );
  }
}
