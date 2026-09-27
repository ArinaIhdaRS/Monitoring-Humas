import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const pathname = req.nextUrl.pathname;
    const role = (token?.role as string)?.toUpperCase();

    // Rute Manajemen: Hanya untuk MANAJEMEN, ADMIN, SUPERADMIN
    if (
      pathname.startsWith("/manajemen") &&
      role !== "MANAJEMEN" &&
      role !== "ADMIN" &&
      role !== "SUPERADMIN"
    ) {
      return NextResponse.redirect(new URL("/login", req.url));
    }

    // Rute Teknisi: Hanya untuk TEKNISI, ADMIN, SUPERADMIN
    if (
      pathname.startsWith("/teknisi") &&
      role !== "TEKNISI" &&
      role !== "ADMIN" &&
      role !== "SUPERADMIN"
    ) {
      return NextResponse.redirect(new URL("/login", req.url));
    }

    // Rute Dashboard Humas & Superadmin: Hanya untuk ADMIN, SUPERADMIN, HUMAS
    if (
      pathname.startsWith("/dashboard") &&
      role !== "ADMIN" &&
      role !== "SUPERADMIN" &&
      role !== "HUMAS"
    ) {
      if (role === "STAFF") return NextResponse.redirect(new URL("/karyawan", req.url));
      if (role === "TEKNISI") return NextResponse.redirect(new URL("/teknisi", req.url));
      if (role === "MANAJEMEN") return NextResponse.redirect(new URL("/manajemen", req.url));
      return NextResponse.redirect(new URL("/login", req.url));
    }
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
    pages: {
      signIn: "/login",
    },
  }
);

// Lindungi rute internal
export const config = {
  matcher: [
    "/dashboard/:path*",
    "/manajemen/:path*",
    "/teknisi/:path*",
    "/karyawan/:path*",
  ],
};
