-- Reemplaza el modelo de cargos fijos por el registro de recibos del Excel.
DROP TABLE IF EXISTS "receipt_voids" CASCADE;
DROP TABLE IF EXISTS "receipt_payments" CASCADE;
DROP TABLE IF EXISTS "receipt_lines" CASCADE;
DROP TABLE IF EXISTS "receipts" CASCADE;
DROP TABLE IF EXISTS "charges" CASCADE;
DROP TABLE IF EXISTS "fee_concepts" CASCADE;
DROP TABLE IF EXISTS "enrollments" CASCADE;
DROP TABLE IF EXISTS "students" CASCADE;
DROP TABLE IF EXISTS "representatives" CASCADE;
DROP TABLE IF EXISTS "parallels" CASCADE;
DROP TABLE IF EXISTS "grades" CASCADE;
DROP TABLE IF EXISTS "academic_years" CASCADE;
DROP TABLE IF EXISTS "receipt_sequences" CASCADE;
DROP TABLE IF EXISTS "users" CASCADE;
DROP TABLE IF EXISTS "institutions" CASCADE;
DROP TABLE IF EXISTS "payment_vouchers" CASCADE;
DROP TABLE IF EXISTS "audit_logs" CASCADE;
DROP TABLE IF EXISTS "fee_catalog" CASCADE;

DROP TYPE IF EXISTS "UserRole" CASCADE;
DROP TYPE IF EXISTS "BillingPeriod" CASCADE;
DROP TYPE IF EXISTS "ChargeStatus" CASCADE;
DROP TYPE IF EXISTS "PaymentMethod" CASCADE;
DROP TYPE IF EXISTS "ReceiptStatus" CASCADE;
DROP TYPE IF EXISTS "ConceptKind" CASCADE;
DROP TYPE IF EXISTS "StudentStatus" CASCADE;
DROP TYPE IF EXISTS "FeeCategory" CASCADE;
DROP TYPE IF EXISTS "CalendarMonth" CASCADE;
DROP TYPE IF EXISTS "VerificationStatus" CASCADE;
DROP TYPE IF EXISTS "Specialty" CASCADE;

-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'COLLECTOR');

-- CreateEnum
CREATE TYPE "StudentStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'GRADUATED', 'WITHDRAWN');

-- CreateEnum
CREATE TYPE "FeeCategory" AS ENUM ('PENSION', 'UNIFORM', 'BOOKS', 'SERVICES', 'ARREARS');

-- CreateEnum
CREATE TYPE "CalendarMonth" AS ENUM ('JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC');

-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('CASH', 'TRANSFER', 'DEPOSIT', 'CHECK');

-- CreateEnum
CREATE TYPE "ReceiptStatus" AS ENUM ('EMITTED', 'VOIDED');

-- CreateEnum
CREATE TYPE "VerificationStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "Specialty" AS ENUM ('EGB', 'MECANICA', 'INFORMATICA', 'ELECTRICIDAD', 'EBANISTERIA');

