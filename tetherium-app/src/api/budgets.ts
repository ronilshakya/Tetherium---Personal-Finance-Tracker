import { Category } from "./categories";
import { apiRequest } from "./httpClient";

export interface Budget {
  id: string;
  category: Category;
  limit: string;
  spent: string;
  month: number;
  year: number;
}

interface CreateBudgetInput {
  categoryId: string;
  limit: number;
  month: number;
  year: number;
}

export function getBudgets(token: string, month: number, year: number) {
  return apiRequest<Budget[]>(`/budgets?month=${month}&year=${year}`, {
    token,
  });
}

export function createBudget(token: string, data: CreateBudgetInput) {
  return apiRequest<Budget>("/budgets", { method: "POST", token, body: data });
}

export function deleteBudget(token: string, id: string) {
  return apiRequest<void>(`/budgets/${id}`, { method: "DELETE", token });
}
