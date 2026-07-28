import React, { createContext, useContext, useState, useEffect } from "react";
import {
  collection,
  doc,
  setDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  runTransaction,
  serverTimestamp,
  getDoc
} from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { db, auth, isFirebaseConfigured } from "./firebase";
import { USD_TO_INR } from "./currency";

/* ──────────────────────────────────────────────
   Interfaces
   ────────────────────────────────────────────── */

export interface Ingredient {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  costPerUnit: number;
  minStock: number;
  reorderPoint: number;
  maxCapacity: number;
  dailyUsage: number;
  supplier: string;
  supplierId: string;
}

export interface Worker {
  id: string;
  name: string;
  email: string;
  role: string;
  avatar: string;
  position: string;
  shift?: string;
  phone: string;
  status: "Active" | "Inactive";
  lastActivity?: string;
}

export interface Supplier {
  id: string;
  name: string;
  contact: string;
  phone: string;
  email: string;
  address?: string;
  ingredients: string;
  status: "Active" | "Inactive";
}

export interface Product {
  id: string;
  name: string;
  costPerUnit: number;
  sellingPrice: number;
  margin: number;
  emoji: string;
  category: string;
  isActive: boolean;
}

export interface ProductionEntry {
  id: string;
  productId: string;
  productName: string;
  qty: number;
  totalCost: number;
  costPerItem: number;
  workerId: string;
  workerName: string;
  shift: string;
  date: string;
  createdAt?: any;
  ingredients?: any[];
}

export interface WasteEntry {
  id: string;
  ingredientId: string;
  ingredient: string;
  quantity: number;
  unit: string;
  reason: string;
  cost: number;
  date: string;
  reportedBy: string;
  reportedById: string;
}

export interface RefillEntry {
  id: string;
  ingredientId: string;
  ingredient: string;
  quantityAdded: number;
  unit: string;
  purchaseCost: number;
  supplierId: string;
  supplier: string;
  date: string;
  addedBy: string;
  addedById: string;
}

export interface Task {
  id: string;
  label: string;
  target: number;
  done: number;
  emoji: string;
  priority: "high" | "medium" | "low";
  assignedTo: string;
  assignedToId: string;
  date: string;
  shift: string;
}

export interface SettingsData {
  bakery: {
    name: string;
    address: string;
    phone: string;
    email: string;
    currency: string;
    timezone: string;
  };
  notifications: {
    lowStock: boolean;
    dailyReport: boolean;
    wasteAlert: boolean;
    productionSummary: boolean;
    emailAlerts: boolean;
  };
  security: {
    twoFactor: boolean;
    sessionTimeout: string;
    requirePin: boolean;
  };
}

export interface Activity {
  id: string;
  type: string;
  text: string;
  time: string;
  timestamp?: number;
  icon: string;
  userId?: string;
  userName?: string;
}

interface DatabaseContextType {
  ingredients: Ingredient[];
  workers: Worker[];
  suppliers: Supplier[];
  products: Product[];
  productionHistory: ProductionEntry[];
  wasteLogs: WasteEntry[];
  refillHistory: RefillEntry[];
  tasks: Task[];
  settings: SettingsData | null;
  activities: Activity[];
  currentUserProfile: Worker | null;
  loading: boolean;
  isFirebaseActive: boolean;

  // Mutations
  addIngredient: (data: Omit<Ingredient, "id">) => Promise<void>;
  updateIngredient: (id: string, data: Omit<Ingredient, "id">) => Promise<void>;
  deleteIngredient: (id: string) => Promise<void>;

  addWorker: (data: Omit<Worker, "id">) => Promise<void>;
  updateWorker: (id: string, data: Omit<Worker, "id">) => Promise<void>;
  deleteWorker: (id: string) => Promise<void>;

  addSupplier: (data: Omit<Supplier, "id">) => Promise<void>;
  updateSupplier: (id: string, data: Omit<Supplier, "id">) => Promise<void>;
  deleteSupplier: (id: string) => Promise<void>;

  addProduct: (data: Omit<Product, "id">) => Promise<void>;
  updateProduct: (id: string, data: Omit<Product, "id">) => Promise<void>;
  deleteProduct: (id: string) => Promise<void>;

