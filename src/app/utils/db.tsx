import React, { createContext, useContext, useState, useEffect } from "react";
import { toast } from "sonner";
import {
  collection,
  onSnapshot,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  setDoc,
  query,
  orderBy,
  limit,
} from "firebase/firestore";
import { db, isFirebaseConfigured } from "./firebase";
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
}

export interface Worker {
  id: string;
  name: string;
  email: string;
  role: string;
  lastActivity: string;
  status: "Active" | "Inactive";
  phone: string;
}

export interface Supplier {
  id: string;
  name: string;
  contact: string;
  phone: string;
  email: string;
  ingredients: string;
}

export interface ProductionEntry {
  id: string;
  product: string;
  quantity: number;
  totalCost: number;
  costPerItem: number;
  date: string;
  addedBy: string;
}

export interface WasteEntry {
  id: string;
  ingredient: string;
  quantity: number;
  unit: string;
  reason: string;
  purchaseCost: number;
  date: string;
  addedBy: string;
}

export interface RefillEntry {
  id: string;
  ingredient: string;
  quantityAdded: number;
  unit: string;
  purchaseCost: number;
  supplier: string;
  date: string;
  addedBy: string;
}

export interface Activity {
  id: string;
  type: string;
  text: string;
  time: string; // display string
  timestamp?: number; // for sorting
  icon: string;
}

interface DatabaseContextType {
  ingredients: Ingredient[];
  workers: Worker[];
  suppliers: Supplier[];
  productionHistory: ProductionEntry[];
  wasteLogs: WasteEntry[];
  refillHistory: RefillEntry[];
  activities: Activity[];
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

  recordProduction: (data: Omit<ProductionEntry, "id">, ingredientDeductions: { ingredientName: string; quantity: number }[]) => Promise<void>;
  recordWaste: (data: Omit<WasteEntry, "id">) => Promise<void>;
  refillStock: (data: Omit<RefillEntry, "id">) => Promise<void>;
  addActivity: (type: string, text: string, icon: string) => Promise<void>;
}

const DatabaseContext = createContext<DatabaseContextType | undefined>(undefined);

/* ──────────────────────────────────────────────
   Initial/Seed Mock Data
   ────────────────────────────────────────────── */

const defaultIngredients: Ingredient[] = [];

const defaultWorkers: Worker[] = [
  { id: "w_1", name: "Maria Santos", email: "maria@bakeflow.com", role: "Senior Baker", lastActivity: "2026-06-04 08:30", status: "Active", phone: "+1 555-0101" },
  { id: "w_2", name: "James Wright", email: "james@bakeflow.com", role: "Baker", lastActivity: "2026-06-04 07:45", status: "Active", phone: "+1 555-0102" },
  { id: "w_3", name: "Fatima Al-Nouri", email: "fatima@bakeflow.com", role: "Pastry Chef", lastActivity: "2026-06-04 09:00", status: "Active", phone: "+1 555-0103" },
  { id: "w_4", name: "Kevin Park", email: "kevin@bakeflow.com", role: "Baker", lastActivity: "2026-06-03 17:00", status: "Inactive", phone: "+1 555-0104" },
  { id: "w_5", name: "Lucia Fernandez", email: "lucia@bakeflow.com", role: "Decorator", lastActivity: "2026-06-04 08:15", status: "Active", phone: "+1 555-0105" },
  { id: "w_6", name: "Tom Anderson", email: "tom@bakeflow.com", role: "Apprentice", lastActivity: "2026-06-02 16:00", status: "Inactive", phone: "+1 555-0106" },
];

const defaultSuppliers: Supplier[] = [];
const defaultProductionHistory: ProductionEntry[] = [];
const defaultWasteLogs: WasteEntry[] = [];
const defaultRefills: RefillEntry[] = [];
const defaultActivities: Activity[] = [];

/* ──────────────────────────────────────────────
   Database Provider Component
   ────────────────────────────────────────────── */

