import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { 
      hasError: false, 
      error: null,
      errorInfo: null 
    };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    this.setState({
      error: error,
      errorInfo: errorInfo
    });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex h-full items-center justify-center p-6">
          <div className="max-w-md text-center">
            <div className="mb-4">
              <div className="mb-4 text-6xl">⚠️</div>
              <h2 className="mb-2 text-2xl font-bold text-red-600">
                Something went wrong
              </h2>
              <p className="mb-4 text-gray-600">
                {this.props.fallbackMessage || 'An unexpected error occurred in this component.'}
              </p>
            </div>
            
            {process.env.NODE_ENV === 'development' && (
              <details className="mb-4 rounded bg-gray-100 p-4 text-left">
                <summary className="cursor-pointer font-semibold">Error Details</summary>
                <pre className="mt-2 text-sm text-red-600">
                  {this.state.error && this.state.error.toString()}
                </pre>
                <pre className="mt-2 text-xs text-gray-600">
                  {this.state.errorInfo.componentStack}
                </pre>
              </details>
            )}
            
            <div className="space-x-2">
              <button
                onClick={() => this.setState({ hasError: false, error: null, errorInfo: null })}
                className="rounded bg-blue-500 px-4 py-2 text-white hover:bg-blue-600"
              >
                Try Again
              </button>
              <button
                onClick={() => window.location.reload()}
                className="rounded bg-gray-500 px-4 py-2 text-white hover:bg-gray-600"
              >
                Reload Page
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;