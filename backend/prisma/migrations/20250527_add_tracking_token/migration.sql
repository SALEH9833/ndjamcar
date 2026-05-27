-- AlterTable
ALTER TABLE "vehicle_tracking" ADD COLUMN     "tracking_token" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "vehicle_tracking_tracking_token_key" ON "vehicle_tracking"("tracking_token");
