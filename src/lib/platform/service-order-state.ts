export const SERVICE_ORDER_STATUSES = [
  "issued",
  "scheduled",
  "in_progress",
  "completed",
  "cancelled",
] as const;

export type ServiceOrderStatusValue = (typeof SERVICE_ORDER_STATUSES)[number];

export function isServiceOrderStatus(
  value: string,
): value is ServiceOrderStatusValue {
  return (SERVICE_ORDER_STATUSES as readonly string[]).includes(value);
}

/** Transições suportadas nesta sprint. Agenda/execução ficam para gates posteriores. */
const SUPPORTED: Record<
  ServiceOrderStatusValue,
  readonly ServiceOrderStatusValue[]
> = {
  issued: ["cancelled"],
  scheduled: [],
  in_progress: [],
  completed: [],
  cancelled: [],
};

export function canTransitionServiceOrder(
  from: ServiceOrderStatusValue,
  to: ServiceOrderStatusValue,
): boolean {
  return SUPPORTED[from].includes(to);
}

export function canCancelServiceOrder(status: ServiceOrderStatusValue): boolean {
  return canTransitionServiceOrder(status, "cancelled");
}

export function isActiveServiceOrder(
  status: ServiceOrderStatusValue,
): boolean {
  return status !== "cancelled";
}
