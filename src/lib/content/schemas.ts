import { z } from "zod";
import { SOURCE_TYPES } from "@/types/provenance";

export const sourceTypeSchema = z.enum(SOURCE_TYPES);

export const contentProvenanceSchema = z.object({
  sourceType: sourceTypeSchema,
  sourceUrl: z.string().url().optional(),
  accessedAt: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  isFictional: z.boolean(),
  needsClientValidation: z.boolean(),
  notes: z.string().optional(),
});

export const serviceSchema = z.object({
  id: z.string().min(1),
  slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  name: z.string().min(3),
  categoryId: z.enum(["water-sanitation", "environmental-pest"]),
  summary: z.string().min(10),
  description: z.string().min(10),
  imageHint: z.string().min(8),
  provenance: contentProvenanceSchema,
});

export const contactFormSchema = z.object({
  name: z.string().trim().min(2, "Informe o nome completo.").max(120),
  company: z
    .string()
    .trim()
    .min(2, "Informe a empresa ou o condomínio.")
    .max(160),
  phone: z
    .string()
    .trim()
    .min(10, "Informe um telefone com DDD.")
    .max(20),
  email: z.email("Informe um e-mail válido."),
  serviceType: z.string().min(1, "Selecione o tipo de serviço."),
  city: z.string().trim().min(2, "Informe a cidade.").max(80),
  message: z
    .string()
    .trim()
    .min(10, "Descreva a necessidade em pelo menos 10 caracteres.")
    .max(2000),
  consent: z.literal(true, {
    error: "É necessário consentir com o uso demonstrativo dos dados.",
  }),
});

export type ContactFormValues = z.infer<typeof contactFormSchema>;
