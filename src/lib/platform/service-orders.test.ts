import { describe, expect, it } from "vitest";
import {
  e2eHostHash,
  e2eWriteDatabaseGuard,
} from "@/lib/db/e2e-write-guard";

import { seedGrantsFor } from "@/lib/platform/permissions";
import { createServiceOrderSchema } from "@/lib/platform/service-order-schemas";
import {
  canCancelServiceOrder,
  canTransitionServiceOrder,
} from "@/lib/platform/service-order-state";
import { formatServiceOrderCode } from "@/lib/platform/service-orders";

describe("máquina de estados da OS (11B.2)", () => {
  it("permite apenas cancelar a partir de emitida nesta sprint", () => {
    expect(canTransitionServiceOrder("issued", "cancelled")).toBe(true);
    expect(canCancelServiceOrder("issued")).toBe(true);
    expect(canTransitionServiceOrder("issued", "completed")).toBe(false);
    expect(canTransitionServiceOrder("issued", "scheduled")).toBe(false);
    expect(canTransitionServiceOrder("cancelled", "issued")).toBe(false);
  });
});

describe("numeração e schema de OS", () => {
  it("formata OS-AAAA-NNNN", () => {
    expect(formatServiceOrderCode(2026, 1)).toBe("OS-2026-0001");
    expect(formatServiceOrderCode(2026, 42)).toBe("OS-2026-0042");
  });

  it("exige contratação e item", () => {
    expect(
      createServiceOrderSchema.safeParse({
        engagementId: "e1",
        engagementItemId: "i1",
      }).success,
    ).toBe(true);
    expect(
      createServiceOrderSchema.safeParse({ engagementId: "" }).success,
    ).toBe(false);
  });
});

describe("permissões e isolamento E2E", () => {
  it("Administrativo tem view/create/update de OS", () => {
    const granted = new Set(
      seedGrantsFor("ADMINISTRATIVO").map((grant) => grant.key),
    );
    expect(granted.has("service_order.view")).toBe(true);
    expect(granted.has("service_order.create")).toBe(true);
    expect(granted.has("service_order.update")).toBe(true);
  });

  it("bloqueia E2E de escrita no HOMOL compartilhado (preview)", () => {
    expect(
      e2eWriteDatabaseGuard({
        DATABASE_ENV: "preview",
        HOMOL_POSTGRES_URL: "postgresql://u:p@db.prisma.io:5432/postgres",
      }).allowed,
    ).toBe(false);
    expect(
      e2eWriteDatabaseGuard({
        DATABASE_ENV: "test",
      }).allowed,
    ).toBe(false);
  });

  it("aceita env de teste apenas com fingerprint isolado explícito", () => {
    const isolated = "postgresql://u:p@127.0.0.1:55432/servsam_e2e";
    expect(
      e2eWriteDatabaseGuard({
        DATABASE_ENV: "test",
        E2E_ISOLATED_DATABASE_URL: isolated,
        E2E_ISOLATED_INSTANCE_ID: "abc123def456",
        E2E_APPROVED_INSTANCE_ID: "abc123def456",
        RUNTIME_DATABASE_URL: isolated,
        POSTGRES_URL: isolated,
        HOMOL_SHARED_HOST_HASH: "22e5c2dd2d93",
      }).allowed,
    ).toBe(true);
    const sharedLookalike = "postgresql://u:p@shared-homol.example:5432/postgres";
    const sharedHash = e2eHostHash(sharedLookalike);
    expect(
      e2eWriteDatabaseGuard({
        DATABASE_ENV: "test",
        E2E_ISOLATED_DATABASE_URL: sharedLookalike,
        E2E_ISOLATED_INSTANCE_ID: "abc123def456",
        E2E_APPROVED_INSTANCE_ID: "abc123def456",
        HOMOL_SHARED_HOST_HASH: sharedHash,
      }).allowed,
    ).toBe(false);
  });
});


