import { AlertTriangle, AlertCircle, CheckCircle, Bell, RefreshCw, ShoppingCart } from "lucide-react";
import { toast } from "sonner";
import { useDatabase } from "../utils/db";

const levelConfig = {
  critical: { label: "Critical", color: "#E5484D", bg: "rgba(229,72,77,0.1)", icon: AlertCircle, border: "rgba(229,72,77,0.3)" },
  low: { label: "Low Stock", color: "#FFB020", bg: "rgba(255,176,32,0.1)", icon: AlertTriangle, border: "rgba(255,176,32,0.3)" },
  warning: { label: "Warning", color: "#F4C95D", bg: "rgba(244,201,93,0.15)", icon: AlertTriangle, border: "rgba(244,201,93,0.4)" },
};

export function LowStockAlerts() {
  const { ingredients, refillHistory, suppliers, loading } = useDatabase();

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-4 border-[#6D1F2F]/20 border-t-[#6D1F2F] animate-spin" />
      </div>
    );
  }

  // Define alert rules dynamically
  const alerts = ingredients.map(ing => {
    let alertLevel: "critical" | "low" | "warning" | "safe" = "safe";
    if (ing.quantity <= ing.minStock * 0.5) {
      alertLevel = "critical";
    } else if (ing.quantity <= ing.minStock) {
      alertLevel = "low";
    } else if (ing.quantity <= ing.minStock * 1.5) {
      alertLevel = "warning";
    }

    // Try to find supplier and last restocked date from history
    const refills = refillHistory.filter(h => h.ingredient.toLowerCase() === ing.name.toLowerCase());
    const lastRestocked = refills[0]?.date || "N/A";
    const supplier = refills[0]?.supplier || (suppliers[0]?.name || "Golden Grain Mills");

    // Mock usage based on minStock
    const dailyUsage = Math.max(0.1, Number((ing.minStock / 15).toFixed(2)));

    return {
      id: ing.id,
      name: ing.name,
      current: ing.quantity,
      unit: ing.unit,
      minimum: ing.minStock,
      reorderPoint: Number((ing.minStock * 1.5).toFixed(1)),
      lastRestocked,
      supplier,
      alertLevel,
      dailyUsage
    };
  });

  const activeAlerts = alerts.filter(a => a.alertLevel !== "safe");
  const safeItems = alerts.filter(a => a.alertLevel === "safe");

  const criticalCount = activeAlerts.filter(a => a.alertLevel === "critical").length;
  const lowCount = activeAlerts.filter(a => a.alertLevel === "low").length;
  const warningCount = activeAlerts.filter(a => a.alertLevel === "warning").length;

  const daysRemaining = (current: number, dailyUsage: number) => {
    if (dailyUsage <= 0) return 99;
    return Math.floor(current / dailyUsage);
  };

  const handleOrder = (name: string) => {
    toast.success(`Purchase order initiated for ${name}`);
  };

  const handleDismiss = (name: string) => {
    toast.success(`Alert for ${name} dismissed`);
  };

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-6">
      <p className="text-sm" style={{ color: "#6B7280" }}>Monitor and respond to low ingredient stock levels</p>

      {/* Summary Banner */}
      <div className="rounded-2xl p-5 border-2" style={{
        background: activeAlerts.length > 0 ? "rgba(229,72,77,0.04)" : "rgba(52,199,89,0.04)",
        borderColor: activeAlerts.length > 0 ? "rgba(229,72,77,0.2)" : "rgba(52,199,89,0.2)"
      }}>
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{
              background: activeAlerts.length > 0 ? "rgba(229,72,77,0.1)" : "rgba(52,199,89,0.1)"
            }}>
              <Bell className="w-6 h-6" style={{ color: activeAlerts.length > 0 ? "#E5484D" : "#34C759" }} />
            </div>
            <div>
              <p className="text-base" style={{ color: "#2C1810", fontWeight: 700 }}>
                {activeAlerts.length} Active Stock Alerts
              </p>
              <p className="text-sm" style={{ color: "#6B7280" }}>
                {activeAlerts.length > 0
                  ? `${criticalCount} critical · ${lowCount} low · ${warningCount} warnings — action recommended`
                  : "All ingredients are safely stocked!"}
              </p>
            </div>
          </div>
          {activeAlerts.length > 0 && (
            <div className="flex items-center gap-3">
              <div className="text-center px-4 py-2 rounded-xl" style={{ background: "rgba(229,72,77,0.1)" }}>
                <p className="text-2xl" style={{ color: "#E5484D", fontWeight: 800 }}>{criticalCount}</p>
                <p className="text-xs" style={{ color: "#E5484D" }}>Critical</p>
              </div>
              <div className="text-center px-4 py-2 rounded-xl" style={{ background: "rgba(255,176,32,0.1)" }}>
                <p className="text-2xl" style={{ color: "#FFB020", fontWeight: 800 }}>{lowCount}</p>
                <p className="text-xs" style={{ color: "#FFB020" }}>Low Stock</p>
              </div>
              <div className="text-center px-4 py-2 rounded-xl" style={{ background: "rgba(244,201,93,0.15)" }}>
                <p className="text-2xl" style={{ color: "#6D1F2F", fontWeight: 800 }}>{warningCount}</p>
                <p className="text-xs" style={{ color: "#6D1F2F" }}>Warning</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Alert Cards */}
      <div className="space-y-3">
        <h3 style={{ color: "#2C1810", fontWeight: 600 }}>Ingredients Requiring Attention</h3>

        {activeAlerts.length === 0 && (
          <div className="bg-card rounded-2xl p-8 text-center border border-border shadow-sm">
            <CheckCircle className="w-12 h-12 mx-auto mb-3" style={{ color: "#34C759" }} />
            <p className="text-sm font-semibold" style={{ color: "#2C1810" }}>No low stock alerts</p>
            <p className="text-xs mt-1" style={{ color: "#6B7280" }}>All ingredients are currently above safe minimum levels.</p>
          </div>
        )}

        {["critical", "low", "warning"].map(level => {
          const items = activeAlerts.filter(a => a.alertLevel === level);
          if (!items.length) return null;
          const conf = levelConfig[level as keyof typeof levelConfig];
          const Icon = conf.icon;

          return (
            <div key={level} className="pt-2">
              <div className="flex items-center gap-2 mb-3">
                <Icon className="w-4 h-4" style={{ color: conf.color }} />
                <p className="text-xs uppercase tracking-wide" style={{ color: conf.color, fontWeight: 700 }}>
                  {conf.label} ({items.length})
                </p>
              </div>
              <div className="space-y-3">
                {items.map(item => {
                  const days = daysRemaining(item.current, item.dailyUsage);
                  const pct = Math.max(5, Math.min(100, (item.current / item.reorderPoint) * 100));
                  return (
                    <div
                      key={item.id}
                      className="bg-card rounded-2xl p-5 border shadow-sm"
                      style={{ borderColor: conf.border }}
                    >
                      <div className="flex items-start justify-between flex-wrap gap-3">
                        <div className="flex items-start gap-4">
                          <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: conf.bg }}>
                            <Icon className="w-5 h-5" style={{ color: conf.color }} />
                          </div>
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <p className="text-sm" style={{ color: "#2C1810", fontWeight: 600 }}>{item.name}</p>
                              <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: conf.bg, color: conf.color, fontWeight: 600 }}>
                                {conf.label}
                              </span>
                            </div>
                            <div className="flex flex-wrap gap-4 text-xs" style={{ color: "#6B7280" }}>
                              <span>
                                Current: <strong style={{ color: conf.color }}>{item.current} {item.unit}</strong>
                              </span>
                              <span>Minimum: {item.minimum} {item.unit}</span>
                              <span>Reorder at: {item.reorderPoint} {item.unit}</span>
                              <span>Daily usage: ~{item.dailyUsage} {item.unit}</span>
                            </div>
                            <div className="mt-2">
                              <div className="h-2 w-48 rounded-full overflow-hidden" style={{ background: "#F5EDE0" }}>
                                <div className="h-full rounded-full" style={{ width: `${pct}%`, background: conf.color }} />
                              </div>
                            </div>
                            <p className="text-xs mt-1.5" style={{ color: days <= 2 ? "#E5484D" : "#6B7280" }}>
                              ⏱ Estimated <strong>{days}</strong> day{days !== 1 ? "s" : ""} remaining
                              · Last restocked: {item.lastRestocked}
                            </p>
                          </div>
                        </div>
                        <div className="flex gap-2 shrink-0">
                          <button
                            onClick={() => handleDismiss(item.name)}
                            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs border border-border transition-colors hover:bg-muted"
                            style={{ color: "#6B7280" }}
                          >
                            <RefreshCw className="w-3 h-3" />
                            Dismiss
                          </button>
                          <button
                            onClick={() => handleOrder(item.name)}
                            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs text-white transition-all hover:opacity-80 shadow-sm"
                            style={{ background: conf.color, fontWeight: 500 }}
                          >
                            <ShoppingCart className="w-3 h-3" />
                            Order Now
                          </button>
                        </div>
                      </div>
                      <div className="mt-3 pt-3 border-t border-border">
                        <p className="text-xs" style={{ color: "#6B7280" }}>
                          Supplier: <span style={{ color: "#2C1810", fontWeight: 500 }}>{item.supplier}</span>
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Safe Stock */}
      <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-border flex items-center gap-2">
          <CheckCircle className="w-4 h-4" style={{ color: "#34C759" }} />
          <h3 style={{ color: "#2C1810", fontWeight: 600 }}>Well-Stocked Ingredients</h3>
        </div>
        <div className="p-4 grid grid-cols-2 md:grid-cols-4 gap-3">
          {safeItems.map((item, i) => {
            const pct = Math.min(100, (item.current / (item.minimum * 3)) * 100);
            return (
              <div key={i} className="p-3 rounded-xl" style={{ background: "#FFF9F0" }}>
                <div className="flex items-center justify-between mb-1">
                  <p className="text-xs" style={{ color: "#2C1810", fontWeight: 500 }}>{item.name}</p>
                  <CheckCircle className="w-3.5 h-3.5" style={{ color: "#34C759" }} />
                </div>
                <p className="text-base" style={{ color: "#2C1810", fontWeight: 700 }}>
                  {item.current} <span className="text-xs font-normal" style={{ color: "#6B7280" }}>{item.unit}</span>
                </p>
                <div className="h-1.5 rounded-full overflow-hidden mt-2" style={{ background: "rgba(44,24,16,0.08)" }}>
                  <div className="h-full rounded-full" style={{ width: `${Math.min(pct, 100)}%`, background: "#34C759" }} />
                </div>
                <p className="text-xs mt-1" style={{ color: "#6B7280" }}>Min: {item.minimum} {item.unit}</p>
              </div>
            );
          })}
          {safeItems.length === 0 && (
            <div className="col-span-4 py-8 text-center text-xs" style={{ color: "#6B7280" }}>
              No ingredients are in safe stock!
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
