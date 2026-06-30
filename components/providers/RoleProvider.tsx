"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { Role, User } from "@/types";
import { getMasterPengguna } from "@/lib/api";

type RoleContextType = {
  role: Role;
  user: User | null;
  accessMode: "role" | "admin";
  setRole: (role: Role) => void;
  setUser: (user: User) => void;
  setAccessMode: (mode: "role" | "admin") => void;
  logout: () => void;
  isHydrated: boolean;
};

const RoleContext = createContext<RoleContextType | null>(null);

const roleToPeran: Record<Role, string> = {
  "operator": "Operator",
  "staf": "Staf",
  "kepala-divisi": "Kepala Divisi",
  "kepala-upa": "Kepala UPA",
};

function mapBackendUser(user: any, fallback: User): User {
  return {
    ...fallback,
    id: user.uuid,
    nama: user.nama_lengkap ?? fallback.nama,
    nip: user.NIP ?? fallback.nip,
    jabatan: user.peran ?? fallback.jabatan,
    divisi: user.divisi?.nama_divisi ?? fallback.divisi,
  };
}

function withAdminAccess(user: User): User {
  const key = `${user.nama} ${user.nip}`.toLowerCase();
  const isHarry = key.includes("harry bonardo") || key.includes("2215061089");
  return { ...user, isAdmin: user.isAdmin || isHarry, statusAkun: user.statusAkun ?? "aktif" };
}

async function syncBackendUser(saved: User): Promise<User> {
  const response: any = await getMasterPengguna();
  const users = Array.isArray(response?.data) ? response.data : [];
  const expectedPeran = roleToPeran[saved.role];
  const matched = users.find((item: any) => item.NIP === saved.nip)
    ?? users.find((item: any) => item.peran === expectedPeran);

  return matched?.uuid ? mapBackendUser(matched, saved) : saved;
}

export function RoleProvider({ children }: { children: React.ReactNode }) {
  const [role, setRoleState] = useState<Role>("operator");
  const [user, setUserState] = useState<User | null>(null);
  const [accessModeState, setAccessModeState] = useState<"role" | "admin">("role");
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    const savedRole = window.localStorage.getItem("simprotik-role") as Role | null;
    const savedUser = window.localStorage.getItem("simprotik-user");
    if (savedRole) setRoleState(savedRole);
    if (savedUser) {
      try {
        const parsed = withAdminAccess(JSON.parse(savedUser) as User);
        setUserState(parsed);
        syncBackendUser(parsed)
          .then((synced) => {
            const hydrated = withAdminAccess(synced);
            window.localStorage.setItem("simprotik-user", JSON.stringify(hydrated));
            window.localStorage.setItem("simprotik-role", hydrated.role);
            setUserState(hydrated);
            setRoleState(synced.role);
          })
          .catch(() => {});
      } catch {}
    }
    window.localStorage.removeItem("simprotik-access-mode");
    setAccessModeState("role");
    setIsHydrated(true);
  }, []);

  const setRole = (nextRole: Role) => {
    window.localStorage.setItem("simprotik-role", nextRole);
    setRoleState(nextRole);
  };

  const setUser = (nextUser: User) => {
    const hydrated = withAdminAccess(nextUser);
    window.localStorage.setItem("simprotik-user", JSON.stringify(hydrated));
    window.localStorage.setItem("simprotik-role", hydrated.role);
    window.localStorage.removeItem("simprotik-access-mode");
    setUserState(hydrated);
    setRoleState(hydrated.role);
    setAccessModeState("role");
  };

  const setAccessMode = (mode: "role" | "admin") => {
    const nextMode = mode === "admin" && user?.isAdmin ? "admin" : "role";
    setAccessModeState(nextMode);
  };

  const logout = () => {
    window.localStorage.removeItem("simprotik-role");
    window.localStorage.removeItem("simprotik-user");
    window.localStorage.removeItem("simprotik-access-mode");
    setUserState(null);
    setRoleState("operator");
    setAccessModeState("role");
  };

  const accessMode = user?.isAdmin ? accessModeState : "role";
  const value = useMemo(
    () => ({ role, user, accessMode, setRole, setUser, setAccessMode, logout, isHydrated }),
    [role, user, accessMode, isHydrated]
  );

  return <RoleContext.Provider value={value}>{children}</RoleContext.Provider>;
}

export function useRole() {
  const ctx = useContext(RoleContext);
  if (!ctx) throw new Error("useRole must be used inside RoleProvider");
  return ctx;
}
