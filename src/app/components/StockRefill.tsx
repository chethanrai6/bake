import { useState } from "react";
import { Plus, Package, X, Search, TrendingUp } from "lucide-react";
import { toast } from "sonner";
import { useDatabase } from "../utils/db";

interface StockRefillProps {
  user?: {
    name: string;
  };
}

export function StockRefill({ user }: StockRefillProps) {
  const {
    ingredients,
    suppliers,
    refillHistory,
    refillStock,
    loading
  } = useDatabase();

  const [search, setSearch]   = useState("");
  const [showForm, setShowForm] = useState(false);

  // Map database ingredients to fit local calculations
  const ingredientOptions = ingredients.map(ing => ({
    name: ing.name,
    unit: ing.unit,
    currentStock: ing.quantity,
  }));

  const defaultSuppliersList = ["Golden Grain Mills", "Sweet Valley Sugar Co.", "Green Pastures Dairy", "Tropical Spice Imports", "Pacific Cocoa Co."];
  const supplierOptions = suppliers.length > 0 ? suppliers.map(s => s.name) : defaultSuppliersList;

  const [form, setForm] = useState({
    ingredient: "",
    quantityAdded: 0,
    purchaseCost: 0,
    supplier: "",
    date: new Date().toISOString().slice(0, 10),
  });

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-4 border-[#6D1F2F]/20 border-t-[#6D1F2F] animate-spin" />
      </div>
    );
  }

  // Ensure form has initial values selected when ingredients/suppliers load
  const activeIngredientName = form.ingredient || (ingredientOptions[0]?.name || "");
  const selectedIng = ingredientOptions.find(i => i.name === activeIngredientName) || { name: "", currentStock: 0, unit: "kg" };
  const activeSupplierName = form.supplier || (supplierOptions[0] || "");

  const filtered = refillHistory.filter(h =>
    h.ingredient.toLowerCase().includes(search.toLowerCase()) ||
    h.supplier.toLowerCase().includes(search.toLowerCase())
  );

  const totalSpent = refillHistory.reduce((s, h) => s + h.purchaseCost, 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.quantityAdded <= 0) { toast.error("Please enter a valid quantity"); return; }
    
    const ingredientName = activeIngredientName || ingredientOptions[0]?.name;
    const supplierName = activeSupplierName || supplierOptions[0];
    
    if (!ingredientName) { toast.error("Please select an ingredient"); return; }
    const ing = ingredientOptions.find(i => i.name === ingredientName)!;

    try {
      await refillStock({
        ingredient: ingredientName,
        quantityAdded: form.quantityAdded,
        unit: ing.unit,
        purchaseCost: form.purchaseCost,
        supplier: supplierName,
        date: form.date,
        addedBy: user?.name || "Ahmed Omar",
      });
      
      toast.success(`Restocked ${form.quantityAdded} ${ing.unit} of ${ingredientName}`);
      setShowForm(false);
      
      setForm({
        ingredient: ingredientOptions[0]?.name || "",
        quantityAdded: 0,
        purchaseCost: 0,
        supplier: supplierOptions[0] || "",
        date: new Date().toISOString().slice(0, 10)
      });
    } catch (error) {
      toast.error("Failed to record refill");
    }
  };

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-sm" style={{ color: "#6B7280" }}>Manage stock refills and purchase history</p>
        <button onClick={() => {
          setForm({
            ingredient: ingredientOptions[0]?.name || "",
            quantityAdded: 0,
            purchaseCost: 0,
            supplier: supplierOptions[0] || "",
            date: new Date().toISOString().slice(0, 10)
          });
          setShowForm(true);
        }}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-white text-sm hover:opacity-90 shadow-sm"
          style={{ background: "#6D1F2F", fontWeight: 500 }}>
          <Plus className="w-4 h-4" /> New Refill
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total Refills",    value: refillHistory.length },
          { label: "Total Spent",      value: `₹${totalSpent.toLocaleString("en-IN", { maximumFractionDigits: 0 })}` },
          { label: "Last Refill",      value: refillHistory[0]?.ingredient.split(" ")[0] ?? "—" },
          { label: "Suppliers Used",   value: new Set(refillHistory.map(h => h.supplier)).size },
        ].map((c, i) => (
          <div key={i} className="bg-card rounded-2xl p-5 border border-border shadow-sm hover:-translate-y-0.5 hover:shadow-md transition-all duration-200">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3" style={{ background: "#FEF3D0" }}>
              {i === 1 ? <TrendingUp className="w-5 h-5" style={{ color: "#6D1F2F" }} /> : <Package className="w-5 h-5" style={{ color: "#6D1F2F" }} />}
            </div>
            <p className="text-xl" style={{ color: "#2C1810", fontWeight: 700 }}>{c.value}</p>
            <p className="text-xs mt-0.5" style={{ color: "#6B7280" }}>{c.label}</p>
          </div>
        ))}
      </div>

      {/* Stock snapshot */}
      <div className="bg-card rounded-2xl p-5 border border-border shadow-sm">
        <h3 className="mb-4" style={{ color: "#2C1810", fontWeight: 600 }}>Current Stock Levels</h3>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {ingredientOptions.map(ing => {
            const pct = ing.currentStock <= 0 ? 0 : Math.min(100, (ing.currentStock / 150) * 100);
            return (
              <div key={ing.name} className="p-3 rounded-xl" style={{ background: "#FFF9F0" }}>
                <p className="text-xs truncate mb-2" style={{ color: "#2C1810", fontWeight: 500 }}>{ing.name}</p>
                <p className="text-sm mb-2" style={{ color: ing.currentStock <= 10 ? "#E5484D" : "#2C1810", fontWeight: 700 }}>
                  {ing.currentStock} <span className="text-xs font-normal" style={{ color: "#6B7280" }}>{ing.unit}</span>
                </p>
                <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(44,24,16,0.1)" }}>
                  <div className="h-full rounded-full" style={{ width: `${pct}%`, background: ing.currentStock <= 10 ? "#E5484D" : ing.currentStock <= 25 ? "#FFB020" : "#34C759" }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* History Table */}
      <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-border flex items-center justify-between">
          <h3 style={{ color: "#2C1810", fontWeight: 600 }}>Refill History</h3>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "#6B7280" }} />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search refills..."
              className="pl-9 pr-4 py-2 rounded-xl border border-border outline-none text-sm" style={{ background: "#FFF9F0", color: "#2C1810" }} />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr style={{ background: "#FFF9F0", borderBottom: "1px solid rgba(44,24,16,0.08)" }}>
                {["Date", "Ingredient", "Qty Added", "Purchase Cost", "Supplier", "Added By"].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs uppercase tracking-wide" style={{ color: "#6B7280", fontWeight: 600 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(r => (
                <tr key={r.id} className="border-b transition-colors hover:bg-muted/40" style={{ borderColor: "rgba(44,24,16,0.06)" }}>
                  <td className="px-4 py-3.5 text-sm" style={{ color: "#6B7280" }}>{r.date}</td>
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-lg flex items-center justify-center" style={{ background: "#FEF3D0" }}>
                        <Package className="w-3 h-3" style={{ color: "#6D1F2F" }} />
                      </div>
                      <span className="text-sm" style={{ color: "#2C1810", fontWeight: 500 }}>{r.ingredient}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3.5">
                    <span className="text-sm px-2.5 py-1 rounded-full" style={{ background: "rgba(52,199,89,0.1)", color: "#34C759", fontWeight: 600 }}>
                      +{r.quantityAdded} {r.unit}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 text-sm" style={{ color: "#6D1F2F", fontWeight: 600 }}>
                    ₹{r.purchaseCost.toLocaleString("en-IN", { maximumFractionDigits: 0 })}
                  </td>
                  <td className="px-4 py-3.5 text-sm" style={{ color: "#2C1810" }}>{r.supplier}</td>
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs" style={{ background: "#6D1F2F", fontWeight: 600 }}>
                        {r.addedBy ? r.addedBy.split(" ").map(n => n[0]).join("") : "AD"}
                      </div>
                      <span className="text-sm" style={{ color: "#6B7280" }}>{r.addedBy || "Admin"}</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div className="py-16 text-center text-sm" style={{ color: "#6B7280" }}>
              No refills found
            </div>
          )}
        </div>
      </div>

      {/* Modal */}
      {showForm && ingredientOptions.length > 0 && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.45)" }}>
          <div className="bg-card rounded-2xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between px-6 py-4 border-b border-border">
              <h2 style={{ color: "#2C1810", fontWeight: 600 }}>New Stock Refill</h2>
              <button onClick={() => setShowForm(false)} className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-muted">
                <X className="w-4 h-4" style={{ color: "#6B7280" }} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block mb-1.5 text-sm" style={{ color: "#2C1810", fontWeight: 500 }}>Ingredient</label>
                <select value={activeIngredientName} onChange={e => setForm(f => ({ ...f, ingredient: e.target.value }))}
                  className="w-full px-3 py-2.5 rounded-xl border border-border outline-none text-sm" style={{ background: "#FFF9F0", color: "#2C1810" }}>
                  {ingredientOptions.map(i => <option key={i.name} value={i.name}>{i.name} (Current: {i.currentStock} {i.unit})</option>)}
                </select>
              </div>
              <div className="p-3 rounded-xl" style={{ background: "#FFF9F0" }}>
                <p className="text-xs" style={{ color: "#6B7280" }}>Current Stock</p>
                <p className="text-lg" style={{ color: "#2C1810", fontWeight: 700 }}>
                  {selectedIng.currentStock} <span className="text-sm font-normal" style={{ color: "#6B7280" }}>{selectedIng.unit}</span>
                </p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block mb-1.5 text-sm" style={{ color: "#2C1810", fontWeight: 500 }}>Qty to Add ({selectedIng.unit})</label>
                  <input required type="number" min={0.01} step={0.01} value={form.quantityAdded || ""}
                    onChange={e => setForm(f => ({ ...f, quantityAdded: parseFloat(e.target.value) || 0 }))}
                    className="w-full px-3 py-2.5 rounded-xl border border-border outline-none text-sm" style={{ background: "#FFF9F0", color: "#2C1810" }} />
                </div>
                <div>
                  <label className="block mb-1.5 text-sm" style={{ color: "#2C1810", fontWeight: 500 }}>Total Purchase Cost (₹)</label>
                  <input required type="number" min={0} step={1} value={form.purchaseCost || ""}
                    onChange={e => setForm(f => ({ ...f, purchaseCost: parseFloat(e.target.value) || 0 }))}
                    className="w-full px-3 py-2.5 rounded-xl border border-border outline-none text-sm" style={{ background: "#FFF9F0", color: "#2C1810" }} />
                </div>
              </div>
              <div>
                <label className="block mb-1.5 text-sm" style={{ color: "#2C1810", fontWeight: 500 }}>Supplier</label>
                <select value={activeSupplierName} onChange={e => setForm(f => ({ ...f, supplier: e.target.value }))}
                  className="w-full px-3 py-2.5 rounded-xl border border-border outline-none text-sm" style={{ background: "#FFF9F0", color: "#2C1810" }}>
                  {supplierOptions.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="block mb-1.5 text-sm" style={{ color: "#2C1810", fontWeight: 500 }}>Date</label>
                <input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
                  className="w-full px-3 py-2.5 rounded-xl border border-border outline-none text-sm" style={{ background: "#FFF9F0", color: "#2C1810" }} />
              </div>
              {form.quantityAdded > 0 && (
                <div className="p-3 rounded-xl border-2" style={{ background: "#FEF3D0", borderColor: "#F4C95D" }}>
                  <div className="flex justify-between text-sm">
                    <span style={{ color: "#6B7280" }}>New stock after refill:</span>
                    <span style={{ color: "#6D1F2F", fontWeight: 700 }}>{selectedIng.currentStock + form.quantityAdded} {selectedIng.unit}</span>
                  </div>
                  {form.purchaseCost > 0 && (
                    <div className="flex justify-between text-sm mt-1">
                      <span style={{ color: "#6B7280" }}>Cost per {selectedIng.unit}:</span>
                      <span style={{ color: "#6D1F2F", fontWeight: 600 }}>₹{(form.purchaseCost / form.quantityAdded).toFixed(2)}</span>
                    </div>
                  )}
                </div>
              )}
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowForm(false)}
                  className="flex-1 py-2.5 rounded-xl border border-border text-sm" style={{ color: "#2C1810" }}>Cancel</button>
                <button type="submit"
                  className="flex-1 py-2.5 rounded-xl text-white text-sm hover:opacity-90" style={{ background: "#6D1F2F", fontWeight: 500 }}>
                  Confirm Refill
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
