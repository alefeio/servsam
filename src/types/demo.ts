import type { Provenanced } from "@/types/provenance";

export type DemoCredentials = Provenanced<{
  email: string;
  password: string;
  roleLabel: string;
}>;

export type DemoSession = {
  email: string;
  roleLabel: string;
  signedInAt: string;
};

export type DashboardAlert = {
  id: string;
  title: string;
  detail: string;
};

export type UpcomingService = {
  id: string;
  clientAlias: string;
  serviceName: string;
  scheduledFor: string;
};

export type DashboardSnapshot = Provenanced<{
  periodLabel: string;
  billingMonth: number;
  openProposals: number;
  scheduledServices: number;
  documentsNearExpiry: number;
  upcomingServices: UpcomingService[];
  alerts: DashboardAlert[];
}>;

export type FunnelStage = {
  stage: string;
  label: string;
  count: number;
};

export type MonthlyRevenue = {
  month: string;
  label: string;
  amount: number;
};

export type CategorySales = {
  categoryId: string;
  categoryName: string;
  amount: number;
};

export type ProductivityRank = {
  technicianAlias: string;
  completedOrders: number;
};

export type DashboardMetrics = {
  periodKey: string;
  periodLabel: string;
  billingMonth: number;
  openProposals: number;
  conversionRate: number;
  scheduledServices: number;
  expiringContracts: number;
  delinquencyAmount: number;
  documentsNearExpiry: number;
  funnel: FunnelStage[];
  revenueByMonth: MonthlyRevenue[];
  salesByCategory: CategorySales[];
  upcomingServices: UpcomingService[];
  alerts: DashboardAlert[];
  productivityRanking: ProductivityRank[];
};

export type PlannedModule = {
  slug: string;
  href: string;
  name: string;
  objective: string;
  plannedSprint: number;
  navLabel: string;
};
