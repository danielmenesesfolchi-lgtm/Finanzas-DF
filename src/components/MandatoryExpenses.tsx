import React, { useState } from "react";
import { CATEGORIES, MandatoryExpense, CATEGORY_COLORS } from "../types";
import { Trash2, Plus, ShieldAlert, CheckCircle2, AlertTriangle, Coins, Sparkles, Pencil, Check, X } from "lucide-react";
import { CategoryIcon } from "./CategoryIcon";

interface MandatoryExpensesProps {
  expenses: MandatoryExpense[];
  onAddExpense: (expense: Omit<MandatoryExpense, "id">) => void;
  onUpdateExpense: (expense: MandatoryExpense) => void;
  onDeleteExpense: (id: string) => void;
  onQuickPay: (expense: MandatoryExpense) => void;
  currentBalance: number;
}

export const MandatoryExpenses: React.FC<MandatoryExpensesProps> = ({
  expenses,
  onAddExpense,
  onUpdateExpense,
  onDeleteExpense,
  onQuickPay,
  currentBalance,
}) => {
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState(CATEGORIES[2]); // Default to "Salud" (Medical/Appointments) since user mentioned it
  const [isAdding, setIsAdding] = useState(false);

  // Editing states
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDescription, setEditDescription] = useState("");
  const [editAmount, setEditAmount] = useState("");
  const [editCategory, setEditCategory] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim() || !amount || parseFloat(amount) <= 0) return;

    onAddExpense({
      description: description.trim(),
      amount: parseFloat(amount),
      category,
    });

    setDescription("");
    setAmount("");
    setIsAdding(false);
  };

  const startEditing = (exp: MandatoryExpense) => {
    setEditingId(exp.id);
    setEditDescription(exp.description);
    setEditAmount(exp.amount.toString());
    setEditCategory(exp.category);
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditDescription("");
    setEditAmount("");
    setEditCategory("");
  };

  const handleSaveEdit = (id: string) => {
    if (!editDescription.trim() || !editAmount || parseFloat(editAmount) <= 0) return;
    onUpdateExpense({
      id,
      description: editDescription.trim(),
      amount: parseFloat(editAmount),
      category: editCategory,
    });
    cancelEditing();
  };

  const totalMandatory = expenses.reduce((sum, e) => sum + e.amount, 0);
  const isBalanceInsufficient = currentBalance < totalMandatory;
  const coveragePercent = totalMandatory > 0 ? Math.min(100, (currentBalance / totalMandatory) * 100) : 100;

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("es-CL", { style: "currency", currency: "CLP", minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(val);
  };

  return (
    <div className="bg-white/5 border border-white/10 backdrop-blur-md rounded-2xl p-6 text-white shadow-xl flex flex-col h-full overflow-hidden">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
          <Coins className="text-pink-400" size={20} />
          Gastos Obligatorios Mensuales
        </h3>
        <button
          onClick={() => {
            setIsAdding(!isAdding);
            if (editingId) cancelEditing();
          }}
          className="text-xs bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 border border-indigo-500/20 rounded-lg py-1 px-2.5 transition-all cursor-pointer flex items-center gap-1 font-medium"
        >
          <Plus size={14} />
          {isAdding ? "Cancelar" : "Nuevo"}
        </button>
      </div>

      {/* Alert Banner inside the component */}
      {expenses.length > 0 && (
        <div className={`mb-4 p-3 rounded-xl border transition-all ${
          isBalanceInsufficient
            ? "bg-rose-500/10 border-rose-500/30 text-rose-200"
            : "bg-emerald-500/10 border-emerald-500/20 text-emerald-200"
        }`}>
          <div className="flex items-start gap-2 text-xs">
            {isBalanceInsufficient ? (
              <ShieldAlert className="text-rose-400 shrink-0 mt-0.5 animate-pulse" size={16} />
            ) : (
              <CheckCircle2 className="text-emerald-400 shrink-0 mt-0.5" size={16} />
            )}
            <div>
              <span className="font-bold block mb-0.5">
                {isBalanceInsufficient ? "¡Alerta de Cobertura!" : "Gastos Asegurados"}
              </span>
              <p className="leading-relaxed text-[11px] opacity-90">
                {isBalanceInsufficient
                  ? `Tu balance disponible de ${formatCurrency(currentBalance)} es insuficiente para cubrir ${formatCurrency(totalMandatory)} en gastos obligatorios. Falta ${formatCurrency(totalMandatory - currentBalance)}.`
                  : `¡Excelente! Tu balance disponible de ${formatCurrency(currentBalance)} cubre al 100% tus gastos obligatorios mensuales.`}
              </p>
            </div>
          </div>

          {/* Progress bar of coverage */}
          <div className="mt-2.5 h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-500 ${
                isBalanceInsufficient ? "bg-rose-500" : "bg-emerald-500"
              }`}
              style={{ width: `${coveragePercent}%` }}
            ></div>
          </div>
        </div>
      )}

      {/* Form or List container with scroll */}
      <div className="flex-1 overflow-y-auto space-y-3 pr-1 max-h-[280px]">
        {isAdding ? (
          <form onSubmit={handleSubmit} className="bg-white/5 border border-white/5 rounded-xl p-4 space-y-3.5 animate-fadeIn">
            <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Registrar Gasto Obligatorio</h4>
            
            <div>
              <label className="block text-[10px] font-medium text-slate-400 mb-1">Descripción</label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Ej. Medicamento Presión, Cita Cardiólogo"
                className="w-full px-3 py-2 rounded-lg border border-white/10 focus:outline-none focus:border-indigo-400 text-xs bg-slate-950 text-white placeholder-slate-500 transition-all"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-medium text-slate-400 mb-1">Monto (CLP)</label>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0"
                  className="w-full px-3 py-2 rounded-lg border border-white/10 focus:outline-none focus:border-indigo-400 text-xs bg-slate-950 text-white placeholder-slate-500 transition-all"
                  required
                />
              </div>

              <div>
                <label className="block text-[10px] font-medium text-slate-400 mb-1">Categoría</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-white/10 focus:outline-none focus:border-indigo-400 text-xs bg-slate-950 text-slate-200 transition-all"
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat} value={cat} className="bg-slate-900 text-slate-100">
                      {cat}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white py-2 rounded-lg text-xs font-semibold shadow transition-all cursor-pointer"
            >
              Guardar Gasto Fijo
            </button>
          </form>
        ) : expenses.length === 0 ? (
          <div className="h-44 border border-dashed border-white/10 rounded-2xl flex flex-col items-center justify-center text-center p-6 bg-white/[0.01]">
            <Sparkles className="text-slate-500 mb-2 animate-pulse" size={24} />
            <p className="text-xs font-semibold text-slate-300">Sin Gastos Obligatorios</p>
            <p className="text-[10px] text-slate-500 mt-1 max-w-[200px]">
              Registra gastos médicos, arriendos, cuentas fijas o citas recurrentes para monitorear tu balance.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {expenses.map((exp) => {
              const color = CATEGORY_COLORS[exp.category] || "#64748b";
              
              if (editingId === exp.id) {
                return (
                  <div
                    key={exp.id}
                    className="bg-slate-900/80 border border-indigo-500/30 rounded-xl p-3 space-y-2.5 animate-fadeIn"
                  >
                    <div className="space-y-2">
                      <div>
                        <label className="block text-[8px] font-bold text-slate-400 uppercase tracking-wide mb-0.5">Descripción</label>
                        <input
                          type="text"
                          value={editDescription}
                          onChange={(e) => setEditDescription(e.target.value)}
                          placeholder="Descripción"
                          className="w-full px-2.5 py-1 rounded-lg bg-slate-950 border border-white/10 text-xs text-white focus:outline-none focus:border-indigo-400"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-[8px] font-bold text-slate-400 uppercase tracking-wide mb-0.5">Monto (CLP)</label>
                          <input
                            type="number"
                            value={editAmount}
                            onChange={(e) => setEditAmount(e.target.value)}
                            placeholder="Monto"
                            className="w-full px-2.5 py-1 rounded-lg bg-slate-950 border border-white/10 text-xs text-white focus:outline-none focus:border-indigo-400"
                          />
                        </div>
                        <div>
                          <label className="block text-[8px] font-bold text-slate-400 uppercase tracking-wide mb-0.5">Categoría</label>
                          <select
                            value={editCategory}
                            onChange={(e) => setEditCategory(e.target.value)}
                            className="w-full px-2.5 py-1 rounded-lg bg-slate-950 border border-white/10 text-xs text-slate-200 focus:outline-none focus:border-indigo-400"
                          >
                            {CATEGORIES.map((cat) => (
                              <option key={cat} value={cat} className="bg-slate-900 text-slate-100">
                                {cat}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </div>
                    <div className="flex justify-end gap-1.5 pt-2 border-t border-white/5">
                      <button
                        onClick={cancelEditing}
                        className="px-2.5 py-1 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-[10px] font-medium text-slate-300 transition-all flex items-center gap-1 cursor-pointer"
                      >
                        <X size={11} />
                        Cancelar
                      </button>
                      <button
                        onClick={() => handleSaveEdit(exp.id)}
                        className="px-3 py-1 bg-indigo-500 hover:bg-indigo-600 rounded-lg text-[10px] font-bold text-white transition-all flex items-center gap-1 cursor-pointer shadow shadow-indigo-500/20"
                      >
                        <Check size={11} />
                        Guardar
                      </button>
                    </div>
                  </div>
                );
              }

              return (
                <div
                  key={exp.id}
                  className="bg-white/5 border border-white/5 hover:border-white/10 rounded-xl p-3 flex items-center justify-between transition-all group"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                      style={{ backgroundColor: `${color}15`, color }}
                    >
                      <CategoryIcon category={exp.category} size={14} />
                    </div>
                    <div className="min-w-0">
                      <span className="text-xs font-semibold text-white block truncate">{exp.description}</span>
                      <span className="text-[9px] text-slate-400 uppercase font-medium tracking-wide">
                        {exp.category}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-xs font-bold font-mono text-slate-200">
                      {formatCurrency(exp.amount)}
                    </span>
                    
                    {/* Instant Register Payment Action Button */}
                    <button
                      onClick={() => onQuickPay(exp)}
                      className="text-[9px] bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 hover:text-emerald-300 border border-emerald-500/20 py-1 px-1.5 rounded-lg transition-all cursor-pointer opacity-80 group-hover:opacity-100 font-medium"
                      title="Registrar como gasto pagado de este mes"
                    >
                      Pagar
                    </button>

                    <button
                      onClick={() => startEditing(exp)}
                      className="p-1.5 rounded-lg hover:bg-indigo-500/10 text-slate-500 hover:text-indigo-400 transition-all cursor-pointer opacity-0 group-hover:opacity-100"
                      title="Editar gasto obligatorio"
                    >
                      <Pencil size={13} />
                    </button>

                    <button
                      onClick={() => onDeleteExpense(exp.id)}
                      className="p-1.5 rounded-lg hover:bg-rose-500/10 text-slate-500 hover:text-rose-400 transition-all cursor-pointer opacity-0 group-hover:opacity-100"
                      title="Eliminar gasto obligatorio"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Summary Footer */}
      {expenses.length > 0 && (
        <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between text-xs text-slate-400">
          <span>Total Obligatorio:</span>
          <span className="font-bold text-white font-mono">{formatCurrency(totalMandatory)}</span>
        </div>
      )}
    </div>
  );
};