  addTask: (data: Omit<Task, "id">) => Promise<void>;
  updateTask: (id: string, done: number) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;

  updateSettings: (data: Omit<SettingsData, "updatedAt">) => Promise<void>;

  recordProduction: (data: Omit<ProductionEntry, "id" | "workerId" | "workerName" | "shift">, ingredientDeductions: { ingredientName: string; quantity: number }[]) => Promise<void>;
  recordWaste: (data: Omit<WasteEntry, "id" | "reportedBy" | "reportedById" | "cost">) => Promise<void>;
  refillStock: (data: Omit<RefillEntry, "id" | "addedBy" | "addedById">) => Promise<void>;
  addActivity: (type: string, text: string, icon: string) => Promise<void>;
}

const DatabaseContext = createContext<DatabaseContextType | undefined>(undefined);

/* ──────────────────────────────────────────────
   Initial/Seed Setup Data (Only Setup Data Seeded)
   ────────────────────────────────────────────── */

const defaultWorkers: Worker[] = [
  { id: "worker-uid-001", name: "Ahmed Omar", email: "admin@bakeflow.com", role: "admin", avatar: "AO", position: "Administrator", shift: undefined, phone: "+1 555-0100", status: "Active" },
  { id: "worker-uid-002", name: "Maria Santos", email: "maria@bakeflow.com", role: "worker", avatar: "MS", position: "Senior Baker", shift: "Morning", phone: "+1 555-0101", status: "Active" },
  { id: "worker-uid-003", name: "James Wright", email: "james@bakeflow.com", role: "worker", avatar: "JW", position: "Baker", shift: "Afternoon", phone: "+1 555-0102", status: "Active" },
  { id: "worker-uid-004", name: "Fatima Al-Nouri", email: "fatima@bakeflow.com", role: "worker", avatar: "FA", position: "Pastry Chef", shift: "Morning", phone: "+1 555-0103", status: "Active" },
  { id: "worker-uid-005", name: "Kevin Park", email: "kevin@bakeflow.com", role: "worker", avatar: "KP", position: "Baker", shift: "Afternoon", phone: "+1 555-0104", status: "Inactive" },
  { id: "worker-uid-006", name: "Lucia Fernandez", email: "lucia@bakeflow.com", role: "worker", avatar: "LF", position: "Decorator", shift: "Morning", phone: "+1 555-0105", status: "Active" },
  { id: "worker-uid-007", name: "Tom Anderson", email: "tom@bakeflow.com", role: "worker", avatar: "TA", position: "Apprentice", shift: "Afternoon", phone: "+1 555-0106", status: "Inactive" }
];

const defaultProducts: Product[] = [
  { id: "prod_1", name: "Butter Croissant", costPerUnit: 107.9, sellingPrice: 332, margin: 67.5, emoji: "🥐", category: "Pastry", isActive: true },
  { id: "prod_2", name: "Sourdough Loaf", costPerUnit: 166, sellingPrice: 539.5, margin: 69.2, emoji: "🍞", category: "Bread", isActive: true },
  { id: "prod_3", name: "Blueberry Muffin", costPerUnit: 43.16, sellingPrice: 207.5, margin: 79.2, emoji: "🧁", category: "Muffin", isActive: true },
  { id: "prod_4", name: "Bagel Assortment", costPerUnit: 45.65, sellingPrice: 166, margin: 72.5, emoji: "🥯", category: "Bread", isActive: true },
  { id: "prod_5", name: "Chocolate Brownie", costPerUnit: 74.7, sellingPrice: 249, margin: 70.0, emoji: "🍫", category: "Cake", isActive: true },
  { id: "prod_6", name: "Almond Danish", costPerUnit: 116.2, sellingPrice: 373.5, margin: 68.9, emoji: "🥐", category: "Pastry", isActive: true },
  { id: "prod_7", name: "Banana Bread", costPerUnit: 103.75, sellingPrice: 332, margin: 68.8, emoji: "🍌", category: "Bread", isActive: true },
  { id: "prod_8", name: "Cinnamon Roll", costPerUnit: 62.25, sellingPrice: 207.5, margin: 70.0, emoji: "🌀", category: "Pastry", isActive: true },
  { id: "prod_9", name: "Lemon Tart", costPerUnit: 124.5, sellingPrice: 373.5, margin: 66.7, emoji: "🍋", category: "Pastry", isActive: true }
];

