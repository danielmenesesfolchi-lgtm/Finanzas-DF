import React, { useState } from "react";
import { Transaction, CategoryLimit, CATEGORIES, CATEGORY_COLORS } from "../types";
import { CategoryIcon, AlertTriangle, Info, Bell } from "./CategoryIcon";

interface BudgetLimitsProps {
  transactions: Transaction[];
  limits: CategoryLimit[];
  onUpdateLimit: (category: string, newLimit: number) => void;
  onSelectCategoryForSearch?: (category: string, budget: number) => void;
}

export const BudgetLimits: React.FC<BudgetLimitsProps> = ({
  transactions,
  limits,
  onUpdateLimit,
  onSelectCategoryForSearch
}) => {
  const [editingCategory, setEditingCategory] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");

  // Get current month details
  const today = new Date();
  const currentYear = today.getFullYear();
  // July 2026 as per our environment metadata
  const currentMonthStr = "2026-07"; 

  // Calculate current month expenses per category
  const getCategorySpending = (category: string) => {
    return transactions
      .filter((t) => {
        return (
          t.type === "expense" &&
          t.category === category &&
          t.date.startsWith(currentMonthStr)
        );
      })
      .reduce((sum, t) => sum + t.amount, 0);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("es-CL", { style: "currency", currency: "CLP", minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(amount);
  };

  const handleEditStart = (category: string, currentLimit: number) => {
    setEditingCategory(category);
    setEditValue(currentLimit.toString());
  };

  const handleEditSave = (category: string) => {
    const val = parseFloat(editValue);
    if (!isNaN(val) && val >= 0) {
      onUpdateLimit(category, val);
    }
    setEditingCategory(null);
  };

  // Find exceeded categories to generate quick notices
  const exceededCategories = limits
    .map((l) => {
      const spending = getCategorySpending(l.category);
      const isExceeded = spending > l.limit;
      const pct = l.limit > 0 ? (spending / l.limit) * 100 : 0;
      return { category: l.category, spending, limit: l.limit, isExceeded, pct };
    })
    .filter((item) => item.isExceeded);

  return (
    <div id="budget-limits-card" className="bg-white/5 border border-white/10 backdrop-blur-md rounded-2xl p-6 flex flex-col h-full text-white shadow-xl relative overflow-hidden">
      <div className="flex items-center justify-between mb-4 shrink-0">
        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
          <Bell className="text-indigo-400 animate-pulse" size={20} />
          Presupuesto y Límites (Julio 2026)
        </h3>
        <span className="text-xs text-indigo-300 bg-indigo-500/15 border border-indigo-500/20 font-medium py-1 px-3 rounded-full flex items-center gap-1">
          <Info size={12} />
          Click para editar límite
        </span>
      </div>

      {/* Exceeded limit alerts section */}
      {exceededCategories.length > 0 && (
        <div className="mb-4 space-y-2 shrink-0">
          {exceededCategories.map((item) => (
            <div
              key={item.category}
              className="flex items-start gap-2.5 p-3 bg-rose-500/10 border border-rose-500/30 text-rose-200 rounded-xl text-xs animate-shake"
            >
              <AlertTriangle className="text-rose-400 shrink-0 mt-0.5" size={16} />
              <div>
                <span className="font-bold">¡Límite excedido en {item.category}! </span>
                Has gastado <span className="font-semibold text-white">{formatCurrency(item.spending)}</span> de un límite de{" "}
                <span className="font-semibold text-white">{formatCurrency(item.limit)}</span> (
                {item.pct.toFixed(0)}%).
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Category List with Limits and Progress */}
      <div className="flex-1 overflow-y-auto space-y-4 pr-1 scrollbar-thin">
        {limits.map((l) => {
          const spending = getCategorySpending(l.category);
          const color = CATEGORY_COLORS[l.category] || "#64748b";
          const pct = l.limit > 0 ? (spending / l.limit) * 100 : 0;
          const isExceeded = spending > l.limit;
          const remaining = Math.max(0, l.limit - spending);

          return (
            <div key={l.category} className="group/item">
              <div className="flex items-center justify-between mb-1">
                {/* Left Side: Icon and Name */}
                <div className="flex items-center gap-2">
                  <div
                    className="w-7 h-7 rounded-lg flex items-center justify-center text-xs border"
                    style={{
                      backgroundColor: `${color}20`,
                      borderColor: `${color}30`,
                      color: color
                    }}
                  >
                    <CategoryIcon name={l.category} size={14} />
                  </div>
                  <span className="text-sm font-medium text-slate-100">{l.category}</span>
                </div>

                {/* Right Side: Limit (Editable) and Spending */}
                <div className="flex items-center gap-2">
                  {editingCategory === l.category ? (
                    <div className="flex items-center gap-1">
                      <span className="text-xs text-slate-400">€</span>
                      <input
                        type="number"
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        className="w-16 px-1.5 py-0.5 text-xs font-mono font-bold text-white bg-slate-900 border border-white/20 rounded focus:outline-none focus:border-indigo-400"
                        autoFocus
                        onBlur={() => handleEditSave(l.category)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleEditSave(l.category);
                          if (e.key === "Escape") setEditingCategory(null);
                        }}
                      />
                    </div>
                  ) : (
                    <button
                      onClick={() => handleEditStart(l.category, l.limit)}
                      className="text-xs font-bold font-mono text-slate-300 hover:text-indigo-300 bg-white/5 group-hover/item:bg-white/10 py-0.5 px-2 rounded border border-white/10 transition-all cursor-pointer"
                      title="Editar límite"
                    >
                      {formatCurrency(l.limit)}
                    </button>
                  )}
                  <span className="text-[10px] text-slate-400 font-mono">
                    Gastado: {formatCurrency(spending)}
                  </span>
                </div>
              </div>

              {/* Progress Bar Container */}
              <div className="h-2 w-full bg-white/5 border border-white/5 rounded-full overflow-hidden relative">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    isExceeded ? "bg-rose-500 shadow-md shadow-rose-500/30" : ""
                  }`}
                  style={{
                    width: `${Math.min(100, pct)}%`,
                    backgroundColor: !isExceeded ? color : undefined
                  }}
                />
              </div>

              {/* Remaining budget and Action buttons */}
              <div className="flex items-center justify-between mt-1 px-0.5">
                <span
                  className={`text-[10px] font-medium font-mono ${
                    isExceeded ? "text-rose-400 animate-pulse" : "text-slate-400"
                  }`}
                >
                  {isExceeded
                    ? `Excedido por: ${formatCurrency(spending - l.limit)}`
                    : `Disponible: ${formatCurrency(remaining)}`}
                </span>

                {onSelectCategoryForSearch && (
                  <button
                    onClick={() => onSelectCategoryForSearch(l.category, remaining > 0 ? remaining : 150)}
                    className="text-[9px] font-semibold text-indigo-300 hover:text-indigo-200 transition-colors flex items-center gap-0.5 py-0.5 px-1.5 rounded hover:bg-white/5 border border-transparent hover:border-white/10 cursor-pointer"
                  >
                    🔍 Buscar productos
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
