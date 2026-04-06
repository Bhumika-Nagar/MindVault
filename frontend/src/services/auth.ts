import type { AxiosError } from "axios";
import { api } from "../lib/api";
import type { AuthPayload, AuthResponse } from "../types/auth";

function getAuthErrorMessage(error: unknown, fallback: string): string {
  const axiosError = error as AxiosError<{ message?: string; error?: string }>;
  return axiosError.response?.data?.message ?? axiosError.response?.data?.error ?? fallback;
}

export const authService = {
  async signup(payload: AuthPayload): Promise<AuthResponse> {
    try {
      const response = await api.post<AuthResponse>("/user/signup", payload);
      return response.data;
    } catch (error) {
      throw new Error(getAuthErrorMessage(error, "Failed to sign up."));
    }
  },

  async signin(payload: AuthPayload): Promise<AuthResponse> {
    try {
      const response = await api.post<AuthResponse>("/user/signin", payload);
      return response.data;
    } catch (error) {
      throw new Error(getAuthErrorMessage(error, "Failed to sign in."));
    }
  }
};
