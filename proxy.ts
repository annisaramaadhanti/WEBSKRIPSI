import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Halaman yang boleh diakses tanpa login (dashboard publik "/", halaman login, aset statis).
const PUBLIC_PATHS = ["/", "/login"];

// CATATAN KEAMANAN: cookie "simprotik_session" cuma penanda "ada user login di app",
// diset dari client (lihat lib/auth-token.ts) — bukan token yang diverifikasi server,
// jadi bisa dipalsukan lewat DevTools. Ini baru penjagaan level route (mencegah orang
// buka /dashboard dkk langsung lewat URL tanpa login sama sekali). Baru benar-benar aman
// setelah backend Sanctum aktif dan middleware ini diganti memvalidasi token asli
// (simprotik_token) ke backend, sekaligus role-check per endpoint dikunci di server.
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (PUBLIC_PATHS.includes(pathname)) {
    return NextResponse.next();
  }

  const hasSession = request.cookies.get("simprotik_session")?.value === "1";
  if (!hasSession) {
    const loginUrl = new URL("/login", request.url);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|logo-upa.png).*)"],
};
