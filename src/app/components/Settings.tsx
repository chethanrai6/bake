import { useState, useEffect } from "react";
import { Save, Bell, Shield, Store } from "lucide-react";
import { toast } from "sonner";
import { useDatabase } from "../utils/db";

export function Settings() {
  const { settings, updateSettings, loading } = useDatabase();

  const [bakery, setBakery] = useState({
    name: "BakeFlow Bakery",
    address: "123 Baker Street, Mumbai",
    phone: "+91-98765-00001",
    email: "contact@bakeflow.in",
    currency: "INR",
    timezone: "Asia/Kolkata",
  });

  const [notifications, setNotifications] = useState({
    lowStock: true,
    dailyReport: true,
    wasteAlert: true,
    productionSummary: false,
    emailAlerts: true,
  });

  const [security, setSecurity] = useState({
    twoFactor: false,
    sessionTimeout: "60",
    requirePin: false,
  });

  useEffect(() => {
    if (settings) {
      if (settings.bakery) setBakery(settings.bakery);
      if (settings.notifications) setNotifications(settings.notifications);
      if (settings.security) setSecurity(settings.security);
    }
  }, [settings]);

  const [tab, setTab] = useState("bakery");

  const tabs = [
    { id: "bakery", label: "Bakery Info", icon: Store },
    { id: "notifications", label: "Notifications", icon: Bell },
    { id: "security", label: "Security", icon: Shield },
  ];

  const handleSave = async () => {
    try {
      await updateSettings({ bakery, notifications, security });
      toast.success("Settings saved successfully");
    } catch (err) {
      toast.error("Failed to save settings");
    }
  };

  return (
    <div className="flex-1 overflow-y-auto p-6">
      <p className="text-sm mb-6" style={{ color: "#6B7280" }}>Configure your bakery system preferences</p>

      <div className="flex gap-6">
        {/* Tab sidebar */}
        <div className="w-48 shrink-0 space-y-1">
          {tabs.map(t => {
            const Icon = t.icon;
            const isActive = tab === t.id;
            return (
              <button key={t.id} onClick={() => setTab(t.id)}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-left transition-colors"
                style={{
                  background: isActive ? "#6D1F2F" : "transparent",
                  color: isActive ? "#FFFFFF" : "#2C1810",
                  fontWeight: isActive ? 500 : 400,
                }}
                onMouseEnter={e => { if (!isActive) (e.currentTarget as HTMLButtonElement).style.background = "#FFF9F0"; }}
                onMouseLeave={e => { if (!isActive) (e.currentTarget as HTMLButtonElement).style.background = "transparent"; }}
              >
                <Icon className="w-4 h-4" />
                {t.label}
              </button>
            );
          })}
        </div>

        {/* Content */}
        <div className="flex-1 bg-card rounded-2xl border border-border shadow-sm p-6">
          {tab === "bakery" && (
            <div className="space-y-5">
              <h3 style={{ color: "#2C1810", fontWeight: 600 }}>Bakery Information</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block mb-1.5 text-sm" style={{ color: "#2C1810", fontWeight: 500 }}>Bakery Name</label>
                  <input value={bakery.name} onChange={e => setBakery(b => ({ ...b, name: e.target.value }))}
                    className="w-full px-3 py-2.5 rounded-xl border border-border outline-none text-sm" style={{ background: "#FFF9F0", color: "#2C1810" }} />
                </div>
                <div>
                  <label className="block mb-1.5 text-sm" style={{ color: "#2C1810", fontWeight: 500 }}>Phone</label>
                  <input value={bakery.phone} onChange={e => setBakery(b => ({ ...b, phone: e.target.value }))}
                    className="w-full px-3 py-2.5 rounded-xl border border-border outline-none text-sm" style={{ background: "#FFF9F0", color: "#2C1810" }} />
                </div>
              </div>
              <div>
                <label className="block mb-1.5 text-sm" style={{ color: "#2C1810", fontWeight: 500 }}>Address</label>
                <input value={bakery.address} onChange={e => setBakery(b => ({ ...b, address: e.target.value }))}
                  className="w-full px-3 py-2.5 rounded-xl border border-border outline-none text-sm" style={{ background: "#FFF9F0", color: "#2C1810" }} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block mb-1.5 text-sm" style={{ color: "#2C1810", fontWeight: 500 }}>Email</label>
                  <input type="email" value={bakery.email} onChange={e => setBakery(b => ({ ...b, email: e.target.value }))}
                    className="w-full px-3 py-2.5 rounded-xl border border-border outline-none text-sm" style={{ background: "#FFF9F0", color: "#2C1810" }} />
                </div>
                <div>
                  <label className="block mb-1.5 text-sm" style={{ color: "#2C1810", fontWeight: 500 }}>Currency</label>
                  <select value={bakery.currency} onChange={e => setBakery(b => ({ ...b, currency: e.target.value }))}
                    className="w-full px-3 py-2.5 rounded-xl border border-border outline-none text-sm" style={{ background: "#FFF9F0", color: "#2C1810" }}>
                    <option value="INR">INR (₹)</option>
                    <option value="USD">USD ($)</option>
                    <option value="EUR">EUR (€)</option>
                    <option value="GBP">GBP (£)</option>
                    <option value="AED">AED (د.إ)</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block mb-1.5 text-sm" style={{ color: "#2C1810", fontWeight: 500 }}>Timezone</label>
                <select value={bakery.timezone} onChange={e => setBakery(b => ({ ...b, timezone: e.target.value }))}
                  className="w-full px-3 py-2.5 rounded-xl border border-border outline-none text-sm" style={{ background: "#FFF9F0", color: "#2C1810" }}>
                  <option value="Asia/Kolkata">Kolkata (India)</option>
                  <option value="America/Los_Angeles">Pacific Time (US & Canada)</option>
                  <option value="America/New_York">Eastern Time (US & Canada)</option>
                  <option value="Europe/London">London</option>
                  <option value="Asia/Dubai">Dubai</option>
                </select>
              </div>
            </div>
          )}

          {tab === "notifications" && (
            <div className="space-y-5">
              <h3 style={{ color: "#2C1810", fontWeight: 600 }}>Notification Preferences</h3>
              <div className="space-y-4">
                {[
                  { key: "lowStock", label: "Low Stock Alerts", desc: "Get notified when ingredients run low" },
                  { key: "dailyReport", label: "Daily Report", desc: "Receive a daily production summary" },
                  { key: "wasteAlert", label: "Waste Alerts", desc: "Alert when waste exceeds threshold" },
                  { key: "productionSummary", label: "Production Summary", desc: "End-of-shift production summary" },
                  { key: "emailAlerts", label: "Email Alerts", desc: "Send alerts to registered email" },
                ].map(item => (
                  <div key={item.key} className="flex items-center justify-between p-4 rounded-xl" style={{ background: "#FFF9F0" }}>
                    <div>
                      <p className="text-sm" style={{ color: "#2C1810", fontWeight: 500 }}>{item.label}</p>
                      <p className="text-xs mt-0.5" style={{ color: "#6B7280" }}>{item.desc}</p>
                    </div>
                    <button
                      onClick={() => setNotifications(n => ({ ...n, [item.key]: !n[item.key as keyof typeof n] }))}
                      className="relative w-10 h-6 rounded-full transition-colors"
                      style={{ background: notifications[item.key as keyof typeof notifications] ? "#6D1F2F" : "#E5E7EB" }}
                    >
                      <span
                        className="absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all"
                        style={{ left: notifications[item.key as keyof typeof notifications] ? "calc(100% - 1.375rem)" : "0.125rem" }}
                      />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {tab === "security" && (
            <div className="space-y-5">
              <h3 style={{ color: "#2C1810", fontWeight: 600 }}>Security Settings</h3>
              <div className="space-y-4">
                {[
                  { key: "twoFactor", label: "Two-Factor Authentication", desc: "Enable 2FA for admin accounts" },
                  { key: "requirePin", label: "Require PIN for Deletion", desc: "Ask for PIN before deleting records" },
                ].map(item => (
                  <div key={item.key} className="flex items-center justify-between p-4 rounded-xl" style={{ background: "#FFF9F0" }}>
                    <div>
                      <p className="text-sm" style={{ color: "#2C1810", fontWeight: 500 }}>{item.label}</p>
                      <p className="text-xs mt-0.5" style={{ color: "#6B7280" }}>{item.desc}</p>
                    </div>
                    <button
                      onClick={() => setSecurity(s => ({ ...s, [item.key]: !s[item.key as keyof typeof s] }))}
                      className="relative w-10 h-6 rounded-full transition-colors"
                      style={{ background: security[item.key as keyof typeof security] ? "#6D1F2F" : "#E5E7EB" }}
                    >
                      <span
                        className="absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all"
                        style={{ left: security[item.key as keyof typeof security] ? "calc(100% - 1.375rem)" : "0.125rem" }}
                      />
                    </button>
                  </div>
                ))}
                <div>
                  <label className="block mb-1.5 text-sm" style={{ color: "#2C1810", fontWeight: 500 }}>Session Timeout (minutes)</label>
                  <select value={security.sessionTimeout} onChange={e => setSecurity(s => ({ ...s, sessionTimeout: e.target.value }))}
                    className="w-full px-3 py-2.5 rounded-xl border border-border outline-none text-sm" style={{ background: "#FFF9F0", color: "#2C1810" }}>
                    <option value="30">30 minutes</option>
                    <option value="60">60 minutes</option>
                    <option value="120">2 hours</option>
                    <option value="480">8 hours</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          <div className="mt-6 pt-5 border-t border-border">
            <button onClick={handleSave}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-white text-sm hover:opacity-90 shadow-sm"
              style={{ background: "#6D1F2F", fontWeight: 500 }}>
              <Save className="w-4 h-4" />
              Save Settings
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
