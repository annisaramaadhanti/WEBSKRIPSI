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
    <aside className="flex flex-col shrink-0 w-[264px] h-screen bg-[#0B1E4B] text-white shadow-[2px_0_20px_rgba(11,30,75,0.30)]">

      {/* User card */}
      <div className="px-4 pt-5 pb-4 border-b border-white/[0.07]">
        {user && (
          <div
            className="flex items-center gap-[10px] px-[12px] py-[11px] rounded-[12px]"
            style={{ background: "linear-gradient(135deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.04) 100%)", border: "1px solid rgba(255,255,255,0.10)" }}
          >
            <div
              className="flex items-center justify-center shrink-0 font-black w-[36px] h-[36px] rounded-full text-[14px] text-[#0B1E4B]"
              style={{ background: "rgba(255,255,255,0.12)", border: "1.5px solid rgba(255,255,255,0.20)" }}
            >
              {avatarInitial}
            </div>
            <div className="min-w-0">
              <div className="font-bold text-[12.5px] text-white whitespace-nowrap overflow-hidden text-ellipsis">{user.nama}</div>
              <div className="text-[10px] mt-[2px] leading-snug text-white/50">
                {getRoleLabel(role ?? "staf")}
                {user.divisi !== "-" ? ` · ${user.divisi}` : ""}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Nav */}
      <div className="flex-1 overflow-y-auto px-3 py-4">
        <p className="text-[9px] font-bold tracking-[1.5px] uppercase text-white/25 px-[10px] mb-[8px]">Menu</p>
        <nav>
          <ul className="list-none m-0 p-0 flex flex-col gap-[2px]">
            {visibleMenu.map((item) => {
              const active = pathname === item.href;
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={[
                      "flex items-center gap-[10px] px-[10px] py-[9px] rounded-[10px] text-[13px] font-medium transition-all no-underline",
                      active
                        ? "text-white"
                        : "text-white/55 hover:text-white hover:bg-white/[0.06]",
                    ].join(" ")}
                    style={active ? { background: "rgba(255,255,255,0.10)", borderLeft: "3px solid rgba(255,255,255,0.80)", paddingLeft: "9px" } : {}}
                  >
                    <span
                      className={["flex items-center justify-center shrink-0 w-[18px] h-[18px]", active ? "opacity-100" : "opacity-50"].join(" ")}
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
