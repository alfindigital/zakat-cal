import { Component, type ErrorInfo, type ReactNode } from "react";

interface Props {
  children: ReactNode;
}
interface State {
  hasError: boolean;
}

// Catches render-time errors anywhere in the tree and shows a friendly,
// recoverable fallback instead of a blank white screen.
export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // Surface for debugging without crashing the app.
    if (import.meta.env.DEV) console.error("App error:", error, info);
  }

  handleReload = () => {
    this.setState({ hasError: false });
    if (typeof window !== "undefined") window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-dvh items-center justify-center bg-background px-4">
          <div className="text-center space-y-4 max-w-sm">
            <h1 className="text-2xl font-bold">Terjadi kesalahan</h1>
            <p className="text-muted-foreground">
              Maaf, ada yang tidak beres. Coba muat ulang halaman — data perhitungan Anda tetap tersimpan.
            </p>
            <button
              type="button"
              onClick={this.handleReload}
              className="inline-flex h-11 items-center justify-center rounded-lg bg-primary px-6 font-semibold text-primary-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              Muat Ulang
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
