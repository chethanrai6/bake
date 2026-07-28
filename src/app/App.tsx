import { useState } from "react";
import { Toaster } from "sonner";
import { DatabaseProvider, useDatabase } from "./utils/db";

// Auth
import { LoginPage, type AuthUser } from "./components/LoginPage";

// Admin layout
import { Sidebar, type Page } from "./components/Sidebar";
import { TopNav } from "./components/TopNav";
import { Dashboard } from "./components/Dashboard";
import { Ingredients } from "./components/Ingredients";
import { StockRefill } from "./components/StockRefill";
import { CostAnalysis } from "./components/CostAnalysis";
import { Reports } from "./components/Reports";
import { Workers } from "./components/Workers";
import { Suppliers } from "./components/Suppliers";
import { LowStockAlerts } from "./components/LowStockAlerts";
import { Settings } from "./components/Settings";
import { ProductionHistory } from "./components/ProductionHistory";
import { WasteTracking } from "./components/WasteTracking";
import { Production } from "./components/Production";

// Worker layout
import { WorkerSidebar, type WorkerPage } from "./components/WorkerSidebar";
import { WorkerDashboard } from "./components/WorkerDashboard";
import { WorkerStockView } from "./components/WorkerStockView";

/* ────────────────────────────────────────────── */

const adminPageTitles: Record<Page, string> = {
  dashboard: "Admin Dashboard",
  "worker-dashboard": "Worker Dashboard",
  ingredients: "Ingredient Inventory",
  "stock-refill": "Stock Refill",
  production: "New Production Entry",
  "production-history": "Production History",
  "cost-analysis": "Cost Analysis",
  reports: "Reports",
  workers: "Worker Management",
  suppliers: "Supplier Management",
  "waste-tracking": "Waste Tracking",
  "low-stock": "Low Stock Alert Center",
  settings: "Settings",
};

const workerPageTitles: Record<WorkerPage, string> = {
  "worker-dashboard": "My Dashboard",
  production: "Log Production",
  "production-history": "My History",
  "waste-tracking": "Report Waste",
  "stock-view": "Stock View",
};

/* ────────────────────────────────────────────── */

function AdminApp({ user, onLogout }: { user: AuthUser; onLogout: () => void }) {
  const [page, setPage] = useState<Page>("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { ingredients, loading } = useDatabase();

  const lowStockCount = ingredients.filter(i => i.quantity <= i.minStock).length;

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center" style={{ background: "#FFF9F0" }}>
        <div className="w-8 h-8 rounded-full border-4 border-[#6D1F2F]/20 border-t-[#6D1F2F] animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: "#FFF9F0", fontFamily: "'Poppins','Inter',system-ui,sans-serif" }}>
      <Sidebar activePage={page} onNavigate={setPage} lowStockCount={lowStockCount} onLogout={onLogout} user={user} mobileOpen={sidebarOpen} onMobileClose={() => setSidebarOpen(false)} />
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        <TopNav pageTitle={adminPageTitles[page]} user={user} onLogout={onLogout} onMenuOpen={() => setSidebarOpen(true)} />
        <main className="flex-1 overflow-hidden flex flex-col">
          {page === "dashboard"           && <Dashboard />}
          {page === "ingredients"         && <Ingredients />}
          {page === "stock-refill"        && <StockRefill user={user} />}
          {page === "production"          && <Production user={user} />}
          {page === "production-history"  && <ProductionHistory />}
          {page === "cost-analysis"       && <CostAnalysis />}
          {page === "reports"             && <Reports />}
          {page === "workers"             && <Workers />}
          {page === "suppliers"           && <Suppliers />}
          {page === "waste-tracking"      && <WasteTracking user={user} />}
          {page === "low-stock"           && <LowStockAlerts />}
          {page === "settings"            && <Settings />}
          {/* worker-dashboard is accessible to admin for preview */}
          {page === "worker-dashboard"    && <WorkerDashboard user={user} />}
        </main>
      </div>
    </div>
  );
}

function WorkerApp({ user, onLogout }: { user: AuthUser; onLogout: () => void }) {
  const [page, setPage] = useState<WorkerPage>("worker-dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { loading } = useDatabase();

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center" style={{ background: "#FFF9F0" }}>
        <div className="w-8 h-8 rounded-full border-4 border-[#6D1F2F]/20 border-t-[#6D1F2F] animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: "#FFF9F0", fontFamily: "'Poppins','Inter',system-ui,sans-serif" }}>
      <WorkerSidebar activePage={page} onNavigate={setPage} user={user} onLogout={onLogout} mobileOpen={sidebarOpen} onMobileClose={() => setSidebarOpen(false)} />
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        <TopNav pageTitle={workerPageTitles[page]} user={user} onLogout={onLogout} workerMode onMenuOpen={() => setSidebarOpen(true)} />
        <main className="flex-1 overflow-hidden flex flex-col">
          {page === "worker-dashboard"   && <WorkerDashboard user={user} />}
          {page === "production"         && <Production user={user} />}
          {page === "production-history" && <ProductionHistory />}
          {page === "waste-tracking"     && <WasteTracking user={user} />}
          {page === "stock-view"         && <WorkerStockView />}
        </main>
      </div>
    </div>
  );
}

/* ────────────────────────────────────────────── */

export default function App() {
  {/* MARKER-MAKE-KIT-INVOKED */}
  const [user, setUser] = useState<AuthUser | null>(null);

  const handleLogout = () => setUser(null);

  if (!user) return (
    <DatabaseProvider>
      <Toaster position="top-right" richColors toastOptions={{ style: { borderRadius: "14px", fontFamily: "'Poppins','Inter',system-ui,sans-serif", fontSize: "13px", fontWeight: 500 } }} />
      <LoginPage onLogin={setUser} />
    </DatabaseProvider>
  );

  return (
    <DatabaseProvider>
      <Toaster position="top-right" richColors toastOptions={{ style: { borderRadius: "14px", fontFamily: "'Poppins','Inter',system-ui,sans-serif", fontSize: "13px", fontWeight: 500 } }} />
      {user.role === "admin"
        ? <AdminApp user={user} onLogout={handleLogout} />
        : <WorkerApp user={user} onLogout={handleLogout} />
      }
    </DatabaseProvider>
  );
}
