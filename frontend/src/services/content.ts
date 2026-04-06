import type { AxiosError } from "axios";
import { api } from "../lib/api";
import type {
  ContentListResponse,
  CreateContentInput,
  CreateContentResponse,
  SharedContentResponse,
  ShareContentResponse
} from "../types/content";

function getContentErrorMessage(error: unknown, fallback: string): string {
  const axiosError = error as AxiosError<{ message?: string; error?: string }>;
  return axiosError.response?.data?.message ?? axiosError.response?.data?.error ?? fallback;
}

export const contentService = {
  async create(input: CreateContentInput): Promise<CreateContentResponse> {
    try {
      const response = await api.post<CreateContentResponse>("/content", input);
      return response.data;
    } catch (error) {
      throw new Error(getContentErrorMessage(error, "Failed to create content."));
    }
  },

  async list(): Promise<ContentListResponse> {
    try {
      const response = await api.get<ContentListResponse>("/content");
      return response.data;
    } catch (error) {
      throw new Error(getContentErrorMessage(error, "Failed to load content."));
    }
  },

  async remove(contentId: string): Promise<void> {
    try {
      await api.delete(`/content/${contentId}`);
    } catch (error) {
      throw new Error(getContentErrorMessage(error, "Failed to delete content."));
    }
  },

  async share(share: boolean): Promise<ShareContentResponse> {
    try {
      const response = await api.post<ShareContentResponse>("/content/share", { share });
      return response.data;
    } catch (error) {
      throw new Error(getContentErrorMessage(error, "Failed to update share link."));
    }
  },

  async getSharedContent(shareLink: string): Promise<SharedContentResponse> {
    try {
      const response = await api.get<SharedContentResponse>(`/content/share/${shareLink}`);
      return response.data;
    } catch (error) {
      throw new Error(getContentErrorMessage(error, "Failed to load shared content."));
    }
  }
};
