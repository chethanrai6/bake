import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { Download, FileText, TrendingUp } from "lucide-react";
import { toast } from "sonner";
import { USD_TO_INR } from "../utils/currency";
import { useDatabase } from "../utils/db";

const R = USD_TO_INR;

const dailyData = [
  { day: "Mon", items: 186, cost: 342 * R },
  { day: "Tue", items: 220, cost: 410 * R },
  { day: "Wed", items: 175, cost: 318 * R },
  { day: "Thu", items: 240, cost: 445 * R },
  { day: "Fri", items: 290, cost: 520 * R },
  { day: "Sat", items: 380, cost: 680 * R },
  { day: "Sun", items: 310, cost: 560 * R },
];

const monthlyData = [
  { month: "Jan", production: 4200, waste: 140, cost: 3800 * R },
  { month: "Feb", production: 3800, waste: 120, cost: 3400 * R },
  { month: "Mar", production: 5100, waste: 180, cost: 4600 * R },
  { month: "Apr", production: 4700, waste: 150, cost: 4200 * R },
  { month: "May", production: 5600, waste: 200, cost: 5000 * R },
  { month: "Jun", production: 1860, waste: 65,  cost: 1680 * R },
];

const topProducts = [
  { name: "Butter Croissant", units: 480, revenue: 1920 * R, cost: 624 * R },
  { name: "Sourdough Loaf",   units: 280, revenue: 1680 * R, cost: 560 * R },
  { name: "Blueberry Muffin", units: 360, revenue: 900  * R, cost: 187 * R },
  { name: "Chocolate Brownie",units: 240, revenue: 720  * R, cost: 216 * R },
  { name: "Cinnamon Roll",    units: 180, revenue: 630  * R, cost: 203 * R },
];

const ingredientConsumption = [
  { ingredient: "All-Purpose Flour", used: 340, cost: 272 * R, unit: "kg" },
  { ingredient: "Large Eggs",        used: 1440,cost: 360 * R, unit: "pcs"},
  { ingredient: "Granulated Sugar",  used: 210, cost: 252 * R, unit: "kg" },
  { ingredient: "Unsalted Butter",   used: 180, cost: 1170* R, unit: "kg" },
  { ingredient: "Whole Milk",        used: 160, cost: 176 * R, unit: "L"  },
];

const reportTypes = [
  { id: "daily",      title: "Daily Production Report",    desc: "Today's production summary",     icon: "📋" },
  { id: "monthly",    title: "Monthly Production Report",  desc: "Full month production overview",  icon: "📊" },
  { id: "ingredient", title: "Ingredient Consumption",     desc: "Usage & cost per ingredient",     icon: "🧂" },
  { id: "cost",       title: "Cost Analysis Report",       desc: "Detailed cost breakdown",         icon: "💰" },
];

const rupFmt = (v: number) => `₹${(v / 1000).toFixed(0)}k`;

