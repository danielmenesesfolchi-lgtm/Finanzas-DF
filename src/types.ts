export interface Transaction {
  id: string;
  description: string;
  amount: number;
  type: "income" | "expense";
  category: string;
  date: string; // ISO string YYYY-MM-DD
}

export interface CategoryLimit {
  category: string;
  limit: number;
}

export interface MandatoryExpense {
  id: string;
  description: string;
  amount: number;
  category: string;
}

export interface ProductRecommendation {
  name: string;
  price: number;
  priceFormatted: string;
  description: string;
  reason: string;
  link: string;
}

export interface SearchResult {
  success: boolean;
  category: string;
  budget: number;
  currency: string;
  products: ProductRecommendation[];
  generalAdvice: string;
  sources: { title: string; uri: string }[];
  isFallback?: boolean;
}

export const CATEGORIES = [
  "Comida",
  "Educación",
  "Salud",
  "Higiene",
  "Vivienda",
  "Transporte",
  "Servicios",
  "Entretenimiento",
  "Otros"
];

export const CATEGORY_COLORS: Record<string, string> = {
  Comida: "#f97316", // orange-500
  Educación: "#3b82f6", // blue-500
  Salud: "#10b981", // emerald-500
  Higiene: "#06b6d4", // cyan-500
  Vivienda: "#8b5cf6", // violet-500
  Transporte: "#eab308", // yellow-500
  Servicios: "#ec4899", // pink-500
  Entretenimiento: "#a855f7", // purple-500
  Otros: "#64748b" // slate-500
};

export const CATEGORY_ICONS: Record<string, string> = {
  Comida: "Utensils",
  Educación: "GraduationCap",
  Salud: "HeartPulse",
  Higiene: "Sparkles",
  Vivienda: "Home",
  Transporte: "Car",
  Servicios: "Wrench",
  Entretenimiento: "Gamepad2",
  Otros: "HelpCircle"
};
