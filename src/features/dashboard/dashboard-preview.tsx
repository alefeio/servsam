"use client";

import { useSyncExternalStore } from "react";
import { DashboardView } from "@/features/dashboard/dashboard-view";
import { useDemoDataset } from "@/features/dashboard/use-demo-dataset";
import {
  getDemoSessionRaw,
  parseDemoSession,
  subscribeToDemoSession,
} from "@/lib/demo/session-core";

function useDemoRoleLabel(): string | undefined {
  const raw = useSyncExternalStore(subscribeToDemoSession, getDemoSessionRaw, () => null);
  return parseDemoSession(raw)?.roleLabel;
}

export function DashboardPreview() {
  const { metrics, periods, periodKey, setPeriodKey } = useDemoDataset();
  const roleLabel = useDemoRoleLabel();

  return (
    <DashboardView
      metrics={metrics}
      periods={periods}
      periodKey={periodKey}
      onPeriodChange={setPeriodKey}
      roleLabel={roleLabel}
    />
  );
}
