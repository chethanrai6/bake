import { useState } from "react";
import { Eye, EyeOff, Croissant, ChefHat, ShieldCheck, ArrowRight, Lock, Mail } from "lucide-react";
import { toast } from "sonner";
import { useDatabase } from "../utils/db";
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from "firebase/auth";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { auth, isFirebaseConfigured, db } from "../utils/firebase";

export type Role = "admin" | "worker";

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: Role;
  avatar: string;
  position: string;
  shift?: string;
}

interface LoginPageProps {
  onLogin: (user: AuthUser) => void;
}

export function LoginPage({ onLogin }: LoginPageProps) {
  const { workers, loading } = useDatabase();

  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loadingLogin, setLoadingLogin] = useState(false);
  const [error, setError] = useState("");

  // Map database workers to login user list
  const dbWorkersOnly = workers.filter(w => w.role === "worker");
  const activeWorkers = dbWorkersOnly.length > 0 ? dbWorkersOnly : [
    { id: "worker-uid-002", name: "Maria Santos", email: "maria@bakeflow.com", role: "worker", avatar: "MS", position: "Senior Baker", shift: "Morning", phone: "+1 555-0101", status: "Active" },
    { id: "worker-uid-003", name: "James Wright", email: "james@bakeflow.com", role: "worker", avatar: "JW", position: "Baker", shift: "Afternoon", phone: "+1 555-0102", status: "Active" },
    { id: "worker-uid-004", name: "Fatima Al-Nouri", email: "fatima@bakeflow.com", role: "worker", avatar: "FA", position: "Pastry Chef", shift: "Morning", phone: "+1 555-0103", status: "Active" },
    { id: "worker-uid-006", name: "Lucia Fernandez", email: "lucia@bakeflow.com", role: "worker", avatar: "LF", position: "Decorator", shift: "Morning", phone: "+1 555-0105", status: "Active" }
  ];

  const USERS = [
    { id: "admin_1", name: "Ahmed Omar", email: "admin@bakeflow.com", password: "admin123", role: "admin" as const, avatar: "AO", position: "Administrator", shift: "All" },
    ...activeWorkers.map(w => ({
      id: w.id,
      name: w.name,
      email: w.email,
      password: "worker123", // default password
      role: "worker" as const,
      avatar: w.avatar || w.name.split(" ").map(n => n[0]).join(""),
      position: w.position || w.role,
      shift: w.shift || (w.role.includes("Senior") || w.role.includes("Decorator") ? "Morning" : "Afternoon")
    }))
  ];

  const handleRoleSelect = (role: Role) => {
    setSelectedRole(role);
    setError("");
    // Pre-fill demo credentials
    if (role === "admin") {
      setEmail("admin@bakeflow.com");
      setPassword("admin123");
    } else {
      // Find the first worker if available
      const firstWorker = workers[0];
      setEmail(firstWorker ? firstWorker.email : "maria@bakeflow.com");
      setPassword("worker123");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoadingLogin(true);

    const emailClean = email.trim().toLowerCase();

    if (isFirebaseConfigured && auth) {
      try {
        let userCredential;
        try {
          userCredential = await signInWithEmailAndPassword(auth, emailClean, password);
        } catch (authErr: any) {
          const defaultWorker = USERS.find(u => u.email === emailClean && u.password === password && u.role === selectedRole);
          
          if (defaultWorker && (authErr.code === "auth/user-not-found" || authErr.code === "auth/invalid-credential" || authErr.code === "auth/invalid-email")) {
            userCredential = await createUserWithEmailAndPassword(auth, emailClean, password);
            
            const userProfile = {
              uid: userCredential.user.uid,
              name: defaultWorker.name,
              email: defaultWorker.email,
              role: defaultWorker.role,
              avatar: defaultWorker.avatar,
              position: defaultWorker.position,
              shift: defaultWorker.shift === "All" ? null : defaultWorker.shift,
              phone: "+1 555-0" + Math.floor(Math.random() * 9000 + 1000),
              status: "Active",
              createdAt: serverTimestamp(),
              lastLoginAt: serverTimestamp(),
              lastActivity: serverTimestamp()
            };
            await setDoc(doc(db, "users", userCredential.user.uid), userProfile);
          } else {
            throw authErr;
          }
        }

        const uid = userCredential.user.uid;
        const userDocRef = doc(db, "users", uid);
        const userDoc = await getDoc(userDocRef);
        
        if (userDoc.exists()) {
          await setDoc(userDocRef, { lastLoginAt: serverTimestamp() }, { merge: true });
          const profile = { ...userDoc.data(), id: uid } as AuthUser;
          toast.success(`Welcome back, ${profile.name}! 👋`);
          onLogin(profile);
        } else {
          const profile: AuthUser = {
            id: uid,
            name: userCredential.user.displayName || emailClean.split("@")[0],
            email: emailClean,
            role: selectedRole || "worker",
            avatar: (userCredential.user.displayName || emailClean).split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2),
            position: selectedRole === "admin" ? "Administrator" : "Baker",
            shift: selectedRole === "admin" ? undefined : "Morning"
          };
          await setDoc(userDocRef, {
            uid,
            name: profile.name,
            email: profile.email,
            role: profile.role,
            avatar: profile.avatar,
            position: profile.position,
            shift: profile.shift || null,
            status: "Active",
            createdAt: serverTimestamp(),
            lastLoginAt: serverTimestamp(),
            lastActivity: serverTimestamp()
          });
          toast.success(`Welcome back, ${profile.name}! 👋`);
          onLogin(profile);
        }
      } catch (err: any) {
        console.error("Sign in failed:", err);
        setError("Invalid credentials. Check your email, password, and selected role.");
        setLoadingLogin(false);
      }
    } else {
      setTimeout(() => {
        const user = USERS.find(
          u => u.email.trim().toLowerCase() === emailClean && u.password === password && u.role === selectedRole
        );
        if (user) {
          const { password: _, ...safe } = user;
          toast.success(`Welcome back, ${safe.name}! 👋`);
          onLogin(safe);
        } else {
          setError("Invalid credentials. Check your email, password, and selected role.");
          setLoadingLogin(false);
        }
      }, 900);
    }
  };

  return (
    <div className="min-h-screen flex" style={{ background: "#FFF9F0", fontFamily: "'Poppins','Inter',system-ui,sans-serif" }}>

      {/* ── Left panel ── */}
      <div
        className="hidden lg:flex w-[480px] shrink-0 flex-col justify-between p-12"
        style={{ background: "linear-gradient(160deg, #6D1F2F 0%, #4A1020 60%, #2C0812 100%)" }}
      >
        {/* Logo */}
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl flex items-center justify-center" style={{ background: "rgba(244,201,93,0.2)", border: "1px solid rgba(244,201,93,0.3)" }}>
            <Croissant className="w-6 h-6" style={{ color: "#F4C95D" }} />
          </div>
          <div>
            <p style={{ color: "#FFFFFF", fontWeight: 800, fontSize: "18px", letterSpacing: "-0.02em" }}>BakeFlow</p>
            <p style={{ color: "rgba(255,255,255,0.45)", fontSize: "12px" }}>Production System</p>
          </div>
        </div>

        {/* Hero text */}
        <div className="space-y-6">
          <div>
            <h1 className="leading-tight" style={{ color: "#FFFFFF", fontWeight: 800, fontSize: "38px", letterSpacing: "-0.03em" }}>
              Bake smarter,<br />
              <span style={{ color: "#F4C95D" }}>not harder.</span>
            </h1>
            <p className="mt-4" style={{ color: "rgba(255,255,255,0.55)", fontSize: "15px", lineHeight: 1.7 }}>
              The all-in-one bakery management platform for production tracking, cost control, and team coordination.
            </p>
          </div>

          {/* Feature pills */}
          <div className="space-y-3">
            {[
              { icon: "📦", text: "Real-time ingredient inventory" },
              { icon: "💰", text: "Automatic cost-per-item calculation" },
              { icon: "📊", text: "Production & waste analytics" },
              { icon: "👥", text: "Role-based team access" },
            ].map((f, i) => (
              <div key={i} className="flex items-center gap-3 px-4 py-3 rounded-2xl" style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)" }}>
                <span className="text-lg">{f.icon}</span>
                <span style={{ color: "rgba(255,255,255,0.75)", fontSize: "13px" }}>{f.text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <p style={{ color: "rgba(255,255,255,0.25)", fontSize: "12px" }}>
          © 2026 BakeFlow · All rights reserved
        </p>
      </div>

      {/* ── Right panel ── */}
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-md space-y-6">

          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "#6D1F2F" }}>
              <Croissant className="w-5 h-5 text-white" />
            </div>
            <p style={{ color: "#6D1F2F", fontWeight: 800, fontSize: "20px" }}>BakeFlow</p>
          </div>

          <div>
            <h2 style={{ color: "#2C1810", fontWeight: 700, fontSize: "26px", letterSpacing: "-0.02em" }}>
              {selectedRole ? (selectedRole === "admin" ? "Admin Sign In" : "Worker Sign In") : "Welcome back"}
            </h2>
            <p className="mt-1" style={{ color: "#6B7280", fontSize: "14px" }}>
              {selectedRole ? "Enter your credentials to continue" : "Choose your role to get started"}
            </p>
          </div>

          {/* ── Step 1: Role selector ── */}
          {!selectedRole ? (
            <div className="space-y-4">
              <p className="text-sm uppercase tracking-widest" style={{ color: "#9CA3AF", fontWeight: 600, letterSpacing: "0.1em" }}>
                Select your role
              </p>

              {/* Admin card */}
              <button
                onClick={() => handleRoleSelect("admin")}
                className="w-full p-5 rounded-2xl border-2 text-left transition-all duration-200 hover:-translate-y-0.5 group"
                style={{ background: "#FFFFFF", borderColor: "rgba(109,31,47,0.15)", boxShadow: "0 2px 12px rgba(0,0,0,0.04)" }}
                onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = "#6D1F2F"; (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 8px 32px rgba(109,31,47,0.12)"; }}
                onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(109,31,47,0.15)"; (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 2px 12px rgba(0,0,0,0.04)"; }}
              >
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl flex items-center justify-center shrink-0" style={{ background: "linear-gradient(135deg, #6D1F2F, #8B2739)" }}>
                    <ShieldCheck className="w-7 h-7 text-white" />
                  </div>
                  <div className="flex-1">
                    <p style={{ color: "#2C1810", fontWeight: 700, fontSize: "16px" }}>Administrator</p>
                    <p style={{ color: "#6B7280", fontSize: "13px", marginTop: "2px" }}>
                      Full access — dashboard, analytics, team & inventory management
                    </p>
                  </div>
                  <ArrowRight className="w-5 h-5 opacity-30 group-hover:opacity-70 transition-opacity shrink-0" style={{ color: "#6D1F2F" }} />
                </div>
                <div className="flex flex-wrap gap-1.5 mt-4">
                  {["Dashboard", "Reports", "Workers", "Suppliers", "Settings"].map(tag => (
                    <span key={tag} className="text-xs px-2 py-0.5 rounded-full" style={{ background: "#FEF3D0", color: "#6D1F2F" }}>{tag}</span>
                  ))}
                </div>
              </button>

              {/* Worker card */}
              <button
                onClick={() => handleRoleSelect("worker")}
                className="w-full p-5 rounded-2xl border-2 text-left transition-all duration-200 hover:-translate-y-0.5 group"
                style={{ background: "#FFFFFF", borderColor: "rgba(244,201,93,0.3)", boxShadow: "0 2px 12px rgba(0,0,0,0.04)" }}
                onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = "#F4C95D"; (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 8px 32px rgba(244,201,93,0.15)"; }}
                onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(244,201,93,0.3)"; (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 2px 12px rgba(0,0,0,0.04)"; }}
              >
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl flex items-center justify-center shrink-0" style={{ background: "linear-gradient(135deg, #F4C95D, #E8B840)" }}>
                    <ChefHat className="w-7 h-7 text-white" />
                  </div>
                  <div className="flex-1">
                    <p style={{ color: "#2C1810", fontWeight: 700, fontSize: "16px" }}>Baker / Worker</p>
                    <p style={{ color: "#6B7280", fontSize: "13px", marginTop: "2px" }}>
                      Production view — log batches, track tasks, report waste
                    </p>
                  </div>
                  <ArrowRight className="w-5 h-5 opacity-30 group-hover:opacity-70 transition-opacity shrink-0" style={{ color: "#2C1810" }} />
                </div>
                <div className="flex flex-wrap gap-1.5 mt-4">
                  {["My Dashboard", "Log Production", "Waste Report", "Stock View"].map(tag => (
                    <span key={tag} className="text-xs px-2 py-0.5 rounded-full" style={{ background: "rgba(244,201,93,0.2)", color: "#6D1F2F" }}>{tag}</span>
                  ))}
                </div>
              </button>

              {/* Demo hint */}
              <div className="flex items-start gap-3 p-4 rounded-2xl" style={{ background: "rgba(109,31,47,0.04)", border: "1px solid rgba(109,31,47,0.08)" }}>
                <span className="text-base shrink-0">💡</span>
                <p style={{ color: "#6B7280", fontSize: "13px" }}>
                  <strong style={{ color: "#2C1810" }}>Demo credentials</strong> are pre-filled after selecting your role. Just click Sign In.
                </p>
              </div>
            </div>
          ) : (
            /* ── Step 2: Login form ── */
            <div className="space-y-5">
              {/* Role badge + back */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5 px-3.5 py-2 rounded-xl" style={{ background: selectedRole === "admin" ? "rgba(109,31,47,0.08)" : "rgba(244,201,93,0.15)" }}>
                  {selectedRole === "admin"
                    ? <ShieldCheck className="w-4 h-4" style={{ color: "#6D1F2F" }} />
                    : <ChefHat className="w-4 h-4" style={{ color: "#6D1F2F" }} />
                  }
                  <span style={{ color: "#6D1F2F", fontWeight: 600, fontSize: "13px" }}>
                    {selectedRole === "admin" ? "Administrator" : "Baker / Worker"}
                  </span>
                </div>
                <button
                  onClick={() => { setSelectedRole(null); setError(""); setEmail(""); setPassword(""); }}
                  className="text-sm transition-colors hover:underline"
                  style={{ color: "#6B7280" }}
                >
                  ← Change role
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Email */}
                <div>
                  <label className="block mb-1.5 text-sm" style={{ color: "#2C1810", fontWeight: 500 }}>Email address</label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "#9CA3AF" }} />
                    <input
                      type="email" required value={email} onChange={e => setEmail(e.target.value)}
                      placeholder="you@bakeflow.com"
                      className="w-full pl-10 pr-4 py-3 rounded-xl border border-border text-sm outline-none transition-all"
                      style={{ background: "#FFF9F0", color: "#2C1810", fontFamily: "inherit" }}
                      onFocus={e => (e.target as HTMLInputElement).style.borderColor = "#6D1F2F"}
                      onBlur={e => (e.target as HTMLInputElement).style.borderColor = "rgba(44,24,16,0.1)"}
                    />
                  </div>
                </div>

                {/* Password */}
                <div>
                  <label className="block mb-1.5 text-sm" style={{ color: "#2C1810", fontWeight: 500 }}>Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "#9CA3AF" }} />
                    <input
                      type={showPass ? "text" : "password"} required value={password} onChange={e => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-10 pr-11 py-3 rounded-xl border border-border text-sm outline-none transition-all"
                      style={{ background: "#FFF9F0", color: "#2C1810", fontFamily: "inherit" }}
                      onFocus={e => (e.target as HTMLInputElement).style.borderColor = "#6D1F2F"}
                      onBlur={e => (e.target as HTMLInputElement).style.borderColor = "rgba(44,24,16,0.1)"}
                    />
                    <button type="button" onClick={() => setShowPass(v => !v)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1 rounded-lg transition-colors hover:bg-muted">
                      {showPass
                        ? <EyeOff className="w-4 h-4" style={{ color: "#9CA3AF" }} />
                        : <Eye className="w-4 h-4" style={{ color: "#9CA3AF" }} />
                      }
                    </button>
                  </div>
                </div>

                {/* Error */}
                {error && (
                  <div className="flex items-start gap-2.5 p-3 rounded-xl" style={{ background: "rgba(229,72,77,0.08)", border: "1px solid rgba(229,72,77,0.2)" }}>
                    <span className="text-sm shrink-0">⚠️</span>
                    <p style={{ color: "#E5484D", fontSize: "13px" }}>{error}</p>
                  </div>
                )}

                {/* Submit */}
                <button
                  type="submit" disabled={loading || loadingLogin}
                  className="w-full py-3.5 rounded-xl font-semibold text-sm transition-all flex items-center justify-center gap-2"
                  style={{
                    background: (loading || loadingLogin) ? "rgba(109,31,47,0.5)" : "linear-gradient(135deg, #6D1F2F, #8B2739)",
                    color: "#FFFFFF",
                    cursor: (loading || loadingLogin) ? "not-allowed" : "pointer"
                  }}
                >
                  {loadingLogin ? (
                    <>
                      <div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                      Signing in…
                    </>
                  ) : (
                    <>
                      Sign in as {selectedRole === "admin" ? "Admin" : "Worker"}
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>

              {/* Demo accounts */}
              <div className="rounded-2xl overflow-hidden border border-border">
                <div className="px-4 py-2.5" style={{ background: "#FFF9F0" }}>
                  <p style={{ color: "#6B7280", fontSize: "12px", fontWeight: 600 }}>Demo accounts for {selectedRole}</p>
                </div>
                <div className="divide-y" style={{ borderColor: "rgba(44,24,16,0.06)" }}>
                  {USERS.filter(u => u.role === selectedRole).map(u => (
                    <button
                      key={u.id}
                      onClick={() => { setEmail(u.email); setPassword(u.password); }}
                      className="w-full flex items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-muted/40"
                    >
                      <div className="w-8 h-8 rounded-full flex items-center justify-center text-white shrink-0"
                        style={{ background: "#6D1F2F", fontSize: "11px", fontWeight: 700 }}>
                        {u.avatar}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p style={{ color: "#2C1810", fontWeight: 500, fontSize: "13px" }}>{u.name}</p>
                        <p style={{ color: "#9CA3AF", fontSize: "11px" }}>{u.email}</p>
                      </div>
                      <span style={{ color: "#6D1F2F", fontSize: "12px", fontWeight: 500 }}>Use →</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
