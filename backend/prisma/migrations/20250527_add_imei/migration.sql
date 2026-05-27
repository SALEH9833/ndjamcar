ALTER TABLE "vehicle_tracking" ADD COLUMN "imei" TEXT;
CREATE UNIQUE INDEX "vehicle_tracking_imei_key" ON "vehicle_tracking"("imei");