const downloadCSV = (filename: string, headers: string[], rows: string[][]) => {
  const csvContent = [
    headers.join(","),
    ...rows.map(row => row.map(val => `"${String(val).replace(/"/g, '""')}"`).join(","))
  ].join("\n");
  
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", filename);
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

const printHTMLReport = (title: string, headers: string[], rows: string[][]) => {
  const win = window.open("", "_blank");
  if (!win) {
    toast.error("Popup blocked! Please allow popups to generate PDF.");
    return;
  }
  
  const headersHTML = headers.map(h => `<th style="padding: 12px 10px; text-align: left; border-bottom: 2px solid #6D1F2F; color: #6D1F2F; font-size: 13px; font-weight: 600;">${h}</th>`).join("");
  const rowsHTML = rows.map(r => `
    <tr style="border-bottom: 1px solid #E5E7EB;">
      ${r.map(val => `<td style="padding: 12px 10px; font-size: 13px; color: #2C1810;">${val}</td>`).join("")}
    </tr>
  `).join("");
  
  win.document.write(`
    <html>
      <head>
        <title>${title}</title>
        <style>
          body { font-family: system-ui, -apple-system, sans-serif; padding: 40px; background: #FFF9F0; color: #2C1810; margin: 0; }
          .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 3px solid #6D1F2F; padding-bottom: 15px; margin-bottom: 30px; }
          .logo { font-weight: 800; color: #6D1F2F; font-size: 26px; letter-spacing: -0.02em; }
          .title { font-size: 18px; font-weight: 600; margin-top: 4px; color: #2C1810; }
          .date { font-size: 12px; color: #6B7280; text-align: right; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; background: #FFFFFF; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.03); }
          tr:nth-child(even) { background-color: #FFFDF9; }
          @media print {
            body { background: #FFFFFF; padding: 0; }
            table { box-shadow: none; border: 1px solid #E5E7EB; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <div class="logo">BakeFlow</div>
            <div class="title">${title}</div>
          </div>
          <div class="date">
            <div>Report Generated</div>
            <div style="font-weight: 600; color: #2C1810; margin-top: 2px;">${new Date().toLocaleDateString('en-IN', { dateStyle: 'long' })}</div>
          </div>
        </div>
        <table>
          <thead>
            <tr style="background: #FFF9F0;">${headersHTML}</tr>
          </thead>
          <tbody>
            ${rowsHTML}
          </tbody>
        </table>
        <script>
          window.onload = function() {
            setTimeout(function() {
              window.print();
              window.onafterprint = function() { window.close(); };
            }, 300);
          }
        </script>
      </body>
    </html>
  `);
  win.document.close();
};

export function Reports() {
  const { productionHistory, ingredients, products } = useDatabase();

  const handleExport = (reportId: string, format: string) => {
    const todayStr = new Date().toISOString().slice(0, 10);
    const currentMonthStr = todayStr.slice(0, 7);
    
    let title = "";
    let headers: string[] = [];
    let rows: string[][] = [];
    
    if (reportId === "daily") {
      title = "Daily Production Report";
      headers = ["Date", "Product", "Quantity", "Total Cost (₹)", "Cost/Item (₹)", "Worker"];
      rows = productionHistory
        .filter(p => p.date === todayStr)
        .map(p => [
          p.date,
          p.productName,
          `${p.qty} pcs`,
          p.totalCost.toLocaleString("en-IN", { maximumFractionDigits: 2 }),
          p.costPerItem.toFixed(2),
          p.workerName || "System"
        ]);
    } else if (reportId === "monthly") {
      title = "Monthly Production Report";
      headers = ["Date", "Product", "Quantity", "Total Cost (₹)", "Cost/Item (₹)", "Worker"];
      rows = productionHistory
        .filter(p => p.date.startsWith(currentMonthStr))
        .map(p => [
          p.date,
          p.productName,
          `${p.qty} pcs`,
          p.totalCost.toLocaleString("en-IN", { maximumFractionDigits: 2 }),
          p.costPerItem.toFixed(2),
          p.workerName || "System"
        ]);
    } else if (reportId === "ingredient") {
      title = "Ingredient Inventory Status";
      headers = ["Ingredient", "Current Stock", "Min Stock", "Cost/Unit (₹)", "Status"];
      rows = ingredients.map(ing => [
        ing.name,
        `${ing.quantity} ${ing.unit}`,
        `${ing.minStock} ${ing.unit}`,
        ing.costPerUnit.toFixed(2),
        ing.quantity <= ing.minStock ? "LOW STOCK" : "In Stock"
      ]);
    } else if (reportId === "cost") {
      title = "Product Cost & Profit Margins";
      headers = ["Product Name", "Est. Unit Cost (₹)", "Selling Price (₹)", "Profit Margin (%)"];
      rows = products.map(p => [
        p.name,
        p.costPerUnit.toFixed(2),
        p.sellingPrice.toFixed(2),
        `${p.margin.toFixed(1)}%`
      ]);
    }

    if (rows.length === 0 && (reportId === "daily" || reportId === "monthly")) {
      toast.warning(`No production entries logged for ${reportId === "daily" ? "today" : "this month"} yet.`);
      return;
    }

    if (format === "Excel") {
      const filename = `${reportId}_report_${todayStr}.csv`;
      downloadCSV(filename, headers, rows);
      toast.success(`Exported ${title} as CSV`);
    } else {
      printHTMLReport(title, headers, rows);
      toast.success(`Opening ${title} print view`);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-6">
      <p className="text-sm" style={{ color: "#6B7280" }}>Generate and export production & cost reports</p>

      {/* Report generators */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {reportTypes.map(r => (
          <div key={r.id} className="bg-card rounded-2xl p-5 border border-border shadow-sm">
            <span className="text-2xl">{r.icon}</span>
            <p className="mt-2 text-sm" style={{ color: "#2C1810", fontWeight: 600 }}>{r.title}</p>
            <p className="text-xs mt-1 mb-4" style={{ color: "#6B7280" }}>{r.desc}</p>
            <div className="flex gap-2">
              <button onClick={() => handleExport(r.id, "PDF")}
                className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs hover:opacity-80"
                style={{ background: "#6D1F2F", color: "#FFFFFF", fontWeight: 500 }}>
                <Download className="w-3 h-3" /> PDF
              </button>
              <button onClick={() => handleExport(r.id, "Excel")}
                className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs hover:opacity-80"
                style={{ background: "#FEF3D0", color: "#6D1F2F", fontWeight: 500 }}>
                <FileText className="w-3 h-3" /> Excel
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-card rounded-2xl p-5 border border-border shadow-sm">
          <h3 className="mb-4" style={{ color: "#2C1810", fontWeight: 600 }}>Daily Production (This Week)</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={dailyData} barSize={22}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(44,24,16,0.06)" vertical={false} />
              <XAxis dataKey="day" tick={{ fontSize: 12, fill: "#6B7280" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "#6B7280" }} axisLine={false} tickLine={false} tickFormatter={v => v > 999 ? rupFmt(v) : String(v)} />
              <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid rgba(44,24,16,0.1)" }}
                formatter={(v: number, name: string) => [name === "cost" ? `₹${v.toLocaleString("en-IN",{maximumFractionDigits:0})}` : v, name === "cost" ? "Cost (₹)" : "Items"]} />
              <Bar dataKey="items" fill="#6D1F2F" radius={[6, 6, 0, 0]} name="Items" />
              <Bar dataKey="cost"  fill="#F4C95D" radius={[6, 6, 0, 0]} name="cost" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-card rounded-2xl p-5 border border-border shadow-sm">
          <h3 className="mb-4" style={{ color: "#2C1810", fontWeight: 600 }}>Monthly Trends</h3>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(44,24,16,0.06)" />
              <XAxis dataKey="month" tick={{ fontSize: 12, fill: "#6B7280" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "#6B7280" }} axisLine={false} tickLine={false} tickFormatter={v => v > 999 ? rupFmt(v) : String(v)} />
              <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid rgba(44,24,16,0.1)" }}
                formatter={(v: number, name: string) => [name === "cost" ? `₹${v.toLocaleString("en-IN",{maximumFractionDigits:0})}` : v, name]} />
              <Line type="monotone" dataKey="production" stroke="#6D1F2F" strokeWidth={2.5} dot={{ fill: "#6D1F2F", r: 4 }} name="Production" />
              <Line type="monotone" dataKey="cost"       stroke="#F4C95D" strokeWidth={2.5} dot={{ fill: "#F4C95D", r: 4 }} name="cost" />
              <Line type="monotone" dataKey="waste"      stroke="#E5484D" strokeWidth={2} strokeDasharray="5 5" dot={false} name="Waste" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-border flex items-center gap-2">
            <TrendingUp className="w-4 h-4" style={{ color: "#6D1F2F" }} />
            <h3 style={{ color: "#2C1810", fontWeight: 600 }}>Top Products (This Month)</h3>
          </div>
          <table className="w-full">
            <thead>
              <tr style={{ background: "#FFF9F0", borderBottom: "1px solid rgba(44,24,16,0.08)" }}>
                {["Product", "Units", "Revenue", "Cost"].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs uppercase tracking-wide" style={{ color: "#6B7280", fontWeight: 600 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {topProducts.map((p, i) => (
                <tr key={i} className="border-b transition-colors hover:bg-muted/40" style={{ borderColor: "rgba(44,24,16,0.06)" }}>
                  <td className="px-4 py-3 text-sm" style={{ color: "#2C1810", fontWeight: 500 }}>{p.name}</td>
                  <td className="px-4 py-3 text-sm" style={{ color: "#2C1810" }}>{p.units}</td>
                  <td className="px-4 py-3 text-sm" style={{ color: "#34C759", fontWeight: 500 }}>₹{p.revenue.toLocaleString("en-IN",{maximumFractionDigits:0})}</td>
                  <td className="px-4 py-3 text-sm" style={{ color: "#E5484D" }}>₹{p.cost.toLocaleString("en-IN",{maximumFractionDigits:0})}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-border">
            <h3 style={{ color: "#2C1810", fontWeight: 600 }}>Ingredient Consumption</h3>
          </div>
          <table className="w-full">
            <thead>
              <tr style={{ background: "#FFF9F0", borderBottom: "1px solid rgba(44,24,16,0.08)" }}>
                {["Ingredient", "Used", "Total Cost"].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs uppercase tracking-wide" style={{ color: "#6B7280", fontWeight: 600 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {ingredientConsumption.map((r, i) => (
                <tr key={i} className="border-b transition-colors hover:bg-muted/40" style={{ borderColor: "rgba(44,24,16,0.06)" }}>
                  <td className="px-4 py-3 text-sm" style={{ color: "#2C1810", fontWeight: 500 }}>{r.ingredient}</td>
                  <td className="px-4 py-3 text-sm" style={{ color: "#2C1810" }}>{r.used} {r.unit}</td>
                  <td className="px-4 py-3 text-sm" style={{ color: "#6D1F2F", fontWeight: 600 }}>₹{r.cost.toLocaleString("en-IN",{maximumFractionDigits:0})}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
