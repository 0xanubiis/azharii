import { Component, type ErrorInfo, type ReactNode } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  error: Error | null;
}

/**
 * Prevents a fully blank page: if rendering fails anywhere in the app, show an
 * Arabic fallback screen with a reload action instead of an empty document.
 */
export class AppErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("App crashed:", error, info.componentStack);
  }

  render() {
    if (this.state.error) {
      return (
        <div
          dir="rtl"
          className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background px-6 text-center text-foreground"
        >
          <h1 className="text-2xl font-bold">حدث خطأ غير متوقع</h1>
          <p className="max-w-md text-sm text-muted-foreground">
            تعذّر تحميل المنصة. جرّب إعادة تحميل الصفحة، وإذا استمرت المشكلة تواصل مع
            الدعم.
          </p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="rounded-md bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
          >
            إعادة تحميل الصفحة
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
