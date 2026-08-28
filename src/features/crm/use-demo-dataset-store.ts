"use client";

import { useSyncExternalStore } from "react";
import {
  getDemoDatasetSnapshot,
  saveDemoDataset,
  subscribeDemoDataset,
} from "@/lib/demo/dataset-store";
import type { DemoDataset } from "@/types/demo-entities";

export function useDemoDatasetStore() {
  const dataset = useSyncExternalStore(
    subscribeDemoDataset,
    getDemoDatasetSnapshot,
    () => getDemoDatasetSnapshot(),
  );

  function mutate(updater: (current: DemoDataset) => DemoDataset) {
    saveDemoDataset(updater(getDemoDatasetSnapshot()));
  }

  return { dataset, mutate };
}
