import React from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('[ErrorBoundary] Component Error:', error, errorInfo);
    this.setState({
      error,
      errorInfo,
    });
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  render() {
    if (this.state.hasError) {
      const isDevelopment = import.meta.env.DEV;

      return (
        <div className="min-h-[400px] flex items-center justify-center p-6">
          <div className="max-w-2xl w-full">
            {/* Error Card */}
            <div className="p-8 rounded-2xl bg-white border-2 border-red-200 shadow-lg space-y-6">
              {/* Icon & Title */}
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-red-50 border border-red-200 flex items-center justify-center">
                  <AlertTriangle className="w-6 h-6 text-red-500" />
                </div>
                <div className="flex-1">
                  <h2 className="text-xl font-bold text-[#173B46] mb-2">
                    Component Rendering Error
                  </h2>
                  <p className="text-sm text-[#68777A] leading-relaxed">
                    This section encountered an unexpected error and couldn't be displayed. 
                    The rest of the application is still functioning normally.
                  </p>
                </div>
              </div>

              {/* Development Error Details */}
              {isDevelopment && this.state.error && (
                <div className="p-4 rounded-xl bg-red-50 border border-red-200">
                  <p className="text-xs font-bold text-red-700 mb-2">Development Error Details:</p>
                  <p className="text-xs text-red-600 font-mono break-all">
                    {this.state.error.toString()}
                  </p>
                  {this.state.errorInfo && this.state.errorInfo.componentStack && (
                    <details className="mt-3">
                      <summary className="text-xs font-semibold text-red-700 cursor-pointer hover:underline">
                        Component Stack Trace
                      </summary>
                      <pre className="mt-2 text-[10px] text-red-600 overflow-auto max-h-40 whitespace-pre-wrap">
                        {this.state.errorInfo.componentStack}
                      </pre>
                    </details>
                  )}
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex items-center gap-3 pt-2">
                <button
                  onClick={this.handleReset}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#173B46] hover:bg-[#0F3040] text-white text-sm font-semibold transition-all shadow-sm"
                >
                  <RefreshCw className="w-4 h-4" />
                  <span>Try Again</span>
                </button>
                <button
                  onClick={() => window.location.href = '/'}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-white hover:bg-[#F7F4EE] text-[#173B46] text-sm font-medium border border-[#E5DED2] transition-all"
                >
                  <Home className="w-4 h-4" />
                  <span>Go to Overview</span>
                </button>
              </div>

              {/* Help Text */}
              <div className="pt-4 border-t border-red-100">
                <p className="text-xs text-[#68777A]">
                  If this problem persists, please contact your system administrator or IT support team.
                </p>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
