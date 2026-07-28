import { useState } from "react";
import { Plus, Edit2, Trash2, X, Search } from "lucide-react";
import { toast } from "sonner";
import { useDatabase, type Worker } from "../utils/db";

const roles = ["Senior Baker", "Baker", "Pastry Chef", "Decorator", "Apprentice", "Manager"];

interface ModalProps {
  worker?: Worker | null;
  onClose: () => void;
  onSave: (data: Omit<Worker, "id">) => void;
}

function WorkerModal({ worker, onClose, onSave }: ModalProps) {
  const [form, setForm] = useState({
    name: worker?.name ?? "",
    email: worker?.email ?? "",
    role: worker?.role ?? "Baker",
    phone: worker?.phone ?? "",
    status: (worker?.status ?? "Active") as "Active" | "Inactive",
    lastActivity: worker?.lastActivity ?? new Date().toISOString().slice(0, 16),
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.4)" }}>
      <div className="bg-card rounded-2xl shadow-xl w-full max-w-md" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h2 style={{ color: "#2C1810", fontWeight: 600 }}>{worker ? "Edit Worker" : "Add Worker"}</h2>
          <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-muted">
            <X className="w-4 h-4" style={{ color: "#6B7280" }} />
          </button>
        </div>
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block mb-1.5 text-sm" style={{ color: "#2C1810", fontWeight: 500 }}>Full Name</label>
              <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                placeholder="John Smith"
                className="w-full px-3 py-2.5 rounded-xl border border-border outline-none text-sm" style={{ background: "#FFF9F0", color: "#2C1810" }} />
            </div>
            <div>
              <label className="block mb-1.5 text-sm" style={{ color: "#2C1810", fontWeight: 500 }}>Phone</label>
              <input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                placeholder="+1 555-0100"
                className="w-full px-3 py-2.5 rounded-xl border border-border outline-none text-sm" style={{ background: "#FFF9F0", color: "#2C1810" }} />
            </div>
          </div>
          <div>
            <label className="block mb-1.5 text-sm" style={{ color: "#2C1810", fontWeight: 500 }}>Email</label>
            <input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
              placeholder="worker@bakeflow.com"
              className="w-full px-3 py-2.5 rounded-xl border border-border outline-none text-sm" style={{ background: "#FFF9F0", color: "#2C1810" }} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block mb-1.5 text-sm" style={{ color: "#2C1810", fontWeight: 500 }}>Role</label>
              <select value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))}
                className="w-full px-3 py-2.5 rounded-xl border border-border outline-none text-sm" style={{ background: "#FFF9F0", color: "#2C1810" }}>
                {roles.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
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
          <div className="flex gap-3 pt-2">
            <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-border text-sm" style={{ color: "#2C1810" }}>Cancel</button>
            <button
              onClick={() => { onSave(form); onClose(); }}
              className="flex-1 py-2.5 rounded-xl text-white text-sm hover:opacity-90" style={{ background: "#6D1F2F", fontWeight: 500 }}>
              {worker ? "Update" : "Add Worker"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export function Workers() {
  const {
    workers,
    addWorker,
    updateWorker,
    deleteWorker,
    loading
  } = useDatabase();

  const [search, setSearch] = useState("");
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState<Worker | null>(null);

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-4 border-[#6D1F2F]/20 border-t-[#6D1F2F] animate-spin" />
      </div>
    );
  }

  const filtered = workers.filter(w =>
    w.name.toLowerCase().includes(search.toLowerCase()) ||
    w.email.toLowerCase().includes(search.toLowerCase()) ||
    w.role.toLowerCase().includes(search.toLowerCase())
  );

  const handleSave = async (data: Omit<Worker, "id">) => {
    try {
      if (editing) {
        await updateWorker(editing.id, data);
        toast.success("Worker updated");
      } else {
        await addWorker(data);
        toast.success("Worker added");
      }
    } catch (err) {
      toast.error("Failed to save worker");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteWorker(id);
      toast.success("Worker removed");
    } catch (err) {
      toast.error("Failed to remove worker");
    }
  };

  const active = workers.filter(w => w.status === "Active").length;

  return (
    <div className="flex-1 overflow-y-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <p className="text-sm" style={{ color: "#6B7280" }}>Admin-only worker management</p>
        <button
          onClick={() => { setEditing(null); setModal(true); }}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-white text-sm hover:opacity-90 shadow-sm"
          style={{ background: "#6D1F2F", fontWeight: 500 }}
        >
          <Plus className="w-4 h-4" />
          Add Worker
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
        {[
          { label: "Total Workers", value: workers.length },
          { label: "Active Today", value: active },
          { label: "Inactive", value: workers.length - active },
          { label: "Roles", value: new Set(workers.map(w => w.role)).size },
        ].map((c, i) => (
          <div key={i} className="bg-card rounded-xl p-4 border border-border">
            <p className="text-xs" style={{ color: "#6B7280" }}>{c.label}</p>
            <p className="text-xl mt-1" style={{ color: "#2C1810", fontWeight: 700 }}>{c.value}</p>
          </div>
        ))}
      </div>

      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "#6B7280" }} />
        <input
          value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Search workers..."
          className="w-full max-w-xs pl-9 pr-4 py-2.5 rounded-xl border border-border outline-none text-sm"
          style={{ background: "#FFF9F0", color: "#2C1810" }}
        />
      </div>

      <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
        <table className="w-full">
          <thead>
            <tr style={{ background: "#FFF9F0", borderBottom: "1px solid rgba(44,24,16,0.08)" }}>
              {["Worker", "Role", "Email", "Phone", "Last Activity", "Status", "Actions"].map(h => (
                <th key={h} className="text-left px-4 py-3 text-xs uppercase tracking-wide" style={{ color: "#6B7280", fontWeight: 600 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map(w => (
              <tr key={w.id} className="border-b transition-colors hover:bg-muted/40" style={{ borderColor: "rgba(44,24,16,0.06)" }}>
                <td className="px-4 py-3.5">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs shrink-0" style={{ background: "#6D1F2F", fontWeight: 600 }}>
                      {w.name ? w.name.split(" ").map(n => n[0]).join("") : "W"}
                    </div>
                    <span className="text-sm" style={{ color: "#2C1810", fontWeight: 500 }}>{w.name}</span>
                  </div>
                </td>
                <td className="px-4 py-3.5">
                  <span className="text-xs px-2.5 py-1 rounded-full" style={{ background: "#FEF3D0", color: "#6D1F2F", fontWeight: 500 }}>{w.role}</span>
                </td>
                <td className="px-4 py-3.5 text-sm" style={{ color: "#6B7280" }}>{w.email}</td>
                <td className="px-4 py-3.5 text-sm" style={{ color: "#6B7280" }}>{w.phone}</td>
                <td className="px-4 py-3.5 text-sm" style={{ color: "#6B7280" }}>{w.lastActivity}</td>
                <td className="px-4 py-3.5">
                  <span className="text-xs px-2.5 py-1 rounded-full" style={{
                    background: w.status === "Active" ? "rgba(52,199,89,0.1)" : "rgba(107,114,128,0.1)",
                    color: w.status === "Active" ? "#34C759" : "#6B7280",
                    fontWeight: 500
                  }}>{w.status}</span>
                </td>
                <td className="px-4 py-3.5">
                  <div className="flex items-center gap-1">
                    <button onClick={() => { setEditing(w); setModal(true); }} className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-muted">
                      <Edit2 className="w-3.5 h-3.5" style={{ color: "#6B7280" }} />
                    </button>
                    <button onClick={() => handleDelete(w.id)} className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-red-50">
                      <Trash2 className="w-3.5 h-3.5" style={{ color: "#E5484D" }} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div className="py-16 text-center text-sm" style={{ color: "#6B7280" }}>
            No workers found
          </div>
        )}
      </div>

      {modal && (
        <WorkerModal
          worker={editing}
          onClose={() => { setModal(false); setEditing(null); }}
          onSave={handleSave}
        />
      )}
    </div>
  );
}
