import { apiRequest } from "./httpClient";
import { Category } from "./categories";

export interface DashboardBudget {
  id: string;
  limit: string;
  spent: string;
  month: number;
  year: number;
  category: Category;
}

export interface DashboardTransaction {
  id: string;
  amount: string;
  type: "INCOME" | "EXPENSE";
  description: string | null;
  date: string;
  category: Category;
}

export interface DashboardSummary {
  totalBalance: number;
  monthIncome: number;
  monthExpense: number;
  budgets: DashboardBudget[];
  recentTransactions: DashboardTransaction[];
}

export function getDashboardSummary(
  token: string,
  month: number,
  year: number,
) {
  return apiRequest<DashboardSummary>(
    `/dashboard/summary?month=${month}&year=${year}`,
    { token },
  );
}
