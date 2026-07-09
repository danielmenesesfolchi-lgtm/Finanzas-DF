import { useState, useEffect } from "react";
import { Transaction, CategoryLimit, MandatoryExpense } from "./types";
import { getInitialTransactions, getInitialLimits, getInitialMandatoryExpenses } from "./initialData";
import { TransactionForm } from "./components/TransactionForm";
import { TransactionList } from "./components/TransactionList";
import { BudgetLimits } from "./components/BudgetLimits";
import { ProductSearch } from "./components/ProductSearch";
import { FinancialCharts } from "./components/FinancialCharts";
import { LockScreen } from "./components/LockScreen";
import { MandatoryExpenses } from "./components/MandatoryExpenses";
import { BankSync } from "./components/BankSync";
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  AlertTriangle,
  Bell,
  PiggyBank,
  RefreshCw
} from "./components/CategoryIcon";
import { Lock } from "lucide-react";
import { motion } from "motion/react";

export default function App() {
  // Master states
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [limits, setLimits] = useState<CategoryLimit[]>([]);
  const [mandatoryExpenses, setMandatoryExpenses] = useState<MandatoryExpense[]>([]);
  const [isLocked, setIsLocked] = useState<boolean>(true);
  
  // Interactive trigger to link Budget Limits with Product Search
  const [searchTrigger, setSearchTrigger] = useState<{ category: string; budget: number } | null>(null);

  // Load initial data from localStorage or fallback
  useEffect(() => {
    const savedTransactions = localStorage.getItem("hogar_transactions");
    const savedLimits = localStorage.getItem("hogar_limits");
    const savedMandatory = localStorage.getItem("hogar_mandatory_expenses");

    let initialTx = getInitialTransactions();
    let initialLimits = getInitialLimits();
    let initialMandatory = getInitialMandatoryExpenses();

    // Force clear any old dummy transactions if present to start completely fresh with 0 balance
    let parsedTxs = null;
    if (savedTransactions) {
      try {
        parsedTxs = JSON.parse(savedTransactions);
        if (Array.isArray(parsedTxs) && parsedTxs.some((t: any) => t.id === "t1" || t.id === "t2" || t.description === "Salario Mensual")) {
          parsedTxs = null; // force clear old demo data
        }
      } catch (e) {
        parsedTxs = null;
      }
    }

    if (parsedTxs) {
      setTransactions(parsedTxs);
    } else {
      setTransactions(initialTx);
      localStorage.setItem("hogar_transactions", JSON.stringify(initialTx));
    }

    if (savedLimits) {
      setLimits(JSON.parse(savedLimits));
    } else {
      setLimits(initialLimits);
      localStorage.setItem("hogar_limits", JSON.stringify(initialLimits));
    }

    if (savedMandatory) {
      setMandatoryExpenses(JSON.parse(savedMandatory));
    } else {
      setMandatoryExpenses(initialMandatory);
      localStorage.setItem("hogar_mandatory_expenses", JSON.stringify(initialMandatory));
    }
  }, []);

  // Save changes to localStorage
  const saveTransactions = (newTransactions: Transaction[]) => {
    setTransactions(newTransactions);
    localStorage.setItem("hogar_transactions", JSON.stringify(newTransactions));
  };

  const saveLimits = (newLimits: CategoryLimit[]) => {
    setLimits(newLimits);
    localStorage.setItem("hogar_limits", JSON.stringify(newLimits));
  };

  const saveMandatoryExpenses = (newExpenses: MandatoryExpense[]) => {
    setMandatoryExpenses(newExpenses);
    localStorage.setItem("hogar_mandatory_expenses", JSON.stringify(newExpenses));
  };

  // State actions
  const handleAddTransaction = (newT: Omit<Transaction, "id">) => {
    const t: Transaction = {
      ...newT,
      id: Math.random().toString(36).substring(2, 9)
    };
    saveTransactions([t, ...transactions]);
  };

  const handleImportBankTransactions = (toImport: Omit<Transaction, "id">[]) => {
    const imported: Transaction[] = toImport.map((item) => ({
      ...item,
      id: Math.random().toString(36).substring(2, 9)
    }));
    saveTransactions([...imported, ...transactions]);
  };

  const handleDeleteTransaction = (id: string) => {
    saveTransactions(transactions.filter((t) => t.id !== id));
  };

  const handleUpdateLimit = (category: string, newLimit: number) => {
    saveLimits(
      limits.map((l) => (l.category === category ? { ...l, limit: newLimit } : l))
    );
  };

  const handleAddMandatoryExpense = (newExp: Omit<MandatoryExpense, "id">) => {
    const exp: MandatoryExpense = {
      ...newExp,
      id: Math.random().toString(36).substring(2, 9)
    };
    saveMandatoryExpenses([...mandatoryExpenses, exp]);
  };

  const handleUpdateMandatoryExpense = (updatedExp: MandatoryExpense) => {
    saveMandatoryExpenses(
      mandatoryExpenses.map((e) => (e.id === updatedExp.id ? updatedExp : e))
    );
  };

  const handleDeleteMandatoryExpense = (id: string) => {
    saveMandatoryExpenses(mandatoryExpenses.filter((e) => e.id !== id));
  };

  const handleQuickPayMandatoryExpense = (exp: MandatoryExpense) => {
    const today = new Date().toISOString().split("T")[0];
    handleAddTransaction({
      description: `Pago: ${exp.description}`,
      amount: exp.amount,
      type: "expense",
      category: exp.category,
      date: today
    });
    handleDeleteMandatoryExpense(exp.id);
  };

  const handleResetData = () => {
    if (window.confirm("¿Está seguro de que desea restablecer todos los movimientos a cero?")) {
      const initialTx = getInitialTransactions();
      const initialLimits = getInitialLimits();
      const initialMandatory = getInitialMandatoryExpenses();
      saveTransactions(initialTx);
      saveLimits(initialLimits);
      saveMandatoryExpenses(initialMandatory);
      setSearchTrigger(null);
    }
  };

  // Statistics Calculations (July 2026 current month focus as per our environment metadata)
  const currentMonthStr = "2026-07";

  const getMonthlyTotal = (type: "income" | "expense") => {
    return transactions
      .filter((t) => t.type === type && t.date.startsWith(currentMonthStr))
      .reduce((sum, t) => sum + t.amount, 0);
  };

  const currentIncome = getMonthlyTotal("income");
  const currentExpense = getMonthlyTotal("expense");
  const balance = currentIncome - currentExpense;
  const savingsRate = currentIncome > 0 ? ((currentIncome - currentExpense) / currentIncome) * 100 : 0;

  const totalMandatoryExpenses = mandatoryExpenses.reduce((sum, e) => sum + e.amount, 0);
  const hasMandatoryAlert = totalMandatoryExpenses > 0 && balance < totalMandatoryExpenses;

  // Active notification check: count categories exceeded
  const activeExceededCount = limits.filter((l) => {
    const spending = transactions
      .filter((t) => t.type === "expense" && t.category === l.category && t.date.startsWith(currentMonthStr))
      .reduce((sum, t) => sum + t.amount, 0);
    return spending > l.limit;
  }).length;

  const totalAlertsCount = activeExceededCount + (hasMandatoryAlert ? 1 : 0);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("es-CL", { style: "currency", currency: "CLP", minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(amount);
  };

  const handleSelectCategoryForSearch = (category: string, budget: number) => {
    setSearchTrigger({ category, budget });
    // Scroll smoothly to the search panel
    document.getElementById("product-search-card")?.scrollIntoView({ behavior: "smooth" });
  };

  if (isLocked) {
    return <LockScreen onUnlock={() => setIsLocked(false)} />;
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans antialiased pb-12 selection:bg-indigo-500/30 selection:text-white relative overflow-x-hidden">
      
      {/* Frosted Glass background decoration layers */}
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-950 via-slate-900 to-purple-950 opacity-80 pointer-events-none z-0"></div>
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-indigo-500/15 rounded-full blur-[130px] pointer-events-none z-0"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-rose-500/8 rounded-full blur-[130px] pointer-events-none z-0"></div>

      {/* Header Panel */}
      <header className="bg-white/5 border-b border-white/10 sticky top-0 z-40 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500 flex items-center justify-center text-white shadow-lg shadow-indigo-500/20">
              <PiggyBank size={22} />
            </div>
            <div>
              <h1 className="text-base font-bold text-white tracking-tight">
                Finanzas DF
              </h1>
              <p className="text-[10px] text-slate-400 font-medium">
                Gestión inteligente de presupuestos familiares • IA
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Notification alert counter */}
            <div className="relative" id="notifications-pill">
              <div className={`p-2 rounded-xl transition-colors ${totalAlertsCount > 0 ? "bg-rose-500/20 text-rose-300 border border-rose-500/30" : "bg-white/5 text-slate-300 border border-white/5"}`}>
                <Bell size={18} className={totalAlertsCount > 0 ? "animate-bounce" : ""} />
              </div>
              {totalAlertsCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-rose-500 text-white font-mono text-[9px] font-bold h-4 w-4 rounded-full flex items-center justify-center shadow-sm">
                  {totalAlertsCount}
                </span>
              )}
            </div>

            <button
              onClick={() => setIsLocked(true)}
              className="text-[11px] font-medium text-slate-300 hover:text-white flex items-center gap-1.5 hover:bg-white/10 py-1.5 px-3 rounded-xl border border-white/10 transition-all cursor-pointer"
              title="Bloquear la aplicación"
            >
              <Lock size={12} className="text-indigo-400" />
              <span>Bloquear</span>
            </button>

            <button
              onClick={handleResetData}
              className="text-[11px] font-medium text-slate-300 hover:text-white flex items-center gap-1 hover:bg-white/10 py-1.5 px-3 rounded-xl border border-white/10 transition-all cursor-pointer"
              title="Restablecer todos los datos a cero"
            >
              <RefreshCw size={12} />
              <span className="hidden sm:inline">Limpiar todo</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6 space-y-6 relative z-10">
        
        {/* Alerts / Banner Notification */}
        {activeExceededCount > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-2xl flex items-start gap-3 text-amber-200 shadow-lg backdrop-blur-md"
          >
            <AlertTriangle className="text-amber-400 shrink-0 mt-0.5" size={18} />
            <div className="text-xs">
              <span className="font-bold block text-amber-300 mb-0.5">Alerta de Límite de Gasto</span>
              Tienes <span className="font-bold">{activeExceededCount}</span> categoría(s) que han superado el presupuesto mensual establecido. Revisa la sección de límites e intenta reducir costos en esas áreas o usa el buscador inteligente de productos para encontrar alternativas de ahorro.
            </div>
          </motion.div>
        )}

        {/* Global Mandatory Expenses Coverage Alert */}
        {hasMandatoryAlert && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 bg-rose-500/10 border border-rose-500/30 rounded-2xl flex items-start gap-3 text-rose-200 shadow-lg backdrop-blur-md"
          >
            <AlertTriangle className="text-rose-400 shrink-0 mt-0.5 animate-pulse" size={18} />
            <div className="text-xs">
              <span className="font-bold block text-rose-300 mb-0.5">⚠️ Alerta de Cobertura para Gastos Obligatorios</span>
              Tu balance total disponible de <span className="font-bold text-white">{formatCurrency(balance)}</span> es insuficiente para cubrir tus gastos obligatorios mensuales de <span className="font-bold text-white">{formatCurrency(totalMandatoryExpenses)}</span>. Te faltan <span className="font-bold text-rose-400">{formatCurrency(totalMandatoryExpenses - balance)}</span> para asegurar el pago de estos compromisos recurrentes (como medicamentos de uso diario o citas mensuales).
            </div>
          </motion.div>
        )}

        {/* Global Statistics Summary Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          
          {/* Card 1: Balance */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="bg-white/5 border border-white/10 backdrop-blur-md rounded-2xl p-5 flex items-center justify-between"
          >
            <div>
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                Balance Mensual (Julio)
              </span>
              <h2 className={`text-2xl font-bold font-mono tracking-tight ${balance >= 0 ? "text-white" : "text-rose-400"}`}>
                {formatCurrency(balance)}
              </h2>
              <span className="text-[10px] text-slate-400 font-medium">Fondos netos disponibles</span>
            </div>
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${balance >= 0 ? "bg-indigo-500/15 text-indigo-300 border border-indigo-500/30" : "bg-rose-500/15 text-rose-300 border border-rose-500/30"}`}>
              <DollarSign size={20} />
            </div>
          </motion.div>

          {/* Card 2: Income */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white/5 border border-white/10 backdrop-blur-md rounded-2xl p-5 flex items-center justify-between"
          >
            <div>
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                Ingresos Totales (Julio)
              </span>
              <h2 className="text-2xl font-bold font-mono tracking-tight text-emerald-400">
                +{formatCurrency(currentIncome)}
              </h2>
              <span className="text-[10px] text-slate-400 font-medium">Entradas en efectivo</span>
            </div>
            <div className="w-12 h-12 rounded-xl bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center justify-center shrink-0">
              <TrendingUp size={20} />
            </div>
          </motion.div>

          {/* Card 3: Expenses */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="bg-white/5 border border-white/10 backdrop-blur-md rounded-2xl p-5 flex items-center justify-between"
          >
            <div>
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                Egresos Totales (Julio)
              </span>
              <h2 className="text-2xl font-bold font-mono tracking-tight text-slate-100">
                -{formatCurrency(currentExpense)}
              </h2>
              <span className="text-[10px] text-slate-400 font-medium">Salidas y consumos</span>
            </div>
            <div className="w-12 h-12 rounded-xl bg-white/5 text-slate-300 border border-white/10 flex items-center justify-center shrink-0">
              <TrendingDown size={20} />
            </div>
          </motion.div>

          {/* Card 4: Savings Rate */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white/5 border border-white/10 backdrop-blur-md rounded-2xl p-5 flex items-center justify-between"
          >
            <div>
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                Tasa de Ahorro
              </span>
              <h2 className={`text-2xl font-bold font-mono tracking-tight ${savingsRate >= 15 ? "text-emerald-400" : savingsRate > 0 ? "text-indigo-300" : "text-rose-400"}`}>
                {savingsRate.toFixed(1)}%
              </h2>
              <span className="text-[10px] text-slate-400 font-medium">Proporción de ingresos ahorrados</span>
            </div>
            <div className="w-12 h-12 rounded-xl bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 flex items-center justify-center shrink-0">
              <PiggyBank size={20} />
            </div>
          </motion.div>

        </div>

        {/* Master Bento Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* Column Left (Col 4): Form and limits list */}
          <div className="lg:col-span-4 space-y-6">
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.2 }}
            >
              <TransactionForm onAddTransaction={handleAddTransaction} />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.2, delay: 0.1 }}
              className="h-[430px]"
            >
              <BudgetLimits
                transactions={transactions}
                limits={limits}
                onUpdateLimit={handleUpdateLimit}
                onSelectCategoryForSearch={handleSelectCategoryForSearch}
              />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.2, delay: 0.15 }}
            >
              <MandatoryExpenses
                expenses={mandatoryExpenses}
                onAddExpense={handleAddMandatoryExpense}
                onUpdateExpense={handleUpdateMandatoryExpense}
                onDeleteExpense={handleDeleteMandatoryExpense}
                onQuickPay={handleQuickPayMandatoryExpense}
                currentBalance={balance}
              />
            </motion.div>
          </div>

          {/* Column Center-Right (Col 8): Transaction history & charts & search */}
          <div className="lg:col-span-8 space-y-6">
            
            {/* Visual Charts Component (Pie breakdown & Bar trend comparison) */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 }}
            >
              <FinancialCharts transactions={transactions} />
            </motion.div>

            {/* Bank Synchronization Panel */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.08 }}
            >
              <BankSync
                existingTransactions={transactions}
                onImportTransactions={handleImportBankTransactions}
                formatCurrency={formatCurrency}
              />
            </motion.div>

            {/* Two Column Layout inside main content: Left is transactions, Right is AI product search */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 items-start">
              
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                <TransactionList
                  transactions={transactions}
                  onDeleteTransaction={handleDeleteTransaction}
                />
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
                className="h-[520px]"
              >
                <ProductSearch
                  initialCategory={searchTrigger?.category}
                  initialBudget={searchTrigger?.budget}
                />
              </motion.div>

            </div>

          </div>

        </div>

      </main>

      {/* Humble Footer with credits */}
      <footer className="mt-16 text-center text-slate-500 text-xs relative z-10">
        <p>Finanzas DF © 2026 • Realizado con IA para optimización de presupuestos</p>
      </footer>
    </div>
  );
}
