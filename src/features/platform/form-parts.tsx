import Link from "next/link";
import { useId } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { buttonVariants } from "@/components/ui/button";
import { PROPOSAL_STATUS_LABELS } from "@/data/platform/labels";
import type { ProposalStatusValue } from "@/lib/platform/proposal-state";
import { cn } from "@/lib/utils";

export function TextField({
  label,
  name,
  defaultValue,
  type = "text",
  required = false,
  placeholder,
  hint,
  inputMode,
  maxLength,
}: {
  label: string;
  name: string;
  defaultValue?: string | null;
  type?: string;
  required?: boolean;
  placeholder?: string;
  hint?: string;
  inputMode?: "text" | "numeric" | "decimal" | "tel" | "email";
  maxLength?: number;
}) {
  const id = `${useId()}-${name}`;
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        name={name}
        type={type}
        defaultValue={defaultValue ?? ""}
        required={required}
        placeholder={placeholder}
        inputMode={inputMode}
        maxLength={maxLength}
      />
      {hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  );
}

export function TextAreaField({
  label,
  name,
  defaultValue,
  rows = 3,
  maxLength,
}: {
  label: string;
  name: string;
  defaultValue?: string | null;
  rows?: number;
  maxLength?: number;
}) {
  const id = `${useId()}-${name}`;
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <Textarea
        id={id}
        name={name}
        defaultValue={defaultValue ?? ""}
        rows={rows}
        maxLength={maxLength}
      />
    </div>
  );
}

export function FormError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <p role="alert" className="text-sm text-destructive">
      {message}
    </p>
  );
}

export function LinkButton({
  href,
  children,
  variant = "default",
  className,
}: {
  href: string;
  children: React.ReactNode;
  variant?: "default" | "outline" | "ghost" | "secondary";
  className?: string;
}) {
  return (
    <Link href={href} className={cn(buttonVariants({ variant }), className)}>
      {children}
    </Link>
  );
}

const STATUS_STYLES: Record<ProposalStatusValue, string> = {
  draft: "bg-muted text-foreground ring-1 ring-border",
  sent: "bg-teal/15 text-navy ring-1 ring-teal/40",
  accepted: "bg-navy text-primary-foreground",
  rejected: "bg-destructive/10 text-destructive",
  expired: "bg-muted text-muted-foreground ring-1 ring-border",
};

export function ProposalStatusBadge({
  status,
}: {
  status: ProposalStatusValue;
}) {
  return (
    <span
      className={cn(
        "inline-flex h-5 items-center rounded-full px-2 text-xs font-medium whitespace-nowrap",
        STATUS_STYLES[status],
      )}
    >
      {PROPOSAL_STATUS_LABELS[status]}
    </span>
  );
}

export function NoAccess({ what }: { what: string }) {
  return (
    <p className="rounded-xl border border-border bg-background p-4 text-sm">
      Você não tem permissão para {what}.
    </p>
  );
}

export function PageHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description?: string;
  actions?: React.ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold text-navy">{title}</h1>
        {description ? (
          <p className="text-sm text-muted-foreground">{description}</p>
        ) : null}
      </div>
      {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
    </div>
  );
}

/** Largura padrão das páginas desktop do /sistema. */
export function PlatformPage({
  children,
  width = "wide",
  className,
}: {
  children: React.ReactNode;
  width?: "wide" | "content" | "form";
  className?: string;
}) {
  const max =
    width === "wide" ? "max-w-6xl" : width === "content" ? "max-w-5xl" : "max-w-3xl";
  return (
    <section className={cn("mx-auto w-full space-y-6", max, className)}>
      {children}
    </section>
  );
}

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div
      role="status"
      className="flex flex-col items-start gap-3 rounded-xl border border-dashed border-border bg-background p-6"
    >
      <div className="space-y-1">
        <p className="font-medium text-navy">{title}</p>
        {description ? (
          <p className="text-sm text-muted-foreground">{description}</p>
        ) : null}
      </div>
      {action}
    </div>
  );
}

export function FutureCapabilityNotice({
  children = "Este recurso está planejado para sprints futuras e ainda não opera neste ambiente.",
}: {
  children?: React.ReactNode;
}) {
  return (
    <p
      role="note"
      className="rounded-xl border border-border bg-muted/40 px-3 py-2 text-xs text-muted-foreground"
    >
      {children}
    </p>
  );
}

export const PERMISSION_DOMAIN_LABELS: Record<string, string> = {
  dashboard: "Painel",
  customer: "Clientes",
  proposal: "Orçamentos",
  schedule: "Agenda (futuro)",
  service_order: "Ordens de serviço (futuro)",
  technical_report: "Relatórios técnicos (futuro)",
  certificate: "Certificados (futuro)",
  contract: "Contratos (futuro)",
  stock: "Estoque (futuro)",
  finance: "Financeiro (futuro)",
  employee: "Colaboradores (futuro)",
  vehicle: "Veículos (futuro)",
  tender: "Licitações (futuro)",
  document: "Documentos (futuro)",
  report: "Relatórios gerenciais (futuro)",
  user: "Usuários",
  role: "Perfis",
  audit: "Auditoria",
};

export const IMPLEMENTED_PERMISSION_PREFIXES = new Set([
  "dashboard",
  "customer",
  "proposal",
  "user",
  "role",
  "audit",
]);

export function permissionDomain(key: string): string {
  const [prefix] = key.split(".");
  return prefix || "outros";
}