const defaultTasks = (todayStr: string): Task[] => [
  { id: "tsk_1", label: "Butter Croissants", target: 60, done: 42, emoji: "🥐", priority: "high", assignedTo: "All", assignedToId: "all", date: todayStr, shift: "Morning" },
  { id: "tsk_2", label: "Sourdough Loaves", target: 30, done: 18, emoji: "🍞", priority: "high", assignedTo: "All", assignedToId: "all", date: todayStr, shift: "Morning" },
  { id: "tsk_3", label: "Blueberry Muffins", target: 80, done: 55, emoji: "🧁", priority: "medium", assignedTo: "All", assignedToId: "all", date: todayStr, shift: "Afternoon" },
  { id: "tsk_4", label: "Cinnamon Rolls", target: 48, done: 20, emoji: "🌀", priority: "low", assignedTo: "All", assignedToId: "all", date: todayStr, shift: "Afternoon" }
];

const defaultSettings: SettingsData = {
  bakery: {
    name: "BakeFlow Bakery",
    address: "123 Baker Street, Mumbai",
    phone: "+91-98765-00001",
    email: "contact@bakeflow.in",
    currency: "INR",
    timezone: "Asia/Kolkata"
  },
  notifications: {
    lowStock: true,
    dailyReport: true,
    wasteAlert: true,
    productionSummary: false,
    emailAlerts: true
  },
  security: {
    twoFactor: false,
    sessionTimeout: "60",
    requirePin: false
  }
};

/* ──────────────────────────────────────────────
   Database Provider Component
   ────────────────────────────────────────────── */

