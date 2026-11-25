-- Sprint 11B.4 FIN-F0 — Solicitações fiscais comerciais e recebimentos confirmáveis.
-- Aditivo. NÃO aplicar ao HOMOL sem preflight + autorização explícita.
-- Não emite NF-e nem integra banco/gateway.

-- CreateEnum
CREATE TYPE "BillingRequestStatus" AS ENUM ('requested', 'under_review', 'processed', 'cancelled');

-- CreateEnum
CREATE TYPE "BillingRequestType" AS ENUM ('invoice_provision');

-- CreateEnum
CREATE TYPE "ReceiptKind" AS ENUM ('signal', 'installment', 'other');

-- CreateEnum
CREATE TYPE "ReceiptStatus" AS ENUM ('pending', 'confirmed', 'rejected', 'cancelled', 'reversed');

-- CreateEnum
CREATE TYPE "ReceiptPaymentMethod" AS ENUM ('pix', 'transfer', 'cash', 'check', 'card', 'other');

-- CreateTable
CREATE TABLE "billing_request" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "engagementId" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "requestType" "BillingRequestType" NOT NULL DEFAULT 'invoice_provision',
    "description" TEXT NOT NULL,
    "notes" TEXT,
    "referenceAmountCents" INTEGER,
    "status" "BillingRequestStatus" NOT NULL DEFAULT 'requested',
    "invoiceIssuedExternally" BOOLEAN NOT NULL DEFAULT false,
    "externalDocumentRef" TEXT,
    "requestedById" TEXT,
    "requestedAt" TIMESTAMP(3) NOT NULL,
    "processedById" TEXT,
    "processedAt" TIMESTAMP(3),
    "cancelledById" TEXT,
    "cancelledAt" TIMESTAMP(3),
    "cancellationReason" TEXT,
    "idempotencyKey" TEXT,
    "createdById" TEXT,
    "updatedById" TEXT,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "billing_request_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "receipt_entry" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "engagementId" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "kind" "ReceiptKind" NOT NULL,
    "amountCents" INTEGER NOT NULL,
    "referenceDate" TIMESTAMP(3) NOT NULL,
    "status" "ReceiptStatus" NOT NULL DEFAULT 'pending',
    "paymentMethod" "ReceiptPaymentMethod",
    "proofReference" TEXT,
    "notes" TEXT,
    "requestedById" TEXT,
    "requestedAt" TIMESTAMP(3) NOT NULL,
    "confirmedById" TEXT,
    "confirmedAt" TIMESTAMP(3),
    "confirmedManually" BOOLEAN NOT NULL DEFAULT false,
    "rejectedById" TEXT,
    "rejectedAt" TIMESTAMP(3),
    "rejectionReason" TEXT,
    "cancelledById" TEXT,
    "cancelledAt" TIMESTAMP(3),
    "cancellationReason" TEXT,
    "reversedById" TEXT,
    "reversedAt" TIMESTAMP(3),
    "reversalReason" TEXT,
    "idempotencyKey" TEXT,
    "createdById" TEXT,
    "updatedById" TEXT,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "receipt_entry_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "billing_request_organizationId_status_deletedAt_idx" ON "billing_request"("organizationId", "status", "deletedAt");

-- CreateIndex
CREATE INDEX "billing_request_organizationId_engagementId_idx" ON "billing_request"("organizationId", "engagementId");

-- CreateIndex
CREATE INDEX "billing_request_organizationId_customerId_idx" ON "billing_request"("organizationId", "customerId");

-- CreateIndex
CREATE UNIQUE INDEX "billing_request_org_idempotency_unique"
ON "billing_request" ("organizationId", "idempotencyKey")
WHERE "idempotencyKey" IS NOT NULL AND "deletedAt" IS NULL;

-- CreateIndex
CREATE INDEX "receipt_entry_organizationId_status_deletedAt_idx" ON "receipt_entry"("organizationId", "status", "deletedAt");

-- CreateIndex
CREATE INDEX "receipt_entry_organizationId_engagementId_status_idx" ON "receipt_entry"("organizationId", "engagementId", "status");

-- CreateIndex
CREATE INDEX "receipt_entry_organizationId_customerId_idx" ON "receipt_entry"("organizationId", "customerId");

-- CreateIndex
CREATE INDEX "receipt_entry_organizationId_referenceDate_idx" ON "receipt_entry"("organizationId", "referenceDate");

-- CreateIndex
CREATE UNIQUE INDEX "receipt_entry_org_idempotency_unique"
ON "receipt_entry" ("organizationId", "idempotencyKey")
WHERE "idempotencyKey" IS NOT NULL AND "deletedAt" IS NULL;

-- AddForeignKey
ALTER TABLE "billing_request" ADD CONSTRAINT "billing_request_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "billing_request" ADD CONSTRAINT "billing_request_engagementId_fkey" FOREIGN KEY ("engagementId") REFERENCES "engagement"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "billing_request" ADD CONSTRAINT "billing_request_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "receipt_entry" ADD CONSTRAINT "receipt_entry_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "receipt_entry" ADD CONSTRAINT "receipt_entry_engagementId_fkey" FOREIGN KEY ("engagementId") REFERENCES "engagement"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "receipt_entry" ADD CONSTRAINT "receipt_entry_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
