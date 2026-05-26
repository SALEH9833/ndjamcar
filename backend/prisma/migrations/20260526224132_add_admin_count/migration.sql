-- AlterTable
ALTER TABLE "agency_requests" ADD COLUMN     "admin_count" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "admin_names" TEXT;
