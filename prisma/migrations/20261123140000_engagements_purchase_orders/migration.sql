-- Sprint 11B.1 — Contratação real e O.C. recebida (incremental, não destrutivo).

-- CreateEnum
CREATE TYPE "ReceivedPurchaseOrderStatus" AS ENUM ('registered', 'contracted', 'cancelled');

-- CreateEnum
CREATE TYPE "EngagementOrigin" AS ENUM ('proposal', 'purchase_order');

-- CreateEnum
CREATE TYPE "EngagementStatus" AS ENUM ('active', 'cancelled');

-- CreateTable
CREATE TABLE "received_purchase_order" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "customerUnitId" TEXT,
    "externalNumber" TEXT NOT NULL,
    "receivedAt" TIMESTAMP(3) NOT NULL,
    "description" TEXT NOT NULL,
    "observations" TEXT,
    "agreedAmountCents" INTEGER NOT NULL DEFAULT 0,
    "documentReference" TEXT,
    "status" "ReceivedPurchaseOrderStatus" NOT NULL DEFAULT 'registered',
    "createdById" TEXT,
    "updatedById" TEXT,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "received_purchase_order_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "received_purchase_order_item" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "purchaseOrderId" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "description" TEXT NOT NULL,
    "quantity" DECIMAL(12,3) NOT NULL,
    "unitPriceCents" INTEGER NOT NULL,
    "totalCents" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "received_purchase_order_item_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "engagement" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "customerUnitId" TEXT,
    "origin" "EngagementOrigin" NOT NULL,
    "proposalId" TEXT,
    "purchaseOrderId" TEXT,
    "title" TEXT NOT NULL,
    "status" "EngagementStatus" NOT NULL DEFAULT 'active',
    "totalCents" INTEGER NOT NULL DEFAULT 0,
    "notes" TEXT,
    "createdById" TEXT,
    "updatedById" TEXT,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "engagement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "engagement_item" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "engagementId" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "description" TEXT NOT NULL,
    "quantity" DECIMAL(12,3) NOT NULL,
    "unitPriceCents" INTEGER NOT NULL,
    "totalCents" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "engagement_item_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "received_purchase_order_organizationId_code_key" ON "received_purchase_order"("organizationId", "code");

-- CreateIndex
CREATE INDEX "received_purchase_order_organizationId_status_deletedAt_idx" ON "received_purchase_order"("organizationId", "status", "deletedAt");

-- CreateIndex
CREATE INDEX "received_purchase_order_organizationId_customerId_idx" ON "received_purchase_order"("organizationId", "customerId");

-- CreateIndex
CREATE UNIQUE INDEX "received_purchase_order_active_external_unique"
ON "received_purchase_order" ("organizationId", "customerId", "externalNumber")
WHERE "deletedAt" IS NULL;

-- CreateIndex
CREATE INDEX "received_purchase_order_item_organizationId_purchaseOrderId_idx" ON "received_purchase_order_item"("organizationId", "purchaseOrderId");

-- CreateIndex
CREATE UNIQUE INDEX "engagement_organizationId_code_key" ON "engagement"("organizationId", "code");

-- CreateIndex
CREATE UNIQUE INDEX "engagement_proposalId_key" ON "engagement"("proposalId");

-- CreateIndex
CREATE UNIQUE INDEX "engagement_purchaseOrderId_key" ON "engagement"("purchaseOrderId");

-- CreateIndex
CREATE INDEX "engagement_organizationId_status_deletedAt_idx" ON "engagement"("organizationId", "status", "deletedAt");

-- CreateIndex
CREATE INDEX "engagement_organizationId_customerId_idx" ON "engagement"("organizationId", "customerId");

-- CreateIndex
CREATE INDEX "engagement_item_organizationId_engagementId_idx" ON "engagement_item"("organizationId", "engagementId");

-- AddForeignKey
ALTER TABLE "received_purchase_order" ADD CONSTRAINT "received_purchase_order_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "received_purchase_order" ADD CONSTRAINT "received_purchase_order_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "received_purchase_order" ADD CONSTRAINT "received_purchase_order_customerUnitId_fkey" FOREIGN KEY ("customerUnitId") REFERENCES "customer_unit"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "received_purchase_order_item" ADD CONSTRAINT "received_purchase_order_item_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "received_purchase_order_item" ADD CONSTRAINT "received_purchase_order_item_purchaseOrderId_fkey" FOREIGN KEY ("purchaseOrderId") REFERENCES "received_purchase_order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "engagement" ADD CONSTRAINT "engagement_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "engagement" ADD CONSTRAINT "engagement_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "engagement" ADD CONSTRAINT "engagement_customerUnitId_fkey" FOREIGN KEY ("customerUnitId") REFERENCES "customer_unit"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "engagement" ADD CONSTRAINT "engagement_proposalId_fkey" FOREIGN KEY ("proposalId") REFERENCES "proposal"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "engagement" ADD CONSTRAINT "engagement_purchaseOrderId_fkey" FOREIGN KEY ("purchaseOrderId") REFERENCES "received_purchase_order"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "engagement_item" ADD CONSTRAINT "engagement_item_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "engagement_item" ADD CONSTRAINT "engagement_item_engagementId_fkey" FOREIGN KEY ("engagementId") REFERENCES "engagement"("id") ON DELETE CASCADE ON UPDATE CASCADE;
