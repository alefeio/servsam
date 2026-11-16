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

export type DashboardActionPriority = "high" | "medium" | "guide";

export type DashboardNextAction = {
  id: string;
  title: string;
  detail: string;
  category: string;
  priority: DashboardActionPriority;
  href?: string;
  recordId?: string;
};

export type FormalizationOverviewItem = {
  id: string;
  proposalCode: string;
  clientAlias: string;
  status: "awaiting" | "received" | "schedule-ready";
  statusLabel: string;
  documentCode?: string;
  href: string;
};

export type RecurringVisitItem = {
  id: string;
  clientAlias: string;
  serviceName: string;
  nextVisitAt: string;
  statusLabel: string;
  vehicleLabel?: string;
  team?: string;
  href: string;
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
  servicesToday: number;
  servicesThisWeek: number;
  certificatesToIssue: number;
  expiringContracts: number;
  delinquencyAmount: number;
  documentsNearExpiry: number;
  funnel: FunnelStage[];
  revenueByMonth: MonthlyRevenue[];
  salesByCategory: CategorySales[];
  upcomingServices: UpcomingService[];
  alerts: DashboardAlert[];
  nextActions: DashboardNextAction[];
  formalizationOverview: FormalizationOverviewItem[];
  recurringVisits: RecurringVisitItem[];
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
