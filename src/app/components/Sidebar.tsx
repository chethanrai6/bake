import {
  LayoutDashboard, Package, ChefHat, ClipboardList, BarChart2,
  Users, Truck, Trash2, Settings, ChevronRight, Croissant,
  RefreshCw, TrendingUp, Bell, UserCircle2, LogOut, ShieldCheck, X
} from "lucide-react";
import type { AuthUser } from "./LoginPage";

export type Page =
  | "dashboard" | "worker-dashboard" | "ingredients" | "stock-refill"
  | "production" | "production-history" | "cost-analysis" | "reports"
  | "workers" | "suppliers" | "waste-tracking" | "low-stock" | "settings";

interface SidebarProps {
  activePage: Page;
  onNavigate: (page: Page) => void;
  lowStockCount?: number;
  onLogout: () => void;
  user: AuthUser;
  mobileOpen?: boolean;
  onMobileClose?: () => void;
}

const navGroups: {
  label: string;
  items: { id: Page; label: string; icon: React.ElementType; badge?: boolean; workerTag?: boolean }[];
}[] = [
  {
    label: "Overview",
    items: [
      { id: "dashboard", label: "Admin Dashboard", icon: LayoutDashboard },
      { id: "worker-dashboard", label: "Worker Preview", icon: UserCircle2, workerTag: true },
    ],
  },
  {
    label: "Inventory",
    items: [
      { id: "ingredients", label: "Ingredients", icon: Package },
      { id: "stock-refill", label: "Stock Refill", icon: RefreshCw },
      { id: "low-stock", label: "Low Stock Alerts", icon: Bell, badge: true },
    ],
  },
  {
    label: "Production",
    items: [
      { id: "production", label: "New Production", icon: ChefHat },
      { id: "production-history", label: "History", icon: ClipboardList },
    ],
  },
  {
    label: "Analytics",
    items: [
      { id: "cost-analysis", label: "Cost Analysis", icon: TrendingUp },
      { id: "reports", label: "Reports", icon: BarChart2 },
      { id: "waste-tracking", label: "Waste Tracking", icon: Trash2 },
    ],
  },
  {
    label: "People",
    items: [
      { id: "workers", label: "Workers", icon: Users },
      { id: "suppliers", label: "Suppliers", icon: Truck },
    ],
  },
  {
    label: "System",
    items: [{ id: "settings", label: "Settings", icon: Settings }],
  },
];

