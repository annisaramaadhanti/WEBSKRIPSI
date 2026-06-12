"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useRole } from "@/components/providers/RoleProvider";
import { mainMenu, getRoleLabel } from "@/lib/menu";

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { logout, user, role, isHydrated } = useRole();

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  const avatarInitial = user?.nama?.charAt(0).toUpperCase() ?? "?";

  // Menu tinjauan-kinerja hanya untuk kepala-divisi, operator, kepala-upa
  // Disembunyikan untuk staf
  const visibleMenu = mainMenu.filter((item) => {
    if (!role) return false;
    return item.roles.includes(role);
  });

  return (
    <aside className="sidebar">
      <div className="sidebar-top">
        <div className="sidebar-brand">
          <div className="sidebar-brand-icon" style={{
            display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
            gap: "1px", background: "transparent", border: "none",
            width: "auto", height: "auto", borderRadius: 0,
          }}>
            <span style={{
              fontFamily: "var(--font-display, 'DM Sans', sans-serif)",
              fontSize: "11px", fontWeight: 800, letterSpacing: "2px",
              color: "#C6A84B", lineHeight: 1,
            }}>UPA</span>
            <span style={{
              fontFamily: "var(--font-display, 'DM Sans', sans-serif)",
              fontSize: "7px", fontWeight: 700, letterSpacing: "1.5px",
              color: "rgba(198,168,75,0.6)", lineHeight: 1,
            }}>TIK</span>
          </div>
          <div>
            <h2>SIMPROTIK</h2>
            <p>UPA TIK Universitas Lampung</p>
          </div>
        </div>

        {user && (
          <div className="sidebar-user">
            <div className="sidebar-user-avatar">{avatarInitial}</div>
            <div className="sidebar-user-info">
              <div className="sidebar-user-name">{user.nama}</div>
              <div className="sidebar-user-role">
                {getRoleLabel(role ?? "staf")}
                {user.divisi !== "-" ? ` · ${user.divisi}` : ""}
              </div>
            </div>
          </div>
        )}

        <nav>
          <ul className="sidebar-menu">
            {visibleMenu.map((item) => {
              const active = pathname === item.href;
              return (
                <li key={item.href}>
                  <Link className={active ? "active" : ""} href={item.href}>
                    <span className="sidebar-menu-icon" dangerouslySetInnerHTML={{ __html: item.icon }} />
                    <span>{item.label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </div>

      <div className="sidebar-footer">
        <button className="logout-btn" onClick={handleLogout}>
          <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
            <path d="M6 14H3a1 1 0 01-1-1V3a1 1 0 011-1h3M10.5 11l3-3-3-3M13.5 8H6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Keluar
        </button>
      </div>
    </aside>
  );
}
