import type { Metadata } from "next";
import "./globals.css";
import Providers from "@/components/providers";

export const metadata: Metadata = {
  title: "Sistem Monitoring & Layanan Pengaduan Humas",
  description: "Platform Monitoring Media, Publikasi, dan Layanan Aspirasi Masyarakat Terpadu",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id">
      <body className="antialiased min-h-screen bg-slate-50 text-slate-900 selection:bg-emerald-100 selection:text-emerald-900">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
