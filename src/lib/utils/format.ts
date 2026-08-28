import type { ContactFormValues } from "@/lib/content/schemas";

export function buildWhatsAppUrl(
  phoneE164: string,
  values: Pick<
    ContactFormValues,
    "name" | "company" | "city" | "serviceType" | "message"
  >,
): string {
  const text = [
    "Olá, SERVSAM. Gostaria de solicitar um orçamento.",
    `Nome: ${values.name}`,
    `Empresa/condomínio: ${values.company}`,
    `Cidade: ${values.city}`,
    `Serviço: ${values.serviceType}`,
    `Mensagem: ${values.message}`,
  ].join("\n");

  return `https://wa.me/${phoneE164}?text=${encodeURIComponent(text)}`;
}

export function formatPhoneLink(e164: string): string {
  return `tel:+${e164}`;
}

export function formatCurrencyBrl(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 0,
  }).format(value);
}
