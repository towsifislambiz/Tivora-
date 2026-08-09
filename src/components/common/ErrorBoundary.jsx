import React from 'react';
import { Home, RefreshCw } from 'lucide-react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, errorMessage: '' };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, errorMessage: error?.message || 'Unknown error' };
  }

  componentDidCatch(error, info) {
    // Development-only diagnostic logging
    if (import.meta.env.DEV) {
      console.error('[ErrorBoundary] Caught error:', error, info);
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-brand-bg flex items-center justify-center p-6">
          <div className="bg-white rounded-3xl border border-brand-border shadow-soft-lg max-w-md w-full p-10 text-center space-y-5">
            <div className="w-16 h-16 rounded-full bg-red-50 text-red-500 flex items-center justify-center mx-auto text-3xl">
              ⚠️
            </div>
            <h2 className="text-xl font-bold text-brand-mainText">Something went wrong</h2>
            <p className="text-sm text-brand-mutedText leading-relaxed">
              An unexpected error occurred. Please try refreshing the page. If the problem persists, contact Tivora support.
            </p>
            <div className="flex items-center justify-center gap-3 pt-2 flex-wrap">
              <button
                onClick={() => this.setState({ hasError: false, errorMessage: '' })}
                className="px-5 py-2.5 bg-primary-gradient text-white font-bold text-sm rounded-full shadow-gradient-glow hover:scale-105 transition-transform flex items-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Try Again</span>
              </button>
              <button
                onClick={() => { window.location.hash = '#home'; window.location.reload(); }}
                className="px-5 py-2.5 bg-brand-lavender text-brand-purple font-bold text-sm rounded-full hover:bg-brand-purple/10 transition-colors flex items-center gap-2"
              >
                <Home className="w-4 h-4" />
                <span>Go Home</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