export const DatabaseProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [productionHistory, setProductionHistory] = useState<ProductionEntry[]>([]);
  const [wasteLogs, setWasteLogs] = useState<WasteEntry[]>([]);
  const [refillHistory, setRefillHistory] = useState<RefillEntry[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);

  const [loading, setLoading] = useState(true);

  // Sync / Init logic
  useEffect(() => {
    if (isFirebaseConfigured && db) {
      console.log("[Database] Initializing with Firebase Firestore");

      const unsubscribeIng = onSnapshot(collection(db, "ingredients"), (snapshot) => {
        const data = snapshot.docs.map((d) => ({ ...d.data(), id: d.id } as Ingredient));
        if (data.length === 0 && snapshot.metadata.fromCache === false) {
          // Empty DB, let's seed initial data
          defaultIngredients.forEach((item) => {
            const { id, ...rest } = item;
            setDoc(doc(collection(db, "ingredients"), id), rest);
          });
        } else {
          setIngredients(data);
        }
      });

      const unsubscribeWorkers = onSnapshot(collection(db, "workers"), (snapshot) => {
        const data = snapshot.docs.map((d) => ({ ...d.data(), id: d.id } as Worker));
        if (data.length === 0) {
          defaultWorkers.forEach((item) => {
            const { id, ...rest } = item;
            setDoc(doc(collection(db, "workers"), id), rest);
          });
        } else {
          setWorkers(data);
        }
      });

      const unsubscribeSuppliers = onSnapshot(collection(db, "suppliers"), (snapshot) => {
        const data = snapshot.docs.map((d) => ({ ...d.data(), id: d.id } as Supplier));
        if (data.length === 0) {
          defaultSuppliers.forEach((item) => {
            const { id, ...rest } = item;
            setDoc(doc(collection(db, "suppliers"), id), rest);
          });
        } else {
          setSuppliers(data);
        }
      });

      const unsubscribeProd = onSnapshot(collection(db, "production"), (snapshot) => {
        const data = snapshot.docs.map((d) => ({ ...d.data(), id: d.id } as ProductionEntry));
        if (data.length === 0) {
          defaultProductionHistory.forEach((item) => {
            const { id, ...rest } = item;
            setDoc(doc(collection(db, "production"), id), rest);
          });
        } else {
          // Sort by date descending
          data.sort((a, b) => b.date.localeCompare(a.date));
          setProductionHistory(data);
        }
      });

      const unsubscribeWaste = onSnapshot(collection(db, "waste"), (snapshot) => {
        const data = snapshot.docs.map((d) => ({ ...d.data(), id: d.id } as WasteEntry));
        if (data.length === 0) {
          defaultWasteLogs.forEach((item) => {
            const { id, ...rest } = item;
            setDoc(doc(collection(db, "waste"), id), rest);
          });
        } else {
          data.sort((a, b) => b.date.localeCompare(a.date));
          setWasteLogs(data);
        }
      });

      const unsubscribeRefill = onSnapshot(collection(db, "refills"), (snapshot) => {
        const data = snapshot.docs.map((d) => ({ ...d.data(), id: d.id } as RefillEntry));
        if (data.length === 0) {
          defaultRefills.forEach((item) => {
            const { id, ...rest } = item;
            setDoc(doc(collection(db, "refills"), id), rest);
          });
        } else {
          data.sort((a, b) => b.date.localeCompare(a.date));
          setRefillHistory(data);
        }
      });

      const unsubscribeAct = onSnapshot(collection(db, "activities"), (snapshot) => {
        const data = snapshot.docs.map((d) => ({ ...d.data(), id: d.id } as Activity));
        if (data.length === 0) {
          defaultActivities.forEach((item) => {
            const { id, ...rest } = item;
            setDoc(doc(collection(db, "activities"), id), rest);
          });
        } else {
          data.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
          setActivities(data);
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
      };
    } else {
      console.log("[Database] Initializing with browser LocalStorage");
      // LocalStorage mode
      const getOrInit = (key: string, defaults: any) => {
        const val = localStorage.getItem(key);
        if (val) return JSON.parse(val);
        localStorage.setItem(key, JSON.stringify(defaults));
        return defaults;
      };

      setIngredients(getOrInit("bfc_ingredients", defaultIngredients));
      setWorkers(getOrInit("bfc_workers", defaultWorkers));
      setSuppliers(getOrInit("bfc_suppliers", defaultSuppliers));
      setProductionHistory(getOrInit("bfc_production", defaultProductionHistory));
      setWasteLogs(getOrInit("bfc_waste", defaultWasteLogs));
      setRefillHistory(getOrInit("bfc_refills", defaultRefills));
      setActivities(getOrInit("bfc_activities", defaultActivities));

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

  // Ingredients CRUD
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

  // Workers CRUD
  const addWorker = async (data: Omit<Worker, "id">) => {
    if (isFirebaseConfigured && db) {
      await addDoc(collection(db, "workers"), data);
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
      await updateDoc(doc(db, "workers", id), data as any);
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
      await deleteDoc(doc(db, "workers", id));
    } else {
      setWorkers((prev) => {
        const updated = prev.filter((item) => item.id !== id);
        saveToLocal("bfc_workers", updated);
        return updated;
      });
    }
  };

  // Suppliers CRUD
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

  // Record Production (automatically deducts stock)
  const recordProduction = async (
    data: Omit<ProductionEntry, "id">,
    ingredientDeductions: { ingredientName: string; quantity: number }[]
  ) => {
    // 1. Save production entry
    let prodId = "prod_" + Date.now();
    if (isFirebaseConfigured && db) {
      const docRef = await addDoc(collection(db, "production"), data);
      prodId = docRef.id;
    } else {
      setProductionHistory((prev) => {
        const updated = [{ ...data, id: prodId }, ...prev];
        saveToLocal("bfc_production", updated);
        return updated;
      });
    }

    // 2. Deduct ingredient stock levels
    for (const ded of ingredientDeductions) {
      const ing = ingredients.find((i) => i.name.toLowerCase() === ded.ingredientName.toLowerCase());
      if (ing) {
        const newQty = Math.max(0, ing.quantity - ded.quantity);
        const { id, ...rest } = ing;
        await updateIngredient(id, { ...rest, quantity: Number(newQty.toFixed(2)) });
      }
    }

    // 3. Add activity log
    await addActivity("production", `Baked ${data.quantity}× ${data.product}`, "🥐");
  };

  // Record Waste (deducts stock)
  const recordWaste = async (data: Omit<WasteEntry, "id">) => {
    // 1. Save waste entry
    let wasteId = "wst_" + Date.now();
    if (isFirebaseConfigured && db) {
      const docRef = await addDoc(collection(db, "waste"), data);
      wasteId = docRef.id;
    } else {
      setWasteLogs((prev) => {
        const updated = [{ ...data, id: wasteId }, ...prev];
        saveToLocal("bfc_waste", updated);
        return updated;
      });
    }

    // 2. Deduct stock levels
    const ing = ingredients.find((i) => i.name.toLowerCase() === data.ingredient.toLowerCase());
    if (ing) {
      const newQty = Math.max(0, ing.quantity - data.quantity);
      const { id, ...rest } = ing;
      await updateIngredient(id, { ...rest, quantity: Number(newQty.toFixed(2)) });
    }

    // 3. Add activity log
    await addActivity("waste", `Reported waste: ${data.quantity}${data.unit} of ${data.ingredient}`, "🗑️");
  };

  // Refill Stock (adds stock)
  const refillStock = async (data: Omit<RefillEntry, "id">) => {
    // 1. Save refill entry
    let refillId = "ref_" + Date.now();
    if (isFirebaseConfigured && db) {
      const docRef = await addDoc(collection(db, "refills"), data);
      refillId = docRef.id;
    } else {
      setRefillHistory((prev) => {
        const updated = [{ ...data, id: refillId }, ...prev];
        saveToLocal("bfc_refills", updated);
        return updated;
      });
    }

    // 2. Increment stock levels
    const ing = ingredients.find((i) => i.name.toLowerCase() === data.ingredient.toLowerCase());
    if (ing) {
      const newQty = ing.quantity + data.quantityAdded;
      const { id, ...rest } = ing;
      await updateIngredient(id, { ...rest, quantity: Number(newQty.toFixed(2)) });
    }

    // 3. Add activity log
    await addActivity("stock", `Restocked ${data.quantityAdded}${data.unit} of ${data.ingredient}`, "📦");
  };

  // Add Activity Log
  const addActivity = async (type: string, text: string, icon: string) => {
    const data: Omit<Activity, "id"> = {
      type,
      text,
      icon,
      time: "Just now",
      timestamp: Date.now(),
    };

    if (isFirebaseConfigured && db) {
      await addDoc(collection(db, "activities"), data);
    } else {
      const newItem: Activity = { ...data, id: "act_" + Date.now() };
      setActivities((prev) => {
        const updated = [newItem, ...prev.slice(0, 19)]; // Keep last 20 logs
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
        productionHistory,
        wasteLogs,
        refillHistory,
        activities,
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
