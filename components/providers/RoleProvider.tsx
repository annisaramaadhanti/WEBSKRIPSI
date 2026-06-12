"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { Role, User } from "@/types";

type RoleContextType = {
  role: Role;
  user: User | null;
  setRole: (role: Role) => void;
  setUser: (user: User) => void;
  logout: () => void;
  isHydrated: boolean;
};

const RoleContext = createContext<RoleContextType | null>(null);

export function RoleProvider({ children }: { children: React.ReactNode }) {
  const [role, setRoleState] = useState<Role>("operator");
  const [user, setUserState] = useState<User | null>(null);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    const savedRole = window.localStorage.getItem("simprotik-role") as Role | null;
    const savedUser = window.localStorage.getItem("simprotik-user");
    if (savedRole) setRoleState(savedRole);
    if (savedUser) {
      try { setUserState(JSON.parse(savedUser)); } catch {}
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
