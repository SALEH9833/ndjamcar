-- AlterTable: remove agency_id and role from admin_users
ALTER TABLE "admin_users" DROP COLUMN IF EXISTS "agency_id";
ALTER TABLE "admin_users" DROP COLUMN IF EXISTS "role";

-- AlterTable: remove agency_id from vehicles
ALTER TABLE "vehicles" DROP CONSTRAINT IF EXISTS "vehicles_agency_id_fkey";
DROP INDEX IF EXISTS "vehicles_agency_id_idx";
ALTER TABLE "vehicles" DROP COLUMN IF EXISTS "agency_id";

-- AlterTable: remove agency_id from reservations
ALTER TABLE "reservations" DROP CONSTRAINT IF EXISTS "reservations_agency_id_fkey";
DROP INDEX IF EXISTS "reservations_agency_id_idx";
ALTER TABLE "reservations" DROP COLUMN IF EXISTS "agency_id";

-- AlterTable: remove agency_id from vehicle_tracking
ALTER TABLE "vehicle_tracking" DROP CONSTRAINT IF EXISTS "vehicle_tracking_agency_id_fkey";
DROP INDEX IF EXISTS "vehicle_tracking_agency_id_idx";
ALTER TABLE "vehicle_tracking" DROP COLUMN IF EXISTS "agency_id";

-- AlterTable: remove agency_id from geofences
ALTER TABLE "geofences" DROP CONSTRAINT IF EXISTS "geofences_agency_id_fkey";
DROP INDEX IF EXISTS "geofences_agency_id_idx";
ALTER TABLE "geofences" DROP COLUMN IF EXISTS "agency_id";

-- AlterTable: remove agency_id from geofence_alerts
ALTER TABLE "geofence_alerts" DROP CONSTRAINT IF EXISTS "geofence_alerts_agency_id_fkey";
DROP INDEX IF EXISTS "geofence_alerts_agency_id_idx";
ALTER TABLE "geofence_alerts" DROP COLUMN IF EXISTS "agency_id";

-- AlterTable: remove agency_id from contact_messages
ALTER TABLE "contact_messages" DROP CONSTRAINT IF EXISTS "contact_messages_agency_id_fkey";
DROP INDEX IF EXISTS "contact_messages_agency_id_idx";
ALTER TABLE "contact_messages" DROP COLUMN IF EXISTS "agency_id";

-- DropTable: agencies
DROP TABLE IF EXISTS "agencies";

-- DropTable: agency_requests
DROP TABLE IF EXISTS "agency_requests";
