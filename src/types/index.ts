export interface LoginRequest {
  username: string;
  password: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  userId: number;
  username: string;
  role: string;
  expiresIn: number;
}

export interface ErrorResponse {
  status: number;
  message: string;
  error: string;
  path: string;
  timestamp: string;
}
