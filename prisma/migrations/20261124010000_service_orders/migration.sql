-- Sprint 11B.2 — Ordem de Serviço real (incremental, não destrutivo).
-- NÃO aplicar ao HOMOL compartilhado sem preflight + autorização explícita.

-- CreateEnum
CREATE TYPE "ServiceOrderStatus" AS ENUM ('issued', 'scheduled', 'in_progress', 'completed', 'cancelled');

-- CreateTable
CREATE TABLE "service_order" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "engagementId" TEXT NOT NULL,
    "engagementItemId" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "customerUnitId" TEXT,
    "description" TEXT NOT NULL,
    "scopeNotes" TEXT,
    "observations" TEXT,
    "quantity" DECIMAL(12,3) NOT NULL,
    "status" "ServiceOrderStatus" NOT NULL DEFAULT 'issued',
    "issuedAt" TIMESTAMP(3) NOT NULL,
    "issuedById" TEXT,
    "cancelledAt" TIMESTAMP(3),
    "cancelledById" TEXT,
    "cancellationReason" TEXT,
    "createdById" TEXT,
    "updatedById" TEXT,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "service_order_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "service_order_organizationId_code_key" ON "service_order"("organizationId", "code");

-- CreateIndex
CREATE INDEX "service_order_organizationId_status_deletedAt_idx" ON "service_order"("organizationId", "status", "deletedAt");

-- CreateIndex
CREATE INDEX "service_order_organizationId_engagementId_idx" ON "service_order"("organizationId", "engagementId");

-- CreateIndex
CREATE INDEX "service_order_organizationId_customerId_idx" ON "service_order"("organizationId", "customerId");

-- CreateIndex
CREATE INDEX "service_order_engagementItemId_idx" ON "service_order"("engagementItemId");

-- Uma OS ativa por item contratado (cancelada preserva histórico e libera reemissão explícita).
CREATE UNIQUE INDEX "service_order_active_engagement_item_unique"
ON "service_order" ("engagementItemId")
WHERE "status" <> 'cancelled' AND "deletedAt" IS NULL;

-- AddForeignKey
ALTER TABLE "service_order" ADD CONSTRAINT "service_order_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "service_order" ADD CONSTRAINT "service_order_engagementId_fkey" FOREIGN KEY ("engagementId") REFERENCES "engagement"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "service_order" ADD CONSTRAINT "service_order_engagementItemId_fkey" FOREIGN KEY ("engagementItemId") REFERENCES "engagement_item"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "service_order" ADD CONSTRAINT "service_order_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "service_order" ADD CONSTRAINT "service_order_customerUnitId_fkey" FOREIGN KEY ("customerUnitId") REFERENCES "customer_unit"("id") ON DELETE SET NULL ON UPDATE CASCADE;
