import { apiRequest } from "./httpClient";

export interface User {
  id: string;
  email: string;
  name: string;
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

export function register(email: string, password: string, name: string) {
  return apiRequest<AuthResponse>("/auth/register", {
    method: "POST",
    body: { email, password, name },
  });
}

export function getMe(token: string) {
  return apiRequest<User>("/auth/me", { token });
}
