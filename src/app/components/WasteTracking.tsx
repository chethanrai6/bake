import { useState } from "react";
import { Plus, X, AlertTriangle } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { toast } from "sonner";
import { useDatabase } from "../utils/db";
import { USD_TO_INR } from "../utils/currency";

const R = USD_TO_INR;
const reasons = ["Spill", "Expired", "Contamination", "Overheated", "Broken", "Burnt", "Other"];

interface WasteTrackingProps {
  user?: {
    name: string;
  };
}

const rupFmt = (v: number) => `₹${(v / 1000).toFixed(1)}k`;

export function WasteTracking({ user }: WasteTrackingProps) {
  const {
    ingredients,
    wasteLogs,
    recordWaste,
    loading
  } = useDatabase();

  const [showForm, setShowForm] = useState(false);
  
  // Format ingredients to map names and cost details
  const activeIngredients = ingredients;

  const [form, setForm] = useState({
    ingredient: "",
    quantity: 0,
    reason: reasons[0],
    date: new Date().toISOString().slice(0, 10)
  });

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-4 border-[#6D1F2F]/20 border-t-[#6D1F2F] animate-spin" />
      </div>
    );
  }

  const activeIngredientName = form.ingredient || (activeIngredients[0]?.name || "");
  const selectedIng = activeIngredients.find(i => i.name === activeIngredientName) || { name: "", unit: "kg", costPerUnit: 0 };

  const entries = wasteLogs.map(w => ({
    id: w.id,
    ingredient: w.ingredient,
    quantity: w.quantity,
    unit: w.unit,
    reason: w.reason,
    date: w.date,
    cost: w.cost || 0
  }));

  const totalCost = entries.reduce((s, e) => s + e.cost, 0);

  const mostWasted = Object.entries(
    entries.reduce((acc, e) => { acc[e.ingredient] = (acc[e.ingredient] ?? 0) + e.cost; return acc; }, {} as Record<string, number>)
  ).sort((a, b) => b[1] - a[1])[0];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.quantity <= 0) { toast.error("Please enter a valid quantity"); return; }
    if (!activeIngredientName) { toast.error("Please select an ingredient"); return; }

    const ing = activeIngredients.find(i => i.name === activeIngredientName);
    if (!ing) return;
    
    if (form.quantity > ing.quantity) {
      toast.error(`Exceeds available stock: ${ing.name} has only ${ing.quantity} ${ing.unit} in stock`);
      return;
    }

    try {
      await recordWaste({
        ingredientId: ing.id,
        ingredient: activeIngredientName,
        quantity: form.quantity,
        unit: ing.unit,
        reason: form.reason,
        date: form.date,
      });

      toast.success("Waste entry recorded");
      setShowForm(false);
      setForm({
        ingredient: activeIngredients[0]?.name || "",
        quantity: 0,
        reason: reasons[0],
        date: new Date().toISOString().slice(0, 10)
      });
    } catch (error) {
      toast.error("Failed to record waste");
    }
  };

  // Group waste cost by month
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const last6Months = Array.from({ length: 6 }).map((_, idx) => {
    const d = new Date();
    d.setMonth(d.getMonth() - (5 - idx));
    return {
      month: months[d.getMonth()],
      monthIndex: d.getMonth(),
      year: d.getFullYear(),
      cost: 0
    };
  });

  entries.forEach(entry => {
    const d = new Date(entry.date);
    if (!isNaN(d.getTime())) {
      const mIdx = d.getMonth();
      const y = d.getFullYear();
      const target = last6Months.find(m => m.monthIndex === mIdx && m.year === y);
      if (target) {
        target.cost += entry.cost;
      }
    }
  });

  const hasWasteData = last6Months.some(m => m.cost > 0);
  const monthlyWasteData = hasWasteData ? last6Months : [
    { month: "Jan", cost: 42 * R },
    { month: "Feb", cost: 28 * R },
    { month: "Mar", cost: 56 * R },
    { month: "Apr", cost: 38 * R },
    { month: "May", cost: 71 * R },
    { month: "Jun", cost: 10 * R },
  ];

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-sm" style={{ color: "#6B7280" }}>Track ingredient waste and analyze patterns</p>
        <button onClick={() => {
          setForm({
            ingredient: activeIngredients[0]?.name || "",
            quantity: 0,
            reason: reasons[0],
            date: new Date().toISOString().slice(0, 10)
          });
          setShowForm(true);
        }}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-white text-sm hover:opacity-90 shadow-sm"
          style={{ background: "#6D1F2F", fontWeight: 500 }}>
          <Plus className="w-4 h-4" /> Record Waste
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <div className="bg-card rounded-2xl p-5 border border-border shadow-sm">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3" style={{ background: "rgba(229,72,77,0.1)" }}>
            <AlertTriangle className="w-5 h-5" style={{ color: "#E5484D" }} />
          </div>
          <p className="text-xs" style={{ color: "#6B7280" }}>Total Waste Cost</p>
          <p className="text-2xl mt-1" style={{ color: "#E5484D", fontWeight: 700 }}>
            ₹{totalCost.toLocaleString("en-IN", { maximumFractionDigits: 0 })}
          </p>
          <p className="text-xs mt-1" style={{ color: "#6B7280" }}>Overall logs</p>
        </div>
        <div className="bg-card rounded-2xl p-5 border border-border shadow-sm">
          <p className="text-xs mb-3" style={{ color: "#6B7280" }}>Most Wasted</p>
          <p className="text-lg" style={{ color: "#2C1810", fontWeight: 600 }}>{mostWasted?.[0] ?? "—"}</p>
          <p className="text-sm mt-1" style={{ color: "#E5484D" }}>
            ₹{mostWasted?.[1] ? mostWasted[1].toLocaleString("en-IN", { maximumFractionDigits: 0 }) : "0"} lost
          </p>
        </div>
        <div className="bg-card rounded-2xl p-5 border border-border shadow-sm">
          <p className="text-xs mb-3" style={{ color: "#6B7280" }}>Total Entries</p>
          <p className="text-2xl" style={{ color: "#2C1810", fontWeight: 700 }}>{entries.length}</p>
          <p className="text-sm mt-1" style={{ color: "#6B7280" }}>Recorded events</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 bg-card rounded-2xl p-5 border border-border shadow-sm">
          <h3 className="mb-4" style={{ color: "#2C1810", fontWeight: 600 }}>Monthly Waste Cost (₹)</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={monthlyWasteData} barSize={28}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(44,24,16,0.06)" vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 12, fill: "#6B7280" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "#6B7280" }} axisLine={false} tickLine={false} tickFormatter={rupFmt} />
              <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid rgba(44,24,16,0.1)" }}
                formatter={(v: number) => [`₹${v.toLocaleString("en-IN",{maximumFractionDigits:0})}`, "Waste Cost"]} />
              <Bar dataKey="cost" fill="#E5484D" radius={[6, 6, 0, 0]} fillOpacity={0.85} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-card rounded-2xl p-5 border border-border shadow-sm">
          <h3 className="mb-4" style={{ color: "#2C1810", fontWeight: 600 }}>By Reason</h3>
          <div className="space-y-3">
            {Object.entries(entries.reduce((acc, e) => { acc[e.reason] = (acc[e.reason] ?? 0) + 1; return acc; }, {} as Record<string, number>))
              .sort((a, b) => b[1] - a[1]).map(([reason, count]) => (
              <div key={reason} className="flex items-center justify-between">
                <span className="text-sm" style={{ color: "#2C1810" }}>{reason}</span>
                <div className="flex items-center gap-2">
                  <div className="w-16 h-1.5 rounded-full overflow-hidden" style={{ background: "#F5EDE0" }}>
                    <div className="h-full rounded-full" style={{ width: `${(count / Math.max(1, entries.length)) * 100}%`, background: "#E5484D" }} />
                  </div>
                  <span className="text-xs w-4 text-right" style={{ color: "#6B7280" }}>{count}</span>
                </div>
              </div>
            ))}
            {entries.length === 0 && (
              <div className="py-8 text-center text-sm" style={{ color: "#6B7280" }}>
                No waste logs recorded.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
        <table className="w-full">
          <thead>
            <tr style={{ background: "#FFF9F0", borderBottom: "1px solid rgba(44,24,16,0.08)" }}>
              {["Date", "Ingredient", "Quantity", "Reason", "Cost Lost"].map(h => (
                <th key={h} className="text-left px-4 py-3 text-xs uppercase tracking-wide" style={{ color: "#6B7280", fontWeight: 600 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {entries.map(e => (
              <tr key={e.id} className="border-b transition-colors hover:bg-muted/40" style={{ borderColor: "rgba(44,24,16,0.06)" }}>
                <td className="px-4 py-3.5 text-sm" style={{ color: "#6B7280" }}>{e.date}</td>
                <td className="px-4 py-3.5 text-sm" style={{ color: "#2C1810", fontWeight: 500 }}>{e.ingredient}</td>
                <td className="px-4 py-3.5 text-sm" style={{ color: "#2C1810" }}>{e.quantity} {e.unit}</td>
                <td className="px-4 py-3.5">
                  <span className="text-xs px-2.5 py-1 rounded-full" style={{ background: "rgba(229,72,77,0.1)", color: "#E5484D", fontWeight: 500 }}>{e.reason}</span>
                </td>
                <td className="px-4 py-3.5 text-sm" style={{ color: "#E5484D", fontWeight: 600 }}>
                  ₹{e.cost.toLocaleString("en-IN", { maximumFractionDigits: 0 })}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {entries.length === 0 && (
          <div className="py-16 text-center text-sm" style={{ color: "#6B7280" }}>
            No waste logs found
          </div>
        )}
      </div>

      {/* Modal */}
      {showForm && activeIngredients.length > 0 && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.4)" }}>
          <div className="bg-card rounded-2xl shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between px-6 py-4 border-b border-border">
              <h2 style={{ color: "#2C1810", fontWeight: 600 }}>Record Waste</h2>
              <button onClick={() => setShowForm(false)} className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-muted">
                <X className="w-4 h-4" style={{ color: "#6B7280" }} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block mb-1.5 text-sm" style={{ color: "#2C1810", fontWeight: 500 }}>Ingredient</label>
                <select value={activeIngredientName} onChange={e => setForm(f => ({ ...f, ingredient: e.target.value }))}
                  className="w-full px-3 py-2.5 rounded-xl border border-border outline-none text-sm" style={{ background: "#FFF9F0", color: "#2C1810" }}>
                  {activeIngredients.map(i => <option key={i.name} value={i.name}>{i.name} (In stock: {i.quantity} {i.unit})</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block mb-1.5 text-sm" style={{ color: "#2C1810", fontWeight: 500 }}>Quantity ({selectedIng.unit})</label>
                  <input type="number" min={0} step={0.01} value={form.quantity || ""}
                    onChange={e => setForm(f => ({ ...f, quantity: parseFloat(e.target.value) || 0 }))}
                    className="w-full px-3 py-2.5 rounded-xl border border-border outline-none text-sm" style={{ background: "#FFF9F0", color: "#2C1810" }} />
                </div>
                <div>
                  <label className="block mb-1.5 text-sm" style={{ color: "#2C1810", fontWeight: 500 }}>Reason</label>
                  <select value={form.reason} onChange={e => setForm(f => ({ ...f, reason: e.target.value }))}
                    className="w-full px-3 py-2.5 rounded-xl border border-border outline-none text-sm" style={{ background: "#FFF9F0", color: "#2C1810" }}>
                    {reasons.map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block mb-1.5 text-sm" style={{ color: "#2C1810", fontWeight: 500 }}>Date</label>
                <input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
                  className="w-full px-3 py-2.5 rounded-xl border border-border outline-none text-sm" style={{ background: "#FFF9F0", color: "#2C1810" }} />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowForm(false)}
                  className="flex-1 py-2.5 rounded-xl border border-border text-sm" style={{ color: "#2C1810" }}>Cancel</button>
                <button type="submit"
                  className="flex-1 py-2.5 rounded-xl text-white text-sm hover:opacity-90" style={{ background: "#E5484D", fontWeight: 500 }}>Record Waste</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
