import { z } from "zod";
import { optionalText } from "@/lib/platform/customer-schemas";

export const createServiceOrderSchema = z.object({
  engagementId: z.string().min(1, "Informe a contratação."),
  engagementItemId: z.string().min(1, "Informe o serviço contratado."),
  scopeNotes: optionalText(2000),
  observations: optionalText(2000),
});

export type CreateServiceOrderInput = z.input<typeof createServiceOrderSchema>;

export const cancelServiceOrderSchema = z.object({
  serviceOrderId: z.string().min(1, "Informe a ordem de serviço."),
  reason: optionalText(500),
});

export type CancelServiceOrderInput = z.input<typeof cancelServiceOrderSchema>;
