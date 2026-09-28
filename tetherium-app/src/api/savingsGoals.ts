import { apiRequest } from "./httpClient";

export interface GoalContribution {
  id: string;
  amount: string;
  date: string;
  note: string | null;
}

export interface SavingsGoal {
  id: string;
  name: string;
  targetAmount: string;
  currentAmount: string;
  targetDate: string | null;
  icon: string | null;
  color: string | null;
  createdAt: string;
}

export interface SavingsGoalDetail extends SavingsGoal {
  contributions: GoalContribution[];
}

interface CreateGoalInput {
  name: string;
  targetAmount: number;
  targetDate?: string;
  icon?: string;
  color?: string;
}

export function getSavingsGoals(token: string) {
  return apiRequest<SavingsGoal[]>("/savings-goals", { token });
}

export function getSavingsGoal(token: string, id: string) {
  return apiRequest<SavingsGoalDetail>(`/savings-goals/${id}`, { token });
}

export function createSavingsGoal(token: string, data: CreateGoalInput) {
  return apiRequest<SavingsGoal>("/savings-goals", {
    method: "POST",
    token,
    body: data,
  });
}

export function addGoalContribution(
  token: string,
  goalId: string,
  data: { amount: number; note?: string },
) {
  return apiRequest<SavingsGoal>(`/savings-goals/${goalId}/contributions`, {
    method: "POST",
    token,
    body: data,
  });
}

export function deleteSavingsGoal(token: string, id: string) {
  return apiRequest<void>(`/savings-goals/${id}`, { method: "DELETE", token });
}
