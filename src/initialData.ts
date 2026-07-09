import { Transaction, CategoryLimit, MandatoryExpense } from "./types";

export const getInitialTransactions = (): Transaction[] => {
  return [];
};

export const getInitialLimits = (): CategoryLimit[] => {
  return [
    { category: "Comida", limit: 300000 },
    { category: "Educación", limit: 150000 },
    { category: "Salud", limit: 100000 },
    { category: "Higiene", limit: 50000 },
    { category: "Vivienda", limit: 1000000 },
    { category: "Transporte", limit: 80000 },
    { category: "Servicios", limit: 200000 },
    { category: "Entretenimiento", limit: 100000 },
    { category: "Otros", limit: 150000 }
  ];
};

export const getInitialMandatoryExpenses = (): MandatoryExpense[] => {
  return [
    { id: "m1", description: "Medicamentos Recurrentes", amount: 35000, category: "Salud" },
    { id: "m2", description: "Cita Médica Mensual", amount: 25000, category: "Salud" }
  ];
};
