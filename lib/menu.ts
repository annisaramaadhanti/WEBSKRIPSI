import type { Role } from "@/types";

export const mainMenu = [
  {
    label: "Dashboard",
    href: "/dashboard",
    roles: ["operator", "kepala-divisi", "kepala-upa", "staf"],
    icon: `<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><rect x="1.5" y="1.5" width="5.5" height="5.5" rx="1.2" stroke="currentColor" strokeWidth="1.4"/><rect x="9" y="1.5" width="5.5" height="5.5" rx="1.2" stroke="currentColor" strokeWidth="1.4"/><rect x="1.5" y="9" width="5.5" height="5.5" rx="1.2" stroke="currentColor" strokeWidth="1.4"/><rect x="9" y="9" width="5.5" height="5.5" rx="1.2" stroke="currentColor" strokeWidth="1.4"/></svg>`,
  },
  {
    label: "Pekerjaan",
    href: "/pekerjaan",
    roles: ["operator", "kepala-divisi", "kepala-upa", "staf"],
    icon: `<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><rect x="2" y="4" width="12" height="9" rx="1.5" stroke="currentColor" strokeWidth="1.4"/><path d="M5 4V3a1 1 0 011-1h4a1 1 0 011 1v1" stroke="currentColor" strokeWidth="1.4"/><path d="M5 8h6M5 11h4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>`,
  },
  {
    label: "Proyek",
    href: "/proyek",
    roles: ["operator", "kepala-divisi", "kepala-upa", "staf"],
    icon: `<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M2 13V6l6-3.5L14 6v7" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round"/><rect x="5.5" y="8.5" width="5" height="4.5" rx="0.8" stroke="currentColor" strokeWidth="1.3"/></svg>`,
  },
  {
    label: "Tinjauan Kinerja",
    href: "/tinjauan-kinerja",
    roles: ["operator", "kepala-divisi", "kepala-upa"],
    icon: `<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M2 12l3.5-4 3 2.5L12 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/><circle cx="12.5" cy="4.5" r="1.5" fill="currentColor" fillOpacity="0.8"/></svg>`,
  },
];

export function getRoleLabel(role: Role) {
  if (role === "kepala-divisi") return "Kepala Divisi";
  if (role === "kepala-upa") return "Kepala UPA";
  if (role === "operator") return "Operator";
  return "Staf";
}
