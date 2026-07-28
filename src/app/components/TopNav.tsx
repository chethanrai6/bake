import { useState } from "react";
import { Search, Bell, Calendar, ChevronDown, LogOut, ShieldCheck, ChefHat, Menu } from "lucide-react";
import type { AuthUser } from "./LoginPage";

interface TopNavProps {
  pageTitle: string;
  user: AuthUser;
  onLogout: () => void;
  workerMode?: boolean;
  onMenuOpen?: () => void;
}

export function TopNav({ pageTitle, user, onLogout, workerMode = false, onMenuOpen }: TopNavProps) {
  const [search, setSearch] = useState("");
  const [profileOpen, setProfileOpen] = useState(false);

  const today = new Date().toLocaleDateString("en-US", {
    weekday: "short", month: "short", day: "numeric", year: "numeric",
  });

  const RoleIcon = user.role === "admin" ? ShieldCheck : ChefHat;
  const roleBg   = user.role === "admin" ? "rgba(109,31,47,0.08)" : "rgba(244,201,93,0.18)";
  const roleColor = "#6D1F2F";
  const roleLabel = user.role === "admin" ? "Admin" : user.position;

  return (
    <header
      className="h-16 bg-white border-b border-border flex items-center px-6 gap-4 shrink-0"
      style={{ boxShadow: "0 1px 0 rgba(44,24,16,0.06)" }}
    >
      {/* Hamburger — mobile only */}
      <button
        onClick={onMenuOpen}
        className="md:hidden w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-colors hover:bg-muted"
        aria-label="Open menu"
      >
        <Menu className="w-5 h-5" style={{ color: "#4B3535" }} />
      </button>

      {/* Page title */}
      <div className="flex-1 min-w-0">
        <h1 className="truncate" style={{ color: "#2C1810", fontWeight: 600, fontSize: "16px" }}>
          {pageTitle}
        </h1>
      </div>

      {/* Search — admin only */}
      {!workerMode && (
        <div className="relative hidden md:flex">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "#9CA3AF" }} />
          <input
            value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search anything…"
            className="pl-9 pr-4 py-2 rounded-xl border border-border text-sm outline-none transition-all w-52 focus:w-72"
            style={{ background: "#FFF9F0", color: "#2C1810", fontFamily: "inherit" }}
            onFocus={e => (e.target as HTMLInputElement).style.borderColor = "#6D1F2F"}
            onBlur={e => (e.target as HTMLInputElement).style.borderColor = "rgba(44,24,16,0.1)"}
          />
        </div>
      )}

      {/* Date */}
      <div className="hidden lg:flex items-center gap-2 px-3 py-2 rounded-xl" style={{ background: "#FFF9F0" }}>
        <Calendar className="w-3.5 h-3.5" style={{ color: "#6D1F2F" }} />
        <span style={{ color: "#2C1810", fontWeight: 500, fontSize: "13px" }}>{today}</span>
      </div>

      {/* Notifications */}
      <button className="relative w-9 h-9 rounded-xl flex items-center justify-center transition-colors hover:bg-muted">
        <Bell className="w-4.5 h-4.5" style={{ color: "#4B3535" }} />
        <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full" style={{ background: "#E5484D" }} />
      </button>

      {/* Profile dropdown */}
      <div className="relative">
        <button
          onClick={() => setProfileOpen(v => !v)}
          className="flex items-center gap-2.5 px-3 py-2 rounded-xl transition-colors hover:bg-muted"
        >
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center text-white shrink-0"
            style={{ background: "linear-gradient(135deg, #6D1F2F, #8B2739)", fontSize: "11px", fontWeight: 800 }}
          >
            {user.avatar}
          </div>
          <div className="hidden md:block text-left">
            <p style={{ color: "#2C1810", fontWeight: 600, fontSize: "13px", lineHeight: 1.2 }}>{user.name}</p>
            <p style={{ color: "#9CA3AF", fontSize: "11px", lineHeight: 1.2 }}>{user.position}</p>
          </div>
          <span
            className="hidden md:inline-flex items-center gap-1 px-2 py-0.5 rounded-full"
            style={{ background: roleBg, color: roleColor, fontSize: "11px", fontWeight: 700 }}
          >
            <RoleIcon className="w-2.5 h-2.5" />
            {roleLabel}
          </span>
          <ChevronDown className="w-3.5 h-3.5 hidden md:block" style={{ color: "#9CA3AF" }} />
        </button>

        {/* Dropdown */}
        {profileOpen && (
          <>
            <div className="fixed inset-0 z-30" onClick={() => setProfileOpen(false)} />
            <div
              className="absolute right-0 top-full mt-2 w-56 rounded-2xl border border-border shadow-xl z-40 overflow-hidden"
              style={{ background: "#FFFFFF" }}
            >
              <div className="px-4 py-3 border-b border-border" style={{ background: "#FFF9F0" }}>
                <p style={{ color: "#2C1810", fontWeight: 600, fontSize: "13px" }}>{user.name}</p>
                <p style={{ color: "#9CA3AF", fontSize: "12px" }}>{user.email}</p>
                <span
                  className="inline-flex items-center gap-1 mt-1.5 px-2 py-0.5 rounded-full"
                  style={{ background: roleBg, color: roleColor, fontSize: "11px", fontWeight: 700 }}
                >
                  <RoleIcon className="w-2.5 h-2.5" />
                  {user.role === "admin" ? "Administrator" : user.position}
                </span>
              </div>
              <div className="p-2">
                <button
                  onClick={() => { setProfileOpen(false); onLogout(); }}
                  className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm transition-colors hover:bg-red-50"
                  style={{ color: "#E5484D" }}
                >
                  <LogOut className="w-4 h-4" />
                  <span style={{ fontWeight: 500 }}>Sign Out</span>
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </header>
  );
}
