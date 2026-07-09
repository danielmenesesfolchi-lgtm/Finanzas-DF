import React from "react";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend
} from "recharts";
import { Transaction, CATEGORIES, CATEGORY_COLORS } from "../types";
import { PiggyBank, TrendingUp, TrendingDown } from "./CategoryIcon";

interface FinancialChartsProps {
  transactions: Transaction[];
}

export const FinancialCharts: React.FC<FinancialChartsProps> = ({ transactions }) => {
  // Get current month details (July 2026 as per our environment metadata)
  const today = new Date();
  const currentMonthStr = "2026-07";

  // 1. Calculate expense breakdown by category for the current month
  const categoryData = CATEGORIES.map((cat) => {
    const total = transactions
      .filter((t) => {
        return (
          t.type === "expense" &&
          t.category === cat &&
          t.date.startsWith(currentMonthStr)
        );
      })
      .reduce((sum, t) => sum + t.amount, 0);

    return {
      name: cat,
      value: parseFloat(total.toFixed(2)),
      color: CATEGORY_COLORS[cat] || "#64748b"
    };
  }).filter((item) => item.value > 0);

  // 2. Calculate monthly cashflow (Income vs Expenses for June and July 2026)
  const getMonthlyCashflow = () => {
    const months = ["2026-06", "2026-07"];
    const monthNames: Record<string, string> = {
      "2026-06": "Junio",
      "2026-07": "Julio"
    };

    return months.map((m) => {
      const income = transactions
        .filter((t) => t.type === "income" && t.date.startsWith(m))
        .reduce((sum, t) => sum + t.amount, 0);

      const expenses = transactions
        .filter((t) => t.type === "expense" && t.date.startsWith(m))
        .reduce((sum, t) => sum + t.amount, 0);

      return {
        name: monthNames[m],
        Ingresos: parseFloat(income.toFixed(2)),
        Egresos: parseFloat(expenses.toFixed(2))
      };
    });
  };

  const cashflowData = getMonthlyCashflow();

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("es-CL", { style: "currency", currency: "CLP", minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(value);
  };

  // Custom tooltips to match slate styling
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-950/90 backdrop-blur-md text-white p-3 rounded-xl border border-white/10 shadow-2xl text-xs font-medium">
          <p className="font-semibold mb-1">{payload[0].name}</p>
          <p className="font-mono text-indigo-300">
            {formatCurrency(payload[0].value)}
          </p>
        </div>
      );
    }
    return null;
  };

  const CustomBarTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-950/90 backdrop-blur-md text-white p-3 rounded-xl border border-white/10 shadow-2xl text-xs font-medium space-y-1">
          <p className="font-semibold text-slate-200">{label}</p>
          {payload.map((item: any) => (
            <div key={item.name} className="flex items-center gap-2">
              <span
                className="w-2.5 h-2.5 rounded-full"
                style={{ backgroundColor: item.color }}
              />
              <span className="text-slate-400">{item.name}:</span>
              <span className="font-mono font-bold" style={{ color: item.color }}>
                {formatCurrency(item.value)}
              </span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  const totalCurrentExpenses = categoryData.reduce((sum, item) => sum + item.value, 0);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Category Breakdown (Donut Chart) */}
      <div id="category-chart-card" className="bg-white/5 border border-white/10 backdrop-blur-md rounded-2xl p-6 flex flex-col h-[380px] text-white shadow-xl relative overflow-hidden">
        <div className="mb-4 shrink-0">
          <h3 className="text-base font-semibold text-white flex items-center gap-2">
            <TrendingDown className="text-rose-400" size={18} />
            Gastos por Categoría (Julio 2026)
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Distribución automática de egresos mensuales por categorías
          </p>
        </div>

        <div className="flex-1 flex flex-col sm:flex-row items-center gap-4 min-h-0">
          {categoryData.length === 0 ? (
            <div className="w-full flex flex-col items-center justify-center text-slate-400 text-sm py-10">
              <PiggyBank size={36} className="text-slate-500 mb-2" />
              <p>No hay gastos registrados este mes.</p>
              <p className="text-xs text-slate-500 mt-1">Registra egresos para ver el desglose gráfico.</p>
            </div>
          ) : (
            <>
              {/* Donut container */}
              <div className="w-full sm:w-1/2 h-full relative flex items-center justify-center min-h-[160px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categoryData}
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={75}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {categoryData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
                {/* Centered Total */}
                <div className="absolute text-center flex flex-col justify-center items-center pointer-events-none">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Total</span>
                  <span className="text-base font-bold font-mono text-white">
                    {formatCurrency(totalCurrentExpenses)}
                  </span>
                </div>
              </div>

              {/* Legend with percentages */}
              <div className="w-full sm:w-1/2 overflow-y-auto max-h-[180px] pr-1 space-y-2 scrollbar-thin">
                {categoryData.map((item, idx) => {
                  const pct = totalCurrentExpenses > 0 ? (item.value / totalCurrentExpenses) * 100 : 0;
                  return (
                    <div key={idx} className="flex items-center justify-between text-xs animate-fadeIn">
                      <div className="flex items-center gap-2">
                        <span
                          className="w-2.5 h-2.5 rounded-full shrink-0"
                          style={{ backgroundColor: item.color }}
                        />
                        <span className="text-slate-300 font-medium truncate max-w-[100px]" title={item.name}>
                          {item.name}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 font-mono">
                        <span className="text-white font-semibold">{formatCurrency(item.value)}</span>
                        <span className="text-slate-400 text-[10px] font-medium">({pct.toFixed(0)}%)</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Monthly Cashflow Comparison (Bar Chart) */}
      <div id="cashflow-chart-card" className="bg-white/5 border border-white/10 backdrop-blur-md rounded-2xl p-6 flex flex-col h-[380px] text-white shadow-xl relative overflow-hidden">
        <div className="mb-4 shrink-0">
          <h3 className="text-base font-semibold text-white flex items-center gap-2">
            <TrendingUp className="text-emerald-400" size={18} />
            Comparativa Mensual (Evolución)
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Balance general entre ingresos totales y egresos mensuales
          </p>
        </div>

        <div className="flex-1 min-h-0">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={cashflowData}
              margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255, 255, 255, 0.05)" />
              <XAxis dataKey="name" tick={{ fill: "#94a3b8", fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis
                tickFormatter={(val) => `$${val.toLocaleString("es-CL")}`}
                tick={{ fill: "#94a3b8", fontSize: 10 }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip content={<CustomBarTooltip />} cursor={{ fill: "rgba(255, 255, 255, 0.05)" }} />
              <Legend verticalAlign="top" height={36} iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11, color: "#cbd5e1" }} />
              <Bar dataKey="Ingresos" fill="#34d399" radius={[4, 4, 0, 0]} maxBarSize={40} />
              <Bar dataKey="Egresos" fill="#f87171" radius={[4, 4, 0, 0]} maxBarSize={40} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};
