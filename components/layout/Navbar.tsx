"use client";

import { useRole } from "@/components/providers/RoleProvider";
import { getRoleLabel } from "@/lib/menu";

export default function Navbar() {
  const { role, user } = useRole();

  return (
    <header className="flex justify-between items-center sticky top-0 z-40 gap-4 px-9 py-4 border-b border-[#E8ECF4] bg-white/95 backdrop-blur-md shadow-[0_1px_0_#E8ECF4]">
      <div>
        <div className="font-bold text-[15px] text-[#0B1E4B]">SIMPROTIK</div>
        <div className="text-[11px] text-[#8A95A3] mt-0.5">Sistem Informasi Manajemen Proyek UPA TIK</div>
      </div>
      <div className="flex flex-col items-end gap-0.5">
        <div className="px-3.5 py-1 rounded-full bg-[#F5EBD0] text-[#9E7F2A] text-[11px] font-bold tracking-[0.3px] border border-[#C6A84B]">
          {getRoleLabel(role)}
        </div>
      </div>
    </header>
  );
}
