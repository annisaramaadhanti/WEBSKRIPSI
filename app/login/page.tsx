"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
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

export default function LoginPage() {
  const router = useRouter();
  const { setUser } = useRole();
  const [loading, setLoading] = useState(false);
  const [showDummy, setShowDummy] = useState(false);

  const loginByNip = async (nip: string) => {
    const res: any = await getMasterPengguna();
    const list: any[] = res?.data ?? [];
    const found = list.find((u: any) => u.NIP === nip);
    if (!found) throw new Error("User tidak ditemukan di database.");
    const role = PERAN_TO_ROLE[found.peran] ?? "staf";
    setUser({
      id: found.uuid,
      nama: found.nama_lengkap,
      nip: found.NIP,
      jabatan: found.peran,
      email: found.email,
      password: "",
      role,
      divisi: found.divisi?.nama_divisi ?? "-",
    });
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

  return (
    <>
      <style suppressHydrationWarning>{`
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        .lp-root {
          min-height: 100vh;
          display: grid;
          grid-template-columns: 1fr 1fr;
          font-family: "Plus Jakarta Sans", system-ui, sans-serif;
          background: #ffffff;
        }

        /* ── Panel kiri — visual ── */
        .lp-left {
          background: #0B1E4B;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          padding: 40px 48px;
          position: relative;
          overflow: hidden;
        }
        .lp-left::before {
          content: '';
          position: absolute;
          top: -120px; right: -120px;
          width: 420px; height: 420px;
          border-radius: 50%;
          border: 64px solid rgba(198,168,75,0.08);
          pointer-events: none;
        }
        .lp-left::after {
          content: '';
          position: absolute;
          bottom: -80px; left: -80px;
          width: 300px; height: 300px;
          border-radius: 50%;
          border: 40px solid rgba(255,255,255,0.04);
          pointer-events: none;
        }

        /* grid dots */
        .lp-left-dots {
          position: absolute;
          inset: 0;
          background-image: radial-gradient(circle, rgba(255,255,255,0.05) 1px, transparent 1px);
          background-size: 28px 28px;
          pointer-events: none;
        }

        .lp-left-top {
          position: relative; z-index: 1;
          display: flex; align-items: center; gap: 12px;
        }
        .lp-left-logo {
          width: 40px; height: 40px; border-radius: 10px;
          background: #C6A84B;
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0;
        }
        .lp-left-logo svg { color: #0B1E4B; }
        .lp-left-brand {
          font-size: 16px; font-weight: 700; letter-spacing: -0.2px; color: #fff;
        }
        .lp-left-brand span { display: block; font-size: 10px; font-weight: 400; color: rgba(255,255,255,0.45); margin-top: 1px; }

        .lp-left-mid {
          position: relative; z-index: 1;
          flex: 1; display: flex; flex-direction: column; justify-content: center;
          padding: 40px 0;
        }
        .lp-left-accent {
          display: inline-block;
          font-size: 10px; font-weight: 700; letter-spacing: 2px; text-transform: uppercase;
          color: #C6A84B;
          padding: 5px 14px; background: rgba(198,168,75,0.12); border-radius: 100px;
          border: 1px solid rgba(198,168,75,0.30);
          margin-bottom: 20px;
        }
        .lp-left-title {
          font-size: 36px; font-weight: 700; letter-spacing: -1.5px;
          color: #fff; line-height: 1.1; margin-bottom: 14px;
        }
        .lp-left-title span { color: #C6A84B; }
        .lp-left-sub {
          font-size: 14px; color: rgba(255,255,255,0.55); line-height: 1.7;
          max-width: 340px;
        }

        /* Feature list */
        .lp-features { margin-top: 36px; display: flex; flex-direction: column; gap: 14px; }
        .lp-feature {
          display: flex; align-items: flex-start; gap: 12px;
        }
        .lp-feature-dot {
          width: 32px; height: 32px; flex-shrink: 0;
          border-radius: 8px; background: rgba(255,255,255,0.06);
          border: 1px solid rgba(255,255,255,0.10);
          display: flex; align-items: center; justify-content: center;
          color: #C6A84B; margin-top: 1px;
        }
        .lp-feature-text strong { display: block; font-size: 13px; font-weight: 600; color: rgba(255,255,255,0.90); }
        .lp-feature-text span { font-size: 12px; color: rgba(255,255,255,0.42); }

        .lp-left-bottom {
          position: relative; z-index: 1;
          font-size: 11px; color: rgba(255,255,255,0.30);
        }

        /* Logo row */
        .lp-logos-row {
          display: flex; align-items: center; gap: 16px;
          background: rgba(255,255,255,0.08);
          border: 1px solid rgba(255,255,255,0.12);
          border-radius: 14px; padding: 14px 20px;
          width: fit-content;
        }
        .lp-logo-img {
          height: 52px; width: auto;
          object-fit: contain; display: block;
          filter: brightness(1);
        }
        .lp-logo-sep {
          width: 1px; height: 40px;
          background: rgba(255,255,255,0.18); flex-shrink: 0;
        }

        /* Formal text */
        .lp-left-sub-formal {
          font-size: 18px; font-weight: 600; color: rgba(255,255,255,0.90);
          line-height: 1.4; margin-bottom: 4px;
        }
        .lp-divider-gold {
          width: 40px; height: 2px; background: #C6A84B;
          border-radius: 2px; margin: 20px 0;
        }
        .lp-info-list {
          display: flex; flex-direction: column; gap: 10px;
        }
        .lp-info-item {
          display: flex; align-items: center; gap: 10px;
          font-size: 13px; color: rgba(255,255,255,0.55);
        }
        .lp-info-dot {
          width: 5px; height: 5px; border-radius: 50%;
          background: #C6A84B; flex-shrink: 0;
        }

        /* ── Panel kanan — form ── */
        .lp-right {
          display: flex; align-items: center; justify-content: center;
          padding: 40px 32px;
          background: #ffffff;
          position: relative;
        }
        .lp-back-btn {
          position: absolute; top: 24px; right: 28px;
          display: inline-flex; align-items: center; gap: 6px;
          padding: 8px 20px; border-radius: 8px;
          background: #0B1E4B; color: #fff;
          font-size: 13px; font-weight: 600;
          border: none; cursor: pointer; text-decoration: none;
          box-shadow: 0 2px 8px rgba(11,30,75,0.22);
          transition: all 0.15s;
        }
        .lp-back-btn:hover { background: #0B1E4B; transform: translateY(-1px); }
        .lp-back-btn svg { transition: transform 0.15s; }
        .lp-back-btn:hover svg { transform: translateX(-3px); }
        .lp-card {
          width: 100%; max-width: 400px;
          background: #fff;
          border-radius: 20px;
          padding: 40px 36px 32px;
          box-shadow: 0 3px 14px rgba(15,23,42,0.09), 0 1px 4px rgba(11,30,75,0.04);
          border: 1px solid rgba(148,163,184,0.25);
        }
        .lp-card-eyebrow {
          font-size: 10px; font-weight: 700; letter-spacing: 1.5px; text-transform: uppercase;
          color: #8A95A3; margin-bottom: 6px;
        }
        .lp-card-title {
          font-size: 22px; font-weight: 700; letter-spacing: -0.5px;
          color: #0B1E4B; margin-bottom: 4px; line-height: 1.2;
        }
        .lp-card-sub {
          font-size: 13px; color: #8A95A3; line-height: 1.5; margin-bottom: 28px;
        }

        /* SSO Button */
        .lp-sso-btn {
          width: 100%;
          display: flex; align-items: center; gap: 14px;
          padding: 14px 18px;
          border: none; border-radius: 12px; cursor: pointer;
          background: #0B1E4B;
          color: #fff;
          box-shadow: 0 4px 14px rgba(11,30,75,0.28);
          transition: all 0.18s;
          position: relative; overflow: hidden;
        }
        .lp-sso-btn::after {
          content: '';
          position: absolute; inset: 0;
          background: linear-gradient(180deg, rgba(255,255,255,0.06) 0%, transparent 100%);
          pointer-events: none;
        }
        .lp-sso-btn:hover:not(:disabled) { background: #0B1E4B; transform: translateY(-1px); box-shadow: 0 6px 20px rgba(11,30,75,0.36); }
        .lp-sso-btn:disabled { opacity: 0.55; cursor: not-allowed; }

        .lp-sso-icon {
          width: 36px; height: 36px; border-radius: 9px;
          background: rgba(255,255,255,0.10);
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0;
          border: 1px solid rgba(255,255,255,0.14);
        }
        .lp-sso-text { flex: 1; text-align: left; }
        .lp-sso-main { font-size: 14px; font-weight: 700; line-height: 1; margin-bottom: 3px; }
        .lp-sso-hint { font-size: 11px; font-weight: 400; opacity: 0.62; }
        .lp-sso-arr { opacity: 0.60; transition: transform 0.18s, opacity 0.18s; }
        .lp-sso-btn:hover .lp-sso-arr { transform: translateX(3px); opacity: 1; }
        .lp-spinner { width: 18px; height: 18px; border: 2.5px solid rgba(255,255,255,0.25); border-top-color: #fff; border-radius: 50%; animation: spin 0.7s linear infinite; flex-shrink: 0; }
        @keyframes spin { to { transform: rotate(360deg); } }

        /* Gold accent bar */
        .lp-accent-bar {
          height: 3px; background: #C6A84B;
          border-radius: 100px; margin: 20px 0;
          width: 48px;
        }

        /* Note */
        .lp-note {
          display: flex; align-items: flex-start; gap: 8px;
          margin-top: 14px; padding: 10px 13px;
          border-radius: 9px;
          background: #EEF5FF;
          border: 1px solid #C9DEFF;
        }
        .lp-note svg { flex-shrink: 0; margin-top: 1px; color: #0B1E4B; }
        .lp-note p { font-size: 11.5px; color: #0B1E4B; line-height: 1.55; font-weight: 500; }

        /* Footer */
        .lp-footer {
          margin-top: 24px; text-align: center;
          font-size: 11px; color: #B0BCCE;
        }
        .lp-dev-toggle {
          background: none; border: none; cursor: pointer;
          font-size: 10px; color: #D4DCEC; font-weight: 500;
          transition: color 0.12s; padding: 3px 6px; border-radius: 4px;
          display: inline-block; margin-top: 6px;
        }
        .lp-dev-toggle:hover { color: #8A95A3; }

        /* Dummy panel */
        .lp-dummy-panel {
          position: fixed; bottom: 20px; right: 20px; z-index: 50;
          background: #fff; border: 1px solid #DDE3EF; border-radius: 14px;
          width: 292px; max-height: 70vh;
          display: flex; flex-direction: column;
          box-shadow: 0 8px 28px rgba(11,30,75,0.14);
          animation: slideUp 0.18s ease; overflow: hidden;
        }
        @keyframes slideUp { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        .lp-dummy-header {
          display: flex; align-items: center; justify-content: space-between;
          padding: 12px 14px 10px; border-bottom: 1px solid #F3F5F9; flex-shrink: 0;
        }
        .lp-dummy-title { font-size: 10px; font-weight: 700; color: #8A95A3; letter-spacing: 1px; text-transform: uppercase; }
        .lp-dummy-close { background: none; border: none; cursor: pointer; color: #B0BCCE; font-size: 16px; line-height: 1; padding: 2px 4px; border-radius: 4px; }
        .lp-dummy-close:hover { color: #4A5568; background: #F3F5F9; }
        .lp-dummy-scroll { overflow-y: auto; flex: 1; padding: 10px; display: flex; flex-direction: column; gap: 8px; }
        .lp-dummy-scroll::-webkit-scrollbar { width: 3px; }
        .lp-dummy-scroll::-webkit-scrollbar-track { background: transparent; }
        .lp-dummy-scroll::-webkit-scrollbar-thumb { background: #DDE3EF; border-radius: 3px; }
        .lp-dummy-group-label { font-size: 9px; font-weight: 700; letter-spacing: 1px; text-transform: uppercase; color: #B0BCCE; padding: 4px 4px 2px; }
        .lp-dummy-list { display: flex; flex-direction: column; gap: 4px; }
        .lp-dummy-item {
          width: 100%; display: flex; align-items: center; gap: 9px;
          padding: 8px 10px; border: 1px solid #F3F5F9; border-radius: 9px;
          background: #F7F9FC; cursor: pointer; transition: all 0.12s; text-align: left;
        }
        .lp-dummy-item:hover { background: #EEF5FF; border-color: #C9DEFF; }
        .lp-dummy-av {
          width: 28px; height: 28px; border-radius: 7px;
          font-size: 11px; font-weight: 800;
          display: flex; align-items: center; justify-content: center; flex-shrink: 0;
        }
        .lp-dummy-av.upa   { background: #EEF5FF; color: #0B1E4B; }
        .lp-dummy-av.kadiv { background: #F0EAFB; color: #5A28AA; }
        .lp-dummy-av.op    { background: #FEF9E7; color: #8A6010; }
        .lp-dummy-av.staf  { background: #E8F5EE; color: #145D30; }
        .lp-dummy-name { font-size: 11px; font-weight: 700; color: #0B1E4B; line-height: 1.3; }
        .lp-dummy-sub  { font-size: 10px; color: #B0BCCE; margin-top: 1px; }

        @media (max-width: 768px) {
          .lp-root { grid-template-columns: 1fr; }
          .lp-left { display: none; }
          .lp-right { padding: 24px 16px; }
          .lp-card { padding: 28px 22px 22px; }
        }
      `}</style>

      <div className="lp-root">
        {/* ── Panel kiri ── */}
        <div className="lp-left">
          <div className="lp-left-dots" />

          {/* Logo area */}
          <div className="lp-left-top">
            <div className="lp-logos-row">
              <img src="/logo-upa.png" alt="UPA TIK" className="lp-logo-img" />
            </div>
          </div>

          {/* Center content */}
          <div className="lp-left-mid">
            <div className="lp-left-accent">Universitas Lampung</div>
            <h1 className="lp-left-title">SIMPROTIK</h1>
            <p className="lp-left-sub-formal">
              Sistem Informasi Manajemen Proyek &amp; Kinerja
            </p>
            <p className="lp-left-sub">
              UPA Teknologi Informasi dan Komunikasi
            </p>

            <div className="lp-divider-gold" />

            <div className="lp-info-list">
              <div className="lp-info-item">
                <span className="lp-info-dot" />
                <span>Pengelolaan pekerjaan &amp; proyek terpusat</span>
              </div>
              <div className="lp-info-item">
                <span className="lp-info-dot" />
                <span>Surat tugas &amp; dokumentasi digital</span>
              </div>
              <div className="lp-info-item">
                <span className="lp-info-dot" />
                <span>Monitoring kinerja per divisi</span>
              </div>
            </div>
          </div>

          <div className="lp-left-bottom">
            Jl. Prof. Dr. Sumantri Brojonegoro No.1, Bandar Lampung
          </div>
        </div>

        {/* ── Panel kanan ── */}
        <div className="lp-right">
          {/* Tombol kembali ke dashboard publik */}
          <button
            type="button"
            className="lp-back-btn"
            onClick={() => router.push("/")}
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M11.5 7h-9M6 3.5L2.5 7L6 10.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Kembali ke Dashboard
          </button>
          <div className="lp-card">
            <div className="lp-card-eyebrow">Portal Masuk</div>
            <h2 className="lp-card-title">Masuk ke SIMPROTIK</h2>
            <p className="lp-card-sub">Gunakan akun SSO Universitas Lampung untuk mengakses sistem.</p>

            <button
              className="lp-sso-btn"
              type="button"
              onClick={handleSSOLogin}
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="lp-spinner" />
                  <div className="lp-sso-text">
                    <div className="lp-sso-main">Menghubungkan ke SSO…</div>
                    <div className="lp-sso-hint">Mohon tunggu sebentar</div>
                  </div>
                </>
              ) : (
                <>
                  <div className="lp-sso-icon">
                    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                      <circle cx="9" cy="6.5" r="3" stroke="white" strokeWidth="1.5"/>
                      <path d="M3 16c0-3 2.7-5.5 6-5.5s6 2.5 6 5.5" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
                    </svg>
                  </div>
                  <div className="lp-sso-text">
                    <div className="lp-sso-main">Masuk dengan SSO Unila</div>
                    <div className="lp-sso-hint">sso.unila.ac.id · akun civitas academica</div>
                  </div>
                  <svg className="lp-sso-arr" width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <path d="M3.5 8h9M9 4.5l3.5 3.5-3.5 3.5" stroke="white" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </>
              )}
            </button>

            <div className="lp-accent-bar" />

            <div className="lp-note">
              <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                <circle cx="6.5" cy="6.5" r="5.5" stroke="currentColor" strokeWidth="1.3"/>
                <path d="M6.5 5.5v4M6.5 4v.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
              </svg>
              <p>Gunakan email dan password iAIK / SIAKADCLOUD untuk masuk ke sistem ini.</p>
            </div>

            <div className="lp-footer">
              <div> 2025 UPA TIK Universitas Lampung</div>
              <button
                className="lp-dev-toggle"
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
          <div className="lp-dummy-panel">
            <div className="lp-dummy-header">
              <span className="lp-dummy-title">Demo Login</span>
              <button className="lp-dummy-close" type="button" onClick={() => setShowDummy(false)}>×</button>
            </div>
            <div className="lp-dummy-scroll">
              {(["kepala-upa", "operator", "kepala-divisi", "staf"] as const).map((role) => {
                const group = USERS.filter((u) => u.role === role);
                if (!group.length) return null;
                const groupLabel: Record<string, string> = { "kepala-upa": "Kepala UPA", "operator": "Operator", "kepala-divisi": "Kepala Divisi", "staf": "Staf" };
                const avClass: Record<string, string> = { "kepala-upa": "upa", "operator": "op", "kepala-divisi": "kadiv", "staf": "staf" };
                return (
                  <div key={role}>
                    <div className="lp-dummy-group-label">{groupLabel[role]}</div>
                    <div className="lp-dummy-list">
                      {group.map((u) => (
                        <button key={u.id} className="lp-dummy-item" type="button" onClick={() => quickLogin(u.nip)}>
                          <div className={`lp-dummy-av ${avClass[role]}`}>{u.nama.charAt(0)}</div>
                          <div>
                            <div className="lp-dummy-name">{u.nama}</div>
                            <div className="lp-dummy-sub">{u.divisi !== "-" ? u.divisi : groupLabel[role]}</div>
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
    </>
  );
}

