"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useRole } from "@/components/providers/RoleProvider";
import { mainMenu, getRoleLabel } from "@/lib/menu";

export default function Sidebar() {
  const pathname = usePathname();
  const { user, role } = useRole();

  const avatarInitial = user?.nama?.charAt(0).toUpperCase() ?? "?";

  const visibleMenu = mainMenu.filter((item) => {
    if (!role) return false;
    return item.roles.includes(role);
  });

  return (
    <aside className="flex flex-col overflow-y-auto shrink-0 w-[264px] h-screen bg-[#0B1E4B] text-white shadow-[2px_0_20px_rgba(11,30,75,0.30)]">
      <div className="flex flex-col px-5 py-[22px] border-b border-white/[0.07]">
        {/* Brand */}
        <div className="flex items-center gap-2.5 mb-[18px]">
          <div className="flex flex-col items-center justify-center shrink-0 w-10 h-10 rounded-[10px] bg-[rgba(198,168,75,0.12)] border border-[rgba(198,168,75,0.25)] gap-px">
            <span style={{ fontFamily: "var(--font-display,'DM Sans',sans-serif)", fontSize: "11px", fontWeight: 800, letterSpacing: "2px", color: "#C6A84B", lineHeight: 1 }}>UPA</span>
            <span style={{ fontFamily: "var(--font-display,'DM Sans',sans-serif)", fontSize: "7px", fontWeight: 700, letterSpacing: "1.5px", color: "rgba(198,168,75,0.6)", lineHeight: 1 }}>TIK</span>
          </div>
          <div>
            <h2 className="m-0 font-bold text-[17px] text-white tracking-[-0.2px]">SIMPROTIK</h2>
            <p className="mt-[3px] mb-0 text-white/45 text-[10px] font-medium leading-snug">UPA TIK Universitas Lampung</p>
          </div>
        </div>

        {/* User info */}
        {user && (
          <div className="flex items-center gap-2.5 px-3 py-2.5 mb-2 bg-white/[0.06] rounded-[10px] border border-white/[0.08]">
            <div className="flex items-center justify-center shrink-0 font-extrabold w-8 h-8 rounded-full bg-[#C6A84B] text-[#0B1E4B] text-[13px]">
              {avatarInitial}
            </div>
            <div className="min-w-0">
              <div className="font-bold whitespace-nowrap overflow-hidden text-ellipsis text-[12px] text-white">{user.nama}</div>
              <div className="text-[10px] text-white/50 mt-px">
                {getRoleLabel(role ?? "staf")}
                {user.divisi !== "-" ? ` · ${user.divisi}` : ""}
              </div>
            </div>
          </div>
        )}

        {/* Nav menu */}
        <nav>
          <ul className="list-none m-0 flex-1 mt-2.5 px-0">
            {visibleMenu.map((item) => {
              const active = pathname === item.href;
              return (
                <li key={item.href} className="mb-0.5">
                  <Link
                    href={item.href}
                    className={[
                      "flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] font-medium transition-all",
                      active
                        ? "bg-white/[0.12] text-white border-l-[3px] border-blue-600 pl-[10px]"
                        : "text-white/60 hover:bg-white/[0.08] hover:text-white",
                    ].join(" ")}
                  >
                    <span
                      className={["flex items-center justify-center shrink-0 w-[18px] h-[18px]", active ? "opacity-100" : "opacity-65"].join(" ")}
                      dangerouslySetInnerHTML={{ __html: item.icon }}
                    />
                    <span>{item.label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </div>

    </aside>
  );
}
