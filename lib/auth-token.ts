const TOKEN_KEY = "simprotik-token";
const TOKEN_COOKIE = "simprotik_token";
const SESSION_COOKIE = "simprotik_session";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 7; // 7 hari

function setCookie(name: string, value: string, maxAge: number) {
  document.cookie = `${name}=${value}; path=/; max-age=${maxAge}; SameSite=Lax`;
}

function clearCookie(name: string) {
  document.cookie = `${name}=; path=/; max-age=0; SameSite=Lax`;
}

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}

// Dipakai begitu backend Sanctum sudah mengeluarkan token asli (login manual & SSO).
export function setToken(token: string) {
  if (typeof window === "undefined") return;
  localStorage.setItem(TOKEN_KEY, token);
  setCookie(TOKEN_COOKIE, token, COOKIE_MAX_AGE);
}

export function clearToken() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(TOKEN_KEY);
  clearCookie(TOKEN_COOKIE);
}

// Penanda "ada user login" untuk middleware.ts, sebelum backend mengeluarkan token asli.
// CATATAN: ini bukan kontrol keamanan sungguhan (bisa dipalsukan lewat DevTools) —
// baru aman setelah backend Sanctum aktif dan middleware.ts memakai setToken/getToken di atas.
export function markSessionCookie() {
  if (typeof window === "undefined") return;
  setCookie(SESSION_COOKIE, "1", COOKIE_MAX_AGE);
}

export function clearSessionCookie() {
  if (typeof window === "undefined") return;
  clearCookie(SESSION_COOKIE);
}
