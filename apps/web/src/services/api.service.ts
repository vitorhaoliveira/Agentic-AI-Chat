import type {
  ApiResponse,
  LoginRequest,
  LoginResponse,
  ChatRequest,
} from '@agentic-ai-chat/shared';
import { appConfig } from '@/config/app.config';
import { storageService } from './storage.service';
import { logger } from '@/utils/logger';

class ApiService {
  private getHeaders(includeAuth = true): HeadersInit {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    if (includeAuth) {
      const token = storageService.getAuthToken();
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
    }

    return headers;
  }

  async login(
    credentials: LoginRequest
  ): Promise<ApiResponse<LoginResponse>> {
    logger.info('Attempting login', { username: credentials.username });

    try {
      const response = await fetch(
        `${appConfig.api.baseUrl}/api/auth/login`,
        {
          method: 'POST',
          headers: this.getHeaders(false),
          body: JSON.stringify(credentials),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        logger.warn('Login failed', { 
          status: response.status, 
          error: data.error,
          code: data.code 
        });
        return {
          success: false,
          error: data.error || 'Login failed',
          code: data.code,
        };
      }

      if (data.success) {
        logger.info('Login successful');
      } else {
        logger.warn('Login failed', { error: data.error });
      }

      return data;
    } catch (error) {
      logger.error('Login request failed', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error. Please try again.',
        code: 'NETWORK_ERROR',
      };
    }
  }

  async *streamChat(
    request: ChatRequest,
    pdfFile?: File
  ): AsyncGenerator<string, void, unknown> {
    logger.info('Starting chat stream', {
      hasMessage: !!request.message,
      hasPdf: !!pdfFile,
    });

    let response: Response;

    try {
      if (pdfFile) {
        const formData = new FormData();
        formData.append('message', request.message);
        formData.append('pdf', pdfFile);

        const token = storageService.getAuthToken();
        const headers: HeadersInit = {};
        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        }

        response = await fetch(`${appConfig.api.baseUrl}/chat/stream`, {
          method: 'POST',
          headers,
          body: formData,
        });
      } else {
        response = await fetch(`${appConfig.api.baseUrl}/chat/stream`, {
          method: 'POST',
          headers: this.getHeaders(),
          body: JSON.stringify(request),
        });
      }

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) {
        throw new Error('Response body is null');
      }

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split('\n');

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.slice(6);
              if (data === '[DONE]') {
                logger.info('Chat stream completed');
                return;
              }
              try {
                const parsed = JSON.parse(data);
                if (parsed.content) {
                  yield parsed.content;
                }
              } catch (e) {
                logger.error('Error parsing SSE data', e);
              }
            }
          }
        }
      } finally {
        reader.releaseLock();
      }
    } catch (error) {
      logger.error('Chat stream error', error);
      throw error;
    }
  }

  async uploadPdf(file: File): Promise<ApiResponse> {
    logger.info('Uploading PDF', { filename: file.name, size: file.size });

    const formData = new FormData();
    formData.append('pdf', file);

    const token = storageService.getAuthToken();
    const headers: HeadersInit = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    try {
      const response = await fetch(`${appConfig.api.baseUrl}/pdf/upload`, {
        method: 'POST',
        headers,
        body: formData,
      });

      const data = await response.json();

      if (data.success) {
        logger.info('PDF uploaded successfully');
      } else {
        logger.warn('PDF upload failed', { error: data.error });
      }

      return data;
    } catch (error) {
      logger.error('PDF upload request failed', error);
      throw error;
    }
  }

  async listPdfs(): Promise<ApiResponse> {
    try {
      const response = await fetch(`${appConfig.api.baseUrl}/pdf/list`, {
        method: 'GET',
        headers: this.getHeaders(),
      });

      return response.json();
    } catch (error) {
      logger.error('List PDFs request failed', error);
      throw error;
    }
  }
}

export const apiService = new ApiService();

