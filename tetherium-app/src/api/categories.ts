import { apiRequest } from "./httpClient";

export interface Category {
  id: string;
  name: string;
  icon: string | null;
  color: string | null;
  type: "INCOME" | "EXPENSE";
}

interface CreateCategoryInput {
  name: string;
  type: "INCOME" | "EXPENSE";
  icon?: string;
  color?: string;
}

export function getCategories(token: string, type?: "INCOME" | "EXPENSE") {
  const query = type ? `?type=${type}` : "";
  return apiRequest<Category[]>(`/categories${query}`, { token });
}

export function createCategory(token: string, data: CreateCategoryInput) {
  return apiRequest<Category>("/categories", {
    method: "POST",
    token,
    body: data,
  });
}

export function deleteCategory(token: string, id: string) {
  return apiRequest<void>(`/categories/${id}`, { method: "DELETE", token });
}
