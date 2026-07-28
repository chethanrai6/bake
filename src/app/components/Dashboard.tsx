import {
  TrendingUp, Package, DollarSign, ChefHat, AlertTriangle, Users,
  ArrowUpRight, ArrowDownRight
} from "lucide-react";
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from "recharts";
import { USD_TO_INR } from "../utils/currency";
import { useDatabase } from "../utils/db";

function KpiCard({
  title, value, subtitle, icon: Icon, iconBg, trend, trendUp
}: {
  title: string; value: string; subtitle: string;
  icon: React.ElementType; iconBg: string; trend: string; trendUp: boolean;
}) {
  return (
    <div className="bg-card rounded-2xl p-5 shadow-sm border border-border flex flex-col gap-3 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
      <div className="flex items-start justify-between">
        <div className="w-11 h-11 rounded-xl flex items-center justify-center" style={{ background: iconBg }}>
          <Icon className="w-5 h-5" style={{ color: "#6D1F2F" }} />
        </div>
        <span className="flex items-center gap-1 text-xs px-2 py-1 rounded-full"
          style={{ background: trendUp ? "rgba(52,199,89,0.1)" : "rgba(229,72,77,0.1)", color: trendUp ? "#34C759" : "#E5484D", fontWeight: 500 }}>
          {trendUp ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
          {trend}
        </span>
      </div>
      <div>
        <p className="text-2xl" style={{ color: "#2C1810", fontWeight: 700 }}>{value}</p>
        <p className="text-sm" style={{ color: "#6B7280" }}>{title}</p>
        <p className="text-xs mt-0.5" style={{ color: "#9CA3AF" }}>{subtitle}</p>
      </div>
    </div>
  );
}

const rupeeFormatter = (v: number) => `₹${(v / 1000).toFixed(0)}k`;

export function Dashboard() {
  const {
    ingredients,
    workers,
    productionHistory,
    activities,
    loading
  } = useDatabase();

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-4 border-[#6D1F2F]/20 border-t-[#6D1F2F] animate-spin" />
      </div>
    );
  }

  // 1. Calculate KPIs
  const totalStockValue = ingredients.reduce((sum, ing) => sum + ing.quantity * ing.costPerUnit, 0);
  const totalIngredients = ingredients.length;
  
  const todayStr = new Date().toISOString().slice(0, 10);
  const todayProduction = productionHistory.filter(p => p.date === todayStr);
  const todayProdCost = todayProduction.reduce((sum, p) => sum + p.totalCost, 0);
  const todayItemsProduced = todayProduction.reduce((sum, p) => sum + p.qty, 0);
  
  const yesterdayStr = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
  const yesterdayProdCost = productionHistory.filter(p => p.date === yesterdayStr).reduce((sum, p) => sum + p.totalCost, 0);

  const lowStockAlerts = ingredients.filter(i => i.quantity <= i.minStock).length;
  const totalWorkers = workers.length;
  const activeWorkersToday = workers.filter(w => w.status === "Active").length;

  const costTrendUp = todayProdCost >= yesterdayProdCost;
  const costTrendPct = yesterdayProdCost > 0 
    ? Math.abs(((todayProdCost - yesterdayProdCost) / yesterdayProdCost) * 100).toFixed(1)
    : "0";

  // 2. Charts Row 1 - Monthly Production
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const last6Months = Array.from({ length: 6 }).map((_, idx) => {
    const d = new Date();
    d.setMonth(d.getMonth() - (5 - idx));
    return {
      month: months[d.getMonth()],
      monthIndex: d.getMonth(),
      year: d.getFullYear(),
      cost: 0,
      items: 0
    };
  });

  productionHistory.forEach(entry => {
    const d = new Date(entry.date);
    if (!isNaN(d.getTime())) {
      const mIdx = d.getMonth();
      const y = d.getFullYear();
      const target = last6Months.find(m => m.monthIndex === mIdx && m.year === y);
      if (target) {
        target.cost += entry.totalCost;
        target.items += entry.qty;
      }
    }
  });

  const hasProductionData = last6Months.some(m => m.cost > 0);
  const chartData = hasProductionData ? last6Months : [
    { month: "Jan", cost: 4200 * USD_TO_INR, items: 1240 },
    { month: "Feb", cost: 3800 * USD_TO_INR, items: 1100 },
    { month: "Mar", cost: 5100 * USD_TO_INR, items: 1520 },
    { month: "Apr", cost: 4700 * USD_TO_INR, items: 1380 },
    { month: "May", cost: 5600 * USD_TO_INR, items: 1690 },
    { month: "Jun", cost: 6100 * USD_TO_INR, items: 1820 },
  ];

  // 3. Product Share
  const productCostMap: Record<string, number> = {};
  productionHistory.forEach(entry => {
    productCostMap[entry.productName] = (productCostMap[entry.productName] || 0) + entry.totalCost;
  });
  const totalCostAllProducts = Object.values(productCostMap).reduce((a, b) => a + b, 0);
  const colors = ["#6D1F2F", "#F4C95D", "#34C759", "#FFB020", "#E5484D", "#8A2BE2", "#5F9EA0"];
  
  let productCostData = Object.keys(productCostMap).map((name, idx) => ({
    name,
    value: totalCostAllProducts > 0 ? Math.round((productCostMap[name] / totalCostAllProducts) * 100) : 0,
    color: colors[idx % colors.length]
  })).filter(p => p.value > 0);

  if (productCostData.length === 0) {
    productCostData = [
      { name: "Croissant", value: 28, color: "#6D1F2F" },
      { name: "Sourdough", value: 22, color: "#F4C95D" },
      { name: "Muffin", value: 18, color: "#34C759" },
      { name: "Bagel", value: 15, color: "#FFB020" },
      { name: "Brownie", value: 17, color: "#E5484D" },
    ];
  }

  // 4. Ingredient Usage (Top Stock Levels)
  let ingredientUsageData = ingredients.slice(0, 6).map(ing => ({
    name: ing.name.split(" ").pop() || ing.name,
    usage: ing.quantity
  }));

  if (ingredientUsageData.length === 0) {
    ingredientUsageData = [
      { name: "Flour", usage: 340 },
      { name: "Sugar", usage: 210 },
      { name: "Butter", usage: 180 },
      { name: "Eggs", usage: 290 },
      { name: "Milk", usage: 160 },
      { name: "Yeast", usage: 90 },
    ];
  }

  // 5. Recent Activity
  const displayActivities = activities.slice(0, 6);

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <KpiCard title="Total Stock Value" value={`₹${totalStockValue.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`} subtitle={`Across ${totalIngredients} ingredients`} icon={DollarSign} iconBg="#FEF3D0" trend="12%" trendUp={true} />
        <KpiCard title="Total Ingredients" value={`${totalIngredients}`} subtitle={`${lowStockAlerts} low stock`} icon={Package} iconBg="#FEF3D0" trend="3%" trendUp={true} />
        <KpiCard title="Today's Prod. Cost" value={`₹${todayProdCost.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`} subtitle={`vs ₹${yesterdayProdCost.toLocaleString("en-IN", { maximumFractionDigits: 0 })} yesterday`} icon={TrendingUp} iconBg="#FEF3D0" trend={`${costTrendPct}%`} trendUp={costTrendUp} />
        <KpiCard title="Items Produced" value={`${todayItemsProduced}`} subtitle="Today's total" icon={ChefHat} iconBg="#FEF3D0" trend="8%" trendUp={true} />
        <KpiCard title="Low Stock Alerts" value={`${lowStockAlerts}`} subtitle="Needs attention" icon={AlertTriangle} iconBg="rgba(229,72,77,0.08)" trend={`${ingredients.filter(i => i.quantity <= i.minStock * 0.5).length} critical`} trendUp={false} />
        <KpiCard title="Total Workers" value={`${totalWorkers}`} subtitle={`${activeWorkersToday} active today`} icon={Users} iconBg="#FEF3D0" trend="75%" trendUp={true} />
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 bg-card rounded-2xl p-5 shadow-sm border border-border">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 style={{ color: "#2C1810", fontWeight: 600 }}>Monthly Production</h3>
              <p className="text-sm" style={{ color: "#6B7280" }}>Cost (₹) vs items produced</p>
            </div>
            <span className="px-3 py-1 rounded-full text-xs" style={{ background: "#FEF3D0", color: "#6D1F2F", fontWeight: 500 }}>Last 6 months</span>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="costGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6D1F2F" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#6D1F2F" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="itemsGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#F4C95D" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#F4C95D" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(44,24,16,0.06)" />
              <XAxis dataKey="month" tick={{ fontSize: 12, fill: "#6B7280" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "#6B7280" }} axisLine={false} tickLine={false} tickFormatter={rupeeFormatter} />
              <Tooltip
                contentStyle={{ borderRadius: 12, border: "1px solid rgba(44,24,16,0.1)", boxShadow: "0 4px 16px rgba(0,0,0,0.08)" }}
                formatter={(v: number, name: string) => [name === "cost" ? `₹${v.toLocaleString("en-IN")}` : v, name === "cost" ? "Cost (₹)" : "Items"]}
              />
              <Area type="monotone" dataKey="cost" stroke="#6D1F2F" strokeWidth={2} fill="url(#costGrad)" name="cost" />
              <Area type="monotone" dataKey="items" stroke="#F4C95D" strokeWidth={2} fill="url(#itemsGrad)" name="Items" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-card rounded-2xl p-5 shadow-sm border border-border">
          <div className="mb-4">
            <h3 style={{ color: "#2C1810", fontWeight: 600 }}>Product Share</h3>
            <p className="text-sm" style={{ color: "#6B7280" }}>Cost distribution</p>
          </div>
          <ResponsiveContainer width="100%" height={160}>
            <PieChart>
              <Pie data={productCostData} cx="50%" cy="50%" innerRadius={45} outerRadius={75} paddingAngle={3} dataKey="value">
                {productCostData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
              </Pie>
              <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid rgba(44,24,16,0.1)" }} formatter={(v: number) => [`${v}%`, "Share"]} />
            </PieChart>
          </ResponsiveContainer>
          <div className="space-y-2 mt-2">
            {productCostData.map((p, i) => (
              <div key={i} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ background: p.color }} />
                  <span className="text-xs" style={{ color: "#6B7280" }}>{p.name}</span>
                </div>
                <span className="text-xs" style={{ color: "#2C1810", fontWeight: 500 }}>{p.value}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 bg-card rounded-2xl p-5 shadow-sm border border-border">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 style={{ color: "#2C1810", fontWeight: 600 }}>Ingredient Stocks</h3>
              <p className="text-sm" style={{ color: "#6B7280" }}>Current quantities in stock (kg/L/pcs)</p>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={ingredientUsageData} barSize={28}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(44,24,16,0.06)" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 12, fill: "#6B7280" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 12, fill: "#6B7280" }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid rgba(44,24,16,0.1)" }} />
              <Bar dataKey="usage" fill="#6D1F2F" radius={[6, 6, 0, 0]} name="In Stock" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-card rounded-2xl p-5 shadow-sm border border-border">
          <h3 className="mb-4" style={{ color: "#2C1810", fontWeight: 600 }}>Recent Activity</h3>
          <div className="space-y-3">
            {displayActivities.map((a, i) => (
              <div key={a.id || i} className="flex items-start gap-3">
                <span className="text-xl leading-none mt-0.5">{a.icon}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm truncate" style={{ color: "#2C1810", fontWeight: 500 }}>{a.text}</p>
                  <p className="text-xs" style={{ color: "#6B7280" }}>{a.time}</p>
                </div>
              </div>
            ))}
            {displayActivities.length === 0 && (
              <div className="py-8 text-center text-sm" style={{ color: "#6B7280" }}>
                No recent activity.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

