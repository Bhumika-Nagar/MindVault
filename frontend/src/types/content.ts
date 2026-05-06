export const BACKEND_CONTENT_TYPES = ["image", "video", "article", "audio", "tweet"] as const;

export type ContentType = (typeof BACKEND_CONTENT_TYPES)[number];
export type ContentStatus = "pending" | "completed" | "failed";

export interface Content {
  _id: string;
  title: string;
  link: string;
  type: ContentType;
  summary?: string;
  status?: ContentStatus;
  userId: string;
  tags: string[];
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateContentInput {
  title: string;
  link: string;
  type: ContentType;
  tags?: string[];
}

export interface CreateContentResponse {
  message: string;
  content: Content;
}

export interface ContentListResponse {
  success: boolean;
  content: Content[];
}

export interface ShareContentResponse {
  message?: string;
  hash?: string;
  shareUrl?: string | null;
}

export interface SharedContentResponse {
  username: string;
  content: Content[];
}
