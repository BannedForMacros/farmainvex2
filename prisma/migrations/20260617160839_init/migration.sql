-- CreateEnum
CREATE TYPE "Rol" AS ENUM ('ADMIN', 'SUPERVISOR', 'FARMACEUTICO', 'OPERADOR');

-- CreateEnum
CREATE TYPE "TipoEstablecimiento" AS ENUM ('FARMACIA', 'BOTICA', 'CENTRO_DISTRIBUCION', 'CLINICA', 'ALMACEN_MEDICO');

-- CreateEnum
CREATE TYPE "EstadoLote" AS ENUM ('VIGENTE', 'PROXIMO_VENCER', 'VENCIDO', 'OBSERVADO', 'RETIRADO');

-- CreateEnum
CREATE TYPE "EstadoVencimiento" AS ENUM ('VIGENTE', 'PREVENTIVA', 'CRITICO');

-- CreateEnum
CREATE TYPE "TipoMovimiento" AS ENUM ('ENTRADA', 'SALIDA', 'TRASLADO', 'AJUSTE', 'BAJA');

-- CreateEnum
CREATE TYPE "TipoAlerta" AS ENUM ('PROXIMO_VENCER', 'LOTE_OBSERVADO', 'RIESGO_ALMACENAMIENTO', 'INCIDENCIA_SANITARIA', 'PRODUCTO_VENCIDO');

-- CreateEnum
CREATE TYPE "Severidad" AS ENUM ('INFO', 'PREVENTIVA', 'CRITICA');

-- CreateEnum
CREATE TYPE "EstadoIncidencia" AS ENUM ('ABIERTA', 'EN_SEGUIMIENTO', 'EN_VALIDACION', 'RESUELTA', 'CERRADA');

-- CreateTable
CREATE TABLE "Usuario" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "rol" "Rol" NOT NULL DEFAULT 'OPERADOR',
    "establecimientoId" TEXT,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Usuario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Establecimiento" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "tipo" "TipoEstablecimiento" NOT NULL,
    "direccion" TEXT,

    CONSTRAINT "Establecimiento_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Medicamento" (
    "id" TEXT NOT NULL,
    "codigo" TEXT NOT NULL,
    "nombreComercial" TEXT NOT NULL,
    "laboratorio" TEXT NOT NULL,
    "principioActivo" TEXT,
    "presentacion" TEXT,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Medicamento_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Lote" (
    "id" TEXT NOT NULL,
    "codigo" TEXT NOT NULL,
    "numeroLote" TEXT NOT NULL,
    "medicamentoId" TEXT NOT NULL,
    "establecimientoId" TEXT,
    "fechaFabricacion" TIMESTAMP(3) NOT NULL,
    "fechaVencimiento" TIMESTAMP(3) NOT NULL,
    "cantidad" INTEGER NOT NULL DEFAULT 0,
    "estado" "EstadoLote" NOT NULL DEFAULT 'VIGENTE',
    "estadoVencimiento" "EstadoVencimiento" NOT NULL DEFAULT 'VIGENTE',
    "diasRestantes" INTEGER,
    "observado" BOOLEAN NOT NULL DEFAULT false,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Lote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MovimientoFarmaceutico" (
    "id" TEXT NOT NULL,
    "loteId" TEXT NOT NULL,
    "tipo" "TipoMovimiento" NOT NULL,
    "cantidad" INTEGER NOT NULL,
    "motivo" TEXT,
    "usuarioId" TEXT,
    "fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MovimientoFarmaceutico_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Alerta" (
    "id" TEXT NOT NULL,
    "tipo" "TipoAlerta" NOT NULL,
    "severidad" "Severidad" NOT NULL,
    "mensaje" TEXT NOT NULL,
    "loteId" TEXT,
    "leida" BOOLEAN NOT NULL DEFAULT false,
    "resuelta" BOOLEAN NOT NULL DEFAULT false,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Alerta_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Incidencia" (
    "id" TEXT NOT NULL,
    "codigo" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "descripcion" TEXT,
    "severidad" "Severidad" NOT NULL DEFAULT 'PREVENTIVA',
    "estado" "EstadoIncidencia" NOT NULL DEFAULT 'ABIERTA',
    "evidencias" TEXT[],
    "loteId" TEXT,
    "reportadoPorId" TEXT,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Incidencia_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ConfigRegla" (
    "clave" TEXT NOT NULL,
    "valor" TEXT NOT NULL,
    "descripcion" TEXT,

    CONSTRAINT "ConfigRegla_pkey" PRIMARY KEY ("clave")
);

-- CreateIndex
CREATE UNIQUE INDEX "Usuario_email_key" ON "Usuario"("email");

-- CreateIndex
CREATE INDEX "Usuario_rol_idx" ON "Usuario"("rol");

-- CreateIndex
CREATE UNIQUE INDEX "Medicamento_codigo_key" ON "Medicamento"("codigo");

-- CreateIndex
CREATE INDEX "Medicamento_laboratorio_idx" ON "Medicamento"("laboratorio");

-- CreateIndex
CREATE UNIQUE INDEX "Lote_codigo_key" ON "Lote"("codigo");

-- CreateIndex
CREATE INDEX "Lote_estadoVencimiento_idx" ON "Lote"("estadoVencimiento");

-- CreateIndex
CREATE INDEX "Lote_fechaVencimiento_idx" ON "Lote"("fechaVencimiento");

-- CreateIndex
CREATE INDEX "Lote_medicamentoId_idx" ON "Lote"("medicamentoId");

-- CreateIndex
CREATE INDEX "MovimientoFarmaceutico_loteId_fecha_idx" ON "MovimientoFarmaceutico"("loteId", "fecha");

-- CreateIndex
CREATE INDEX "Alerta_leida_resuelta_idx" ON "Alerta"("leida", "resuelta");

-- CreateIndex
CREATE UNIQUE INDEX "Incidencia_codigo_key" ON "Incidencia"("codigo");

-- CreateIndex
CREATE INDEX "Incidencia_estado_severidad_idx" ON "Incidencia"("estado", "severidad");

-- AddForeignKey
ALTER TABLE "Usuario" ADD CONSTRAINT "Usuario_establecimientoId_fkey" FOREIGN KEY ("establecimientoId") REFERENCES "Establecimiento"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Lote" ADD CONSTRAINT "Lote_medicamentoId_fkey" FOREIGN KEY ("medicamentoId") REFERENCES "Medicamento"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Lote" ADD CONSTRAINT "Lote_establecimientoId_fkey" FOREIGN KEY ("establecimientoId") REFERENCES "Establecimiento"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MovimientoFarmaceutico" ADD CONSTRAINT "MovimientoFarmaceutico_loteId_fkey" FOREIGN KEY ("loteId") REFERENCES "Lote"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MovimientoFarmaceutico" ADD CONSTRAINT "MovimientoFarmaceutico_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Alerta" ADD CONSTRAINT "Alerta_loteId_fkey" FOREIGN KEY ("loteId") REFERENCES "Lote"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Incidencia" ADD CONSTRAINT "Incidencia_loteId_fkey" FOREIGN KEY ("loteId") REFERENCES "Lote"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Incidencia" ADD CONSTRAINT "Incidencia_reportadoPorId_fkey" FOREIGN KEY ("reportadoPorId") REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;
