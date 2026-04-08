export const AUTH_TOKEN_STORAGE_KEY = "mindvault.auth-token";
export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, "") || "http://localhost:5000/api/v1";
