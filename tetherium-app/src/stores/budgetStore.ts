import { create } from "zustand";
import { Budget } from "../api";

interface BudgetState {
  budgets: Budget[];
  loading: boolean;
  setBudgets: (budgets: Budget[]) => void;
  addBudget: (budget: Budget) => void;
  removeBudget: (id: string) => void;
  setLoading: (loading: boolean) => void;
}

export const useBudgetStore = create<BudgetState>((set) => ({
  budgets: [],
  loading: false,
  setBudgets: (budgets) => set({ budgets }),
  addBudget: (budget) =>
    set((state) => ({ budgets: [...state.budgets, budget] })),
  removeBudget: (id) =>
    set((state) => ({ budgets: state.budgets.filter((b) => b.id !== id) })),
  setLoading: (loading) => set({ loading }),
}));
