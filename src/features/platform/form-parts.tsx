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
