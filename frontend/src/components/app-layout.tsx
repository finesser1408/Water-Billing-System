import { type ReactNode, useState } from "react";
import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import {
  Droplet, LayoutDashboard, Users, Gauge, FileText, Receipt, Search,
  BarChart3, PieChart, UserCog, Settings, ScrollText, HelpCircle,
  LogOut, Bell, ChevronLeft, ChevronRight,
} from "lucide-react";
import { ConvexProvider, ConvexReactClient } from "convex/react";
import { useAuth, ROLE_MENU, type Role } from "@/lib/auth-context";
import { fmtDate } from "@/utils/billingCalculator";
import { cn } from "@/lib/utils";

const NAV: Record<string, { label: string; icon: any }> = {
  "/dashboard": { label: "Dashboard", icon: LayoutDashboard },
  "/consumers": { label: "Consumer Accounts", icon: Users },
  "/meter-readings": { label: "Meter Readings", icon: Gauge },
  "/billing": { label: "Billing", icon: FileText },
  "/payments": { label: "Payments", icon: Receipt },
  "/enquiry": { label: "Account Enquiry", icon: Search },
  "/reports/revenue": { label: "Billing Reports", icon: BarChart3 },
  "/reports/collection": { label: "Collection Reports", icon: PieChart },
  "/admin/users": { label: "User Management", icon: UserCog },
  "/admin/tariff": { label: "Tariff Configuration", icon: Settings },
  "/admin/logs": { label: "System Logs", icon: ScrollText },
  "/help": { label: "Help", icon: HelpCircle },
};

export function AppLayout({ children }: { children: ReactNode }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const routerState = useRouterState();
  const pathname = routerState.location.pathname;
  const [collapsed, setCollapsed] = useState(false);

  if (!user) return null;
  const menu = ROLE_MENU[user.role];
  const initials = user.fullName.split(" ").map((p) => p[0]).slice(0, 2).join("");
  const currentLabel = NAV[pathname]?.label ?? "Dashboard";

  return (
    <div className="min-h-screen flex bg-background">
      {/* Sidebar */}
      <aside
        className={cn(
          "bg-sidebar text-sidebar-foreground flex flex-col transition-all duration-200",
          collapsed ? "w-16" : "w-60",
        )}
      >
        <div className="h-16 flex items-center gap-2 px-4 border-b border-sidebar-border">
          <div className="w-9 h-9 rounded-md bg-accent flex items-center justify-center shrink-0">
            <Droplet className="w-5 h-5 text-accent-foreground" />
          </div>
          {!collapsed && (
            <div className="leading-tight">
              <div className="text-xs uppercase tracking-wider opacity-70">Epworth</div>
              <div className="text-sm font-semibold">Local Board</div>
            </div>
          )}
        </div>

        <nav className="flex-1 py-3 overflow-y-auto">
          {menu.map((path) => {
            const item = NAV[path];
            if (!item) return null;
            const Icon = item.icon;
            const active = pathname === path || (path !== "/dashboard" && pathname.startsWith(path));
            return (
              <Link
                key={path}
                to={path}
                className={cn(
                  "flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-sidebar-accent transition-colors border-l-4 border-transparent",
                  active && "bg-sidebar-accent border-l-accent font-medium",
                )}
                title={collapsed ? item.label : undefined}
              >
                <Icon className="w-5 h-5 shrink-0" />
                {!collapsed && <span>{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-sidebar-border p-3">
          <button
            onClick={() => setCollapsed((c) => !c)}
            className="w-full flex items-center justify-center gap-2 text-xs py-1.5 mb-3 rounded hover:bg-sidebar-accent"
          >
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <><ChevronLeft className="w-4 h-4" /><span>Collapse</span></>}
          </button>
          <div className={cn("flex items-center gap-3", collapsed && "justify-center")}>
            <div className="w-9 h-9 rounded-full bg-accent text-accent-foreground flex items-center justify-center text-sm font-semibold shrink-0">
              {initials}
            </div>
            {!collapsed && (
              <div className="min-w-0 flex-1">
                <div className="text-sm font-medium truncate">{user.fullName}</div>
                <span className="inline-block text-[10px] px-1.5 py-0.5 rounded bg-accent text-accent-foreground font-medium mt-0.5">
                  {user.role}
                </span>
              </div>
            )}
          </div>
          <button
            onClick={() => { logout(); navigate({ to: "/login" }); }}
            className={cn(
              "mt-3 w-full flex items-center gap-2 text-sm px-3 py-2 rounded hover:bg-sidebar-accent",
              collapsed && "justify-center px-0",
            )}
          >
            <LogOut className="w-4 h-4" />
            {!collapsed && <span>Sign Out</span>}
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 bg-surface border-b border-border flex items-center justify-between px-6">
          <h1 className="text-lg font-semibold text-foreground">{currentLabel}</h1>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">{fmtDate(new Date())}</span>
            <button className="relative p-2 rounded hover:bg-muted">
              <Bell className="w-5 h-5 text-muted-foreground" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-accent" />
            </button>
          </div>
        </header>
        <main className="flex-1 p-6 overflow-auto">{children}</main>
      </div>
    </div>
  );
}

import { useEffect as _useEffect } from "react";
import { toast as _toast } from "sonner";

export function ProtectedRoute({ children, allow }: { children: ReactNode; allow?: Role[] }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  _useEffect(() => {
    if (!user) { navigate({ to: "/login" }); return; }
    if (allow && !allow.includes(user.role)) {
      _toast.error("You do not have permission to access this page");
      navigate({ to: "/dashboard" });
    }
  }, [user, allow, navigate]);

  if (!user) return null;
  if (allow && !allow.includes(user.role)) return null;
  return <AppLayout>{children}</AppLayout>;
}
