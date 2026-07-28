import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from "recharts";
import { DollarSign, TrendingUp, AlertCircle } from "lucide-react";
import { USD_TO_INR } from "../utils/currency";

const R = USD_TO_INR;

const productCostData = [
  { product: "Croissant", cost: 1.30 * R, price: 4.00 * R, margin: 67.5 },
  { product: "Sourdough", cost: 2.00 * R, price: 6.50 * R, margin: 69.2 },
  { product: "Muffin",    cost: 0.52 * R, price: 2.50 * R, margin: 79.2 },
  { product: "Bagel",     cost: 0.55 * R, price: 2.00 * R, margin: 72.5 },
  { product: "Brownie",   cost: 0.90 * R, price: 3.00 * R, margin: 70.0 },
  { product: "Danish",    cost: 1.40 * R, price: 4.50 * R, margin: 68.9 },
  { product: "Banana Bread", cost: 1.25 * R, price: 4.00 * R, margin: 68.8 },
];

const expensiveIngredients = [
  { name: "Unsalted Butter",  costPerUnit: 6.50 * R, unit: "kg", monthlyUsage: 180, monthlyTotal: 1170 * R },
  { name: "Vanilla Extract",  costPerUnit: 18.0 * R, unit: "L",  monthlyUsage: 8,   monthlyTotal: 144  * R },
  { name: "Active Dry Yeast", costPerUnit: 12.0 * R, unit: "kg", monthlyUsage: 18,  monthlyTotal: 216  * R },
  { name: "Cocoa Powder",     costPerUnit: 7.00 * R, unit: "kg", monthlyUsage: 48,  monthlyTotal: 336  * R },
  { name: "Baking Powder",    costPerUnit: 4.50 * R, unit: "kg", monthlyUsage: 12,  monthlyTotal: 54   * R },
  { name: "Granulated Sugar", costPerUnit: 1.20 * R, unit: "kg", monthlyUsage: 210, monthlyTotal: 252  * R },
];

const monthlyCostTrends = [
  { month: "Jan", ingredients: 2800 * R, labor: 4200 * R, total: 7000 * R },
  { month: "Feb", ingredients: 2400 * R, labor: 4000 * R, total: 6400 * R },
  { month: "Mar", ingredients: 3200 * R, labor: 4500 * R, total: 7700 * R },
  { month: "Apr", ingredients: 3000 * R, labor: 4300 * R, total: 7300 * R },
  { month: "May", ingredients: 3600 * R, labor: 4800 * R, total: 8400 * R },
  { month: "Jun", ingredients: 1200 * R, labor: 1600 * R, total: 2800 * R },
];

const costBreakdownPie = [
  { name: "Flour & Grains", value: 22, color: "#6D1F2F" },
  { name: "Dairy",          value: 35, color: "#F4C95D" },
  { name: "Sweeteners",     value: 18, color: "#34C759" },
  { name: "Flavoring",      value: 12, color: "#FFB020" },
  { name: "Leavening",      value: 8,  color: "#E5484D" },
  { name: "Other",          value: 5,  color: "#9CA3AF" },
];

const RADIAN = Math.PI / 180;
const CustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) => {
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);
  return percent > 0.08 ? (
    <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" fontSize={11} fontWeight={600}>
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  ) : null;
};

const rupFmt = (v: number) => `₹${(v / 1000).toFixed(0)}k`;

