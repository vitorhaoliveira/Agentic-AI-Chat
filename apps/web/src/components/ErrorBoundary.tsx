import { Component, type ReactNode } from 'react';
import { logger } from '@/utils/logger';
import { Button } from './ui/button';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    logger.error('React Error Boundary caught an error', error, {
      componentStack: errorInfo.componentStack,
    });
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen bg-gradient-to-br from-[#0f0f23] via-[#1a1a3e] to-[#0f0f23] flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-[#1a1a2e]/80 backdrop-blur-md border border-gray-700/50 rounded-lg p-8 text-center">
            <div className="mb-6">
              <div className="mx-auto w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mb-4">
                <svg
                  className="w-8 h-8 text-red-500"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">
                Something went wrong
              </h2>
              <p className="text-gray-400 mb-1">
                We encountered an unexpected error.
              </p>
              {import.meta.env.DEV && this.state.error && (
                <details className="mt-4 text-left">
                  <summary className="text-sm text-gray-500 cursor-pointer hover:text-gray-400">
                    Error details
                  </summary>
                  <pre className="mt-2 text-xs text-red-400 overflow-auto max-h-40 bg-black/20 p-2 rounded">
                    {this.state.error.message}
                    {'\n\n'}
                    {this.state.error.stack}
                  </pre>
                </details>
              )}
            </div>
            <Button
              onClick={this.handleReset}
              className="w-full bg-[#4169E1] hover:bg-[#3559d1]"
            >
              Return to Home
            </Button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

