import { Component } from "react";
import { AlertTriangle, RefreshCw, ArrowLeft } from "lucide-react";

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error("[ErrorBoundary]", error?.message, info?.componentStack);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  handleBack = () => {
    this.setState({ hasError: false, error: null });
    window.dispatchEvent(new CustomEvent("opencode:resetBeat", { detail: { beat: "persona" } }));
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#F8FAFC] dark:bg-dark-bg flex items-center justify-center p-6">
          <div className="max-w-md w-full bg-white dark:bg-dark-card rounded-2xl border border-slate-200 dark:border-dark-border shadow-lg p-8 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-red-50 dark:bg-red-900/20 flex items-center justify-center">
              <AlertTriangle className="w-8 h-8 text-red-500" />
            </div>
            <h2 className="text-xl font-bold text-slate-800 dark:text-dark-text mb-2">Something went wrong</h2>
            <p className="text-sm text-slate-500 dark:text-dark-muted mb-6">
              The application encountered an unexpected error. Please try again.
            </p>
            {this.state.error?.message && (
              <p className="text-xs text-slate-400 dark:text-dark-muted mb-6 p-3 bg-slate-50 dark:bg-dark-border/50 rounded-xl font-mono break-all">
                {this.state.error.message}
              </p>
            )}
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={this.handleBack}
                className="inline-flex items-center gap-2 px-5 py-3 bg-slate-100 dark:bg-dark-border text-slate-700 dark:text-dark-text rounded-xl font-semibold hover:bg-slate-200 dark:hover:bg-dark-border/80 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Dashboard
              </button>
              <button
                onClick={this.handleRetry}
                className="inline-flex items-center gap-2 px-6 py-3 bg-[#0066FF] text-white rounded-xl font-semibold hover:bg-[#0052CC] transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                Reload
              </button>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
