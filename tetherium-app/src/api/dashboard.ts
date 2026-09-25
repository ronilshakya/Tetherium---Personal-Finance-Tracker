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

export interface CategorySpending {
  categoryId: string;
  categoryName: string;
  color: string | null;
  total: number;
}

export interface MonthlyTrend {
  month: number;
  year: number;
  income: number;
  expense: number;
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

export function getSpendingByCategory(
  token: string,
  month: number,
  year: number,
) {
  return apiRequest<CategorySpending[]>(
    `/dashboard/spending-by-category?month=${month}&year=${year}`,
    { token },
  );
}

export function getMonthlyTrend(token: string, months: number = 6) {
  return apiRequest<MonthlyTrend[]>(
    `/dashboard/monthly-trend?months=${months}`,
    { token },
  );
}