export function Sidebar({ activePage, onNavigate, lowStockCount = 6, onLogout, user, mobileOpen = false, onMobileClose }: SidebarProps) {
  const handleNavigate = (page: Page) => {
    onNavigate(page);
    onMobileClose?.();
  };

  return (
    <>
      {/* Mobile backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 md:hidden"
          style={{ background: "rgba(0,0,0,0.45)" }}
          onClick={onMobileClose}
        />
      )}
      <aside
        className={[
          "flex flex-col border-r border-border",
          // Desktop: static sidebar
          "md:relative md:w-56 md:shrink-0 md:h-full md:translate-x-0",
          // Mobile: fixed drawer
          "fixed inset-y-0 left-0 z-50 w-72 h-full transition-transform duration-300 ease-in-out md:transition-none",
          mobileOpen ? "translate-x-0" : "-translate-x-full",
        ].join(" ")}
        style={{ background: "#FFFFFF" }}
      >
      {/* Logo */}
      <div className="px-5 py-4 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "linear-gradient(135deg,#6D1F2F,#8B2739)" }}>
            <Croissant className="w-5 h-5 text-white" />
          </div>
          <div>
            <p style={{ color: "#6D1F2F", fontWeight: 800, fontSize: "15px", letterSpacing: "-0.02em" }}>BakeFlow</p>
            <p style={{ color: "#9CA3AF", fontSize: "11px" }}>Admin Console</p>
          </div>
        </div>
        <button onClick={onMobileClose} className="md:hidden w-8 h-8 rounded-lg flex items-center justify-center hover:bg-muted">
          <X className="w-4 h-4" style={{ color: "#6B7280" }} />
        </button>
      </div>

      {/* Admin badge */}
      <div className="mx-3 mt-3 px-3 py-2 rounded-xl flex items-center gap-2" style={{ background: "rgba(109,31,47,0.06)", border: "1px solid rgba(109,31,47,0.1)" }}>
        <ShieldCheck className="w-3.5 h-3.5 shrink-0" style={{ color: "#6D1F2F" }} />
        <p style={{ color: "#6D1F2F", fontSize: "11px", fontWeight: 700 }}>Administrator Access</p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-4">
        {navGroups.map(group => (
          <div key={group.label}>
            <p className="px-2 mb-1.5" style={{ color: "#C4B5B5", fontSize: "10px", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase" }}>
              {group.label}
            </p>
            <ul className="space-y-0.5">
              {group.items.map(({ id, label, icon: Icon, badge, workerTag }) => {
                const isActive = activePage === id;
                return (
                  <li key={id}>
                    <button
                      onClick={() => handleNavigate(id)}
                      className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm transition-all duration-150"
                      style={{
                        background: isActive ? "linear-gradient(135deg,#6D1F2F,#7D2438)" : "transparent",
                        color: isActive ? "#FFFFFF" : "#4B3535",
                        fontWeight: isActive ? 600 : 400,
                        boxShadow: isActive ? "0 4px 14px rgba(109,31,47,0.22)" : "none",
                      }}
                      onMouseEnter={e => { if (!isActive) (e.currentTarget as HTMLButtonElement).style.background = "#FFF5EE"; }}
                      onMouseLeave={e => { if (!isActive) (e.currentTarget as HTMLButtonElement).style.background = "transparent"; }}
                    >
                      <Icon className="w-4 h-4 shrink-0" />
                      <span className="flex-1 text-left truncate" style={{ fontSize: "13px" }}>{label}</span>

                      {workerTag && !isActive && (
                        <span style={{ fontSize: "9px", fontWeight: 700, background: "rgba(244,201,93,0.2)", color: "#6D1F2F", borderRadius: "4px", padding: "1px 5px" }}>
                          VIEW
                        </span>
                      )}
                      {badge && lowStockCount > 0 && (
                        <span className="flex items-center justify-center w-5 h-5 rounded-full shrink-0"
                          style={{ background: isActive ? "rgba(255,255,255,0.25)" : "#E5484D", color: "#fff", fontSize: "10px", fontWeight: 700 }}>
                          {lowStockCount}
                        </span>
                      )}
                      {!badge && !workerTag && isActive && (
                        <ChevronRight className="w-3 h-3 opacity-60 shrink-0" />
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      {/* User + logout */}
      <div className="px-3 pb-3 pt-2 border-t border-border space-y-1">
        <div className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl" style={{ background: "#FFF9F0" }}>
          <div className="w-8 h-8 rounded-full flex items-center justify-center text-white shrink-0"
            style={{ background: "linear-gradient(135deg,#6D1F2F,#8B2739)", fontSize: "11px", fontWeight: 800 }}>
            {user.avatar}
          </div>
          <div className="flex-1 min-w-0">
            <p className="truncate" style={{ color: "#2C1810", fontWeight: 600, fontSize: "12px" }}>{user.name}</p>
            <p className="truncate" style={{ color: "#9CA3AF", fontSize: "11px" }}>{user.email}</p>
          </div>
        </div>
        <button
          onClick={onLogout}
          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl transition-colors hover:bg-red-50"
          style={{ color: "#E5484D" }}
        >
          <LogOut className="w-3.5 h-3.5" />
          <span style={{ fontWeight: 500, fontSize: "13px" }}>Sign Out</span>
        </button>
      </div>
    </aside>
    </>
  );
}
