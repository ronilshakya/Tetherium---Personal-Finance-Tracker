import { Category } from "./categories";
import { apiRequest } from "./httpClient";

export interface Transaction {
  id: string;
  amount: string;
  type: "INCOME" | "EXPENSE";
  category: Category;
  description: string | null;
  date: string;
}

interface CreateTransactionInput {
  amount: number;
  type: "INCOME" | "EXPENSE";
  categoryId: string;
  description?: string;
}

export function getTransactions(
  token: string,
  filters: {
    from?: Date;
    to?: Date;
    categoryId?: string;
    search?: string;
  } = {},
) {
  const params = new URLSearchParams();
  if (filters.from) params.append("from", filters.from.toISOString());
  if (filters.to) params.append("to", filters.to.toISOString());
  if (filters.categoryId) params.append("categoryId", filters.categoryId);
  if (filters.search) params.append("search", filters.search);
  const query = params.toString() ? `?${params.toString()}` : "";
  return apiRequest<Transaction[]>(`/transactions${query}`, { token });
}

export function getTransaction(token: string, id: string) {
  return apiRequest<Transaction>(`/transactions/${id}`, { token });
}

export function updateTransaction(
  token: string,
  id: string,
  data: Partial<CreateTransactionInput>,
) {
  return apiRequest<Transaction>(`/transactions/${id}`, {
    method: "PATCH",
    token,
    body: data,
  });
}

export function createTransaction(token: string, data: CreateTransactionInput) {
  return apiRequest<Transaction>("/transactions", {
    method: "POST",
    token,
    body: data,
  });
}

export function deleteTransaction(token: string, id: string) {
  return apiRequest<void>(`/transactions/${id}`, { method: "DELETE", token });
}
