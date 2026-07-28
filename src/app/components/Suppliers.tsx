import { useState } from "react";
import { Plus, Edit2, Trash2, X, Search, Truck } from "lucide-react";
import { toast } from "sonner";
import { useDatabase, type Supplier } from "../utils/db";

function SupplierModal({ supplier, onClose, onSave }: { supplier?: Supplier | null; onClose: () => void; onSave: (d: Omit<Supplier, "id">) => void }) {
  const [form, setForm] = useState({
    name: supplier?.name ?? "",
    contact: supplier?.contact ?? "",
    email: supplier?.email ?? "",
    address: supplier?.address ?? "",
    ingredients: supplier?.ingredients ?? "",
    status: (supplier?.status ?? "Active") as "Active" | "Inactive",
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.4)" }}>
      <div className="bg-card rounded-2xl shadow-xl w-full max-w-lg">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h2 style={{ color: "#2C1810", fontWeight: 600 }}>{supplier ? "Edit Supplier" : "Add Supplier"}</h2>
          <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-muted">
            <X className="w-4 h-4" style={{ color: "#6B7280" }} />
          </button>
        </div>
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block mb-1.5 text-sm" style={{ color: "#2C1810", fontWeight: 500 }}>Supplier Name</label>
              <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                className="w-full px-3 py-2.5 rounded-xl border border-border outline-none text-sm" style={{ background: "#FFF9F0", color: "#2C1810" }} />
            </div>
            <div>
              <label className="block mb-1.5 text-sm" style={{ color: "#2C1810", fontWeight: 500 }}>Contact Number</label>
              <input value={form.contact} onChange={e => setForm(f => ({ ...f, contact: e.target.value }))}
                className="w-full px-3 py-2.5 rounded-xl border border-border outline-none text-sm" style={{ background: "#FFF9F0", color: "#2C1810" }} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block mb-1.5 text-sm" style={{ color: "#2C1810", fontWeight: 500 }}>Email</label>
              <input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                className="w-full px-3 py-2.5 rounded-xl border border-border outline-none text-sm" style={{ background: "#FFF9F0", color: "#2C1810" }} />
            </div>
            <div>
              <label className="block mb-1.5 text-sm" style={{ color: "#2C1810", fontWeight: 500 }}>Status</label>
              <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value as "Active" | "Inactive" }))}
                className="w-full px-3 py-2.5 rounded-xl border border-border outline-none text-sm" style={{ background: "#FFF9F0", color: "#2C1810" }}>
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block mb-1.5 text-sm" style={{ color: "#2C1810", fontWeight: 500 }}>Address</label>
            <input value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))}
              className="w-full px-3 py-2.5 rounded-xl border border-border outline-none text-sm" style={{ background: "#FFF9F0", color: "#2C1810" }} />
          </div>
          <div>
            <label className="block mb-1.5 text-sm" style={{ color: "#2C1810", fontWeight: 500 }}>Ingredients Supplied</label>
            <textarea value={form.ingredients} onChange={e => setForm(f => ({ ...f, ingredients: e.target.value }))}
              rows={2} placeholder="Flour, Sugar, Butter..."
              className="w-full px-3 py-2.5 rounded-xl border border-border outline-none text-sm resize-none" style={{ background: "#FFF9F0", color: "#2C1810" }} />
          </div>
          <div className="flex gap-3 pt-2">
            <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-border text-sm" style={{ color: "#2C1810" }}>Cancel</button>
            <button onClick={() => { onSave(form); onClose(); }}
              className="flex-1 py-2.5 rounded-xl text-white text-sm hover:opacity-90" style={{ background: "#6D1F2F", fontWeight: 500 }}>
              {supplier ? "Update" : "Add Supplier"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export function Suppliers() {
  const {
    suppliers,
    addSupplier,
    updateSupplier,
    deleteSupplier,
    loading
  } = useDatabase();

  const [search, setSearch] = useState("");
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState<Supplier | null>(null);

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-4 border-[#6D1F2F]/20 border-t-[#6D1F2F] animate-spin" />
      </div>
    );
  }

  const filtered = suppliers.filter(s =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    s.ingredients.toLowerCase().includes(search.toLowerCase())
  );

  const handleSave = async (data: Omit<Supplier, "id">) => {
    try {
      if (editing) {
        await updateSupplier(editing.id, data);
        toast.success("Supplier updated");
      } else {
        await addSupplier(data);
        toast.success("Supplier added");
      }
    } catch (err) {
      toast.error("Failed to save supplier");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteSupplier(id);
      toast.success("Supplier removed");
    } catch (err) {
      toast.error("Failed to remove supplier");
    }
  };

  return (
    <div className="flex-1 overflow-y-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <p className="text-sm" style={{ color: "#6B7280" }}>Manage your ingredient suppliers</p>
        <button onClick={() => { setEditing(null); setModal(true); }}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-white text-sm hover:opacity-90 shadow-sm"
          style={{ background: "#6D1F2F", fontWeight: 500 }}>
          <Plus className="w-4 h-4" />
          Add Supplier
        </button>
      </div>

      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "#6B7280" }} />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search suppliers..."
          className="w-full max-w-xs pl-9 pr-4 py-2.5 rounded-xl border border-border outline-none text-sm"
          style={{ background: "#FFF9F0", color: "#2C1810" }} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filtered.map(s => (
          <div key={s.id} className="bg-card rounded-2xl p-5 border border-border shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "#FEF3D0" }}>
                  <Truck className="w-5 h-5" style={{ color: "#6D1F2F" }} />
                </div>
                <div>
                  <p className="text-sm" style={{ color: "#2C1810", fontWeight: 600 }}>{s.name}</p>
                  <span className="text-xs px-2 py-0.5 rounded-full" style={{
                    background: s.status === "Active" ? "rgba(52,199,89,0.1)" : "rgba(107,114,128,0.1)",
                    color: s.status === "Active" ? "#34C759" : "#6B7280",
                    fontWeight: 500
                  }}>{s.status}</span>
                </div>
              </div>
              <div className="flex gap-1">
                <button onClick={() => { setEditing(s); setModal(true); }} className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-muted">
                  <Edit2 className="w-3.5 h-3.5" style={{ color: "#6B7280" }} />
                </button>
                <button onClick={() => handleDelete(s.id)}
                  className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-red-50">
                  <Trash2 className="w-3.5 h-3.5" style={{ color: "#E5484D" }} />
                </button>
              </div>
            </div>
            <div className="space-y-1.5 text-sm" style={{ color: "#6B7280" }}>
              <p>📞 {s.contact}</p>
              <p>✉️ {s.email}</p>
              <p>📍 {s.address || "No Address Listed"}</p>
            </div>
            <div className="mt-3 pt-3 border-t border-border">
              <p className="text-xs mb-1" style={{ color: "#6B7280", fontWeight: 500 }}>Supplies:</p>
              <div className="flex flex-wrap gap-1">
                {s.ingredients.split(",").map((ing, i) => (
                  <span key={i} className="text-xs px-2 py-0.5 rounded-full" style={{ background: "#FEF3D0", color: "#6D1F2F" }}>
                    {ing.trim()}
                  </span>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      {modal && (
        <SupplierModal supplier={editing} onClose={() => { setModal(false); setEditing(null); }} onSave={handleSave} />
      )}
    </div>
  );
}
