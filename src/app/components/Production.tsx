import { useState, useMemo } from "react";
import { Plus, X, Calculator, CheckCircle } from "lucide-react";
import { toast } from "sonner";
import { useDatabase } from "../utils/db";

interface IngredientRow { id: string; ingredientId: string; quantity: number }

interface ProductionProps {
  user?: {
    name: string;
  };
}

export function Production({ user }: ProductionProps) {
  const {
    ingredients,
    products,
    recordProduction,
    loading
  } = useDatabase();

  const [productName, setProductName] = useState("");
  const [itemsProduced, setItemsProduced] = useState(1);
  const [rows, setRows] = useState<IngredientRow[]>([{ id: "r1", ingredientId: "", quantity: 0 }]);
  const [submitted, setSubmitted] = useState(false);

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-4 border-[#6D1F2F]/20 border-t-[#6D1F2F] animate-spin" />
      </div>
    );
  }

  const activeIngredientList = ingredients;

  // Ensure rows have default ingredient ID
  const activeRows = rows.map(r => ({
    ...r,
    ingredientId: r.ingredientId || (activeIngredientList[0]?.id || "")
  }));

  const addRow = () => setRows(p => [...p, { id: `r${Date.now()}`, ingredientId: activeIngredientList[0]?.id || "", quantity: 0 }]);
  const removeRow = (id: string) => setRows(p => p.filter(r => r.id !== id));
  const updateRow = (id: string, field: "ingredientId" | "quantity", val: any) =>
    setRows(p => p.map(r => r.id === id ? { ...r, [field]: val } : r));

  const totalCost = activeRows.reduce((sum, row) => {
    const ing = activeIngredientList.find(i => i.id === row.ingredientId);
    return sum + (ing ? ing.costPerUnit * row.quantity : 0);
  }, 0);

  const costPerItem = itemsProduced > 0 ? totalCost / itemsProduced : 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!productName || activeRows.some(r => r.quantity <= 0)) {
      toast.error("Please fill in all fields with valid quantities");
      return;
    }

    // Check stock levels
    for (const r of activeRows) {
      const ing = activeIngredientList.find(i => i.id === r.ingredientId);
      if (ing && r.quantity > ing.quantity) {
        toast.error(`Exceeds available stock for ${ing.name}`);
        return;
      }
    }

    try {
      const deductions = activeRows.map(r => {
        const ing = activeIngredientList.find(i => i.id === r.ingredientId)!;
        return {
          ingredientName: ing.name,
          quantity: r.quantity
        };
      });

      const matchedProd = products.find(p => p.name.toLowerCase() === productName.trim().toLowerCase());
      const productId = matchedProd ? matchedProd.id : "other";

      await recordProduction({
        productId,
        productName: productName.trim(),
        qty: itemsProduced,
        totalCost,
        costPerItem,
        date: new Date().toISOString().slice(0, 10),
      }, deductions);

      toast.success(`Production recorded: ${itemsProduced}× ${productName}`);
      setSubmitted(true);
      setTimeout(() => {
        setSubmitted(false); setProductName(""); setItemsProduced(1);
        setRows([{ id: "r1", ingredientId: activeIngredientList[0]?.id || "", quantity: 0 }]);
      }, 2500);
    } catch (error) {
      toast.error("Failed to record production");
    }
  };

  if (submitted) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto" style={{ background: "rgba(52,199,89,0.1)" }}>
            <CheckCircle className="w-10 h-10" style={{ color: "#34C759" }} />
          </div>
          <h2 style={{ color: "#2C1810", fontWeight: 600 }}>Production Recorded!</h2>
          <p style={{ color: "#6B7280" }}>Resetting form…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-6">
      <p className="text-sm mb-6" style={{ color: "#6B7280" }}>Record today's baking production batch</p>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Form */}
        <form onSubmit={handleSubmit} className="lg:col-span-2 space-y-5">
          {/* Product details */}
          <div className="bg-card rounded-2xl p-5 border border-border shadow-sm">
            <h3 className="mb-4" style={{ color: "#2C1810", fontWeight: 600 }}>Product Details</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block mb-1.5 text-sm" style={{ color: "#2C1810", fontWeight: 500 }}>Product Name</label>
                <input required value={productName} onChange={e => setProductName(e.target.value)}
                  placeholder="e.g. Butter Croissant"
                  className="w-full px-3 py-2.5 rounded-xl border border-border outline-none text-sm" style={{ background: "#FFF9F0", color: "#2C1810" }} />
              </div>
              <div>
                <label className="block mb-1.5 text-sm" style={{ color: "#2C1810", fontWeight: 500 }}>Items Produced</label>
                <input required type="number" min={1} value={itemsProduced}
                  onChange={e => setItemsProduced(parseInt(e.target.value) || 1)}
                  className="w-full px-3 py-2.5 rounded-xl border border-border outline-none text-sm" style={{ background: "#FFF9F0", color: "#2C1810" }} />
              </div>
            </div>
          </div>

          {/* Ingredients */}
          <div className="bg-card rounded-2xl p-5 border border-border shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 style={{ color: "#2C1810", fontWeight: 600 }}>Ingredients Used</h3>
              <button type="button" onClick={addRow}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm hover:opacity-80"
                style={{ background: "#FEF3D0", color: "#6D1F2F", fontWeight: 500 }}>
                <Plus className="w-3.5 h-3.5" /> Add Ingredient
              </button>
            </div>

            <div className="grid grid-cols-12 gap-2 px-2 mb-2">
              {["Ingredient", "Quantity", "Unit", "Cost", ""].map((h, i) => (
                <p key={i} className={`text-xs uppercase tracking-wide ${i === 0 ? "col-span-5" : i === 1 ? "col-span-3" : i === 2 ? "col-span-2" : "col-span-1"}`}
                  style={{ color: "#6B7280", fontWeight: 600 }}>{h}</p>
              ))}
            </div>

            <div className="space-y-2">
              {activeRows.map(row => {
                const ing = activeIngredientList.find(i => i.id === row.ingredientId) || { name: "", costPerUnit: 0, quantity: 0, unit: "kg" };
                const rowCost   = ing.costPerUnit * row.quantity;
                const overStock = row.quantity > ing.quantity;
                return (
                  <div key={row.id} className="grid grid-cols-12 gap-2 items-center">
                    <div className="col-span-5">
                      <select value={row.ingredientId} onChange={e => updateRow(row.id, "ingredientId", e.target.value)}
                        className="w-full px-2 py-2 rounded-xl border border-border outline-none text-sm" style={{ background: "#FFF9F0", color: "#2C1810" }}>
                        {activeIngredientList.map(i => <option key={i.id} value={i.id}>{i.name}</option>)}
                      </select>
                    </div>
                    <div className="col-span-3">
                      <input type="number" min={0} step={0.01} value={row.quantity || ""}
                        onChange={e => updateRow(row.id, "quantity", parseFloat(e.target.value) || 0)}
                        className="w-full px-2 py-2 rounded-xl border outline-none text-sm"
                        style={{ background: "#FFF9F0", color: "#2C1810", borderColor: overStock ? "#E5484D" : "rgba(44,24,16,0.1)" }} />
                    </div>
                    <div className="col-span-2">
                      <span className="text-sm px-2 py-1 rounded-md" style={{ background: "#FEF3D0", color: "#6D1F2F" }}>{ing.unit}</span>
                    </div>
                    <div className="col-span-1">
                      <span className="text-xs" style={{ color: "#6B7280" }}>₹{rowCost.toFixed(0)}</span>
                    </div>
                    <div className="col-span-1 flex justify-center">
                      <button type="button" onClick={() => removeRow(row.id)} disabled={rows.length === 1}
                        className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-red-50 disabled:opacity-30">
                        <X className="w-3.5 h-3.5" style={{ color: "#E5484D" }} />
                      </button>
                    </div>
                    {overStock && (
                      <p className="col-span-12 text-xs px-2" style={{ color: "#E5484D" }}>
                        Exceeds available stock ({ing.quantity} {ing.unit})
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <button type="submit"
            className="w-full py-3 rounded-xl text-white transition-all hover:opacity-90 shadow-sm"
            style={{ background: "#6D1F2F", fontWeight: 500 }}>
            Record Production
          </button>
        </form>

        {/* Live panel */}
        <div className="space-y-4">
          <div className="bg-card rounded-2xl p-5 border border-border shadow-sm sticky top-0">
            <div className="flex items-center gap-2 mb-5">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: "#FEF3D0" }}>
                <Calculator className="w-4 h-4" style={{ color: "#6D1F2F" }} />
              </div>
              <h3 style={{ color: "#2C1810", fontWeight: 600 }}>Live Calculation</h3>
            </div>
            <div className="space-y-4">
              <div className="p-4 rounded-xl" style={{ background: "#FFF9F0" }}>
                <p className="text-xs mb-1" style={{ color: "#6B7280" }}>Total Ingredient Cost</p>
                <p className="text-2xl" style={{ color: "#6D1F2F", fontWeight: 700 }}>
                  ₹{totalCost.toLocaleString("en-IN", { maximumFractionDigits: 2 })}
                </p>
              </div>
              <div className="p-4 rounded-xl" style={{ background: "#FFF9F0" }}>
                <p className="text-xs mb-1" style={{ color: "#6B7280" }}>Items Being Produced</p>
                <p className="text-2xl" style={{ color: "#2C1810", fontWeight: 700 }}>{itemsProduced}</p>
              </div>
              <div className="p-4 rounded-xl border-2" style={{ background: "#FEF3D0", borderColor: "#F4C95D" }}>
                <p className="text-xs mb-1" style={{ color: "#6B7280" }}>Cost Per Item</p>
                <p className="text-3xl" style={{ color: "#6D1F2F", fontWeight: 700 }}>
                  ₹{costPerItem.toFixed(2)}
                </p>
              </div>
            </div>

            <div className="mt-5 space-y-2">
              <p className="text-xs uppercase tracking-wide" style={{ color: "#6B7280", fontWeight: 600 }}>Stock Preview</p>
              {activeRows.map(row => {
                const ing = activeIngredientList.find(i => i.id === row.ingredientId);
                if (!ing) return null;
                const remaining = ing.quantity - row.quantity;
                const pct = ing.quantity <= 0 ? 0 : Math.max(0, (remaining / ing.quantity) * 100);
                return (
                  <div key={row.id}>
                    <div className="flex justify-between text-xs mb-1">
                      <span style={{ color: "#2C1810" }}>{ing.name}</span>
                      <span style={{ color: remaining < 0 ? "#E5484D" : "#6B7280" }}>
                        {remaining < 0 ? "Over!" : `${remaining.toFixed(1)} ${ing.unit}`}
                      </span>
                    </div>
                    <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "#F5EDE0" }}>
                      <div className="h-full rounded-full transition-all"
                        style={{ width: `${Math.min(100, pct)}%`, background: pct < 20 ? "#E5484D" : pct < 40 ? "#FFB020" : "#34C759" }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
