"use client";

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html>
      <body style={{ margin: 0, fontFamily: "system-ui, -apple-system, sans-serif", backgroundColor: "#f8fafc" }}>
        <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}>
          <div style={{ maxWidth: "450px", width: "100%", background: "#fff", borderRadius: "16px", padding: "32px", textAlign: "center", boxShadow: "0 10px 25px rgba(0,0,0,0.05)", border: "1px solid #e2e8f0" }}>
            <div style={{ fontSize: "36px", marginBottom: "12px" }}>⚠️</div>
            <h2 style={{ fontSize: "20px", fontWeight: "bold", color: "#0f172a", marginBottom: "8px" }}>Terjadi Kendala Sistem</h2>
            <p style={{ color: "#64748b", fontSize: "14px", marginBottom: "24px", lineHeight: "1.5" }}>
              Sistem mendeteksi kendala pada koneksi server. Silakan klik tombol di bawah untuk mencoba kembali.
            </p>
            <button
              onClick={() => reset()}
              style={{ width: "100%", padding: "12px", background: "#059669", color: "#fff", border: "none", borderRadius: "12px", fontWeight: "600", cursor: "pointer", fontSize: "14px" }}
            >
              Coba Lagi
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
