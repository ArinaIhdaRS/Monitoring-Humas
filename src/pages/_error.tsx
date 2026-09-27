import { NextPageContext } from "next";

interface ErrorProps {
  statusCode?: number;
}

function CustomError({ statusCode }: ErrorProps) {
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "system-ui, -apple-system, sans-serif",
        backgroundColor: "#f8fafc",
        color: "#0f172a",
        padding: "20px",
        textAlign: "center",
      }}
    >
      <div
        style={{
          maxWidth: "480px",
          width: "100%",
          background: "#ffffff",
          borderRadius: "16px",
          padding: "36px 24px",
          boxShadow: "0 10px 25px rgba(0,0,0,0.05)",
          border: "1px solid #e2e8f0",
        }}
      >
        <div style={{ fontSize: "36px", marginBottom: "12px" }}>⚠️</div>
        <h1 style={{ fontSize: "20px", fontWeight: "700", marginBottom: "8px" }}>
          {statusCode ? `Terjadi Gangguan (${statusCode})` : "Terjadi Gangguan pada Sistem"}
        </h1>
        <p style={{ fontSize: "14px", color: "#64748b", marginBottom: "24px", lineHeight: "1.5" }}>
          Sistem sedang memuat ulang data atau memperbarui koneksi. Silakan segarkan halaman browser Anda.
        </p>
        <button
          onClick={() => window.location.reload()}
          style={{
            padding: "10px 24px",
            backgroundColor: "#059669",
            color: "#ffffff",
            border: "none",
            borderRadius: "10px",
            fontSize: "14px",
            fontWeight: "600",
            cursor: "pointer",
          }}
        >
          Muat Ulang Halaman
        </button>
      </div>
    </div>
  );
}

CustomError.getInitialProps = ({ res, err }: NextPageContext) => {
  const statusCode = res ? res.statusCode : err ? err.statusCode : 404;
  return { statusCode };
};

export default CustomError;
