import { z } from "zod";
import { detectBrDocument, digitsOnly } from "@/lib/platform/br-document";

export function optionalText(max: number) {
  return z
    .string()
    .trim()
    .max(max, `Use até ${max} caracteres.`)
    .optional()
    .transform((value) => (value ? value : undefined));
}

const UF_CODES = [
  "AC",
  "AL",
  "AP",
  "AM",
  "BA",
  "CE",
  "DF",
  "ES",
  "GO",
  "MA",
  "MT",
  "MS",
  "MG",
  "PA",
  "PB",
  "PR",
  "PE",
  "PI",
  "RJ",
  "RN",
  "RS",
  "RO",
  "RR",
  "SC",
  "SP",
  "SE",
  "TO",
] as const;

export const customerInputSchema = z.object({
  legalName: z
    .string()
    .trim()
    .min(2, "Informe o nome ou razão social.")
    .max(160),
  tradeName: optionalText(160),
  document: z
    .string()
    .trim()
    .optional()
    .transform((value) => (value ? digitsOnly(value) : undefined))
    .refine(
      (value) => value === undefined || detectBrDocument(value) !== null,
      {
        message: "CPF ou CNPJ inválido.",
      },
    ),
  segment: optionalText(80),
  notes: optionalText(2000),
});

export type CustomerInput = z.input<typeof customerInputSchema>;

export const contactInputSchema = z.object({
  name: z.string().trim().min(2, "Informe o nome do contato.").max(120),
  roleTitle: optionalText(80),
  email: z
    .string()
    .trim()
    .max(180)
    .optional()
    .transform((value) => (value ? value.toLowerCase() : undefined))
    .refine(
      (value) => value === undefined || z.email().safeParse(value).success,
      {
        message: "E-mail inválido.",
      },
    ),
  phone: z
    .string()
    .trim()
    .optional()
    .transform((value) => (value ? digitsOnly(value) : undefined))
    .refine(
      (value) =>
        value === undefined || (value.length >= 10 && value.length <= 13),
      {
        message: "Telefone inválido. Informe DDD e número.",
      },
    ),
  isPrimary: z.boolean().default(false),
});

export type ContactInput = z.input<typeof contactInputSchema>;

export const unitInputSchema = z.object({
  name: z.string().trim().min(2, "Informe o nome da unidade.").max(120),
  addressLine: optionalText(200),
  city: optionalText(80),
  state: z
    .string()
    .trim()
    .toUpperCase()
    .optional()
    .transform((value) => (value ? value : undefined))
    .refine(
      (value) =>
        value === undefined || (UF_CODES as readonly string[]).includes(value),
      {
        message: "UF inválida.",
      },
    ),
  postalCode: z
    .string()
    .trim()
    .optional()
    .transform((value) => (value ? digitsOnly(value) : undefined))
    .refine((value) => value === undefined || value.length === 8, {
      message: "CEP inválido.",
    }),
  notes: optionalText(1000),
});

export type UnitInput = z.input<typeof unitInputSchema>;
