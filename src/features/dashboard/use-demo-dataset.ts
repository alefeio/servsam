"use client";

import { useMemo, useState, useSyncExternalStore } from "react";
import {
  getDemoDatasetSnapshot,
  subscribeDemoDataset,
} from "@/lib/demo/dataset-store";
import {
  buildDashboardMetrics,
  getAvailablePeriods,
  getDefaultPeriodKey,
} from "@/lib/demo/metrics";

export function useDemoDataset() {
  const dataset = useSyncExternalStore(
    subscribeDemoDataset,
    getDemoDatasetSnapshot,
    () => getDemoDatasetSnapshot(),
  );

  const periods = useMemo(() => getAvailablePeriods(dataset), [dataset]);
  const defaultPeriod = useMemo(() => getDefaultPeriodKey(dataset), [dataset]);
  const [periodKey, setPeriodKey] = useState(defaultPeriod);

  const activePeriod = periods.includes(periodKey) ? periodKey : defaultPeriod;
  const metrics = useMemo(
    () => buildDashboardMetrics(dataset, activePeriod),
    [dataset, activePeriod],
  );

  return {
    dataset,
    periods,
    periodKey: activePeriod,
    setPeriodKey,
    metrics,
  };
}
