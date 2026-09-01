import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, LayoutDashboard } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallbackView?: () => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    this.setState({ errorInfo });
  }

  private handleReload = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="h-screen w-screen bg-[#0F172A] text-slate-100 flex items-center justify-center p-6 select-none font-sans">
          <div className="max-w-lg w-full bg-[#1E293B] border border-slate-700 rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-red-500/20 text-red-400 flex items-center justify-center">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-base font-bold text-white">Se detectó una incidencia en la vista</h2>
                <p className="text-xs text-slate-400">ProcesosStudio Portable &bull; Recuperación Segura</p>
              </div>
            </div>

            <div className="p-3 bg-[#0B1120] rounded-lg border border-slate-800 text-xs font-mono text-red-300 overflow-x-auto max-h-32">
              {this.state.error?.message || 'Error desconocido al renderizar el componente'}
            </div>

            <p className="text-xs text-slate-300">
              Tus archivos de proyectos en <code>../Proyectos/</code> están seguros. Podés recargar la aplicación para restablecer el estado.
            </p>

            <div className="flex items-center justify-end space-x-3 pt-2">
              <button
                onClick={this.handleReload}
                className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-sky-600 to-blue-600 hover:brightness-110 text-white text-xs font-bold rounded-xl shadow-lg transition-all"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Recargar Aplicación</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
