"use client";

import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Dashboard / App runtime error:", error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 border border-slate-100 text-center">
        <div className="w-14 h-14 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center mx-auto mb-4 font-bold text-2xl">
          ⚠️
        </div>
        <h2 className="text-xl font-bold text-slate-900 mb-2">Terjadi Gangguan Sementara</h2>
        <p className="text-slate-600 text-sm mb-6">
          Sistem sedang mengalami kendala pemrosesan data atau koneksi. Silakan muat ulang halaman.
        </p>
        <button
          onClick={() => reset()}
          className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-semibold text-sm transition shadow-sm"
        >
          Muat Ulang Halaman
        </button>
      </div>
    </div>
  );
}
