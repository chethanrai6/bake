import { useState } from "react";
import { Search, Calendar } from "lucide-react";
import { useDatabase } from "../utils/db";

export function ProductionHistory() {
  const {
    productionHistory,
    workers: dbWorkers,
    loading
  } = useDatabase();

  const [search, setSearch]             = useState("");
  const [workerFilter, setWorkerFilter] = useState("All Workers");
  const [dateFrom, setDateFrom]         = useState("");
  const [dateTo, setDateTo]             = useState("");

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-4 border-[#6D1F2F]/20 border-t-[#6D1F2F] animate-spin" />
      </div>
    );
  }

  // Get unique workers list from history + database workers
  const uniqueWorkers = ["All Workers", ...Array.from(new Set([
    ...dbWorkers.map(w => w.name),
    ...productionHistory.map(h => h.addedBy)
  ]))];

  const filtered = productionHistory.filter(r => {
    const matchSearch = r.product.toLowerCase().includes(search.toLowerCase());
    const matchWorker = workerFilter === "All Workers" || r.addedBy === workerFilter;
    const matchFrom   = !dateFrom || r.date >= dateFrom;
    const matchTo     = !dateTo   || r.date <= dateTo;
    return matchSearch && matchWorker && matchFrom && matchTo;
  });

  const totals = filtered.reduce((acc, r) => ({ items: acc.items + r.quantity, cost: acc.cost + r.totalCost }), { items: 0, cost: 0 });

  return (
    <div className="flex-1 overflow-y-auto p-6">
      <p className="text-sm mb-6" style={{ color: "#6B7280" }}>View and filter all production records</p>

      {/* Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
        {[
          { label: "Total Batches",   value: filtered.length },
          { label: "Items Produced",  value: totals.items.toLocaleString() },
          { label: "Total Cost",      value: `₹${totals.cost.toLocaleString("en-IN", { maximumFractionDigits: 0 })}` },
          { label: "Avg Cost/Batch",  value: filtered.length ? `₹${(totals.cost / filtered.length).toLocaleString("en-IN", { maximumFractionDigits: 0 })}` : "₹0" },
        ].map((c, i) => (
          <div key={i} className="bg-card rounded-xl p-4 border border-border">
            <p className="text-xs" style={{ color: "#6B7280" }}>{c.label}</p>
            <p className="text-xl mt-1" style={{ color: "#2C1810", fontWeight: 700 }}>{c.value}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-4">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "#6B7280" }} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search product..."
            className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-border outline-none text-sm" style={{ background: "#FFF9F0", color: "#2C1810" }} />
        </div>
        <select value={workerFilter} onChange={e => setWorkerFilter(e.target.value)}
          className="px-3 py-2.5 rounded-xl border border-border outline-none text-sm" style={{ background: "#FFF9F0", color: "#2C1810" }}>
          {uniqueWorkers.map(w => <option key={w} value={w}>{w}</option>)}
        </select>
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4" style={{ color: "#6B7280" }} />
          <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)}
            className="px-3 py-2.5 rounded-xl border border-border outline-none text-sm" style={{ background: "#FFF9F0", color: "#2C1810" }} />
          <span className="text-sm" style={{ color: "#6B7280" }}>to</span>
          <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)}
            className="px-3 py-2.5 rounded-xl border border-border outline-none text-sm" style={{ background: "#FFF9F0", color: "#2C1810" }} />
        </div>
      </div>

      {/* Table */}
      <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr style={{ background: "#FFF9F0", borderBottom: "1px solid rgba(44,24,16,0.08)" }}>
                {["Date", "Product", "Qty Produced", "Total Cost", "Cost/Item", "Worker", "Shift"].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs uppercase tracking-wide" style={{ color: "#6B7280", fontWeight: 600 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(row => {
                const w = dbWorkers.find(worker => worker.name === row.addedBy);
                const shift = w?.role.includes("Senior") || w?.role.includes("Decorator") || row.addedBy.includes("Maria") || row.addedBy.includes("Fatima")
                  ? "Morning"
                  : "Afternoon";

                return (
                  <tr key={row.id} className="border-b transition-colors hover:bg-muted/40" style={{ borderColor: "rgba(44,24,16,0.06)" }}>
                    <td className="px-4 py-3.5 text-sm" style={{ color: "#6B7280" }}>{row.date}</td>
                    <td className="px-4 py-3.5"><span className="text-sm" style={{ color: "#2C1810", fontWeight: 500 }}>{row.product}</span></td>
                    <td className="px-4 py-3.5 text-sm" style={{ color: "#2C1810" }}>{row.quantity} pcs</td>
                    <td className="px-4 py-3.5 text-sm" style={{ color: "#2C1810", fontWeight: 500 }}>
                      ₹{row.totalCost.toLocaleString("en-IN", { maximumFractionDigits: 0 })}
                    </td>
                    <td className="px-4 py-3.5 text-sm" style={{ color: "#6D1F2F", fontWeight: 600 }}>
                      ₹{row.costPerItem.toFixed(2)}
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs" style={{ background: "#6D1F2F", fontWeight: 600 }}>
                          {row.addedBy ? row.addedBy.split(" ").map(n => n[0]).join("") : "W"}
                        </div>
                        <span className="text-sm" style={{ color: "#2C1810" }}>{row.addedBy}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="text-xs px-2.5 py-1 rounded-full"
                        style={{ background: shift === "Morning" ? "rgba(52,199,89,0.1)" : "rgba(255,176,32,0.1)", color: shift === "Morning" ? "#34C759" : "#FFB020", fontWeight: 500 }}>
                        {shift}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {filtered.length === 0 && <div className="py-16 text-center"><p style={{ color: "#6B7280" }}>No records found</p></div>}
        </div>
      </div>
    </div>
  );
}
