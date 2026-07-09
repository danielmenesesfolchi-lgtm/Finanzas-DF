import React, { useState } from "react";
import { CATEGORIES, Transaction } from "../types";
import { Plus, TrendingUp, TrendingDown, DollarSign } from "./CategoryIcon";

interface TransactionFormProps {
  onAddTransaction: (transaction: Omit<Transaction, "id">) => void;
}

export const TransactionForm: React.FC<TransactionFormProps> = ({ onAddTransaction }) => {
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [type, setType] = useState<"income" | "expense">("expense");
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [date, setDate] = useState(() => {
    // Default to current local date
    const today = new Date();
    return today.toISOString().split("T")[0];
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim() || !amount || parseFloat(amount) <= 0) return;

    onAddTransaction({
      description: description.trim(),
      amount: parseFloat(amount),
      type,
      category: type === "income" ? "Otros" : category, // Income defaults to "Otros" or general
      date
    });

    // Reset some fields
    setDescription("");
    setAmount("");
  };

  return (
    <div id="add-transaction-card" className="bg-white/5 border border-white/10 backdrop-blur-md rounded-2xl p-6 text-white shadow-xl relative overflow-hidden">
      <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
        <Plus className="text-indigo-400" size={20} />
        Registrar Movimiento
      </h3>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Type Toggle */}
        <div className="grid grid-cols-2 gap-2 p-1 bg-white/5 border border-white/10 rounded-xl">
          <button
            type="button"
            id="type-expense-btn"
            onClick={() => {
              setType("expense");
              setCategory(CATEGORIES[0]);
            }}
            className={`py-2 px-3 rounded-lg text-sm font-medium transition-all duration-200 flex items-center justify-center gap-2 border ${
              type === "expense"
                ? "bg-white/10 text-rose-400 border-white/20 shadow-sm"
                : "text-slate-400 hover:text-slate-200 border-transparent hover:bg-white/5"
            }`}
          >
            <TrendingDown size={16} />
            Egreso (Gasto)
          </button>
          <button
            type="button"
            id="type-income-btn"
            onClick={() => {
              setType("income");
              setCategory("Otros");
            }}
            className={`py-2 px-3 rounded-lg text-sm font-medium transition-all duration-200 flex items-center justify-center gap-2 border ${
              type === "income"
                ? "bg-white/10 text-emerald-400 border-white/20 shadow-sm"
                : "text-slate-400 hover:text-slate-200 border-transparent hover:bg-white/5"
            }`}
          >
            <TrendingUp size={16} />
            Ingreso
          </button>
        </div>

        {/* Description */}
        <div>
          <label htmlFor="description" className="block text-xs font-medium text-slate-400 mb-1">
            Descripción
          </label>
          <input
            type="text"
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Ej. Supermercado, Sueldo, Internet..."
            className="w-full px-4 py-2.5 rounded-xl border border-white/10 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 text-sm bg-white/5 text-white placeholder-slate-400 transition-all"
            required
          />
        </div>

        {/* Amount & Date Grid */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="amount" className="block text-xs font-medium text-slate-400 mb-1">
              Monto
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                <DollarSign size={16} />
              </span>
              <input
                type="number"
                id="amount"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                step="0.01"
                min="0.01"
                className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-white/10 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 text-sm bg-white/5 text-white placeholder-slate-400 transition-all"
                required
              />
            </div>
          </div>

          <div>
            <label htmlFor="date" className="block text-xs font-medium text-slate-400 mb-1">
              Fecha
            </label>
            <input
              type="date"
              id="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-white/10 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 text-sm bg-white/5 text-slate-200 transition-all"
              required
            />
          </div>
        </div>

        {/* Category (Only if expense) */}
        {type === "expense" && (
          <div>
            <label htmlFor="category" className="block text-xs font-medium text-slate-400 mb-1">
              Categoría del Gasto
            </label>
            <select
              id="category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-white/10 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 text-sm bg-white/5 text-slate-200 appearance-none bg-[url('data:image/svg+xml;charset=UTF-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2224%22%20height%3D%2224%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22rgba(255,255,255,0.4)%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpolyline%20points%3D%226%209%2012%2015%2018%209%22%3E%3C%2Fpolyline%3E%3C%2Fsvg%3E')] bg-[length:1rem_1rem] bg-[right_1rem_center] bg-no-repeat transition-all"
            >
              {CATEGORIES.filter(cat => cat !== "Otros" || type === "expense").map((cat) => (
                <option key={cat} value={cat} className="bg-slate-900 text-slate-100">
                  {cat}
                </option>
              ))}
            </select>
          </div>
        )}

        <button
          type="submit"
          id="submit-transaction-btn"
          className="w-full bg-indigo-600 hover:bg-indigo-500 text-white py-3 rounded-xl font-semibold text-sm transition-all duration-200 flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/20 hover:shadow-indigo-500/30 cursor-pointer"
        >
          Agregar Registro
        </button>
      </form>
    </div>
  );
};
