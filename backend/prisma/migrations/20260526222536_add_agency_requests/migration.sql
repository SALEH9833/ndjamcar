-- AlterTable
ALTER TABLE "agencies" ALTER COLUMN "updated_at" DROP DEFAULT;

-- CreateTable
CREATE TABLE "agency_requests" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "owner_name" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "whatsapp" TEXT,
    "email" TEXT,
    "city" TEXT,
    "address" TEXT,
    "vehicle_count" INTEGER NOT NULL DEFAULT 0,
    "description" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "admin_notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "agency_requests_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "agency_requests_status_idx" ON "agency_requests"("status");
