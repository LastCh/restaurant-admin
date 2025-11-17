export type AuthResponse = {
  accessToken: string;
  refreshToken: string;
  userId: number;
  username: string;
  role: string;
  expiresIn: number;
};

export type LoginRequest = {
  username: string;
  password: string;
};

export type ErrorResponse = {
  status: number;
  message: string;
  error: string;
  path: string;
  timestamp: string;
};
