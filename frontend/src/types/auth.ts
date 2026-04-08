export interface AuthPayload {
  username: string;
  password: string;
}

export interface AuthResponse {
  message: string;
  token?: string;
}
