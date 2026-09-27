"use client";

import React, { useState, useEffect } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Lock, Mail, User, AlertCircle, ArrowLeft, Loader2, ShieldCheck } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    document.title = "Masuk Single Sign-On - HumasMonitor";
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const res = await signIn("credentials", {
        email: email.trim(),
        password,
        redirect: false,
      });

      if (res?.error) {
        setError(res.error || "Username atau password salah.");
      } else if (res?.ok) {
        const params = new URLSearchParams(window.location.search);
        const callback = params.get("callbackUrl");
        if (callback && callback.startsWith("/") && !callback.startsWith("//")) {
          router.push(callback);
          router.refresh();
          return;
        }

        try {
          const sessionRes = await fetch("/api/auth/session");
          const sessionData = await sessionRes.json();
          const role = sessionData?.user?.role;

          if (role === "MANAJEMEN") {
            router.push("/manajemen");
          } else if (role === "TEKNISI") {
            router.push("/teknisi");
          } else if (role === "STAFF") {
            router.push("/karyawan");
          } else {
            router.push("/dashboard");
          }
        } catch {
          router.push("/dashboard");
        }
        router.refresh();
      }
    } catch (err) {
      setError("Terjadi kesalahan pada sistem. Silakan coba lagi.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50/50 via-slate-50 to-emerald-50/30 flex flex-col justify-center py-10 sm:px-6 lg:px-8">
      <title>Masuk Single Sign-On - HumasMonitor</title>
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <Link
          href="/"
          className="inline-flex items-center text-xs font-semibold text-emerald-700 hover:text-emerald-900 mb-6 transition"
        >
          <ArrowLeft className="w-3.5 h-3.5 mr-1" />
          Kembali ke Beranda
        </Link>

        <div className="flex items-center justify-center space-x-3 mb-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/LOGO DKH.png"
            alt="Logo Humas"
            className="w-12 h-12 object-contain rounded-xl shadow-md border border-emerald-100 bg-white p-1"
          />
          <div>
            <span className="text-2xl font-black text-emerald-950 tracking-tight">HumasMonitor</span>
          </div>
        </div>

        <h2 className="text-center text-xl font-bold text-slate-900 tracking-tight">
          Single Sign-On
        </h2>
        {/* <p className="mt-1 text-center text-xs text-slate-600">
          Superadmin • Admin Humas • Manajemen • Tim Teknisi
        </p> */}
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <div className="bg-white py-8 px-6 shadow-xl shadow-emerald-900/5 rounded-2xl border border-emerald-100 sm:px-8">
          {error && (
            <div className="mb-5 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Username / Email Kedinasan
              </label>
              <div className="relative">
                <User className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                <input
                  id="email"
                  name="email"
                  type="text"
                  autoComplete="username"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Masukkan username atau email"
                  className="block w-full pl-9 pr-3 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white placeholder-slate-400"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="block w-full pl-9 pr-3 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white placeholder-slate-400"
                />
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex justify-center items-center py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 transition disabled:opacity-60 shadow-emerald-600/20"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    Memverifikasi...
                  </>
                ) : (
                  "Login"
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
