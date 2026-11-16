"use client";

import { Component, type ErrorInfo, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import {
  getDemoDatasetLoadIssue,
  restoreDemoData,
} from "@/lib/demo/dataset-store";

type Props = {
  children: ReactNode;
};

type State = {
  hasError: boolean;
  message: string;
};

export class DemoErrorBoundary extends Component<Props, State> {
  state: State = {
    hasError: false,
    message: "",
  };

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      message: error.message || "A demonstração encontrou um erro inesperado.",
    };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("Demonstração: erro capturado", error, info);
  }

  private handleReload = () => {
    window.location.reload();
  };

  private handleRestore = () => {
    restoreDemoData();
    window.location.reload();
  };

  render() {
    if (!this.state.hasError) {
      return this.props.children;
    }

    const loadIssue = getDemoDatasetLoadIssue();

    return (
      <div className="grid min-h-screen place-items-center bg-muted px-4">
        <div className="max-w-lg space-y-4 rounded-xl border border-border bg-background p-6 text-sm">
          <p className="text-xs tracking-wide text-teal uppercase">Demonstração</p>
          <h1 className="text-xl font-semibold text-navy">A página não carregou</h1>
          <p className="text-muted-foreground">
            A sessão demonstrativa encontrou um erro. Os dados salvos neste navegador
            não foram apagados automaticamente.
          </p>
          {loadIssue ? (
            <p className="rounded-md border border-amber-600/40 bg-amber-50 px-3 py-2 text-amber-950">
              {loadIssue.message}
            </p>
          ) : null}
          <p className="text-xs text-muted-foreground">{this.state.message}</p>
          <div className="flex flex-wrap gap-2">
            <Button type="button" onClick={this.handleReload}>
              Recarregar
            </Button>
            <Button type="button" variant="outline" onClick={this.handleRestore}>
              Restaurar dados demonstrativos
            </Button>
          </div>
        </div>
      </div>
    );
  }
}
