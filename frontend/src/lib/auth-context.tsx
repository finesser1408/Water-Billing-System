import { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import { useQuery } from "convex/react";
import { api } from "../convex/_generated/api";

export type Role =
  | "Billing Officer"
  | "Finance Clerk"
  | "Finance Manager"
  | "System Administrator";

export interface User {
  _id?: string;
  username: string;
  fullName: string;
  role: Role;
}

interface AuthContextValue {
  user: User | null;
  login: (username: string, password: string) => { ok: boolean; locked?: boolean };
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const STORAGE_KEY = "elb_auth_user";
const ATTEMPTS_KEY = "elb_auth_attempts";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const users = useQuery(api.users.list) || [];

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setUser(JSON.parse(raw));
    } catch {}
  }, []);

  const login = (username: string, password: string) => {
    const attempts = Number(localStorage.getItem(ATTEMPTS_KEY) || "0");
    if (attempts >= 3) return { ok: false, locked: true };
    
    const foundUser = users.find(
      (u: any) => u.username.toLowerCase().trim() === username.toLowerCase().trim()
    );
    
    if (!foundUser || foundUser.password !== password) {
      localStorage.setItem(ATTEMPTS_KEY, String(attempts + 1));
      return { ok: false, locked: attempts + 1 >= 3 };
    }
    
    localStorage.removeItem(ATTEMPTS_KEY);
    const userData = {
      username: foundUser.username,
      fullName: foundUser.fullName,
      role: foundUser.role,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(userData));
    setUser(userData);
    return { ok: true };
  };

  const logout = () => {
    localStorage.removeItem(STORAGE_KEY);
    setUser(null);
  };

  return <AuthContext.Provider value={{ user, login, logout }}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

export const ROLE_MENU: Record<Role, string[]> = {
  "Billing Officer": ["/dashboard", "/consumers", "/meter-readings", "/help"],
  "Finance Clerk": ["/dashboard", "/consumers", "/payments", "/enquiry", "/help"],
  "Finance Manager": ["/dashboard", "/consumers", "/billing", "/reports/revenue", "/reports/collection", "/help"],
  "System Administrator": ["/dashboard", "/admin/users", "/admin/tariff", "/admin/logs", "/help"],
};

export function canAccess(role: Role | undefined, path: string) {
  if (!role) return false;
  if (path === "/dashboard" || path === "/help") return true;
  return ROLE_MENU[role].some((p) => path === p || path.startsWith(p + "/"));
}
