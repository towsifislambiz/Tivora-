import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';

export default class PageErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("PageErrorBoundary caught lazy loading error:", error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="bg-brand-surface rounded-3xl p-8 border border-brand-border shadow-soft-sm text-center space-y-4 max-w-md mx-auto my-8 animate-fadeIn">
          <div className="w-14 h-14 rounded-full bg-amber-50 dark:bg-amber-950/40 text-amber-500 flex items-center justify-center mx-auto border border-amber-200/50">
            <AlertCircle className="w-7 h-7" />
          </div>
          <div className="space-y-1">
            <h3 className="font-bold text-base text-brand-mainText">Connection Interrupted</h3>
            <p className="text-xs text-brand-mutedText max-w-xs mx-auto">
              We couldn't load this page due to a temporary network hiccup.
            </p>
          </div>
          <button
            onClick={this.handleRetry}
            className="px-6 py-2.5 rounded-full bg-primary-gradient text-white font-bold text-xs shadow-gradient-glow hover:scale-105 transition-transform inline-flex items-center gap-2"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Retry Loading</span>
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
