import { z } from "zod";
import { optionalText } from "@/lib/platform/customer-schemas";

export const employeeInputSchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(2, "Informe o nome completo.")
    .max(160),
  jobTitle: z
    .string()
    .trim()
    .min(2, "Informe a função ou cargo.")
    .max(120),
  phone: optionalText(40),
  email: z
    .string()
    .trim()
    .max(160)
    .optional()
    .transform((value) => (value ? value : undefined))
    .refine(
      (value) =>
        value === undefined ||
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value),
      { message: "E-mail profissional inválido." },
    ),
  notes: optionalText(2000),
  isActive: z.boolean().optional(),
});

export type EmployeeInput = z.input<typeof employeeInputSchema>;