export function CostAnalysis() {
  const avgMargin = productCostData.reduce((s, p) => s + p.margin, 0) / productCostData.length;

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-6">
      <p className="text-sm" style={{ color: "#6B7280" }}>Deep cost breakdown, margin analysis, and trend forecasting</p>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Avg Profit Margin",    value: `${avgMargin.toFixed(1)}%`,  trend: "+2.4%",     up: true,  icon: TrendingUp,  bg: "rgba(52,199,89,0.1)",  color: "#34C759" },
          { label: "Highest Cost Product", value: "Sourdough",                 trend: `₹${(2*R).toFixed(0)}/unit`, up: false, icon: AlertCircle, bg: "#FEF3D0",             color: "#FFB020" },
          { label: "Most Expensive Ing.",  value: "Butter",                    trend: `₹${(6.5*R).toFixed(0)}/kg`, up: false, icon: DollarSign,  bg: "rgba(229,72,77,0.08)",color: "#E5484D" },
          { label: "Monthly Cost (Jun)",   value: `₹${(2800*R).toLocaleString("en-IN", {maximumFractionDigits:0})}`, trend: "This month", up: true, icon: DollarSign, bg: "#FEF3D0", color: "#6D1F2F" },
        ].map((c, i) => {
          const Icon = c.icon;
          return (
            <div key={i} className="bg-card rounded-2xl p-5 border border-border shadow-sm hover:-translate-y-0.5 hover:shadow-md transition-all duration-200">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3" style={{ background: c.bg }}>
                <Icon className="w-5 h-5" style={{ color: c.color }} />
              </div>
              <p className="text-lg" style={{ color: "#2C1810", fontWeight: 700 }}>{c.value}</p>
              <p className="text-xs mt-0.5" style={{ color: "#6B7280" }}>{c.label}</p>
              <p className="text-xs mt-1" style={{ color: c.up ? "#34C759" : "#FFB020", fontWeight: 500 }}>{c.trend}</p>
            </div>
          );
        })}
      </div>

      {/* Cost vs Price + Pie */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 bg-card rounded-2xl p-5 border border-border shadow-sm">
          <h3 className="mb-1" style={{ color: "#2C1810", fontWeight: 600 }}>Product Cost vs Selling Price</h3>
          <p className="text-sm mb-4" style={{ color: "#6B7280" }}>Cost per item vs market price (₹)</p>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={productCostData} barSize={20}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(44,24,16,0.06)" vertical={false} />
              <XAxis dataKey="product" tick={{ fontSize: 11, fill: "#6B7280" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "#6B7280" }} axisLine={false} tickLine={false} tickFormatter={rupFmt} />
              <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid rgba(44,24,16,0.1)" }}
                formatter={(v: number, name: string) => [`₹${v.toFixed(2)}`, name === "cost" ? "Cost" : "Price"]} />
              <Legend formatter={(v) => v === "cost" ? "Production Cost" : "Selling Price"} />
              <Bar dataKey="cost" fill="#6D1F2F" radius={[6, 6, 0, 0]} name="cost" />
              <Bar dataKey="price" fill="#F4C95D" radius={[6, 6, 0, 0]} name="price" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-card rounded-2xl p-5 border border-border shadow-sm">
          <h3 className="mb-1" style={{ color: "#2C1810", fontWeight: 600 }}>Ingredient Cost Share</h3>
          <p className="text-sm mb-3" style={{ color: "#6B7280" }}>By category</p>
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie data={costBreakdownPie} cx="50%" cy="50%" outerRadius={80} dataKey="value" labelLine={false} label={CustomLabel}>
                {costBreakdownPie.map((e, i) => <Cell key={i} fill={e.color} />)}
              </Pie>
              <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid rgba(44,24,16,0.1)" }} formatter={(v: number) => [`${v}%`, "Share"]} />
            </PieChart>
          </ResponsiveContainer>
          <div className="space-y-1.5 mt-2">
            {costBreakdownPie.map((c, i) => (
              <div key={i} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full" style={{ background: c.color }} />
                  <span className="text-xs" style={{ color: "#6B7280" }}>{c.name}</span>
                </div>
                <span className="text-xs" style={{ color: "#2C1810", fontWeight: 500 }}>{c.value}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Monthly trends */}
      <div className="bg-card rounded-2xl p-5 border border-border shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 style={{ color: "#2C1810", fontWeight: 600 }}>Monthly Cost Trends</h3>
            <p className="text-sm" style={{ color: "#6B7280" }}>Ingredient vs labor costs (₹)</p>
          </div>
          <span className="px-3 py-1 rounded-full text-xs" style={{ background: "#FEF3D0", color: "#6D1F2F", fontWeight: 500 }}>6 months</span>
        </div>
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={monthlyCostTrends}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(44,24,16,0.06)" />
            <XAxis dataKey="month" tick={{ fontSize: 12, fill: "#6B7280" }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: "#6B7280" }} axisLine={false} tickLine={false} tickFormatter={rupFmt} />
            <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid rgba(44,24,16,0.1)" }}
              formatter={(v: number) => [`₹${v.toLocaleString("en-IN", {maximumFractionDigits:0})}`, ""]} />
            <Legend />
            <Line type="monotone" dataKey="total"       stroke="#6D1F2F" strokeWidth={3} dot={{ fill: "#6D1F2F", r: 5 }} name="Total Cost" />
            <Line type="monotone" dataKey="ingredients" stroke="#F4C95D" strokeWidth={2} dot={{ fill: "#F4C95D", r: 4 }} name="Ingredients" />
            <Line type="monotone" dataKey="labor"       stroke="#34C759" strokeWidth={2} strokeDasharray="5 5" dot={false} name="Labor" />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Most expensive */}
        <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-border">
            <h3 style={{ color: "#2C1810", fontWeight: 600 }}>Most Expensive Ingredients</h3>
            <p className="text-sm" style={{ color: "#6B7280" }}>By monthly spend (₹)</p>
          </div>
          <div className="p-4 space-y-3">
            {[...expensiveIngredients].sort((a, b) => b.monthlyTotal - a.monthlyTotal).map((ing, i) => {
              const max = Math.max(...expensiveIngredients.map(x => x.monthlyTotal));
              const pct = (ing.monthlyTotal / max) * 100;
              return (
                <div key={i}>
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs w-4 text-right" style={{ color: "#6B7280" }}>#{i + 1}</span>
                      <span className="text-sm" style={{ color: "#2C1810", fontWeight: 500 }}>{ing.name}</span>
                    </div>
                    <span className="text-sm" style={{ color: "#6D1F2F", fontWeight: 700 }}>
                      ₹{ing.monthlyTotal.toLocaleString("en-IN", { maximumFractionDigits: 0 })}/mo
                    </span>
                  </div>
                  <div className="h-2 rounded-full overflow-hidden ml-6" style={{ background: "#F5EDE0" }}>
                    <div className="h-full rounded-full" style={{ width: `${pct}%`, background: i === 0 ? "#6D1F2F" : i === 1 ? "#FFB020" : "#F4C95D" }} />
                  </div>
                  <p className="text-xs mt-0.5 ml-6" style={{ color: "#9CA3AF" }}>
                    ₹{ing.costPerUnit.toFixed(0)}/{ing.unit} · {ing.monthlyUsage} {ing.unit} used
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Margin */}
        <div className="bg-card rounded-2xl p-5 border border-border shadow-sm">
          <h3 className="mb-1" style={{ color: "#2C1810", fontWeight: 600 }}>Profit Margin by Product</h3>
          <p className="text-sm mb-4" style={{ color: "#6B7280" }}>Margin percentage</p>
          <div className="space-y-3">
            {[...productCostData].sort((a, b) => b.margin - a.margin).map((p, i) => (
              <div key={i}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm" style={{ color: "#2C1810" }}>{p.product}</span>
                  <span className="text-sm" style={{ color: p.margin > 75 ? "#34C759" : p.margin > 70 ? "#FFB020" : "#6D1F2F", fontWeight: 600 }}>
                    {p.margin.toFixed(1)}%
                  </span>
                </div>
                <div className="h-2.5 rounded-full overflow-hidden" style={{ background: "#F5EDE0" }}>
                  <div className="h-full rounded-full" style={{ width: `${p.margin}%`, background: p.margin > 75 ? "#34C759" : p.margin > 70 ? "#FFB020" : "#6D1F2F" }} />
                </div>
              </div>
            ))}
          </div>
          <div className="mt-5 pt-4 border-t border-border grid grid-cols-3 gap-3 text-center">
            {[
              { label: "Avg Margin", value: `${avgMargin.toFixed(1)}%`, color: "#34C759" },
              { label: "Best",       value: `${Math.max(...productCostData.map(p => p.margin)).toFixed(1)}%`, color: "#34C759" },
              { label: "Lowest",     value: `${Math.min(...productCostData.map(p => p.margin)).toFixed(1)}%`, color: "#FFB020" },
            ].map((s, i) => (
              <div key={i} className="p-3 rounded-xl" style={{ background: "#FFF9F0" }}>
                <p className="text-xs" style={{ color: "#6B7280" }}>{s.label}</p>
                <p className="text-base" style={{ color: s.color, fontWeight: 700 }}>{s.value}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
