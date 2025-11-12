type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogContext {
  [key: string]: unknown;
}

const isDevelopment = import.meta.env.DEV;

class Logger {
  private log(level: LogLevel, message: string, context?: LogContext) {
    if (!isDevelopment && level === 'debug') {
      return;
    }

    const timestamp = new Date().toISOString();
    const prefix = `[${timestamp}] [${level.toUpperCase()}]`;
    
    if (context && Object.keys(context).length > 0) {
      console[level](prefix, message, context);
    } else {
      console[level](prefix, message);
    }
  }

  debug(message: string, context?: LogContext) {
    this.log('debug', message, context);
  }

  info(message: string, context?: LogContext) {
    this.log('info', message, context);
  }

  warn(message: string, context?: LogContext) {
    this.log('warn', message, context);
  }

  error(message: string, error?: Error | unknown, context?: LogContext) {
    const errorContext = {
      ...context,
      error: error instanceof Error ? {
        message: error.message,
        stack: error.stack,
      } : error,
    };
    this.log('error', message, errorContext);
  }
}

export const logger = new Logger();

