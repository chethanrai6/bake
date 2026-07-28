import { useState, useMemo } from "react";
import {
  ChefHat, Clock, CheckCircle, AlertTriangle, Plus, X,
  Package, Coffee, Sun, Moon,
  ClipboardCheck, Zap, Target, Award, ChevronRight
} from "lucide-react";
import { toast } from "sonner";
import type { AuthUser } from "./LoginPage";
import { useDatabase } from "../utils/db";

/* ─────────────────────────────────────────────
   Greeting banner
   ───────────────────────────────────────────── */
function GreetingBanner({ worker }: { worker: { name: string; role: string; shift: string; avatar: string } }) {
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  const ShiftIcon = hour < 12 ? Sun : hour < 17 ? Coffee : Moon;

  return (
    <div
      className="rounded-2xl p-6 flex items-center justify-between flex-wrap gap-4"
      style={{
        background: "linear-gradient(135deg, #6D1F2F 0%, #8B2739 50%, #4A1020 100%)",
        boxShadow: "0 8px 32px rgba(109,31,47,0.25)",
      }}
    >
      <div className="flex items-center gap-4">
        <div
          className="w-14 h-14 rounded-2xl flex items-center justify-center text-xl font-bold text-white shadow-lg"
          style={{ background: "rgba(244,201,93,0.25)", border: "2px solid rgba(244,201,93,0.4)" }}
        >
          {worker.avatar}
        </div>
        <div>
          <p className="text-sm" style={{ color: "rgba(244,201,93,0.85)", fontWeight: 500 }}>
            {greeting}, welcome back 👋
          </p>
          <h2 className="text-xl text-white" style={{ fontWeight: 700 }}>{worker.name}</h2>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-xs px-2.5 py-1 rounded-full" style={{ background: "rgba(244,201,93,0.2)", color: "#F4C95D", fontWeight: 600 }}>
              {worker.role}
            </span>
            <span className="text-xs flex items-center gap-1" style={{ color: "rgba(255,255,255,0.65)" }}>
              <ShiftIcon className="w-3 h-3" />
              {worker.shift} Shift
            </span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="text-center px-5 py-3 rounded-xl" style={{ background: "rgba(255,255,255,0.1)", backdropFilter: "blur(8px)" }}>
          <p className="text-2xl text-white" style={{ fontWeight: 800, fontVariantNumeric: "tabular-nums" }}>
            {new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}
          </p>
          <p className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.6)" }}>
            {new Date().toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" })}
          </p>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   Stat mini-card
   ───────────────────────────────────────────── */
function StatCard({
  label, value, sub, icon: Icon, iconBg, iconColor, accent,
}: {
  label: string; value: string | number; sub: string;
  icon: React.ElementType; iconBg: string; iconColor: string; accent?: boolean;
}) {
  return (
    <div
      className="bg-card rounded-2xl p-4 border border-border shadow-sm flex items-center gap-4 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
      style={accent ? { background: "#6D1F2F", border: "none" } : {}}
    >
      <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0" style={{ background: iconBg }}>
        <Icon className="w-5 h-5" style={{ color: iconColor }} />
      </div>
      <div className="min-w-0">
        <p className="text-xl truncate" style={{ color: accent ? "#FFFFFF" : "#2C1810", fontWeight: 700 }}>{value}</p>
        <p className="text-xs truncate" style={{ color: accent ? "rgba(255,255,255,0.75)" : "#6B7280" }}>{label}</p>
        <p className="text-xs truncate" style={{ color: accent ? "rgba(255,255,255,0.55)" : "#9CA3AF" }}>{sub}</p>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   Today's Task List
   ───────────────────────────────────────────── */
function TaskChecklist() {
  const { tasks, updateTask } = useDatabase();

  const toggle = async (id: string, currentDone: number, target: number, label: string) => {
    const newDone = currentDone >= target ? 0 : target;
    try {
      await updateTask(id, newDone);
      if (newDone === target) toast.success(`${label} marked complete! 🎉`);
    } catch (err) {
      toast.error("Failed to update task");
    }
  };

  const priorityColor: Record<string, string> = {
    high: "#E5484D", medium: "#FFB020", low: "#34C759"
  };

  return (
    <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ClipboardCheck className="w-4 h-4" style={{ color: "#6D1F2F" }} />
          <h3 style={{ color: "#2C1810", fontWeight: 600 }}>Today's Production Tasks</h3>
        </div>
        <span className="text-xs px-2.5 py-1 rounded-full" style={{ background: "#FEF3D0", color: "#6D1F2F", fontWeight: 600 }}>
          {tasks.filter(t => t.done >= t.target).length}/{tasks.length} done
        </span>
      </div>
      <div className="p-4 space-y-3">
        {tasks.map(task => {
          const pct = Math.min(100, (task.done / task.target) * 100);
          const complete = task.done >= task.target;
          return (
            <div
              key={task.id}
              className="flex items-center gap-4 p-3 rounded-xl transition-all"
              style={{ background: complete ? "rgba(52,199,89,0.05)" : "#FFF9F0" }}
            >
              <button
                onClick={() => toggle(task.id, task.done, task.target, task.label)}
                className="w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 transition-all"
                style={{
                  borderColor: complete ? "#34C759" : priorityColor[task.priority],
                  background: complete ? "#34C759" : "transparent",
                }}
              >
                {complete && <CheckCircle className="w-3.5 h-3.5 text-white" />}
              </button>
              <span className="text-xl">{task.emoji}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1.5">
                  <p
                    className="text-sm truncate"
                    style={{
                      color: complete ? "#34C759" : "#2C1810",
                      fontWeight: 500,
                      textDecoration: complete ? "line-through" : "none",
                    }}
                  >
                    {task.label}
                  </p>
                  <span className="text-xs ml-2 shrink-0" style={{ color: "#6B7280" }}>
                    {task.done}/{task.target}
                  </span>
                </div>
                <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(44,24,16,0.08)" }}>
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${pct}%`,
                      background: complete ? "#34C759" : pct > 60 ? "#FFB020" : "#6D1F2F",
                    }}
                  />
                </div>
              </div>
              <span
                className="text-xs px-2 py-0.5 rounded-full shrink-0"
                style={{
                  background: `${priorityColor[task.priority]}15`,
                  color: priorityColor[task.priority],
                  fontWeight: 600,
                }}
              >
                {task.priority}
              </span>
            </div>
          );
        })}
        {tasks.length === 0 && (
          <div className="py-6 text-center text-xs" style={{ color: "#6B7280" }}>
            No tasks assigned for today.
          </div>
        )}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   Quick Production Logger
   ───────────────────────────────────────────── */
interface IngRow { id: string; ingredientId: string; qty: number }

function QuickLogger({ workerName }: { workerName: string }) {
  const { ingredients, products, recordProduction } = useDatabase();

  const [productName, setProductName] = useState("");
  const [itemsProduced, setItemsProduced] = useState<number | "">("");
  const [rows, setRows] = useState<IngRow[]>([{ id: "r1", ingredientId: "", qty: 0 }]);
  const [submitted, setSubmitted] = useState(false);

  const activeIngredientList = ingredients;

  // Ensure rows have default ingredient ID
  const activeRows = rows.map(r => ({
    ...r,
    ingredientId: r.ingredientId || (activeIngredientList[0]?.id || "")
  }));

  const addRow = () => setRows(p => [...p, { id: `r${Date.now()}`, ingredientId: activeIngredientList[0]?.id || "", qty: 0 }]);
  const removeRow = (id: string) => setRows(p => p.filter(r => r.id !== id));
  const updateRow = (id: string, field: "ingredientId" | "qty", val: any) =>
    setRows(p => p.map(r => r.id === id ? { ...r, [field]: val } : r));

  const totalCost = activeRows.reduce((s, r) => {
    const ing = activeIngredientList.find(i => i.id === r.ingredientId);
    return s + (ing ? ing.costPerUnit * r.qty : 0);
  }, 0);

  const n = Number(itemsProduced);
  const costPerItem = n > 0 ? totalCost / n : 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!productName || n < 1) { toast.error("Fill in product name and quantity"); return; }
    if (activeRows.some(r => r.qty <= 0)) { toast.error("Please enter a valid quantity for ingredients"); return; }

    // Check stock levels
    for (const r of activeRows) {
      const ing = activeIngredientList.find(i => i.id === r.ingredientId);
      if (ing && r.qty > ing.quantity) {
        toast.error(`Exceeds available stock for ${ing.name}`);
        return;
      }
    }

    try {
      const deductions = activeRows.map(r => {
        const ing = activeIngredientList.find(i => i.id === r.ingredientId)!;
        return {
          ingredientName: ing.name,
          quantity: r.qty
        };
      });

      const matchedProd = products.find(p => p.name.toLowerCase() === productName.trim().toLowerCase());
      const productId = matchedProd ? matchedProd.id : "other";

      await recordProduction({
        productId,
        productName: productName.trim(),
        qty: n,
        totalCost,
        costPerItem,
        date: new Date().toISOString().slice(0, 10),
      }, deductions);

      toast.success(`✅ Logged ${n}× ${productName} — cost ₹${totalCost.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`);
      setSubmitted(true);
      setTimeout(() => {
        setSubmitted(false);
        setProductName("");
        setItemsProduced("");
        setRows([{ id: "r1", ingredientId: activeIngredientList[0]?.id || "", qty: 0 }]);
      }, 2000);
    } catch (error) {
      toast.error("Failed to log production");
    }
  };

  if (submitted) {
    return (
      <div className="bg-card rounded-2xl border border-border shadow-sm flex flex-col items-center justify-center py-12 gap-3">
        <div className="w-16 h-16 rounded-full flex items-center justify-center" style={{ background: "rgba(52,199,89,0.12)" }}>
          <CheckCircle className="w-9 h-9" style={{ color: "#34C759" }} />
        </div>
        <p style={{ color: "#34C759", fontWeight: 700 }}>Production Logged!</p>
        <p className="text-sm" style={{ color: "#6B7280" }}>Resetting form…</p>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-border flex items-center gap-2">
        <Zap className="w-4 h-4" style={{ color: "#F4C95D" }} />
        <h3 style={{ color: "#2C1810", fontWeight: 600 }}>Quick Production Log</h3>
      </div>

      <form onSubmit={handleSubmit} className="p-5 space-y-4">
        {/* Product + count */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block mb-1.5 text-xs" style={{ color: "#6B7280", fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.05em" }}>
              Product Name
            </label>
            <input
              required value={productName} onChange={e => setProductName(e.target.value)}
              placeholder="e.g. Butter Croissant"
              className="w-full px-3 py-2.5 rounded-xl border border-border text-sm outline-none transition-all focus:border-primary"
              style={{ background: "#FFF9F0", color: "#2C1810" }}
            />
          </div>
          <div>
            <label className="block mb-1.5 text-xs" style={{ color: "#6B7280", fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.05em" }}>
              Items Produced
            </label>
            <input
              required type="number" min={1} value={itemsProduced}
              onChange={e => setItemsProduced(parseInt(e.target.value) || "")}
              placeholder="0"
              className="w-full px-3 py-2.5 rounded-xl border border-border text-sm outline-none transition-all focus:border-primary"
              style={{ background: "#FFF9F0", color: "#2C1810" }}
            />
          </div>
        </div>

        {/* Ingredient rows */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs" style={{ color: "#6B7280", fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.05em" }}>
              Ingredients Used
            </label>
            <button type="button" onClick={addRow}
              className="flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-xl transition-colors hover:opacity-80"
              style={{ background: "#FEF3D0", color: "#6D1F2F", fontWeight: 600 }}>
              <Plus className="w-3 h-3" /> Add
            </button>
          </div>
          <div className="space-y-2">
            {activeRows.map(row => {
              const ing = activeIngredientList.find(i => i.id === row.ingredientId) || { name: "", unit: "kg", quantity: 0, costPerUnit: 0 };
              const rowCost = ing.costPerUnit * row.qty;
              const overStock = row.qty > ing.quantity;
              return (
                <div key={row.id} className="flex items-center gap-2">
                  <select
                    value={row.ingredientId}
                    onChange={e => updateRow(row.id, "ingredientId", e.target.value)}
                    className="flex-1 px-2.5 py-2 rounded-xl border border-border text-sm outline-none"
                    style={{ background: "#FFF9F0", color: "#2C1810" }}
                  >
                    {activeIngredientList.map(i => <option key={i.id} value={i.id}>{i.name}</option>)}
                  </select>
                  <div className="relative w-24">
                    <input
                      type="number" min={0} step={0.01} value={row.qty || ""}
                      onChange={e => updateRow(row.id, "qty", parseFloat(e.target.value) || 0)}
                      placeholder="0"
                      className="w-full px-2.5 py-2 rounded-xl border text-sm outline-none text-right"
                      style={{
                        background: "#FFF9F0", color: "#2C1810",
                        borderColor: overStock ? "#E5484D" : "rgba(44,24,16,0.1)",
                      }}
                    />
                  </div>
                  <span className="text-xs w-8 shrink-0 text-center" style={{ color: "#6B7280" }}>{ing.unit}</span>
                  <span className="text-xs w-14 shrink-0 text-right" style={{ color: "#6D1F2F", fontWeight: 600 }}>
                    ₹{rowCost.toLocaleString("en-IN", { maximumFractionDigits: 0 })}
                  </span>
                  <button type="button" onClick={() => removeRow(row.id)} disabled={rows.length === 1}
                    className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-red-50 disabled:opacity-30">
                    <X className="w-3.5 h-3.5" style={{ color: "#E5484D" }} />
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* Live cost strip */}
        <div className="grid grid-cols-3 gap-2 rounded-xl p-3" style={{ background: "#FFF9F0" }}>
          <div className="text-center">
            <p className="text-xs" style={{ color: "#6B7280" }}>Total Cost</p>
            <p className="text-base" style={{ color: "#6D1F2F", fontWeight: 700 }}>₹{totalCost.toLocaleString("en-IN", { maximumFractionDigits: 0 })}</p>
          </div>
          <div className="text-center border-x border-border">
            <p className="text-xs" style={{ color: "#6B7280" }}>Items</p>
            <p className="text-base" style={{ color: "#2C1810", fontWeight: 700 }}>{n || "—"}</p>
          </div>
          <div className="text-center">
            <p className="text-xs" style={{ color: "#6B7280" }}>Cost/Item</p>
            <p className="text-base" style={{ color: "#34C759", fontWeight: 700 }}>₹{costPerItem.toFixed(2)}</p>
          </div>
        </div>

        <button
          type="submit"
          className="w-full py-3 rounded-xl text-white text-sm transition-all hover:opacity-90 active:scale-[0.98] shadow-md flex items-center justify-center gap-2"
          style={{ background: "linear-gradient(135deg, #6D1F2F, #8B2739)", fontWeight: 600 }}
        >
          <ChefHat className="w-4 h-4" />
          Submit Production Entry
        </button>
      </form>
    </div>
  );
}

/* ─────────────────────────────────────────────
   Waste Quick Log
   ───────────────────────────────────────────── */
const REASONS = ["Spill", "Burnt", "Expired", "Broken", "Overheated", "Other"];

function WasteLogger({ workerName }: { workerName: string }) {
  const { ingredients, recordWaste } = useDatabase();
  const [form, setForm] = useState({ ingredient: "", qty: "", reason: REASONS[0] });

  const activeIngredients = ingredients;
  const activeIngredientName = form.ingredient || (activeIngredients[0]?.name || "");

  const handleLog = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.qty || +form.qty <= 0) { toast.error("Enter a valid quantity"); return; }
    if (!activeIngredientName) { toast.error("Select an ingredient"); return; }

    const ing = activeIngredients.find(i => i.name === activeIngredientName);
    if (!ing) return;

    if (+form.qty > ing.quantity) {
      toast.error(`Exceeds available stock: ${ing.name} has only ${ing.quantity} ${ing.unit}`);
      return;
    }

    try {
      const cost = ing.costPerUnit * Number(form.qty);
      await recordWaste({
        ingredient: activeIngredientName,
        quantity: Number(form.qty),
        unit: ing.unit,
        reason: form.reason,
        purchaseCost: cost,
        date: new Date().toISOString().slice(0, 10),
        addedBy: workerName
      });

      toast.success("Waste logged successfully!");
      setForm({ ingredient: activeIngredients[0]?.name || "", qty: "", reason: REASONS[0] });
    } catch (err) {
      toast.error("Failed to log waste");
    }
  };

  return (
    <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-border flex items-center gap-2">
        <AlertTriangle className="w-4 h-4" style={{ color: "#E5484D" }} />
        <h3 style={{ color: "#2C1810", fontWeight: 600 }}>Log Waste</h3>
      </div>
      <form onSubmit={handleLog} className="p-5 space-y-3">
        <div>
          <label className="block mb-1.5 text-xs" style={{ color: "#6B7280", fontWeight: 500 }}>Ingredient</label>
          <select value={activeIngredientName} onChange={e => setForm(f => ({ ...f, ingredient: e.target.value }))}
            className="w-full px-3 py-2.5 rounded-xl border border-border text-sm outline-none"
            style={{ background: "#FFF9F0", color: "#2C1810" }}>
            {activeIngredients.map(i => <option key={i.id} value={i.name}>{i.name}</option>)}
          </select>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block mb-1.5 text-xs" style={{ color: "#6B7280", fontWeight: 500 }}>Quantity Wasted</label>
            <input type="number" min={0} step={0.01} value={form.qty}
              onChange={e => setForm(f => ({ ...f, qty: e.target.value }))}
              placeholder="0"
              className="w-full px-3 py-2.5 rounded-xl border border-border text-sm outline-none"
              style={{ background: "#FFF9F0", color: "#2C1810" }} />
          </div>
          <div>
            <label className="block mb-1.5 text-xs" style={{ color: "#6B7280", fontWeight: 500 }}>Reason</label>
            <select value={form.reason} onChange={e => setForm(f => ({ ...f, reason: e.target.value }))}
              className="w-full px-3 py-2.5 rounded-xl border border-border text-sm outline-none"
              style={{ background: "#FFF9F0", color: "#2C1810" }}>
              {REASONS.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>
        </div>
        <button type="submit"
          className="w-full py-2.5 rounded-xl text-sm transition-all hover:opacity-80"
          style={{ background: "rgba(229,72,77,0.1)", color: "#E5484D", fontWeight: 600, border: "1px solid rgba(229,72,77,0.2)" }}>
          Report Waste
        </button>
      </form>
    </div>
  );
}

/* ─────────────────────────────────────────────
   Recent Production Log
   ───────────────────────────────────────────── */
function RecentLogs({ workerName }: { workerName: string }) {
  const { productionHistory } = useDatabase();

  const myLogs = useMemo(() => {
    return productionHistory
      .filter(p => p.workerName === workerName)
      .slice(0, 4)
      .map(p => {
        let emoji = "🥐";
        const nameLower = (p.productName || "").toLowerCase();
        if (nameLower.includes("bread") || nameLower.includes("loaf") || nameLower.includes("sourdough")) emoji = "🍞";
        else if (nameLower.includes("muffin") || nameLower.includes("cupcake")) emoji = "🧁";
        else if (nameLower.includes("bagel")) emoji = "🥯";
        else if (nameLower.includes("brownie") || nameLower.includes("cake")) emoji = "🍰";

        return {
          time: p.date,
          product: p.productName,
          qty: p.qty,
          cost: p.totalCost,
          emoji
        };
      });
  }, [productionHistory, workerName]);

  const defaultLogs = [
    { time: "09:42", product: "Butter Croissant", qty: 48, cost: 48 * 15 * R / 10, emoji: "🥐" },
    { time: "08:15", product: "Sourdough Loaf", qty: 24, cost: 24 * 20 * R / 10, emoji: "🍞" },
  ];

  const logsToRender = myLogs.length > 0 ? myLogs : defaultLogs;

  return (
    <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ClipboardCheck className="w-4 h-4" style={{ color: "#6D1F2F" }} />
          <h3 style={{ color: "#2C1810", fontWeight: 600 }}>My Recent Logs</h3>
        </div>
      </div>
      <div className="divide-y" style={{ borderColor: "rgba(44,24,16,0.06)" }}>
        {logsToRender.map((log, i) => (
          <div key={i} className="flex items-center gap-3 px-5 py-3.5 hover:bg-muted/30 transition-colors">
            <span className="text-xl">{log.emoji}</span>
            <div className="flex-1 min-w-0">
              <p className="text-sm truncate" style={{ color: "#2C1810", fontWeight: 500 }}>{log.product}</p>
              <p className="text-xs" style={{ color: "#6B7280" }}>{log.qty} pieces · {log.time}</p>
            </div>
            <span className="text-sm shrink-0" style={{ color: "#6D1F2F", fontWeight: 700 }}>₹{log.cost.toLocaleString("en-IN", { maximumFractionDigits: 0 })}</span>
          </div>
        ))}
        {logsToRender.length === 0 && (
          <div className="py-6 text-center text-xs" style={{ color: "#6B7280" }}>
            No recent logs recorded.
          </div>
        )}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   Performance widget
   ───────────────────────────────────────────── */
function PerformanceWidget({ workerName }: { workerName: string }) {
  const { productionHistory } = useDatabase();

  const todayStr = new Date().toISOString().slice(0, 10);
  const todayItems = productionHistory
    .filter(p => p.date === todayStr && p.workerName === workerName)
    .reduce((sum, p) => sum + (p.qty || 0), 0);

  const metrics = [
    { label: "Items Today", value: todayItems || 48, goal: 100, color: "#6D1F2F" },
    { label: "Waste Rate", value: 2, goal: 5, color: "#34C759", invert: true },
    { label: "Tasks Done", value: 2, goal: 4, color: "#F4C95D" },
  ];

  return (
    <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-border flex items-center gap-2">
        <Target className="w-4 h-4" style={{ color: "#6D1F2F" }} />
        <h3 style={{ color: "#2C1810", fontWeight: 600 }}>My Performance</h3>
        <span className="ml-auto text-xs px-2 py-0.5 rounded-full" style={{ background: "#FEF3D0", color: "#6D1F2F", fontWeight: 600 }}>
          Today
        </span>
      </div>
      <div className="p-5 space-y-4">
        {metrics.map((m, i) => {
          const pct = Math.min(100, (m.value / m.goal) * 100);
          return (
            <div key={i}>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-sm" style={{ color: "#2C1810", fontWeight: 500 }}>{m.label}</span>
                <span className="text-sm" style={{ color: m.color, fontWeight: 700 }}>
                  {m.value} <span className="text-xs font-normal" style={{ color: "#9CA3AF" }}>/ {m.goal}</span>
                </span>
              </div>
              <div className="h-2.5 rounded-full overflow-hidden" style={{ background: "rgba(44,24,16,0.07)" }}>
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{ width: `${pct}%`, background: m.color }}
                />
              </div>
            </div>
          );
        })}

        <div className="mt-4 pt-4 border-t border-border">
          <div className="flex items-center gap-3 p-3 rounded-xl" style={{ background: "rgba(244,201,93,0.1)" }}>
            <Award className="w-5 h-5" style={{ color: "#F4C95D" }} />
            <div>
              <p className="text-xs" style={{ color: "#2C1810", fontWeight: 600 }}>On Track</p>
              <p className="text-xs" style={{ color: "#6B7280" }}>Keep up the good work!</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   Stock Visibility
   ───────────────────────────────────────────── */
function StockPanel() {
  const { ingredients } = useDatabase();
  const lowStock = ingredients.filter(i => i.quantity <= i.minStock);

  return (
    <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Package className="w-4 h-4" style={{ color: "#6D1F2F" }} />
          <h3 style={{ color: "#2C1810", fontWeight: 600 }}>Stock Visibility</h3>
        </div>
        {lowStock.length > 0 && (
          <span className="text-xs px-2.5 py-1 rounded-full flex items-center gap-1"
            style={{ background: "rgba(229,72,77,0.1)", color: "#E5484D", fontWeight: 600 }}>
            <AlertTriangle className="w-3 h-3" />
            {lowStock.length} low
          </span>
        )}
      </div>
      <div className="p-4 space-y-2">
        {ingredients.slice(0, 8).map((ing, i) => {
          const maxStock = ing.minStock * 4;
          const pct = Math.min(100, (ing.quantity / maxStock) * 100);
          const isLow = ing.quantity <= ing.minStock;
          return (
            <div key={i} className="flex items-center gap-3">
              <p className="text-xs w-32 truncate shrink-0" style={{ color: "#2C1810", fontWeight: isLow ? 600 : 400 }}>
                {ing.name}
              </p>
              <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: "rgba(44,24,16,0.07)" }}>
                <div
                  className="h-full rounded-full transition-all"
                  style={{ width: `${pct}%`, background: ing.quantity <= ing.minStock * 0.5 ? "#E5484D" : ing.quantity <= ing.minStock ? "#FFB020" : "#34C759" }}
                />
              </div>
              <p className="text-xs w-16 text-right shrink-0" style={{ color: isLow ? "#E5484D" : "#6B7280", fontWeight: isLow ? 600 : 400 }}>
                {ing.quantity} {ing.unit}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   Main Worker Dashboard
   ───────────────────────────────────────────── */
export function WorkerDashboard({ user }: { user?: AuthUser }) {
  const { ingredients, productionHistory, loading } = useDatabase();

  const worker = {
    name: user?.name ?? "Maria Santos",
    role: user?.position ?? "Senior Baker",
    shift: user?.shift ?? "Morning",
    avatar: user?.avatar ?? "MS",
  };

  const lowStock = ingredients.filter(i => i.quantity <= i.minStock);
  const todayStr = new Date().toISOString().slice(0, 10);
  const todayBatches = productionHistory.filter(p => p.date === todayStr && p.workerName === worker.name);
  const todayItemsBaked = todayBatches.reduce((sum, p) => sum + (p.qty || 0), 0);

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-4 border-[#6D1F2F]/20 border-t-[#6D1F2F] animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-5">
      {/* Greeting */}
      <GreetingBanner worker={worker} />

      {/* Stat row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard label="Items Baked" value={todayItemsBaked || 48} sub="Today's total" icon={ChefHat} iconBg="#FEF3D0" iconColor="#6D1F2F" />
        <StatCard label="Batches Done" value={`${todayBatches.length || 2}/4`} sub="Tasks complete" icon={CheckCircle} iconBg="rgba(52,199,89,0.1)" iconColor="#34C759" />
        <StatCard label="Shift Time" value="5h 30m" sub="08:00 → 16:00" icon={Clock} iconBg="rgba(109,31,47,0.08)" iconColor="#6D1F2F" />
        <StatCard label="Low Stock" value={lowStock.length} sub="Needs attention" icon={AlertTriangle} iconBg="rgba(229,72,77,0.08)" iconColor="#E5484D" accent />
      </div>

      {/* Main 3-column grid */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        {/* Left col */}
        <div className="xl:col-span-2 space-y-5">
          <TaskChecklist />
          <QuickLogger workerName={worker.name} />
        </div>

        {/* Right col */}
        <div className="space-y-5">
          <PerformanceWidget workerName={worker.name} />
          <WasteLogger workerName={worker.name} />
          <RecentLogs workerName={worker.name} />
          <StockPanel />
        </div>
      </div>
    </div>
  );
}
