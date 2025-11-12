export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  code?: string;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  user: {
    id: string;
    username: string;
  };
}

export interface ChatRequest {
  message: string;
  sessionId?: string;
}

export interface PdfUploadResponse {
  id: string;
  filename: string;
  size: number;
  uploadedAt: number;
}

export interface PdfDocument {
  id: string;
  filename: string;
  size: number;
  uploadedAt: number;
  indexed: boolean;
}

