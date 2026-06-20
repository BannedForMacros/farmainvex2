-- CreateEnum
CREATE TYPE "TipoDocumento" AS ENUM ('RUC', 'DNI');

-- CreateEnum
CREATE TYPE "OrigenDatos" AS ENUM ('API', 'MANUAL');

-- AlterEnum
ALTER TYPE "TipoMovimiento" ADD VALUE 'VENTA';

-- AlterTable
ALTER TABLE "MovimientoFarmaceutico" ADD COLUMN     "clienteId" TEXT;

-- CreateTable
CREATE TABLE "Cliente" (
    "id" TEXT NOT NULL,
    "tipoDocumento" "TipoDocumento" NOT NULL,
    "numeroDocumento" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "direccion" TEXT,
    "estado" TEXT,
    "condicion" TEXT,
    "distrito" TEXT,
    "provincia" TEXT,
    "departamento" TEXT,
    "origenDatos" "OrigenDatos" NOT NULL DEFAULT 'MANUAL',
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Cliente_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Cliente_numeroDocumento_key" ON "Cliente"("numeroDocumento");

-- CreateIndex
CREATE INDEX "Cliente_nombre_idx" ON "Cliente"("nombre");

-- AddForeignKey
ALTER TABLE "MovimientoFarmaceutico" ADD CONSTRAINT "MovimientoFarmaceutico_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "Cliente"("id") ON DELETE SET NULL ON UPDATE CASCADE;