export const DatabaseProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [productionHistory, setProductionHistory] = useState<ProductionEntry[]>([]);
  const [wasteLogs, setWasteLogs] = useState<WasteEntry[]>([]);
  const [refillHistory, setRefillHistory] = useState<RefillEntry[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [settings, setSettings] = useState<SettingsData | null>(null);
  const [activities, setActivities] = useState<Activity[]>([]);

  const [currentUserProfile, setCurrentUserProfile] = useState<Worker | null>(null);
  const [loading, setLoading] = useState(true);

  // Sync Auth State & Profile
  useEffect(() => {
    if (isFirebaseConfigured && auth) {
      const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
        if (firebaseUser) {
          const userDoc = await getDoc(doc(db, "users", firebaseUser.uid));
          if (userDoc.exists()) {
            setCurrentUserProfile({ ...userDoc.data(), id: firebaseUser.uid } as Worker);
          } else {
            setCurrentUserProfile(null);
          }
        } else {
          setCurrentUserProfile(null);
        }
      });
      return unsub;
    }
  }, []);

  // Sync Firestore / LocalStorage
  useEffect(() => {
    if (isFirebaseConfigured && db) {
      console.log("[Database] Realignment Initializing with Firebase Firestore");

      const unsubscribeIng = onSnapshot(collection(db, "ingredients"), (snapshot) => {
        const data = snapshot.docs.map((d) => ({ ...d.data(), id: d.id } as Ingredient));
        setIngredients(data);
      });

      const unsubscribeWorkers = onSnapshot(collection(db, "users"), (snapshot) => {
        const data = snapshot.docs.map((d) => ({ ...d.data(), id: d.id } as Worker));
        if (data.length === 0) {
          defaultWorkers.forEach((item) => {
            const { id, ...rest } = item;
            setDoc(doc(collection(db, "users"), id), rest);
          });
        } else {
          setWorkers(data);
        }
      });

      const unsubscribeSuppliers = onSnapshot(collection(db, "suppliers"), (snapshot) => {
        const data = snapshot.docs.map((d) => ({ ...d.data(), id: d.id } as Supplier));
        setSuppliers(data);
      });

      const unsubscribeProd = onSnapshot(collection(db, "production_entries"), (snapshot) => {
        const data = snapshot.docs.map((d) => ({ ...d.data(), id: d.id } as ProductionEntry));
        data.sort((a, b) => b.date.localeCompare(a.date));
        setProductionHistory(data);
      });

      const unsubscribeWaste = onSnapshot(collection(db, "waste_entries"), (snapshot) => {
        const data = snapshot.docs.map((d) => ({ ...d.data(), id: d.id } as WasteEntry));
        data.sort((a, b) => b.date.localeCompare(a.date));
        setWasteLogs(data);
      });

      const unsubscribeRefill = onSnapshot(collection(db, "stock_refills"), (snapshot) => {
        const data = snapshot.docs.map((d) => ({ ...d.data(), id: d.id } as RefillEntry));
        data.sort((a, b) => b.date.localeCompare(a.date));
        setRefillHistory(data);
      });

      const unsubscribeAct = onSnapshot(collection(db, "activity_log"), (snapshot) => {
        const data = snapshot.docs.map((d) => ({ ...d.data(), id: d.id } as Activity));
        data.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
        setActivities(data);
      });

      const unsubscribeProdList = onSnapshot(collection(db, "products"), (snapshot) => {
        const data = snapshot.docs.map((d) => ({ ...d.data(), id: d.id } as Product));
        if (data.length === 0) {
          defaultProducts.forEach((item) => {
            const { id, ...rest } = item;
            setDoc(doc(collection(db, "products"), id), rest);
          });
        } else {
          setProducts(data);
        }
      });

      const unsubscribeTaskList = onSnapshot(collection(db, "tasks"), (snapshot) => {
        const data = snapshot.docs.map((d) => ({ ...d.data(), id: d.id } as Task));
        if (data.length === 0) {
          const todayStr = new Date().toISOString().slice(0, 10);
          defaultTasks(todayStr).forEach((item) => {
            const { id, ...rest } = item;
            setDoc(doc(collection(db, "tasks"), id), rest);
          });
        } else {
          setTasks(data);
        }
      });

      const unsubscribeSet = onSnapshot(doc(db, "settings", "bakery"), (d) => {
        if (d.exists()) {
          setSettings(d.data() as SettingsData);
        } else {
          setDoc(doc(db, "settings", "bakery"), defaultSettings);
        }
      });

      setLoading(false);

      return () => {
        unsubscribeIng();
        unsubscribeWorkers();
        unsubscribeSuppliers();
        unsubscribeProd();
        unsubscribeWaste();
        unsubscribeRefill();
        unsubscribeAct();
        unsubscribeProdList();
        unsubscribeTaskList();
        unsubscribeSet();
      };
    } else {
      console.log("[Database] Initializing with browser LocalStorage");
      const getOrInit = (key: string, defaults: any) => {
        const val = localStorage.getItem(key);
        if (val) return JSON.parse(val);
        localStorage.setItem(key, JSON.stringify(defaults));
        return defaults;
      };

      setIngredients(getOrInit("bfc_ingredients", []));
      setWorkers(getOrInit("bfc_workers", defaultWorkers));
      setSuppliers(getOrInit("bfc_suppliers", []));
      setProducts(getOrInit("bfc_products", defaultProducts));
      setProductionHistory(getOrInit("bfc_production", []));
      setWasteLogs(getOrInit("bfc_waste", []));
      setRefillHistory(getOrInit("bfc_refills", []));
      const todayStr = new Date().toISOString().slice(0, 10);
      setTasks(getOrInit("bfc_tasks", defaultTasks(todayStr)));
      setSettings(getOrInit("bfc_settings", defaultSettings));
      setActivities(getOrInit("bfc_activities", []));

      setLoading(false);
    }
  }, []);

  const saveToLocal = (key: string, data: any) => {
    if (!isFirebaseConfigured) {
      localStorage.setItem(key, JSON.stringify(data));
    }
  };

  /* ──────────────────────────────────────────────
     Mutations
     ────────────────────────────────────────────── */

  const addIngredient = async (data: Omit<Ingredient, "id">) => {
    if (isFirebaseConfigured && db) {
      await addDoc(collection(db, "ingredients"), data);
    } else {
      const newItem: Ingredient = { ...data, id: "ing_" + Date.now() };
      setIngredients((prev) => {
        const updated = [...prev, newItem];
        saveToLocal("bfc_ingredients", updated);
        return updated;
      });
    }
  };

  const updateIngredient = async (id: string, data: Omit<Ingredient, "id">) => {
    if (isFirebaseConfigured && db) {
      await updateDoc(doc(db, "ingredients", id), data as any);
    } else {
      setIngredients((prev) => {
        const updated = prev.map((item) => (item.id === id ? { ...data, id } : item));
        saveToLocal("bfc_ingredients", updated);
        return updated;
      });
    }
  };

  const deleteIngredient = async (id: string) => {
    if (isFirebaseConfigured && db) {
      await deleteDoc(doc(db, "ingredients", id));
    } else {
      setIngredients((prev) => {
        const updated = prev.filter((item) => item.id !== id);
        saveToLocal("bfc_ingredients", updated);
        return updated;
      });
    }
  };

  const addWorker = async (data: Omit<Worker, "id">) => {
    if (isFirebaseConfigured && db) {
      await addDoc(collection(db, "users"), data);
    } else {
      const newItem: Worker = { ...data, id: "w_" + Date.now() };
      setWorkers((prev) => {
        const updated = [...prev, newItem];
        saveToLocal("bfc_workers", updated);
        return updated;
      });
    }
  };

  const updateWorker = async (id: string, data: Omit<Worker, "id">) => {
    if (isFirebaseConfigured && db) {
      await updateDoc(doc(db, "users", id), data as any);
    } else {
      setWorkers((prev) => {
        const updated = prev.map((item) => (item.id === id ? { ...data, id } : item));
        saveToLocal("bfc_workers", updated);
        return updated;
      });
    }
  };

  const deleteWorker = async (id: string) => {
    if (isFirebaseConfigured && db) {
      await deleteDoc(doc(db, "users", id));
    } else {
      setWorkers((prev) => {
        const updated = prev.filter((item) => item.id !== id);
        saveToLocal("bfc_workers", updated);
        return updated;
      });
    }
  };

  const addSupplier = async (data: Omit<Supplier, "id">) => {
    if (isFirebaseConfigured && db) {
      await addDoc(collection(db, "suppliers"), data);
    } else {
      const newItem: Supplier = { ...data, id: "sup_" + Date.now() };
      setSuppliers((prev) => {
        const updated = [...prev, newItem];
        saveToLocal("bfc_suppliers", updated);
        return updated;
      });
    }
  };

  const updateSupplier = async (id: string, data: Omit<Supplier, "id">) => {
    if (isFirebaseConfigured && db) {
      await updateDoc(doc(db, "suppliers", id), data as any);
    } else {
      setSuppliers((prev) => {
        const updated = prev.map((item) => (item.id === id ? { ...data, id } : item));
        saveToLocal("bfc_suppliers", updated);
        return updated;
      });
    }
  };

  const deleteSupplier = async (id: string) => {
    if (isFirebaseConfigured && db) {
      await deleteDoc(doc(db, "suppliers", id));
    } else {
      setSuppliers((prev) => {
        const updated = prev.filter((item) => item.id !== id);
        saveToLocal("bfc_suppliers", updated);
        return updated;
      });
    }
  };

  const addProduct = async (data: Omit<Product, "id">) => {
    if (isFirebaseConfigured && db) {
      await addDoc(collection(db, "products"), data);
    } else {
      const newItem: Product = { ...data, id: "prod_" + Date.now() };
      setProducts((prev) => {
        const updated = [...prev, newItem];
        saveToLocal("bfc_products", updated);
        return updated;
      });
    }
  };

  const updateProduct = async (id: string, data: Omit<Product, "id">) => {
    if (isFirebaseConfigured && db) {
      await updateDoc(doc(db, "products", id), data as any);
    } else {
      setProducts((prev) => {
        const updated = prev.map((item) => (item.id === id ? { ...data, id } : item));
        saveToLocal("bfc_products", updated);
        return updated;
      });
    }
  };

  const deleteProduct = async (id: string) => {
    if (isFirebaseConfigured && db) {
      await deleteDoc(doc(db, "products", id));
    } else {
      setProducts((prev) => {
        const updated = prev.filter((item) => item.id !== id);
        saveToLocal("bfc_products", updated);
        return updated;
      });
    }
  };

  const addTask = async (data: Omit<Task, "id">) => {
    if (isFirebaseConfigured && db) {
      await addDoc(collection(db, "tasks"), data);
    } else {
      const newItem: Task = { ...data, id: "tsk_" + Date.now() };
      setTasks((prev) => {
        const updated = [...prev, newItem];
        saveToLocal("bfc_tasks", updated);
        return updated;
      });
    }
  };

  const updateTask = async (id: string, done: number) => {
    if (isFirebaseConfigured && db) {
      await updateDoc(doc(db, "tasks", id), { done, updatedAt: serverTimestamp() });
    } else {
      setTasks((prev) => {
        const updated = prev.map((t) => (t.id === id ? { ...t, done } : t));
        saveToLocal("bfc_tasks", updated);
        return updated;
      });
    }
  };

  const deleteTask = async (id: string) => {
    if (isFirebaseConfigured && db) {
      await deleteDoc(doc(db, "tasks", id));
    } else {
      setTasks((prev) => {
        const updated = prev.filter((t) => t.id !== id);
        saveToLocal("bfc_tasks", updated);
        return updated;
      });
    }
  };

  const updateSettings = async (data: Omit<SettingsData, "updatedAt">) => {
    if (isFirebaseConfigured && db) {
      await setDoc(doc(db, "settings", "bakery"), { ...data, updatedAt: serverTimestamp() });
    } else {
      setSettings(data as SettingsData);
      saveToLocal("bfc_settings", data);
    }
  };

  // Record Production (using ATOMIC Firestore Transactions)
  const recordProduction = async (
    data: Omit<ProductionEntry, "id" | "workerId" | "workerName" | "shift">,
    ingredientDeductions: { ingredientName: string; quantity: number }[]
  ) => {
    const activeUser = currentUserProfile || defaultWorkers[1]; // Fallback to Maria Santos for demo/offline
    const workerId = activeUser.id;
    const workerName = activeUser.name;
    const shift = activeUser.shift || "Morning";

    if (isFirebaseConfigured && db) {
      await runTransaction(db, async (transaction) => {
        const ingredientRefsAndNewDocs: { ref: any; newQty: number }[] = [];

        // 1. Read all ingredient levels first
        for (const ded of ingredientDeductions) {
          const ing = ingredients.find((i) => i.name.toLowerCase() === ded.ingredientName.toLowerCase());
          if (ing) {
            const ingRef = doc(db, "ingredients", ing.id);
            const ingDoc = await transaction.get(ingRef);
            if (!ingDoc.exists()) {
              throw new Error(`Ingredient ${ded.ingredientName} not found!`);
            }
            const currentQty = ingDoc.data().quantity || 0;
            const newQty = Math.max(0, currentQty - ded.quantity);
            ingredientRefsAndNewDocs.push({ ref: ingRef, newQty: Number(newQty.toFixed(2)) });
          }
        }

        // 2. Perform writes
        const prodRef = doc(collection(db, "production_entries"));
        transaction.set(prodRef, {
          ...data,
          workerId,
          workerName,
          shift,
          createdAt: serverTimestamp(),
        });

        for (const item of ingredientRefsAndNewDocs) {
          transaction.update(item.ref, { quantity: item.newQty, updatedAt: serverTimestamp() });
        }

        const actRef = doc(collection(db, "activity_log"));
        transaction.set(actRef, {
          type: "production",
          text: `Baked ${data.quantity}× ${data.productName}`,
          icon: "🥐",
          userId: workerId,
          userName: workerName,
          timestamp: Date.now(),
          createdAt: serverTimestamp(),
        });
      });
    } else {
      // LocalStorage mode
      const prodId = "prod_" + Date.now();
      setProductionHistory((prev) => {
        const updated = [{ ...data, id: prodId, workerId, workerName, shift } as ProductionEntry, ...prev];
        saveToLocal("bfc_production", updated);
        return updated;
      });

      // Deduct stock levels
      setIngredients((prev) => {
        const updated = prev.map((ing) => {
          const ded = ingredientDeductions.find((d) => d.ingredientName.toLowerCase() === ing.name.toLowerCase());
          if (ded) {
            const newQty = Math.max(0, ing.quantity - ded.quantity);
            return { ...ing, quantity: Number(newQty.toFixed(2)) };
          }
          return ing;
        });
        saveToLocal("bfc_ingredients", updated);
        return updated;
      });

      await addActivity("production", `Baked ${data.quantity}× ${data.productName}`, "🥐");
    }
  };

  // Record Waste (using ATOMIC Firestore Transactions)
  const recordWaste = async (data: Omit<WasteEntry, "id" | "reportedBy" | "reportedById" | "cost">) => {
    const activeUser = currentUserProfile || defaultWorkers[1];
    const reportedById = activeUser.id;
    const reportedBy = activeUser.name;

    const ing = ingredients.find((i) => i.name.toLowerCase() === data.ingredient.toLowerCase());
    const cost = ing ? ing.costPerUnit * data.quantity : 0;

    if (isFirebaseConfigured && db) {
      await runTransaction(db, async (transaction) => {
        if (!ing) return;
        const ingRef = doc(db, "ingredients", ing.id);
        const ingDoc = await transaction.get(ingRef);
        if (!ingDoc.exists()) {
          throw new Error(`Ingredient ${data.ingredient} not found!`);
        }
        const currentQty = ingDoc.data().quantity || 0;
        const newQty = Math.max(0, currentQty - data.quantity);

        const wasteRef = doc(collection(db, "waste_entries"));
        transaction.set(wasteRef, {
          ...data,
          reportedBy,
          reportedById,
          cost,
          createdAt: serverTimestamp(),
        });

        transaction.update(ingRef, { quantity: Number(newQty.toFixed(2)), updatedAt: serverTimestamp() });

        const actRef = doc(collection(db, "activity_log"));
        transaction.set(actRef, {
          type: "waste",
          text: `Reported waste: ${data.quantity}${data.unit} of ${data.ingredient}`,
          icon: "🗑️",
          userId: reportedById,
          userName: reportedBy,
          timestamp: Date.now(),
          createdAt: serverTimestamp(),
        });
      });
    } else {
      // LocalStorage mode
      const wasteId = "wst_" + Date.now();
      setWasteLogs((prev) => {
        const updated = [{ ...data, id: wasteId, reportedBy, reportedById, cost } as WasteEntry, ...prev];
        saveToLocal("bfc_waste", updated);
        return updated;
      });

      // Deduct stock levels
      if (ing) {
        setIngredients((prev) => {
          const updated = prev.map((item) =>
            item.id === ing.id ? { ...item, quantity: Number(Math.max(0, item.quantity - data.quantity).toFixed(2)) } : item
          );
          saveToLocal("bfc_ingredients", updated);
          return updated;
        });
      }

      await addActivity("waste", `Reported waste: ${data.quantity}${data.unit} of ${data.ingredient}`, "🗑️");
    }
  };

  // Refill Stock (using ATOMIC Firestore Transactions)
  const refillStock = async (data: Omit<RefillEntry, "id" | "addedBy" | "addedById">) => {
    const activeUser = currentUserProfile || defaultWorkers[0]; // default to Admin
    const addedById = activeUser.id;
    const addedBy = activeUser.name;

    const ing = ingredients.find((i) => i.name.toLowerCase() === data.ingredient.toLowerCase());

    if (isFirebaseConfigured && db) {
      await runTransaction(db, async (transaction) => {
        if (!ing) return;
        const ingRef = doc(db, "ingredients", ing.id);
        const ingDoc = await transaction.get(ingRef);
        if (!ingDoc.exists()) {
          throw new Error(`Ingredient ${data.ingredient} not found!`);
        }
        const currentQty = ingDoc.data().quantity || 0;
        const newQty = currentQty + data.quantityAdded;

        const refillRef = doc(collection(db, "stock_refills"));
        transaction.set(refillRef, {
          ...data,
          addedBy,
          addedById,
          createdAt: serverTimestamp(),
        });

        transaction.update(ingRef, { quantity: Number(newQty.toFixed(2)), updatedAt: serverTimestamp() });

        const actRef = doc(collection(db, "activity_log"));
        transaction.set(actRef, {
          type: "stock",
          text: `Restocked ${data.quantityAdded}${data.unit} of ${data.ingredient}`,
          icon: "📦",
          userId: addedById,
          userName: addedBy,
          timestamp: Date.now(),
          createdAt: serverTimestamp(),
        });
      });
    } else {
      // LocalStorage mode
      const refillId = "ref_" + Date.now();
      setRefillHistory((prev) => {
        const updated = [{ ...data, id: refillId, addedBy, addedById } as RefillEntry, ...prev];
        saveToLocal("bfc_refills", updated);
        return updated;
      });

      // Increment stock levels
      if (ing) {
        setIngredients((prev) => {
          const updated = prev.map((item) =>
            item.id === ing.id ? { ...item, quantity: Number((item.quantity + data.quantityAdded).toFixed(2)) } : item
          );
          saveToLocal("bfc_ingredients", updated);
          return updated;
        });
      }

      await addActivity("stock", `Restocked ${data.quantityAdded}${data.unit} of ${data.ingredient}`, "📦");
    }
  };

  const addActivity = async (type: string, text: string, icon: string) => {
    const activeUser = currentUserProfile || defaultWorkers[0];
    const data: Omit<Activity, "id"> = {
      type,
      text,
      icon,
      time: "Just now",
      timestamp: Date.now(),
      userId: activeUser.id,
      userName: activeUser.name,
    };

    if (isFirebaseConfigured && db) {
      await addDoc(collection(db, "activity_log"), data);
    } else {
      const newItem: Activity = { ...data, id: "act_" + Date.now() };
      setActivities((prev) => {
        const updated = [newItem, ...prev.slice(0, 19)];
        saveToLocal("bfc_activities", updated);
        return updated;
      });
    }
  };

  return (
    <DatabaseContext.Provider
      value={{
        ingredients,
        workers,
        suppliers,
        products,
        productionHistory,
        wasteLogs,
        refillHistory,
        tasks,
        settings,
        activities,
        currentUserProfile,
        loading,
        isFirebaseActive: isFirebaseConfigured,
        addIngredient,
        updateIngredient,
        deleteIngredient,
        addWorker,
        updateWorker,
        deleteWorker,
        addSupplier,
        updateSupplier,
        deleteSupplier,
        addProduct,
        updateProduct,
        deleteProduct,
        addTask,
        updateTask,
        deleteTask,
        updateSettings,
        recordProduction,
        recordWaste,
        refillStock,
        addActivity,
      }}
    >
      {children}
    </DatabaseContext.Provider>
  );
};

export const useDatabase = () => {
  const context = useContext(DatabaseContext);
  if (!context) {
    throw new Error("useDatabase must be used within a DatabaseProvider");
  }
  return context;
};

// Export hook compatibility wrappers
export const useIngredients = () => {
  const { ingredients, loading } = useDatabase();
  return { ingredients, loading, error: null };
};
export const useProductionEntries = () => {
  const { productionHistory, loading } = useDatabase();
  return { entries: productionHistory, loading, error: null };
};
export const useWasteEntries = () => {
  const { wasteLogs, loading } = useDatabase();
  return { entries: wasteLogs, loading, error: null };
};
export const useStockRefills = () => {
  const { refillHistory, loading } = useDatabase();
  return { refills: refillHistory, loading, error: null };
};
export const useSuppliers = () => {
  const { suppliers, loading } = useDatabase();
  return { suppliers, loading, error: null };
};
export const useWorkers = () => {
  const { workers, loading } = useDatabase();
  return { workers, loading, error: null };
};
export const useTasks = () => {
  const { tasks, loading } = useDatabase();
  return { tasks, loading, error: null };
};
export const useActivityLog = () => {
  const { activities, loading } = useDatabase();
  return { logs: activities, loading, error: null };
};
