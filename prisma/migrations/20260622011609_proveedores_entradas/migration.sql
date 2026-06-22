-- AlterTable
ALTER TABLE "MovimientoFarmaceutico" ADD COLUMN     "proveedorId" TEXT;

-- CreateTable
CREATE TABLE "Proveedor" (
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

    CONSTRAINT "Proveedor_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Proveedor_numeroDocumento_key" ON "Proveedor"("numeroDocumento");

-- CreateIndex
CREATE INDEX "Proveedor_nombre_idx" ON "Proveedor"("nombre");

-- AddForeignKey
ALTER TABLE "MovimientoFarmaceutico" ADD CONSTRAINT "MovimientoFarmaceutico_proveedorId_fkey" FOREIGN KEY ("proveedorId") REFERENCES "Proveedor"("id") ON DELETE SET NULL ON UPDATE CASCADE;
