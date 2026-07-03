"use client";

import { useEffect, useRef, useState } from "react";
import { useRole } from "@/components/providers/RoleProvider";
import { getRoleLabel } from "@/lib/menu";
import { ssoLogoutUrl, logoutUser, ubahPassword } from "@/lib/api";
import { useRouter } from "next/navigation";

export default function Navbar() {
  const { role, user, logout } = useRole();
  const router = useRouter();

  const [dropOpen, setDropOpen] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [oldPw, setOldPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [pwError, setPwError] = useState("");
  const [pwSuccess, setPwSuccess] = useState(false);
  const [pwLoading, setPwLoading] = useState(false);

  const dropRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropRef.current && !dropRef.current.contains(e.target as Node)) {
        setDropOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleLogout = async () => {
    setDropOpen(false);
    await logoutUser();
    logout();
    const logoutUrl = ssoLogoutUrl();
    if (logoutUrl) {
      window.location.href = logoutUrl;
      return;
    }
    router.push("/login");
  };

  const openModal = () => {
    setDropOpen(false);
    setOldPw(""); setNewPw(""); setConfirmPw("");
    setPwError(""); setPwSuccess(false);
    setPwLoading(false);
    setShowModal(true);
  };

  const handleSimpan = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwError("");
    if (!user?.id) { setPwError("Data pengguna belum lengkap. Silakan login ulang."); return; }
    if (!oldPw || !newPw || !confirmPw) { setPwError("Semua field wajib diisi."); return; }
    if (newPw.length < 6) { setPwError("Password baru minimal 6 karakter."); return; }
    if (newPw !== confirmPw) { setPwError("Konfirmasi password tidak cocok."); return; }
    setPwLoading(true);
    try {
      await ubahPassword({
        id_pengguna: user.id,
        password_lama: oldPw,
        password_baru: newPw,
      });
      setPwSuccess(true);
      setTimeout(() => setShowModal(false), 1200);
    } catch (error) {
      setPwError(error instanceof Error ? error.message.replace(/^POST \/ubah-password gagal: \d+\s-\s?/, "") : "Password gagal diubah.");
    } finally {
      setPwLoading(false);
    }
  };

  const initials = user?.nama?.split(" ").slice(0, 2).map((w) => w[0]).join("") ?? "?";

  return (
    <>
      <header className="flex justify-between items-center sticky top-0 z-40 gap-4 px-9 py-4 border-b border-[#E8ECF4] bg-white/95 backdrop-blur-md shadow-[0_1px_0_#E8ECF4]">
        <div className="flex items-center gap-[12px]">
          <img src="/logo-upa.png" alt="UPA TIK" className="w-[92px] h-[92px] object-contain shrink-0" />
          <div className="w-[1px] h-[28px] bg-[#E8ECF4] shrink-0" />
          <div>
            <div className="font-bold text-[15px] text-[#0B1E4B]">SIMPROTIK</div>
            <div className="text-[11px] text-[#8A95A3] mt-0.5">Sistem Informasi Manajemen Proyek UPA TIK</div>
          </div>
        </div>

        {/* Akun dropdown */}
        <div className="relative" ref={dropRef}>
          <button
            type="button"
            onClick={() => setDropOpen(!dropOpen)}
            className="flex items-center gap-[10px] px-[12px] py-[7px] rounded-[10px] border border-[#E8ECF4] bg-white cursor-pointer transition-all hover:border-[#C9DEFF] hover:bg-[#F7F9FC]"
          >
            {/* Avatar */}
            <div className="w-[30px] h-[30px] rounded-full bg-[#0B1E4B] text-white text-[11px] font-bold flex items-center justify-center shrink-0">
              {initials}
            </div>
            <div className="text-left">
              <div className="text-[12px] font-semibold text-[#0B1E4B] leading-none">{user?.nama ?? "—"}</div>
              <div className="text-[10px] text-[#8A95A3] mt-[2px]">{getRoleLabel(role)}</div>
            </div>
            {/* Chevron */}
            <svg
              className={`ml-[2px] text-[#B0BCCE] transition-transform ${dropOpen ? "rotate-180" : ""}`}
              width="12" height="12" viewBox="0 0 12 12" fill="none"
            >
              <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>

          {/* Dropdown menu */}
          {dropOpen && (
            <div className="absolute right-0 top-[calc(100%+6px)] w-[180px] bg-white border border-[#E8ECF4] rounded-[10px] shadow-[0_8px_24px_rgba(11,30,75,0.10)] overflow-hidden z-50">
              <button
                type="button"
                onClick={openModal}
                className="w-full flex items-center gap-[9px] px-[14px] py-[10px] text-[12.5px] text-[#1E293B] font-medium bg-transparent border-none cursor-pointer transition-colors hover:bg-[#F7F9FC] text-left"
              >
                <svg width="13" height="13" viewBox="0 0 13 13" fill="none" className="text-[#8A95A3] shrink-0">
                  <rect x="1.5" y="6" width="10" height="6" rx="1.2" stroke="currentColor" strokeWidth="1.3"/>
                  <path d="M4 6V4a2.5 2.5 0 0 1 5 0v2" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
                </svg>
                Ubah Password
              </button>
              <div className="h-[1px] bg-[#F3F5F9] mx-[10px]" />
              <button
                type="button"
                onClick={handleLogout}
                className="w-full flex items-center gap-[9px] px-[14px] py-[10px] text-[12.5px] text-[#DC2626] font-medium bg-transparent border-none cursor-pointer transition-colors hover:bg-[#FFF5F5] text-left"
              >
                <svg width="13" height="13" viewBox="0 0 13 13" fill="none" className="shrink-0">
                  <path d="M5 11H3a1 1 0 0 1-1-1V3a1 1 0 0 1 1-1h2M8.5 9l3-2.5L8.5 4M11.5 6.5H4.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Keluar
              </button>
            </div>
          )}
        </div>
      </header>

      {/* Modal Ubah Password */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-[2px]">
          <div className="bg-white rounded-[16px] w-full max-w-[380px] mx-4 shadow-[0_20px_60px_rgba(11,30,75,0.18)] border border-[#E8ECF4]">
            {/* Header */}
            <div className="flex items-center justify-between px-[24px] pt-[20px] pb-[16px] border-b border-[#F3F5F9]">
              <h3 className="text-[15px] font-bold text-[#0B1E4B] m-0">Ubah Password</h3>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="w-[28px] h-[28px] flex items-center justify-center rounded-[7px] border-none bg-transparent text-[#B0BCCE] cursor-pointer transition-colors hover:bg-[#F3F5F9] hover:text-[#4A5568] text-[18px] leading-none"
              >×</button>
            </div>

            {/* Body */}
            <form onSubmit={handleSimpan} className="px-[24px] py-[20px] flex flex-col gap-[14px]">
              {pwSuccess ? (
                <div className="py-[20px] text-center">
                  <div className="text-[32px] mb-[8px]">✓</div>
                  <p className="text-[13px] font-semibold text-[#145D30] m-0">Password berhasil diubah.</p>
                </div>
              ) : (
                <>
                  {[
                    { label: "Password Lama", val: oldPw, set: setOldPw },
                    { label: "Password Baru", val: newPw, set: setNewPw },
                    { label: "Konfirmasi Password Baru", val: confirmPw, set: setConfirmPw },
                  ].map(({ label, val, set }) => (
                    <div key={label} className="flex flex-col gap-[5px]">
                      <label className="text-[11.5px] font-semibold text-[#4A5568]">{label}</label>
                      <input
                        type="password"
                        value={val}
                        onChange={(e) => set(e.target.value)}
                        className="w-full px-[12px] py-[9px] rounded-[8px] border border-[#DDE3EF] text-[13px] text-[#0B1E4B] bg-[#F7F9FC] outline-none focus:border-[#0B1E4B] focus:shadow-[0_0_0_3px_rgba(11,30,75,0.08)] transition-all"
                      />
                    </div>
                  ))}
                  {pwError && <p className="text-[11.5px] text-red-500 m-0">{pwError}</p>}
                  <p className="text-[11px] text-[#8A95A3] m-0 leading-[1.5]">
                    Password ini hanya digunakan untuk login manual SIMPROTIK.
                  </p>
                  {/* Footer */}
                  <div className="flex gap-[8px] pt-[4px]">
                    <button
                      type="button"
                      onClick={() => setShowModal(false)}
                      disabled={pwLoading}
                      className="flex-1 py-[9px] rounded-[8px] border border-[#DDE3EF] bg-white text-[13px] font-semibold text-[#4A5568] cursor-pointer transition-all hover:bg-[#F7F9FC]"
                    >Batal</button>
                    <button
                      type="submit"
                      disabled={pwLoading}
                      className="flex-1 py-[9px] rounded-[8px] border-none bg-[#0B1E4B] text-white text-[13px] font-semibold cursor-pointer transition-all hover:bg-[#0F2150] disabled:opacity-60 disabled:cursor-not-allowed"
                    >{pwLoading ? "Menyimpan..." : "Simpan"}</button>
                  </div>
                </>
              )}
            </form>
          </div>
        </div>
      )}
    </>
  );
}
