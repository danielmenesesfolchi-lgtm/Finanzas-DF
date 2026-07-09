import React, { useState } from "react";
import { Transaction, CATEGORIES, CATEGORY_COLORS } from "../types";
import { CategoryIcon, Trash2, ListFilter, Search } from "./CategoryIcon";

interface TransactionListProps {
  transactions: Transaction[];
  onDeleteTransaction: (id: string) => void;
}

export const TransactionList: React.FC<TransactionListProps> = ({
  transactions,
  onDeleteTransaction
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<"all" | "income" | "expense">("all");
  const [filterCategory, setFilterCategory] = useState<string>("all");

  const filteredTransactions = transactions
    .filter((t) => {
      const matchesSearch = t.description.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesType = filterType === "all" || t.type === filterType;
      const matchesCategory = filterCategory === "all" || t.category === filterCategory;
      return matchesSearch && matchesType && matchesCategory;
    })
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("es-CL", { style: "currency", currency: "CLP", minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(amount);
  };

  const formatDate = (dateStr: string) => {
    const options: Intl.DateTimeFormatOptions = { day: "numeric", month: "short" };
    return new Date(dateStr + "T00:00:00").toLocaleDateString("es-ES", options);
  };

  return (
    <div id="transactions-list-card" className="bg-white/5 border border-white/10 backdrop-blur-md rounded-2xl p-6 flex flex-col h-[520px] text-white shadow-xl relative overflow-hidden">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
          <ListFilter className="text-indigo-400" size={20} />
          Historial de Movimientos
        </h3>
        <span className="text-xs bg-white/10 text-slate-300 py-1 px-2.5 rounded-full font-medium border border-white/5">
          {filteredTransactions.length} registros encontrados
        </span>
      </div>

      {/* Filter and Search Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mb-4 shrink-0">
        <div className="relative col-span-1 sm:col-span-1">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
            <Search size={16} />
          </span>
          <input
            type="text"
            placeholder="Buscar..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-white/10 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 text-xs bg-white/5 text-white placeholder-slate-400 transition-all"
          />
        </div>

        <div>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value as any)}
            className="w-full px-3 py-1.5 rounded-xl border border-white/10 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 text-xs bg-white/5 text-slate-200 appearance-none bg-[url('data:image/svg+xml;charset=UTF-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2224%22%20height%3D%2224%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22rgba(255,255,255,0.4)%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpolyline%20points%3D%226%209%2012%2015%2018%209%22%3E%3C%2Fpolyline%3E%3C%2Fsvg%3E')] bg-[length:0.8rem_0.8rem] bg-[right_0.8rem_center] bg-no-repeat transition-all"
          >
            <option value="all" className="bg-slate-900 text-slate-100">Todos los Tipos</option>
            <option value="income" className="bg-slate-900 text-slate-100">Ingresos</option>
            <option value="expense" className="bg-slate-900 text-slate-100">Egresos (Gastos)</option>
          </select>
        </div>

        <div>
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="w-full px-3 py-1.5 rounded-xl border border-white/10 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 text-xs bg-white/5 text-slate-200 appearance-none bg-[url('data:image/svg+xml;charset=UTF-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2224%22%20height%3D%2224%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22rgba(255,255,255,0.4)%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpolyline%20points%3D%226%209%2012%2015%2018%209%22%3E%3C%2Fpolyline%3E%3C%2Fsvg%3E')] bg-[length:0.8rem_0.8rem] bg-[right_0.8rem_center] bg-no-repeat transition-all"
          >
            <option value="all" className="bg-slate-900 text-slate-100">Todas las Categorías</option>
            {CATEGORIES.map((cat) => (
              <option key={cat} value={cat} className="bg-slate-900 text-slate-100">
                {cat}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Transactions Container */}
      <div className="flex-1 overflow-y-auto pr-1 -mr-2 space-y-2 scrollbar-thin">
        {filteredTransactions.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-slate-400 py-10">
            <span className="text-4xl mb-2">🔍</span>
            <p className="text-sm">No se encontraron movimientos.</p>
            <p className="text-xs text-slate-500 mt-1">Prueba cambiando los filtros o agrega uno nuevo.</p>
          </div>
        ) : (
          filteredTransactions.map((t) => {
            const isExpense = t.type === "expense";
            const color = CATEGORY_COLORS[t.category] || "#64748b";

            return (
              <div
                key={t.id}
                className="flex items-center justify-between p-3.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-all duration-200 group text-white"
              >
                <div className="flex items-center gap-3">
                  {/* Category icon container with category colored border/bg */}
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center border shrink-0"
                    style={{
                      borderColor: `${color}30`,
                      backgroundColor: `${color}20`,
                      color: color
                    }}
                  >
                    <CategoryIcon name={t.category} size={18} />
                  </div>

                  <div>
                    <h4 className="text-sm font-medium text-slate-100 line-clamp-1">
                      {t.description}
                    </h4>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[10px] font-mono text-slate-400">
                        {formatDate(t.date)}
                      </span>
                      {isExpense && (
                        <span
                          className="text-[10px] font-medium px-1.5 py-0.5 rounded-full"
                          style={{
                            backgroundColor: `${color}20`,
                            color: color
                          }}
                        >
                          {t.category}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span
                    className={`text-sm font-semibold font-mono ${
                      isExpense ? "text-slate-200" : "text-emerald-400"
                    }`}
                  >
                    {isExpense ? "-" : "+"}
                    {formatCurrency(t.amount)}
                  </span>
                  <button
                    onClick={() => onDeleteTransaction(t.id)}
                    className="text-slate-400 hover:text-rose-400 p-1.5 rounded-lg hover:bg-white/10 opacity-0 group-hover:opacity-100 focus:opacity-100 transition-all duration-200 cursor-pointer"
                    title="Eliminar movimiento"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
