-- CreateTable agencies first
CREATE TABLE "agencies" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "phone" TEXT,
    "email" TEXT,
    "address" TEXT,
    "city" TEXT,
    "logo_url" TEXT,
    "whatsapp" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "agencies_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "agencies_slug_key" ON "agencies"("slug");

-- Insert default agency
INSERT INTO "agencies" ("name", "slug", "phone", "whatsapp", "city", "email", "updated_at")
VALUES ('NdjamCar', 'ndjamcar', '+23560935774', '+23560935774', 'N''Djamena', 'salehmhtsaleh224@gmail.com', CURRENT_TIMESTAMP);

-- AlterTable admin_users
ALTER TABLE "admin_users" ADD COLUMN "agency_id" INTEGER,
ADD COLUMN "role" TEXT NOT NULL DEFAULT 'AGENCY_ADMIN';

UPDATE "admin_users" SET "role" = 'SUPER_ADMIN';

-- AlterTable contact_messages
ALTER TABLE "contact_messages" ADD COLUMN "agency_id" INTEGER;

-- AlterTable vehicles (add nullable first, fill, then make NOT NULL)
ALTER TABLE "vehicles" ADD COLUMN "agency_id" INTEGER;
UPDATE "vehicles" SET "agency_id" = (SELECT id FROM "agencies" WHERE slug = 'ndjamcar');
ALTER TABLE "vehicles" ALTER COLUMN "agency_id" SET NOT NULL;

-- AlterTable reservations
ALTER TABLE "reservations" ADD COLUMN "agency_id" INTEGER;
UPDATE "reservations" SET "agency_id" = (SELECT id FROM "agencies" WHERE slug = 'ndjamcar');
ALTER TABLE "reservations" ALTER COLUMN "agency_id" SET NOT NULL;

-- AlterTable vehicle_tracking
ALTER TABLE "vehicle_tracking" ADD COLUMN "agency_id" INTEGER;
UPDATE "vehicle_tracking" SET "agency_id" = (SELECT id FROM "agencies" WHERE slug = 'ndjamcar');
ALTER TABLE "vehicle_tracking" ALTER COLUMN "agency_id" SET NOT NULL;

-- AlterTable geofences
ALTER TABLE "geofences" ADD COLUMN "agency_id" INTEGER;
UPDATE "geofences" SET "agency_id" = (SELECT id FROM "agencies" WHERE slug = 'ndjamcar');
ALTER TABLE "geofences" ALTER COLUMN "agency_id" SET NOT NULL;

-- AlterTable geofence_alerts
ALTER TABLE "geofence_alerts" ADD COLUMN "agency_id" INTEGER;
UPDATE "geofence_alerts" SET "agency_id" = (SELECT id FROM "agencies" WHERE slug = 'ndjamcar');
ALTER TABLE "geofence_alerts" ALTER COLUMN "agency_id" SET NOT NULL;

-- CreateIndexes
CREATE INDEX "admin_users_agency_id_idx" ON "admin_users"("agency_id");
CREATE INDEX "contact_messages_agency_id_idx" ON "contact_messages"("agency_id");
CREATE INDEX "geofence_alerts_agency_id_idx" ON "geofence_alerts"("agency_id");
CREATE INDEX "geofences_agency_id_idx" ON "geofences"("agency_id");
CREATE INDEX "reservations_agency_id_idx" ON "reservations"("agency_id");
CREATE INDEX "vehicle_tracking_agency_id_idx" ON "vehicle_tracking"("agency_id");
CREATE INDEX "vehicles_agency_id_idx" ON "vehicles"("agency_id");

-- AddForeignKeys
ALTER TABLE "admin_users" ADD CONSTRAINT "admin_users_agency_id_fkey" FOREIGN KEY ("agency_id") REFERENCES "agencies"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "vehicles" ADD CONSTRAINT "vehicles_agency_id_fkey" FOREIGN KEY ("agency_id") REFERENCES "agencies"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "reservations" ADD CONSTRAINT "reservations_agency_id_fkey" FOREIGN KEY ("agency_id") REFERENCES "agencies"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "vehicle_tracking" ADD CONSTRAINT "vehicle_tracking_agency_id_fkey" FOREIGN KEY ("agency_id") REFERENCES "agencies"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "geofences" ADD CONSTRAINT "geofences_agency_id_fkey" FOREIGN KEY ("agency_id") REFERENCES "agencies"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "geofence_alerts" ADD CONSTRAINT "geofence_alerts_agency_id_fkey" FOREIGN KEY ("agency_id") REFERENCES "agencies"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "contact_messages" ADD CONSTRAINT "contact_messages_agency_id_fkey" FOREIGN KEY ("agency_id") REFERENCES "agencies"("id") ON DELETE SET NULL ON UPDATE CASCADE;
