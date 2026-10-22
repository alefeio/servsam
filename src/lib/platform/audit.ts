import { getPrisma } from "@/lib/db/prisma";
import type { Prisma } from "@/generated/prisma/client";

export const AUDIT_ACTIONS = [
  "LOGIN_SUCCESS",
  "LOGIN_FAILURE",
  "LOGOUT",
  "USER_CREATED",
  "USER_UPDATED",
  "USER_ACTIVATED",
  "USER_DISABLED",
  "ROLE_CREATED",
  "ROLE_UPDATED",
  "ROLE_ASSIGNED",
  "ROLE_REMOVED",
  "PERMISSION_GRANTED",
  "PERMISSION_REVOKED",
] as const;

export type AuditAction = (typeof AUDIT_ACTIONS)[number];

const SENSITIVE_KEYS = new Set([
  "password",
  "passwordhash",
  "hash",
  "token",
  "secret",
  "authorization",
  "cookie",
  "apikey",
  "api_key",
]);

export function sanitizeAuditMetadata(
  metadata: Record<string, unknown> | undefined,
): Record<string, unknown> | undefined {
  if (!metadata) return undefined;
  const clean: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(metadata)) {
    if (SENSITIVE_KEYS.has(key.toLowerCase())) continue;
    if (value && typeof value === "object" && !Array.isArray(value)) {
      clean[key] = sanitizeAuditMetadata(value as Record<string, unknown>) ?? {};
      continue;
    }
    clean[key] = value;
  }
  return clean;
}

export async function writeAudit(input: {
  organizationId: string;
  actorUserId?: string | null;
  action: AuditAction;
  entityType: string;
  entityId?: string | null;
  metadata?: Record<string, unknown>;
}): Promise<void> {
  await getPrisma().auditLog.create({
    data: {
      id: crypto.randomUUID(),
      organizationId: input.organizationId,
      actorUserId: input.actorUserId ?? null,
      action: input.action,
      entityType: input.entityType,
      entityId: input.entityId ?? null,
      metadata: sanitizeAuditMetadata(input.metadata) as Prisma.InputJsonValue | undefined,
    },
  });
}
