"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { Role, User } from "@/types";
import { getMasterPengguna } from "@/lib/api";

type RoleContextType = {
  role: Role;
  user: User | null;
  setRole: (role: Role) => void;
  setUser: (user: User) => void;
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
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    const savedRole = window.localStorage.getItem("simprotik-role") as Role | null;
    const savedUser = window.localStorage.getItem("simprotik-user");
    if (savedRole) setRoleState(savedRole);
    if (savedUser) {
      try {
        const parsed = JSON.parse(savedUser) as User;
        setUserState(parsed);
        syncBackendUser(parsed)
          .then((synced) => {
            window.localStorage.setItem("simprotik-user", JSON.stringify(synced));
            window.localStorage.setItem("simprotik-role", synced.role);
            setUserState(synced);
            setRoleState(synced.role);
          })
          .catch(() => {});
      } catch {}
    }
    setIsHydrated(true);
  }, []);

  const setRole = (nextRole: Role) => {
    window.localStorage.setItem("simprotik-role", nextRole);
    setRoleState(nextRole);
  };

  const setUser = (nextUser: User) => {
    window.localStorage.setItem("simprotik-user", JSON.stringify(nextUser));
    window.localStorage.setItem("simprotik-role", nextUser.role);
    setUserState(nextUser);
    setRoleState(nextUser.role);
  };

  const logout = () => {
    window.localStorage.removeItem("simprotik-role");
    window.localStorage.removeItem("simprotik-user");
    setUserState(null);
    setRoleState("operator");
  };

  const value = useMemo(() => ({ role, user, setRole, setUser, logout, isHydrated }), [role, user, isHydrated]);

  return <RoleContext.Provider value={value}>{children}</RoleContext.Provider>;
}

export function useRole() {
  const ctx = useContext(RoleContext);
  if (!ctx) throw new Error("useRole must be used inside RoleProvider");
  return ctx;
}
