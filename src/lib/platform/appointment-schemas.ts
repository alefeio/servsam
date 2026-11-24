import { z } from "zod";
import { optionalText } from "@/lib/platform/customer-schemas";

const datetimeLocal = z
  .string()
  .trim()
  .regex(
    /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/,
    "Informe data e horário válidos.",
  );

export const createAppointmentSchema = z.object({
  serviceOrderId: z.string().trim().min(1, "Informe a ordem de serviço."),
  startsAtLocal: datetimeLocal,
  endsAtLocal: datetimeLocal,
  employeeId: z
    .string()
    .trim()
    .optional()
    .transform((value) => (value ? value : undefined)),
  notes: optionalText(2000),
  acceptConflict: z.boolean().optional(),
});

export const rescheduleAppointmentSchema = z.object({
  appointmentId: z.string().trim().min(1, "Informe o agendamento."),
  startsAtLocal: datetimeLocal,
  endsAtLocal: datetimeLocal,
  employeeId: z
    .string()
    .trim()
    .optional()
    .transform((value) => (value ? value : undefined)),
  reason: z
    .string()
    .trim()
    .min(3, "Informe o motivo da remarcação.")
    .max(500),
  notes: optionalText(2000),
  acceptConflict: z.boolean().optional(),
});

export const cancelAppointmentSchema = z.object({
  appointmentId: z.string().trim().min(1, "Informe o agendamento."),
  reason: z
    .string()
    .trim()
    .min(3, "Informe o motivo do cancelamento.")
    .max(500),
});

export type CreateAppointmentInput = z.input<typeof createAppointmentSchema>;
export type RescheduleAppointmentInput = z.input<
  typeof rescheduleAppointmentSchema
>;
export type CancelAppointmentInput = z.input<typeof cancelAppointmentSchema>;
