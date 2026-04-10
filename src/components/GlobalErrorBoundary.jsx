import React from "react";
import * as Sentry from "@sentry/react";

export default class GlobalErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("GlobalErrorBoundary caught:", error, errorInfo);
    Sentry.captureException(error, { extra: { componentStack: errorInfo.componentStack } });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="fixed inset-0 bg-black text-white flex flex-col items-center justify-center p-8 text-center z-[99999]">
          <div className="w-16 h-16 premium-silver-gradient rounded-2xl flex items-center justify-center mb-6 shadow-xl">
            <span className="text-black font-black text-2xl">M</span>
          </div>
          <h1 className="text-3xl font-black mb-3">אופס, משהו השתבש</h1>
          <p className="text-gray-400 text-base mb-8 max-w-sm leading-relaxed">
            אירעה שגיאה בלתי צפויה באפליקציה.<br />
            ניתן לנסות לרענן את הדף.
          </p>
          <pre className="text-xs text-red-400 bg-white/5 rounded-xl p-4 mb-8 max-w-md w-full text-left overflow-auto max-h-32 border border-white/10">
            {this.state.error?.toString()}
          </pre>
          <button
            onClick={() => window.location.reload()}
            className="bg-white text-black font-black px-8 py-4 rounded-2xl text-lg active:scale-95 transition-transform shadow-xl"
          >
            רענן אפליקציה
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}