-- CreateTable
CREATE TABLE "institutions" (
    "id" TEXT NOT NULL DEFAULT 'default',
    "name" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "phone" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "institutions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" "UserRole" NOT NULL,
    "jobTitle" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "academic_years" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "startYear" INTEGER NOT NULL,
    "endYear" INTEGER NOT NULL,
    "startsOn" DATE NOT NULL,
    "endsOn" DATE NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "academic_years_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "grades" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "grades_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "students" (
    "id" UUID NOT NULL,
    "idCard" VARCHAR(10),
    "fullName" TEXT NOT NULL,
    "grade" TEXT NOT NULL,
    "section" TEXT,
    "specialty" "Specialty",
    "status" "StudentStatus" NOT NULL DEFAULT 'ACTIVE',
    "academicYearId" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "students_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fee_catalog" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "category" "FeeCategory" NOT NULL,
    "baseAmount" DECIMAL(12,2),
    "active" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 100,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "fee_catalog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "receipt_sequences" (
    "year" INTEGER NOT NULL,
    "lastNumber" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "receipt_sequences_pkey" PRIMARY KEY ("year")
);

-- CreateTable
CREATE TABLE "receipts" (
    "id" UUID NOT NULL,
    "receiptNumber" VARCHAR(40) NOT NULL,
    "issueDate" DATE NOT NULL,
    "studentId" UUID NOT NULL,
    "academicYearId" UUID NOT NULL,
    "feeCatalogId" UUID NOT NULL,
    "coveredMonth" "CalendarMonth" NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "paymentMethod" "PaymentMethod" NOT NULL,
    "referenceNumber" VARCHAR(40),
    "bankName" VARCHAR(80),
    "bankDate" DATE,
    "cashierId" UUID NOT NULL,
    "cashierName" TEXT NOT NULL,
    "cashierRole" TEXT NOT NULL,
    "notes" TEXT,
    "status" "ReceiptStatus" NOT NULL DEFAULT 'EMITTED',
    "voidReason" TEXT,
    "voidedAt" TIMESTAMP(3),
    "voidedById" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "receipts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payment_vouchers" (
    "id" UUID NOT NULL,
    "receiptId" UUID,
    "studentId" UUID NOT NULL,
    "storedName" TEXT NOT NULL,
    "originalName" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "bankName" TEXT NOT NULL,
    "referenceNumber" VARCHAR(40) NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "bankDate" DATE,
    "uploadDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "verificationStatus" "VerificationStatus" NOT NULL DEFAULT 'PENDING',
    "reviewNote" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "reviewedById" UUID,

    CONSTRAINT "payment_vouchers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" UUID NOT NULL,
    "actorId" UUID,
    "action" TEXT NOT NULL,
    "entity" TEXT NOT NULL,
    "entityId" TEXT,
    "detail" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_role_active_idx" ON "users"("role", "active");

-- CreateIndex
CREATE UNIQUE INDEX "academic_years_name_key" ON "academic_years"("name");

-- CreateIndex
CREATE UNIQUE INDEX "grades_name_key" ON "grades"("name");

-- CreateIndex
CREATE UNIQUE INDEX "students_idCard_key" ON "students"("idCard");

-- CreateIndex
CREATE INDEX "students_fullName_idx" ON "students"("fullName");

-- CreateIndex
CREATE INDEX "students_grade_section_idx" ON "students"("grade", "section");

-- CreateIndex
CREATE INDEX "students_status_idx" ON "students"("status");

-- CreateIndex
CREATE INDEX "students_academicYearId_idx" ON "students"("academicYearId");

-- CreateIndex
CREATE UNIQUE INDEX "fee_catalog_name_key" ON "fee_catalog"("name");

-- CreateIndex
CREATE INDEX "fee_catalog_category_active_idx" ON "fee_catalog"("category", "active");

-- CreateIndex
CREATE INDEX "receipts_issueDate_idx" ON "receipts"("issueDate");

-- CreateIndex
CREATE INDEX "receipts_receiptNumber_idx" ON "receipts"("receiptNumber");

-- CreateIndex
CREATE INDEX "receipts_cashierId_issueDate_idx" ON "receipts"("cashierId", "issueDate");

-- CreateIndex
CREATE INDEX "receipts_studentId_issueDate_idx" ON "receipts"("studentId", "issueDate");

-- CreateIndex
CREATE INDEX "receipts_academicYearId_coveredMonth_idx" ON "receipts"("academicYearId", "coveredMonth");

-- CreateIndex
CREATE INDEX "receipts_status_issueDate_idx" ON "receipts"("status", "issueDate");

-- CreateIndex
CREATE INDEX "receipts_paymentMethod_issueDate_idx" ON "receipts"("paymentMethod", "issueDate");

-- CreateIndex
CREATE UNIQUE INDEX "payment_vouchers_receiptId_key" ON "payment_vouchers"("receiptId");

-- CreateIndex
CREATE INDEX "payment_vouchers_verificationStatus_uploadDate_idx" ON "payment_vouchers"("verificationStatus", "uploadDate");

-- CreateIndex
CREATE INDEX "payment_vouchers_studentId_idx" ON "payment_vouchers"("studentId");

-- CreateIndex
CREATE INDEX "audit_logs_createdAt_idx" ON "audit_logs"("createdAt");

-- CreateIndex
CREATE INDEX "audit_logs_entity_entityId_idx" ON "audit_logs"("entity", "entityId");

-- AddForeignKey
ALTER TABLE "students" ADD CONSTRAINT "students_academicYearId_fkey" FOREIGN KEY ("academicYearId") REFERENCES "academic_years"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "receipts" ADD CONSTRAINT "receipts_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "students"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "receipts" ADD CONSTRAINT "receipts_academicYearId_fkey" FOREIGN KEY ("academicYearId") REFERENCES "academic_years"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "receipts" ADD CONSTRAINT "receipts_feeCatalogId_fkey" FOREIGN KEY ("feeCatalogId") REFERENCES "fee_catalog"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "receipts" ADD CONSTRAINT "receipts_cashierId_fkey" FOREIGN KEY ("cashierId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "receipts" ADD CONSTRAINT "receipts_voidedById_fkey" FOREIGN KEY ("voidedById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payment_vouchers" ADD CONSTRAINT "payment_vouchers_receiptId_fkey" FOREIGN KEY ("receiptId") REFERENCES "receipts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payment_vouchers" ADD CONSTRAINT "payment_vouchers_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "students"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payment_vouchers" ADD CONSTRAINT "payment_vouchers_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE UNIQUE INDEX "academic_years_one_active" ON "academic_years" ("active") WHERE "active";

ALTER TABLE "students" ADD CONSTRAINT "students_id_card_digits" CHECK ("idCard" IS NULL OR "idCard" ~ '^[0-9]{10}$');
ALTER TABLE "fee_catalog" ADD CONSTRAINT "fee_catalog_base_amount" CHECK ("baseAmount" IS NULL OR "baseAmount" > 0);
ALTER TABLE "receipts" ADD CONSTRAINT "receipts_amount_positive" CHECK ("amount" > 0);
ALTER TABLE "receipts" ADD CONSTRAINT "receipts_reference_rule" CHECK (
  ("paymentMethod" = 'CASH' AND "referenceNumber" IS NULL AND "bankDate" IS NULL)
  OR ("paymentMethod" <> 'CASH' AND "referenceNumber" IS NOT NULL AND char_length("referenceNumber") >= 4)
);
ALTER TABLE "receipts" ADD CONSTRAINT "receipts_void_rule" CHECK (
  ("status" = 'EMITTED' AND "voidReason" IS NULL AND "voidedAt" IS NULL AND "voidedById" IS NULL)
  OR ("status" = 'VOIDED' AND "voidReason" IS NOT NULL AND char_length("voidReason") >= 10 AND "voidedAt" IS NOT NULL AND "voidedById" IS NOT NULL)
);
ALTER TABLE "payment_vouchers" ADD CONSTRAINT "payment_vouchers_amount_positive" CHECK ("amount" > 0);

