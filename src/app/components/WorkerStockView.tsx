import { Package, AlertTriangle, CheckCircle, TrendingDown } from "lucide-react";
import { useDatabase } from "../utils/db";

function getLevel(current: number, min: number, max: number) {
  const pct = max > 0 ? (current / max) * 100 : 0;
  if (current <= min * 0.5) return { label: "Critical", color: "#E5484D", bg: "rgba(229,72,77,0.1)", bar: "#E5484D", pct };
  if (current <= min) return { label: "Low", color: "#FFB020", bg: "rgba(255,176,32,0.1)", bar: "#FFB020", pct };
  return { label: "OK", color: "#34C759", bg: "rgba(52,199,89,0.1)", bar: "#34C759", pct };
}

export function WorkerStockView() {
  const { ingredients, loading } = useDatabase();

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-4 border-[#6D1F2F]/20 border-t-[#6D1F2F] animate-spin" />
      </div>
    );
  }

  const mappedIngredients = ingredients.map(ing => ({
    name: ing.name,
    current: ing.quantity,
    unit: ing.unit,
    min: ing.minStock,
    max: ing.minStock * 4 // estimate max stock
  }));

  const critical = mappedIngredients.filter(i => i.current <= i.min * 0.5);
  const low = mappedIngredients.filter(i => i.current > i.min * 0.5 && i.current <= i.min);
  const ok = mappedIngredients.filter(i => i.current > i.min);

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-6">
      <div>
        <p className="text-sm" style={{ color: "#6B7280" }}>Read-only stock levels — contact your admin to request a refill</p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Critical", count: critical.length, color: "#E5484D", bg: "rgba(229,72,77,0.08)", icon: AlertTriangle },
          { label: "Low Stock", count: low.length, color: "#FFB020", bg: "rgba(255,176,32,0.08)", icon: TrendingDown },
          { label: "Well Stocked", count: ok.length, color: "#34C759", bg: "rgba(52,199,89,0.08)", icon: CheckCircle },
        ].map(({ label, count, color, bg, icon: Icon }) => (
          <div key={label} className="bg-card rounded-2xl p-4 border border-border shadow-sm text-center">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center mx-auto mb-2" style={{ background: bg }}>
              <Icon className="w-4.5 h-4.5" style={{ color }} />
            </div>
            <p className="text-2xl" style={{ color, fontWeight: 800 }}>{count}</p>
            <p className="text-xs mt-0.5" style={{ color: "#6B7280" }}>{label}</p>
          </div>
        ))}
      </div>

      {/* Alert banner if critical */}
      {critical.length > 0 && (
        <div className="flex items-start gap-3 p-4 rounded-2xl" style={{ background: "rgba(229,72,77,0.06)", border: "1.5px solid rgba(229,72,77,0.2)" }}>
          <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" style={{ color: "#E5484D" }} />
          <div>
            <p style={{ color: "#E5484D", fontWeight: 600, fontSize: "13px" }}>Critical stock levels detected</p>
            <p style={{ color: "#6B7280", fontSize: "12px", marginTop: "2px" }}>
              Please notify your supervisor: {critical.map(i => i.name).join(", ")}
            </p>
          </div>
        </div>
      )}

      {/* Stock cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {mappedIngredients.map((ing, i) => {
          const { label, color, bg, bar, pct } = getLevel(ing.current, ing.min, ing.max);
          return (
            <div key={i} className="bg-card rounded-2xl p-4 border border-border shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: "#FEF3D0" }}>
                    <Package className="w-4 h-4" style={{ color: "#6D1F2F" }} />
                  </div>
                  <p style={{ color: "#2C1810", fontWeight: 600, fontSize: "13px" }}>{ing.name}</p>
                </div>
                <span className="text-xs px-2.5 py-1 rounded-full" style={{ background: bg, color, fontWeight: 600 }}>
                  {label}
                </span>
              </div>
              <div className="flex items-end justify-between mb-2">
                <p style={{ color: color, fontWeight: 800, fontSize: "22px" }}>
                  {ing.current}
                  <span style={{ color: "#9CA3AF", fontWeight: 400, fontSize: "13px", marginLeft: "4px" }}>{ing.unit}</span>
                </p>
                <p style={{ color: "#9CA3AF", fontSize: "12px" }}>Min: {ing.min} {ing.unit}</p>
              </div>
              <div className="h-2 rounded-full overflow-hidden" style={{ background: "rgba(44,24,16,0.07)" }}>
                <div className="h-full rounded-full transition-all" style={{ width: `${Math.min(pct, 100)}%`, background: bar }} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
