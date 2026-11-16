"use client";

import { useSyncExternalStore } from "react";
import { Button } from "@/components/ui/button";
import {
  getDemoDatasetLoadIssue,
  getDemoDatasetSnapshot,
  getSeedDemoDataset,
  restoreDemoData,
  subscribeDemoDataset,
} from "@/lib/demo/dataset-store";

export function DemoDatasetIssueBanner() {
  useSyncExternalStore(subscribeDemoDataset, getDemoDatasetSnapshot, getSeedDemoDataset);
  const issue = getDemoDatasetLoadIssue();

  if (!issue) {
    return null;
  }

  return (
    <div className="border-b border-amber-600/40 bg-amber-50 px-4 py-3 text-sm text-amber-950 md:px-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p>{issue.message} A demonstração continua com a massa inicial em memória.</p>
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={() => {
            restoreDemoData();
            window.location.reload();
          }}
        >
          Restaurar dados demonstrativos
        </Button>
      </div>
    </div>
  );
}
