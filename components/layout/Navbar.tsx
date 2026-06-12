"use client";

import { useRole } from "@/components/providers/RoleProvider";
import { getRoleLabel } from "@/lib/menu";

export default function Navbar() {
  const { role, user } = useRole();

  return (
    <header className="navbar">
      <div>
        <div className="navbar-title">SIMPROTIK</div>
        <div className="navbar-subtitle">Sistem Informasi Manajemen Proyek UPA TIK</div>
      </div>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 2 }}>
        <div className="role-pill">{getRoleLabel(role)}</div>
      </div>
    </header>
  );
}
