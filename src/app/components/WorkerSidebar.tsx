import { ChefHat, ClipboardList, Trash2, Package, LayoutDashboard, ChevronRight, Croissant, LogOut, X } from "lucide-react";
import type { AuthUser } from "./LoginPage";

export type WorkerPage = "worker-dashboard" | "production" | "production-history" | "waste-tracking" | "stock-view";

interface WorkerSidebarProps {
  activePage: WorkerPage;
  onNavigate: (page: WorkerPage) => void;
  user: AuthUser;
  onLogout: () => void;
  mobileOpen?: boolean;
  onMobileClose?: () => void;
}

const workerNav: { id: WorkerPage; label: string; icon: React.ElementType; desc: string }[] = [
  { id: "worker-dashboard", label: "My Dashboard", icon: LayoutDashboard, desc: "Overview & tasks" },
  { id: "production", label: "Log Production", icon: ChefHat, desc: "Record a batch" },
  { id: "production-history", label: "My History", icon: ClipboardList, desc: "Past entries" },
  { id: "waste-tracking", label: "Report Waste", icon: Trash2, desc: "Log wasted items" },
  { id: "stock-view", label: "Stock View", icon: Package, desc: "Check inventory" },
];

export function WorkerSidebar({ activePage, onNavigate, user, onLogout, mobileOpen = false, onMobileClose }: WorkerSidebarProps) {
  const handleNavigate = (page: WorkerPage) => {
    onNavigate(page);
    onMobileClose?.();
  };

  return (
    <>
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
          "md:relative md:w-56 md:shrink-0 md:h-full md:translate-x-0",
          "fixed inset-y-0 left-0 z-50 w-72 h-full transition-transform duration-300 ease-in-out md:transition-none",
          mobileOpen ? "translate-x-0" : "-translate-x-full",
        ].join(" ")}
        style={{ background: "#FFFFFF" }}
      >
      {/* Logo */}
      <div className="px-5 py-4 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "linear-gradient(135deg, #6D1F2F, #8B2739)" }}>
            <Croissant className="w-5 h-5 text-white" />
          </div>
          <div>
            <p style={{ color: "#6D1F2F", fontWeight: 800, fontSize: "15px", letterSpacing: "-0.02em" }}>BakeFlow</p>
            <p style={{ color: "#9CA3AF", fontSize: "11px" }}>Worker Portal</p>
          </div>
        </div>
        <button onClick={onMobileClose} className="md:hidden w-8 h-8 rounded-lg flex items-center justify-center hover:bg-muted">
          <X className="w-4 h-4" style={{ color: "#6B7280" }} />
        </button>
      </div>

      {/* Worker badge */}
      <div className="mx-3 mt-3 px-3 py-2.5 rounded-xl" style={{ background: "rgba(244,201,93,0.12)", border: "1px solid rgba(244,201,93,0.3)" }}>
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full flex items-center justify-center text-white shrink-0"
            style={{ background: "linear-gradient(135deg, #F4C95D, #E8B840)", fontSize: "11px", fontWeight: 800, color: "#6D1F2F" }}>
            {user.avatar}
          </div>
          <div className="min-w-0">
            <p className="truncate" style={{ color: "#2C1810", fontWeight: 600, fontSize: "12px" }}>{user.name}</p>
            <div className="flex items-center gap-1">
              <ChefHat className="w-2.5 h-2.5" style={{ color: "#6D1F2F" }} />
              <p style={{ color: "#6D1F2F", fontSize: "10px", fontWeight: 600 }}>{user.position}</p>
            </div>
          </div>
        </div>
        {user.shift && (
          <p className="mt-1.5 text-center text-xs rounded-lg py-1" style={{ background: "rgba(109,31,47,0.08)", color: "#6D1F2F", fontWeight: 600 }}>
            ☀️ {user.shift} Shift
          </p>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        <p className="px-2 mb-2" style={{ color: "#C4B5B5", fontSize: "10px", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase" }}>
          My Tools
        </p>
        {workerNav.map(({ id, label, icon: Icon, desc }) => {
          const isActive = activePage === id;
          return (
            <button
              key={id}
              onClick={() => handleNavigate(id)}
              className="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-left transition-all duration-150"
              style={{
                background: isActive ? "linear-gradient(135deg, #6D1F2F, #7D2438)" : "transparent",
                boxShadow: isActive ? "0 4px 14px rgba(109,31,47,0.22)" : "none",
              }}
              onMouseEnter={e => { if (!isActive) (e.currentTarget as HTMLButtonElement).style.background = "#FFF5EE"; }}
              onMouseLeave={e => { if (!isActive) (e.currentTarget as HTMLButtonElement).style.background = "transparent"; }}
            >
              <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
                style={{ background: isActive ? "rgba(255,255,255,0.15)" : "rgba(109,31,47,0.07)" }}>
                <Icon className="w-4 h-4" style={{ color: isActive ? "#FFFFFF" : "#6D1F2F" }} />
              </div>
              <div className="flex-1 min-w-0">
                <p style={{ color: isActive ? "#FFFFFF" : "#2C1810", fontWeight: isActive ? 600 : 500, fontSize: "13px" }}>{label}</p>
                <p style={{ color: isActive ? "rgba(255,255,255,0.6)" : "#9CA3AF", fontSize: "11px" }}>{desc}</p>
              </div>
              {isActive && <ChevronRight className="w-3.5 h-3.5 opacity-60 shrink-0 text-white" />}
            </button>
          );
        })}
      </nav>

      {/* Logout */}
      <div className="px-3 pb-3 pt-2 border-t border-border">
        <button
          onClick={onLogout}
          className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm transition-colors hover:bg-red-50"
          style={{ color: "#E5484D" }}
        >
          <LogOut className="w-4 h-4" />
          <span style={{ fontWeight: 500, fontSize: "13px" }}>Sign Out</span>
        </button>
      </div>
    </aside>
    </>
  );
}
