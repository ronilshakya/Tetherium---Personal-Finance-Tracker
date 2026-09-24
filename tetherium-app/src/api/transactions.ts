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

export function getTransactions(token: string) {
  return apiRequest<Transaction[]>("/transactions", { token });
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
