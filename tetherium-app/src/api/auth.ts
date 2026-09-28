import { apiRequest } from "./httpClient";

export interface User {
  id: string;
  email: string;
  name: string;
  currency: string;
}

interface AuthResponse {
  user: User;
  token: string;
}

export function login(email: string, password: string) {
  return apiRequest<AuthResponse>("/auth/login", {
    method: "POST",
    body: { email, password },
  });
}

export function updatePushToken(token: string, pushToken: string) {
  return apiRequest<void>("/auth/push-token", {
    method: "POST",
    token,
    body: { pushToken },
  });
}

export function register(email: string, password: string, name: string) {
  return apiRequest<AuthResponse>("/auth/register", {
    method: "POST",
    body: { email, password, name },
  });
}

export function getMe(token: string) {
  return apiRequest<User>("/auth/me", { token });
}

export function updateProfile(token: string, data: { currency?: string }) {
  return apiRequest<User>("/auth/me", { method: "PATCH", token, body: data });
}
