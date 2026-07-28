import { useState } from "react";
import { Plus, Search, Edit2, Trash2, X, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { toast } from "sonner";
import { useDatabase, type Ingredient } from "../utils/db";

function getStatus(qty: number, min: number) {
  if (qty <= min * 0.5) return { label: "Critical",  color: "#E5484D", bg: "rgba(229,72,77,0.1)"  };
  if (qty <= min)       return { label: "Low Stock", color: "#FFB020", bg: "rgba(255,176,32,0.1)" };
  return                       { label: "In Stock",  color: "#34C759", bg: "rgba(52,199,89,0.1)"  };
}

interface ModalProps {
  ingredient?: Ingredient | null;
  onClose: () => void;
  onSave: (data: Omit<Ingredient, "id">) => void;
}

function IngredientModal({ ingredient, onClose, onSave }: ModalProps) {
  const [form, setForm] = useState({
    name: ingredient?.name ?? "",
    quantity: ingredient?.quantity ?? 0,
    unit: ingredient?.unit ?? "kg",
    costPerUnit: ingredient?.costPerUnit ?? 0,
    minStock: ingredient?.minStock ?? 5,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(form);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.4)" }}>
      <div className="bg-card rounded-2xl shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h2 style={{ color: "#2C1810", fontWeight: 600 }}>{ingredient ? "Edit Ingredient" : "Add Ingredient"}</h2>
          <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-muted">
            <X className="w-4 h-4" style={{ color: "#6B7280" }} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block mb-1.5 text-sm" style={{ color: "#2C1810", fontWeight: 500 }}>Ingredient Name</label>
            <input required value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              placeholder="e.g. All-Purpose Flour"
              className="w-full px-3 py-2.5 rounded-xl border border-border outline-none text-sm" style={{ background: "#FFF9F0", color: "#2C1810" }} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block mb-1.5 text-sm" style={{ color: "#2C1810", fontWeight: 500 }}>Quantity</label>
              <input required type="number" min={0} step={0.01} value={form.quantity}
                onChange={e => setForm(f => ({ ...f, quantity: parseFloat(e.target.value) || 0 }))}
                className="w-full px-3 py-2.5 rounded-xl border border-border outline-none text-sm" style={{ background: "#FFF9F0", color: "#2C1810" }} />
            </div>
            <div>
              <label className="block mb-1.5 text-sm" style={{ color: "#2C1810", fontWeight: 500 }}>Unit</label>
              <select value={form.unit} onChange={e => setForm(f => ({ ...f, unit: e.target.value }))}
                className="w-full px-3 py-2.5 rounded-xl border border-border outline-none text-sm" style={{ background: "#FFF9F0", color: "#2C1810" }}>
                {["kg", "g", "L", "ml", "pcs", "tbsp", "tsp", "cup"].map(u => <option key={u} value={u}>{u}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block mb-1.5 text-sm" style={{ color: "#2C1810", fontWeight: 500 }}>Cost Per Unit (₹)</label>
              <input required type="number" min={0} step={0.01} value={form.costPerUnit}
                onChange={e => setForm(f => ({ ...f, costPerUnit: parseFloat(e.target.value) || 0 }))}
                className="w-full px-3 py-2.5 rounded-xl border border-border outline-none text-sm" style={{ background: "#FFF9F0", color: "#2C1810" }} />
            </div>
            <div>
              <label className="block mb-1.5 text-sm" style={{ color: "#2C1810", fontWeight: 500 }}>Min Stock</label>
              <input required type="number" min={0} step={0.01} value={form.minStock}
                onChange={e => setForm(f => ({ ...f, minStock: parseFloat(e.target.value) || 0 }))}
                className="w-full px-3 py-2.5 rounded-xl border border-border outline-none text-sm" style={{ background: "#FFF9F0", color: "#2C1810" }} />
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-border text-sm" style={{ color: "#2C1810" }}>Cancel</button>
            <button type="submit" className="flex-1 py-2.5 rounded-xl text-white text-sm hover:opacity-90" style={{ background: "#6D1F2F", fontWeight: 500 }}>
              {ingredient ? "Update" : "Add Ingredient"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function Ingredients() {
  const {
    ingredients,
    addIngredient,
    updateIngredient,
    deleteIngredient,
    loading
  } = useDatabase();

  const [search, setSearch] = useState("");
  const [filterUnit, setFilterUnit] = useState("all");
  const [modal, setModal] = useState<"add" | "edit" | null>(null);
  const [editing, setEditing] = useState<Ingredient | null>(null);

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-4 border-[#6D1F2F]/20 border-t-[#6D1F2F] animate-spin" />
      </div>
    );
  }

  const units = ["all", ...Array.from(new Set(ingredients.map(i => i.unit)))];
  const filtered = ingredients.filter(i => {
    const matchSearch = i.name.toLowerCase().includes(search.toLowerCase());
    const matchUnit   = filterUnit === "all" || i.unit === filterUnit;
    return matchSearch && matchUnit;
  });

  const handleSave = async (data: Omit<Ingredient, "id">) => {
    try {
      if (editing) {
        await updateIngredient(editing.id, data);
        toast.success("Ingredient updated successfully");
      } else {
        await addIngredient(data);
        toast.success("Ingredient added successfully");
      }
      setModal(null); setEditing(null);
    } catch (error) {
      toast.error("Error saving ingredient");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteIngredient(id);
      toast.success("Ingredient deleted");
    } catch (error) {
      toast.error("Error deleting ingredient");
    }
  };

  const totalValue = ingredients.reduce((s, i) => s + i.quantity * i.costPerUnit, 0);

  return (
    <div className="flex-1 overflow-y-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <p className="text-sm" style={{ color: "#6B7280" }}>Manage your bakery ingredient inventory</p>
        <button onClick={() => { setEditing(null); setModal("add"); }}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-white text-sm hover:opacity-90 shadow-sm"
          style={{ background: "#6D1F2F", fontWeight: 500 }}>
          <Plus className="w-4 h-4" /> Add Ingredient
        </button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 mb-4 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "#6B7280" }} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search ingredients..."
            className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-border outline-none text-sm" style={{ background: "#FFF9F0", color: "#2C1810" }} />
        </div>
        <select value={filterUnit} onChange={e => setFilterUnit(e.target.value)}
          className="px-3 py-2.5 rounded-xl border border-border outline-none text-sm" style={{ background: "#FFF9F0", color: "#2C1810" }}>
          {units.map(u => <option key={u} value={u}>{u === "all" ? "All Units" : u}</option>)}
        </select>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
        {[
          { label: "Total Ingredients", value: ingredients.length },
          { label: "Total Value",       value: `₹${totalValue.toLocaleString("en-IN", { maximumFractionDigits: 0 })}` },
          { label: "Low Stock",         value: ingredients.filter(i => i.quantity <= i.minStock).length },
          { label: "Critical",          value: ingredients.filter(i => i.quantity <= i.minStock * 0.5).length },
        ].map((c, i) => (
          <div key={i} className="bg-card rounded-xl p-4 border border-border">
            <p className="text-xs" style={{ color: "#6B7280" }}>{c.label}</p>
            <p className="text-xl mt-1" style={{ color: "#2C1810", fontWeight: 700 }}>{c.value}</p>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr style={{ background: "#FFF9F0", borderBottom: "1px solid rgba(44,24,16,0.08)" }}>
                {["Ingredient Name", "Quantity", "Unit", "Cost/Unit", "Total Value", "Status", "Actions"].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs uppercase tracking-wide" style={{ color: "#6B7280", fontWeight: 600 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(ing => {
                const status     = getStatus(ing.quantity, ing.minStock);
                const totalValue = (ing.quantity * ing.costPerUnit).toLocaleString("en-IN", { maximumFractionDigits: 0 });
                return (
                  <tr key={ing.id} className="border-b transition-colors hover:bg-muted/40" style={{ borderColor: "rgba(44,24,16,0.06)" }}>
                    <td className="px-4 py-3.5">
                      <span className="text-sm" style={{ color: "#2C1810", fontWeight: 500 }}>{ing.name}</span>
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm" style={{ color: "#2C1810" }}>{ing.quantity}</span>
                        {ing.quantity <= ing.minStock * 0.5 ? <TrendingDown className="w-3.5 h-3.5" style={{ color: "#E5484D" }} />
                          : ing.quantity <= ing.minStock    ? <Minus       className="w-3.5 h-3.5" style={{ color: "#FFB020" }} />
                          :                                  <TrendingUp  className="w-3.5 h-3.5" style={{ color: "#34C759" }} />}
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="text-sm px-2 py-0.5 rounded-md" style={{ background: "#FEF3D0", color: "#6D1F2F", fontWeight: 500 }}>{ing.unit}</span>
                    </td>
                    <td className="px-4 py-3.5 text-sm" style={{ color: "#2C1810" }}>
                      ₹{ing.costPerUnit.toLocaleString("en-IN", { maximumFractionDigits: 2 })}
                    </td>
                    <td className="px-4 py-3.5 text-sm" style={{ color: "#2C1810", fontWeight: 500 }}>₹{totalValue}</td>
                    <td className="px-4 py-3.5">
                      <span className="text-xs px-2.5 py-1 rounded-full" style={{ background: status.bg, color: status.color, fontWeight: 500 }}>
                        {status.label}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-1">
                        <button onClick={() => { setEditing(ing); setModal("edit"); }}
                          className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-muted">
                          <Edit2 className="w-3.5 h-3.5" style={{ color: "#6B7280" }} />
                        </button>
                        <button onClick={() => handleDelete(ing.id)}
                          className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-red-50">
                          <Trash2 className="w-3.5 h-3.5" style={{ color: "#E5484D" }} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {filtered.length === 0 && <div className="py-16 text-center"><p style={{ color: "#6B7280" }}>No ingredients found</p></div>}
        </div>
      </div>

      {(modal === "add" || modal === "edit") && (
        <IngredientModal ingredient={editing} onClose={() => { setModal(null); setEditing(null); }} onSave={handleSave} />
      )}
    </div>
  );
}
