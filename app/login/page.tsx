"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useRole } from "@/components/providers/RoleProvider";
import { loginUser as apiLoginUser, ssoLoginUrl } from "@/lib/api";
import { setToken } from "@/lib/auth-token";
import type { Role } from "@/types";

const PERAN_TO_ROLE: Record<string, Role> = {
  "Kepala UPA": "kepala-upa",
  "Operator": "operator",
  "Kepala Divisi": "kepala-divisi",
  "Staf": "staf",
};

const decodeBase64UrlJson = (value: string) => {
  const base64 = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), "=");
  return JSON.parse(window.atob(padded));
};

export default function LoginPage() {
  const router = useRouter();
  const { setUser } = useRole();
  const [loading, setLoading] = useState(false);
  const [showManual, setShowManual] = useState(false);
  const [nipInput, setNipInput] = useState("");
  const [passwordInput, setPasswordInput] = useState("");
  const [manualLoading, setManualLoading] = useState(false);
  const [manualError, setManualError] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const ssoError = params.get("sso_error");
    const ssoUser = params.get("sso_user");
    const ssoPending = params.get("sso_pending");

    if (ssoError) {
      alert(`Login SSO gagal: ${ssoError}`);
      window.history.replaceState(null, "", "/login");
      return;
    }

    if (ssoPending) {
      try {
        const pendingUser = decodeBase64UrlJson(ssoPending);
        alert(`Login SSO berhasil. Akun ${pendingUser.nama_lengkap ?? pendingUser.username_sso ?? "Anda"} sudah masuk daftar pending dan menunggu aktivasi Admin Akses.`);
      } catch {
        alert("Login SSO berhasil. Akun Anda menunggu aktivasi Admin Akses.");
      }
      window.history.replaceState(null, "", "/login");
      return;
    }

    if (!ssoUser) return;

    try {
      const user = decodeBase64UrlJson(ssoUser);
      const role = PERAN_TO_ROLE[user.peran] ?? "staf";
      if (user.token) setToken(user.token);
      setUser({
        id: user.uuid,
        nama: user.nama_lengkap ?? user.NIP ?? "Pengguna SSO",
        nip: user.NIP ?? "",
        jabatan: user.peran ?? "Staf",
        role,
        divisi: user.divisi?.nama_divisi ?? "-",
      });
      window.history.replaceState(null, "", "/login");
      router.push("/dashboard");
    } catch {
      alert("Login SSO gagal: data pengguna dari server tidak bisa dibaca.");
      window.history.replaceState(null, "", "/login");
    }
  }, [router, setUser]);

  // Login manual selalu diverifikasi backend (Hash::check + token) — tidak ada fallback
  // pencocokan password di client, karena itu bisa dibaca siapa saja lewat JS bundle.
  const loginByNip = async (nip: string, password: string) => {
    const response = await apiLoginUser(nip, password);
    const found = response.data;
    const role = PERAN_TO_ROLE[found.peran] ?? "staf";
    if (response.token) setToken(response.token);
    setUser({
      id: found.uuid,
      nama: found.nama_lengkap,
      nip: found.NIP,
      jabatan: found.peran,
      role,
      divisi: found.divisi?.nama_divisi ?? "-",
    });
    router.push("/dashboard");
  };

  const handleSSOLogin = async () => {
    setLoading(true);
    window.location.href = ssoLoginUrl();
  };

  const handleManualLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nipInput.trim() || !passwordInput.trim()) return;
    setManualLoading(true);
    setManualError("");
    try {
      await loginByNip(nipInput.trim(), passwordInput.trim());
    } catch (err: any) {
      setManualError(err.message ?? "NIP tidak ditemukan.");
    } finally {
      setManualLoading(false);
    }
  };

  return (
    <div className="min-h-screen grid grid-cols-1 md:grid-cols-2 bg-white" style={{ fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif" }}>

      {/* ── Panel kiri ── */}
      <div className="hidden md:flex flex-col justify-between px-[48px] py-[40px] bg-[#0B1E4B] relative overflow-hidden before:content-[''] before:absolute before:pointer-events-none before:top-[-120px] before:right-[-120px] before:w-[420px] before:h-[420px] before:rounded-full before:border-[64px] before:border-[rgba(198,168,75,0.08)] after:content-[''] after:absolute after:pointer-events-none after:bottom-[-80px] after:left-[-80px] after:w-[300px] after:h-[300px] after:rounded-full after:border-[40px] after:border-[rgba(255,255,255,0.04)]">
        <div className="absolute inset-0 pointer-events-none" style={{ backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.05) 1px, transparent 1px)", backgroundSize: "28px 28px" }} />

        <div className="relative z-[1] flex items-center gap-3">
          <div className="flex items-center gap-4 bg-[rgba(255,255,255,0.08)] border border-[rgba(255,255,255,0.12)] rounded-[14px] px-[20px] py-[14px] w-fit">
            <img src="/logo-upa.png" alt="UPA TIK" className="h-[52px] w-auto object-contain" />
          </div>
        </div>

        <div className="relative z-[1] flex-1 flex flex-col justify-center py-[40px]">
          <div className="inline-block text-[10px] font-bold tracking-[2px] uppercase text-[#C6A84B] bg-[rgba(198,168,75,0.12)] rounded-full border border-[rgba(198,168,75,0.30)] px-[14px] py-[5px] mb-[20px]">
            Universitas Lampung
          </div>
          <h1 className="text-[36px] font-bold tracking-[-1.5px] text-white leading-[1.1] mb-[14px]">SIMPROTIK</h1>
          <p className="text-[18px] font-semibold text-[rgba(255,255,255,0.90)] leading-[1.4] mb-[4px]">
            Sistem Informasi Manajemen Proyek &amp; Kinerja
          </p>
          <p className="text-[14px] text-[rgba(255,255,255,0.55)] leading-[1.7] max-w-[340px]">
            UPA Teknologi Informasi dan Komunikasi
          </p>
          <div className="w-[40px] h-[2px] bg-[#C6A84B] rounded-[2px] my-[20px]" />
          <div className="flex flex-col gap-[10px]">
            {[
              "Pengelolaan pekerjaan & proyek terpusat",
              "Surat tugas & dokumentasi digital",
              "Monitoring kinerja per divisi",
            ].map((text) => (
              <div key={text} className="flex items-center gap-[10px] text-[13px] text-[rgba(255,255,255,0.55)]">
                <span className="w-[5px] h-[5px] rounded-full bg-[#C6A84B] shrink-0" />
                <span>{text}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="relative z-[1] text-[11px] text-[rgba(255,255,255,0.30)]">
          Jl. Prof. Dr. Sumantri Brojonegoro No.1, Bandar Lampung
        </div>
      </div>

      {/* ── Panel kanan ── */}
      <div className="flex items-center justify-center p-[24px_16px] md:p-[40px_32px] bg-white relative">
        {/* Card */}
        <div className="w-full max-w-[400px] bg-white rounded-[20px] p-[28px_22px_22px] md:p-[40px_36px_32px] shadow-[0_3px_14px_rgba(15,23,42,0.09),0_1px_4px_rgba(11,30,75,0.04)] border border-[rgba(148,163,184,0.25)]">
          <div className="text-[10px] font-bold tracking-[1.5px] uppercase text-[#8A95A3] mb-[6px]">Portal Masuk</div>
          <h2 className="text-[22px] font-bold tracking-[-0.5px] text-[#0B1E4B] mb-[4px] leading-[1.2]">Masuk ke SIMPROTIK</h2>
          <p className="text-[13px] text-[#8A95A3] leading-[1.5] mb-[28px]">Gunakan akun SSO Universitas Lampung untuk mengakses sistem.</p>

          {/* SSO Button */}
          <button
            className="group relative w-full flex items-center gap-[14px] px-[18px] py-[14px] border-none rounded-[12px] cursor-pointer bg-[#0B1E4B] text-white shadow-[0_4px_14px_rgba(11,30,75,0.28)] transition-all overflow-hidden hover:enabled:-translate-y-px hover:enabled:shadow-[0_6px_20px_rgba(11,30,75,0.36)] disabled:opacity-[0.55] disabled:cursor-not-allowed after:content-[''] after:absolute after:inset-0 after:[background:linear-gradient(180deg,rgba(255,255,255,0.06)_0%,transparent_100%)] after:pointer-events-none"
            type="button"
            onClick={handleSSOLogin}
            disabled={loading}
          >
            {loading ? (
              <>
                <span className="w-[18px] h-[18px] border-[2.5px] border-[rgba(255,255,255,0.25)] border-t-white rounded-full animate-spin shrink-0" />
                <div className="flex-1 text-left">
                  <div className="text-[14px] font-bold leading-none mb-[3px]">Menghubungkan ke SSO…</div>
                  <div className="text-[11px] opacity-[0.62]">Mohon tunggu sebentar</div>
                </div>
              </>
            ) : (
              <>
                <div className="w-[36px] h-[36px] rounded-[9px] bg-[rgba(255,255,255,0.10)] flex items-center justify-center shrink-0 border border-[rgba(255,255,255,0.14)]">
                  <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                    <circle cx="9" cy="6.5" r="3" stroke="white" strokeWidth="1.5"/>
                    <path d="M3 16c0-3 2.7-5.5 6-5.5s6 2.5 6 5.5" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
                  </svg>
                </div>
                <div className="flex-1 text-left">
                  <div className="text-[14px] font-bold leading-none mb-[3px]">Masuk dengan SSO Unila</div>
                  <div className="text-[11px] opacity-[0.62]">sso.unila.ac.id · akun civitas academica</div>
                </div>
                <svg
                  className="opacity-[0.60] transition-[transform,opacity] group-hover:translate-x-[3px] group-hover:opacity-100"
                  width="16" height="16" viewBox="0 0 16 16" fill="none"
                >
                  <path d="M3.5 8h9M9 4.5l3.5 3.5-3.5 3.5" stroke="white" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </>
            )}
          </button>

          {/* Login manual fallback */}
          <div className="mt-[14px]">
            <button
              type="button"
              className="w-full text-[11.5px] text-[#8A95A3] bg-transparent border-none cursor-pointer py-[6px] transition-colors hover:text-[#0B1E4B]"
              onClick={() => { setShowManual(!showManual); setManualError(""); setNipInput(""); setPasswordInput(""); }}
            >
              {showManual ? "Tutup login manual" : "SSO dalam maintenance? Masuk manual"}
            </button>
            {showManual && (
              <form onSubmit={handleManualLogin} className="mt-[8px] flex flex-col gap-[8px]">
                <input
                  type="text"
                  placeholder="Masukkan NIP"
                  value={nipInput}
                  onChange={(e) => setNipInput(e.target.value)}
                  className="w-full px-[14px] py-[10px] rounded-[10px] border border-[#DDE3EF] text-[13px] text-[#0B1E4B] bg-[#F7F9FC] outline-none focus:border-[#0B1E4B] focus:shadow-[0_0_0_3px_rgba(11,30,75,0.08)] transition-all"
                />
                <input
                  type="password"
                  placeholder="Masukkan password"
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  className="w-full px-[14px] py-[10px] rounded-[10px] border border-[#DDE3EF] text-[13px] text-[#0B1E4B] bg-[#F7F9FC] outline-none focus:border-[#0B1E4B] focus:shadow-[0_0_0_3px_rgba(11,30,75,0.08)] transition-all"
                />
                {manualError && <p className="text-[11px] text-red-500 m-0">{manualError}</p>}
                <button
                  type="submit"
                  disabled={manualLoading || !nipInput.trim() || !passwordInput.trim()}
                  className="w-full py-[10px] rounded-[10px] bg-[#0B1E4B] text-white text-[13px] font-semibold border-none cursor-pointer transition-all hover:enabled:bg-[#0F2150] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {manualLoading ? "Memproses…" : "Masuk"}
                </button>
              </form>
            )}
          </div>

          <div className="mt-[16px]">
            <a href="/" className="w-full flex items-center justify-center gap-[6px] py-[9px] rounded-[10px] border border-[#DDE3EF] bg-[#F7F9FC] text-[12px] font-semibold text-[#475569] no-underline transition-all hover:bg-[#EEF5FF] hover:border-[#C9DEFF] hover:text-[#0B1E4B]">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M8.5 2.5 3.5 7l5 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
              Lihat Dashboard Publik
            </a>
          </div>

          <div className="mt-[14px] text-center text-[11px] text-[#B0BCCE]">
            <div>© 2025 UPA TIK Universitas Lampung</div>
          </div>
        </div>
      </div>
    </div>
  );
}
