"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useRole } from "@/components/providers/RoleProvider";
import { USERS } from "@/lib/data";
import { getMasterPengguna } from "@/lib/api";
import type { Role } from "@/types";

const PERAN_TO_ROLE: Record<string, Role> = {
  "Kepala UPA": "kepala-upa",
  "Operator": "operator",
  "Kepala Divisi": "kepala-divisi",
  "Staf": "staf",
};

const AV_CLS: Record<string, string> = {
  upa:   "bg-[#EEF5FF] text-[#0B1E4B]",
  kadiv: "bg-[#F0EAFB] text-[#5A28AA]",
  op:    "bg-[#FEF9E7] text-[#8A6010]",
  staf:  "bg-[#E8F5EE] text-[#145D30]",
};

export default function LoginPage() {
  const router = useRouter();
  const { setUser } = useRole();
  const [loading, setLoading] = useState(false);
  const [showDummy, setShowDummy] = useState(false);
  const [showManual, setShowManual] = useState(false);
  const [nipInput, setNipInput] = useState("");
  const [manualLoading, setManualLoading] = useState(false);
  const [manualError, setManualError] = useState("");

  const loginByNip = async (nip: string) => {
    try {
      const res: any = await getMasterPengguna();
      const list: any[] = res?.data ?? [];
      const found = list.find((u: any) => u.NIP === nip);
      if (found) {
        const role = PERAN_TO_ROLE[found.peran] ?? "staf";
        setUser({ id: found.uuid, nama: found.nama_lengkap, nip: found.NIP, jabatan: found.peran, email: found.email, password: "", role, divisi: found.divisi?.nama_divisi ?? "-" });
        router.push("/dashboard");
        return;
      }
    } catch {}
    // Fallback ke data lokal kalau API mati
    const local = USERS.find((u) => u.nip === nip);
    if (!local) throw new Error("User tidak ditemukan.");
    setUser(local);
    router.push("/dashboard");
  };

  const handleSSOLogin = async () => {
    setLoading(true);
    try {
      const kepalaUpa = USERS.find((u) => u.role === "kepala-upa");
      if (kepalaUpa) await loginByNip(kepalaUpa.nip);
    } catch (e: any) {
      alert("Login gagal: " + e.message);
    } finally {
      setLoading(false);
    }
  };

  const quickLogin = async (nip: string) => {
    try {
      await loginByNip(nip);
    } catch (e: any) {
      alert("Login gagal: " + e.message);
    }
  };

  const handleManualLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nipInput.trim()) return;
    setManualLoading(true);
    setManualError("");
    try {
      await loginByNip(nipInput.trim());
    } catch (e: any) {
      setManualError(e.message ?? "NIP tidak ditemukan.");
    } finally {
      setManualLoading(false);
    }
  };

  return (
    <div className="min-h-screen grid grid-cols-1 md:grid-cols-2 bg-white" style={{ fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif" }}>

      {/* ── Panel kiri ── */}
      <div className="hidden md:flex flex-col justify-between px-[48px] py-[40px] bg-[#0B1E4B] relative overflow-hidden before:content-[''] before:absolute before:pointer-events-none before:top-[-120px] before:right-[-120px] before:w-[420px] before:h-[420px] before:rounded-full before:border-[64px] before:border-[rgba(198,168,75,0.08)] after:content-[''] after:absolute after:pointer-events-none after:bottom-[-80px] after:left-[-80px] after:w-[300px] after:h-[300px] after:rounded-full after:border-[40px] after:border-[rgba(255,255,255,0.04)]">

        {/* Dot pattern */}
        <div className="absolute inset-0 pointer-events-none" style={{ backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.05) 1px, transparent 1px)", backgroundSize: "28px 28px" }} />

        {/* Logo row */}
        <div className="relative z-[1] flex items-center gap-3">
          <div className="flex items-center gap-4 bg-[rgba(255,255,255,0.08)] border border-[rgba(255,255,255,0.12)] rounded-[14px] px-[20px] py-[14px] w-fit">
            <img src="/logo-upa.png" alt="UPA TIK" className="h-[52px] w-auto object-contain" />
          </div>
        </div>

        {/* Center content */}
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

        {/* Bottom text */}
        <div className="relative z-[1] text-[11px] text-[rgba(255,255,255,0.30)]">
          Jl. Prof. Dr. Sumantri Brojonegoro No.1, Bandar Lampung
        </div>
      </div>

      {/* ── Panel kanan ── */}
      <div className="flex items-center justify-center p-[24px_16px] md:p-[40px_32px] bg-white relative">

        {/* Tombol kembali ke dashboard publik */}
        <button
          type="button"
          className="group absolute top-[24px] right-[28px] inline-flex items-center gap-[6px] px-[20px] py-[8px] rounded-lg bg-[#0B1E4B] text-white text-[13px] font-semibold border-none cursor-pointer shadow-[0_2px_8px_rgba(11,30,75,0.22)] transition-all hover:bg-[#0F2150] hover:-translate-y-px"
          onClick={() => router.push("/")}
        >
          <svg className="transition-transform group-hover:-translate-x-[3px]" width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M11.5 7h-9M6 3.5L2.5 7L6 10.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Kembali ke Dashboard
        </button>

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
              onClick={() => { setShowManual(!showManual); setManualError(""); setNipInput(""); }}
            >
              {showManual ? "↑ Tutup login manual" : "SSO dalam maintenance? Masuk dengan NIP"}
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
                {manualError && <p className="text-[11px] text-red-500 m-0">{manualError}</p>}
                <button
                  type="submit"
                  disabled={manualLoading || !nipInput.trim()}
                  className="w-full py-[10px] rounded-[10px] bg-[#0B1E4B] text-white text-[13px] font-semibold border-none cursor-pointer transition-all hover:enabled:bg-[#0F2150] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {manualLoading ? "Memproses…" : "Masuk"}
                </button>
              </form>
            )}
          </div>

          {/* Gold accent bar */}
          <div className="h-[3px] bg-[#C6A84B] rounded-full my-[20px] w-[48px]" />

          {/* Note */}
          <div className="flex items-start gap-[8px] mt-[14px] px-[13px] py-[10px] rounded-[9px] bg-[#EEF5FF] border border-[#C9DEFF]">
            <svg width="13" height="13" viewBox="0 0 13 13" fill="none" className="shrink-0 mt-[1px] text-[#0B1E4B]">
              <circle cx="6.5" cy="6.5" r="5.5" stroke="currentColor" strokeWidth="1.3"/>
              <path d="M6.5 5.5v4M6.5 4v.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
            </svg>
            <p className="m-0 text-[11.5px] text-[#0B1E4B] leading-[1.55] font-medium">Gunakan email dan password iAIK / SIAKADCLOUD untuk masuk ke sistem ini.</p>
          </div>

          {/* Footer */}
          <div className="mt-[24px] text-center text-[11px] text-[#B0BCCE]">
            <div>© 2025 UPA TIK Universitas Lampung</div>
            <button
              className="bg-transparent border-none cursor-pointer text-[10px] text-[#D4DCEC] font-medium transition-colors px-[6px] py-[3px] rounded-[4px] inline-block mt-[6px] hover:text-[#8A95A3]"
              type="button"
              onClick={() => setShowDummy(!showDummy)}
            >
              {showDummy ? "tutup akses demo" : "akses demo"}
            </button>
          </div>
        </div>
      </div>

      {/* ── Dummy login panel ── */}
      {showDummy && (
        <div className="fixed bottom-[20px] right-[20px] z-50 bg-white border border-[#DDE3EF] rounded-[14px] w-[292px] max-h-[70vh] flex flex-col shadow-[0_8px_28px_rgba(11,30,75,0.14)] overflow-hidden [animation:slideUp_0.18s_ease]">
          <div className="flex items-center justify-between px-[14px] pt-[12px] pb-[10px] border-b border-[#F3F5F9] shrink-0">
            <span className="text-[10px] font-bold text-[#8A95A3] tracking-[1px] uppercase">Demo Login</span>
            <button
              className="bg-transparent border-none cursor-pointer text-[#B0BCCE] text-[16px] leading-none px-[4px] py-[2px] rounded-[4px] transition-colors hover:text-[#4A5568] hover:bg-[#F3F5F9]"
              type="button"
              onClick={() => setShowDummy(false)}
            >×</button>
          </div>
          <div className="overflow-y-auto flex-1 p-[10px] flex flex-col gap-[8px] [&::-webkit-scrollbar]:w-[3px] [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-[#DDE3EF] [&::-webkit-scrollbar-thumb]:rounded-[3px]">
            {(["kepala-upa", "operator", "kepala-divisi", "staf"] as const).map((role) => {
              const group = USERS.filter((u) => u.role === role);
              if (!group.length) return null;
              const groupLabel: Record<string, string> = {
                "kepala-upa": "Kepala UPA", "operator": "Operator",
                "kepala-divisi": "Kepala Divisi", "staf": "Staf",
              };
              const avKey: Record<string, string> = {
                "kepala-upa": "upa", "operator": "op", "kepala-divisi": "kadiv", "staf": "staf",
              };
              return (
                <div key={role}>
                  <div className="text-[9px] font-bold tracking-[1px] uppercase text-[#B0BCCE] px-[4px] pt-[4px] pb-[2px]">
                    {groupLabel[role]}
                  </div>
                  <div className="flex flex-col gap-[4px]">
                    {group.map((u) => (
                      <button
                        key={u.id}
                        className="w-full flex items-center gap-[9px] px-[10px] py-[8px] border border-[#F3F5F9] rounded-[9px] bg-[#F7F9FC] cursor-pointer transition-all text-left hover:bg-[#EEF5FF] hover:border-[#C9DEFF]"
                        type="button"
                        onClick={() => quickLogin(u.nip)}
                      >
                        <div className={`w-[28px] h-[28px] rounded-[7px] text-[11px] font-extrabold flex items-center justify-center shrink-0 ${AV_CLS[avKey[role]]}`}>
                          {u.nama.charAt(0)}
                        </div>
                        <div>
                          <div className="text-[11px] font-bold text-[#0B1E4B] leading-[1.3]">{u.nama}</div>
                          <div className="text-[10px] text-[#B0BCCE] mt-[1px]">{u.divisi !== "-" ? u.divisi : groupLabel[role]}</div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
