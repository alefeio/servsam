"use client";

import { DashboardView } from "@/features/dashboard/dashboard-view";
import { useDemoDataset } from "@/features/dashboard/use-demo-dataset";

export function DashboardPreview() {
  const { metrics, periods, periodKey, setPeriodKey } = useDemoDataset();

  return (
    <DashboardView
      metrics={metrics}
      periods={periods}
      periodKey={periodKey}
      onPeriodChange={setPeriodKey}
    />
  );
}
