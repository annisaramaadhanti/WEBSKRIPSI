import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Halaman yang boleh diakses tanpa login (dashboard publik "/", halaman login, aset statis).
const PUBLIC_PATHS = ["/", "/login"];

// Role yang TIDAK boleh membuka path dengan prefix ini (selain itu, semua role login boleh).
// Samakan dengan pengecekan client-side di masing-masing page.tsx (jangan sampai beda aturan).
const ROLE_BLOCKED_PREFIXES: { prefix: string; blockedRoles: string[] }[] = [
  { prefix: "/tinjauan-kinerja", blockedRoles: ["staf"] }, // lihat app/(app)/tinjauan-kinerja/page.tsx:124
];

// CATATAN KEAMANAN: cookie "simprotik_session"/"simprotik_role"/"simprotik_admin" cuma
// penanda yang diset dari client (lihat lib/auth-token.ts) — bukan token yang diverifikasi
// server, jadi bisa dipalsukan lewat DevTools. Ini penjagaan level route (mencegah navigasi
// biasa/ketik URL nyasar ke halaman yang bukan haknya), BUKAN kontrol keamanan sungguhan.
// Baru benar-benar aman setelah backend Sanctum aktif dan setiap endpoint mengunci akses
// berdasarkan token asli + role dari database, bukan cookie seperti ini.
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (PUBLIC_PATHS.includes(pathname)) {
    return NextResponse.next();
  }

  const hasSession = request.cookies.get("simprotik_session")?.value === "1";
  if (!hasSession) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  const dashboardUrl = new URL("/dashboard", request.url);

  if (pathname.startsWith("/admin")) {
    const isAdmin = request.cookies.get("simprotik_admin")?.value === "1";
    if (!isAdmin) return NextResponse.redirect(dashboardUrl);
  }

  const role = request.cookies.get("simprotik_role")?.value ?? "";
  const blockedRule = ROLE_BLOCKED_PREFIXES.find((rule) => pathname.startsWith(rule.prefix));
  if (blockedRule && blockedRule.blockedRoles.includes(role)) {
    return NextResponse.redirect(dashboardUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|logo-upa.png).*)"],
};
