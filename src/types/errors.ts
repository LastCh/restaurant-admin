export interface ApiError {
  status: number;
  message: string;
  details?: Record<string, any>;
}
