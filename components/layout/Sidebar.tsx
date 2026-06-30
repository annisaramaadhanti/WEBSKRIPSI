"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { useRole } from "@/components/providers/RoleProvider";
import { adminMenu, getRoleLabel, mainMenu } from "@/lib/menu";

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, role, accessMode, setAccessMode } = useRole();
  const [modeOpen, setModeOpen] = useState(false);

  const avatarInitial = user?.nama?.charAt(0).toUpperCase() ?? "?";
  const visibleMenu = accessMode === "admin"
    ? adminMenu
    : mainMenu.filter((item) => item.roles.includes(role));

  const handleModeChange = (mode: "role" | "admin") => {
    setAccessMode(mode);
    setModeOpen(false);
    router.push(mode === "admin" ? "/admin/akses" : "/dashboard");
  };

  return (
    <aside className="flex flex-col shrink-0 w-[264px] h-screen bg-[#0B1E4B] text-white shadow-[2px_0_20px_rgba(11,30,75,0.30)]">
      <div className="px-4 pt-5 pb-4 border-b border-white/[0.07]">
        {user && (
          <div className="mb-2">
            <div
              className="flex items-center gap-[10px] px-[12px] py-[11px] rounded-[12px]"
              style={{
                background: "linear-gradient(135deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.04) 100%)",
                border: "1px solid rgba(255,255,255,0.10)",
              }}
            >
              <div
                className="flex items-center justify-center shrink-0 font-black w-[36px] h-[36px] rounded-full text-[14px] text-[#0B1E4B]"
                style={{
                  background: "#C6A84B",
                  border: "1.5px solid rgba(255,255,255,0.20)",
                }}
              >
                {avatarInitial}
              </div>
              <div className="min-w-0">
                <div className="font-bold text-[12.5px] text-white whitespace-nowrap overflow-hidden text-ellipsis">{user.nama}</div>
                <div className="text-[10px] mt-[2px] leading-snug text-white/50">
                  {accessMode === "admin" ? "Admin Akses" : getRoleLabel(role)}
                  {accessMode !== "admin" && user.divisi !== "-" ? ` - ${user.divisi}` : ""}
                </div>
              </div>
            </div>

            {user.isAdmin && (
              <div className="relative mt-2">
                <button
                  type="button"
                  onClick={() => setModeOpen((open) => !open)}
                  className="flex w-full items-center justify-between rounded-[8px] border border-[#C6A84B]/45 bg-[#10265C] px-3 py-2.5 text-left text-[11px] font-extrabold uppercase tracking-[0.35px] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] transition-colors hover:bg-[#15306D]"
                >
                  <span className="truncate text-white drop-shadow-[0_1px_1px_rgba(0,0,0,0.35)]">
                    {accessMode === "admin" ? "Admin Akses" : getRoleLabel(role)}
                  </span>
                  <span className="ml-2 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white/[0.08]">
                    <svg
                      className={`text-[#C6A84B] transition-transform ${modeOpen ? "rotate-180" : ""}`}
                      width="13"
                      height="13"
                      viewBox="0 0 13 13"
                      fill="none"
                    >
                      <path d="M3.25 5 6.5 8.25 9.75 5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </span>
                </button>

                {modeOpen && (
                  <div className="absolute left-0 right-0 top-[calc(100%+6px)] z-50 overflow-hidden rounded-[8px] border border-[#C6A84B]/35 bg-[#07183E] shadow-[0_14px_30px_rgba(0,0,0,0.35)]">
                    {[
                      { value: "role" as const, label: getRoleLabel(role) },
                      { value: "admin" as const, label: "Admin Akses" },
                    ].map((item) => {
                      const active = accessMode === item.value;
                      return (
                        <button
                          key={item.value}
                          type="button"
                          onClick={() => handleModeChange(item.value)}
                          className={[
                            "flex w-full items-center justify-between px-3 py-2.5 text-left text-[11px] font-extrabold uppercase tracking-[0.25px] text-white transition-colors",
                            active ? "bg-[#C6A84B] text-[#0B1E4B]" : "hover:bg-white/[0.10]",
                          ].join(" ")}
                        >
                          <span className="truncate">{item.label}</span>
                          {active && (
                            <svg width="13" height="13" viewBox="0 0 13 13" fill="none" className="text-[#0B1E4B]">
                              <path d="M10.5 3.75 5.25 9 2.75 6.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

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
