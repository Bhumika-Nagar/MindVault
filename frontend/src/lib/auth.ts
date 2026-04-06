import { AUTH_TOKEN_STORAGE_KEY } from "./constants";

export function getStoredToken(): string | null {
  return window.localStorage.getItem(AUTH_TOKEN_STORAGE_KEY);
}

export function setStoredToken(token: string): void {
  window.localStorage.setItem(AUTH_TOKEN_STORAGE_KEY, token);
}

export function clearStoredToken(): void {
  window.localStorage.removeItem(AUTH_TOKEN_STORAGE_KEY);
}
