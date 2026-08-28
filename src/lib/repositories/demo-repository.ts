import { seedDemoDataset } from "@/data/demo/demo-dataset";
import { demoCredentials } from "@/data/demo/auth";
import { demoNavItems, plannedModules } from "@/data/demo/planned-modules";
import {
  buildDashboardMetrics,
  getAvailablePeriods,
  getDefaultPeriodKey,
} from "@/lib/demo/metrics";
import type { DemoDataset } from "@/types/demo-entities";
import type {
  DashboardMetrics,
  DemoCredentials,
  PlannedModule,
} from "@/types/demo";

export type DemoRepository = {
  getCredentials: () => DemoCredentials;
  getSeedDataset: () => DemoDataset;
  getAvailablePeriods: (dataset?: DemoDataset) => string[];
  getDefaultPeriodKey: (dataset?: DemoDataset) => string;
  getDashboardMetrics: (periodKey: string, dataset?: DemoDataset) => DashboardMetrics;
  getPlannedModules: () => PlannedModule[];
  getPlannedModuleByHref: (href: string) => PlannedModule | undefined;
  getNavItems: () => typeof demoNavItems;
};

export const demoRepository: DemoRepository = {
  getCredentials: () => demoCredentials,
  getSeedDataset: () => seedDemoDataset,
  getAvailablePeriods: (dataset = seedDemoDataset) => getAvailablePeriods(dataset),
  getDefaultPeriodKey: (dataset = seedDemoDataset) => getDefaultPeriodKey(dataset),
  getDashboardMetrics: (periodKey, dataset = seedDemoDataset) =>
    buildDashboardMetrics(dataset, periodKey),
  getPlannedModules: () => plannedModules,
  getPlannedModuleByHref: (href) =>
    plannedModules.find((module) => module.href === href),
  getNavItems: () => demoNavItems,
};
