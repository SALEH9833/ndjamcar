-- CreateTable
CREATE TABLE "geofences" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "points" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "geofences_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "geofence_alerts" (
    "id" SERIAL NOT NULL,
    "vehicle_id" INTEGER NOT NULL,
    "geofence_id" INTEGER NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'EXIT',
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "is_read" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "geofence_alerts_pkey" PRIMARY KEY ("id")
);
