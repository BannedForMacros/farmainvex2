/**
 * FarmaInvex — datos de demostración.
 * Ejecuta: npm run db:seed
 */
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";
import { evaluarLote, UMBRALES_POR_DEFECTO } from "../src/domain/vencimiento";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

function enDias(dias: number): Date {
  const d = new Date();
  d.setDate(d.getDate() + dias);
  return d;
}

async function main() {
  console.log("🌱 Sembrando datos de FarmaInvex…");

  // Limpieza idempotente
  await prisma.alerta.deleteMany();
  await prisma.incidencia.deleteMany();
  await prisma.movimientoFarmaceutico.deleteMany();
  await prisma.lote.deleteMany();
  await prisma.medicamento.deleteMany();
  await prisma.usuario.deleteMany();
  await prisma.establecimiento.deleteMany();
  await prisma.configRegla.deleteMany();

  // Umbrales configurables
  await prisma.configRegla.createMany({
    data: [
      { clave: "DIAS_ALERTA_PREVENTIVA", valor: "90", descripcion: "Días para alerta preventiva 🟡" },
      { clave: "DIAS_ALERTA_CRITICA", valor: "30", descripcion: "Días para riesgo crítico 🔴" },
    ],
  });

  // Establecimiento
  const central = await prisma.establecimiento.create({
    data: { nombre: "Farmacia Central FarmaInvex", tipo: "FARMACIA", direccion: "Av. Salud 123, Lima" },
  });

  // Usuarios (uno por rol) — contraseña común para la demo
  const passwordHash = await bcrypt.hash("farmainvex123", 10);
  await prisma.usuario.createMany({
    data: [
      { nombre: "Administrador", email: "admin@farmainvex.pe", passwordHash, rol: "ADMIN", establecimientoId: central.id },
      { nombre: "Supervisor Sanitario", email: "supervisor@farmainvex.pe", passwordHash, rol: "SUPERVISOR", establecimientoId: central.id },
      { nombre: "Químico Farmacéutico", email: "farmaceutico@farmainvex.pe", passwordHash, rol: "FARMACEUTICO", establecimientoId: central.id },
      { nombre: "Operador de Almacén", email: "operador@farmainvex.pe", passwordHash, rol: "OPERADOR", establecimientoId: central.id },
    ],
  });
  const farmaceutico = await prisma.usuario.findUnique({
    where: { email: "farmaceutico@farmainvex.pe" },
  });

  // Medicamentos
  const meds = await Promise.all(
    [
      { codigo: "MED-001", nombreComercial: "Paracetamol 500mg", laboratorio: "Genfar", principioActivo: "Paracetamol", presentacion: "Caja x 100 tab" },
      { codigo: "MED-002", nombreComercial: "Amoxicilina 500mg", laboratorio: "Medifarma", principioActivo: "Amoxicilina", presentacion: "Caja x 100 cap" },
      { codigo: "MED-003", nombreComercial: "Ibuprofeno 400mg", laboratorio: "Portugal", principioActivo: "Ibuprofeno", presentacion: "Caja x 50 tab" },
      { codigo: "MED-004", nombreComercial: "Omeprazol 20mg", laboratorio: "Farmindustria", principioActivo: "Omeprazol", presentacion: "Caja x 30 cap" },
    ].map((m) => prisma.medicamento.create({ data: m })),
  );

  // Lotes con vencimientos variados (vigente / preventivo / crítico / vencido)
  const definicionLotes = [
    { med: 0, numero: "L-AX22", dias: 400, cantidad: 320 }, // 🟢 vigente
    { med: 1, numero: "L-BX09", dias: 75, cantidad: 140 }, //  🟡 preventiva
    { med: 2, numero: "L-CX17", dias: 20, cantidad: 60 }, //   🔴 crítico
    { med: 3, numero: "L-DX01", dias: -5, cantidad: 25 }, //   🔴 vencido
    { med: 0, numero: "L-AX23", dias: 200, cantidad: 500 }, // 🟢 vigente
  ];

  let n = 1;
  for (const def of definicionLotes) {
    const fechaVencimiento = enDias(def.dias);
    const ev = evaluarLote(fechaVencimiento, UMBRALES_POR_DEFECTO);
    const lote = await prisma.lote.create({
      data: {
        codigo: `FI-LOT-${String(n++).padStart(4, "0")}`,
        numeroLote: def.numero,
        medicamentoId: meds[def.med].id,
        establecimientoId: central.id,
        fechaFabricacion: enDias(def.dias - 720),
        fechaVencimiento,
        cantidad: def.cantidad,
        diasRestantes: ev.dias,
        estadoVencimiento: ev.estado,
        estado: ev.vencido ? "VENCIDO" : ev.estado === "PREVENTIVA" || ev.estado === "CRITICO" ? "PROXIMO_VENCER" : "VIGENTE",
      },
    });

    // Movimiento de ENTRADA (ingreso del lote al inventario — trazabilidad).
    await prisma.movimientoFarmaceutico.create({
      data: {
        loteId: lote.id,
        tipo: "ENTRADA",
        cantidad: def.cantidad,
        motivo: "Registro inicial de lote en almacén",
        usuarioId: farmaceutico?.id,
      },
    });
  }

  console.log("✅ Listo. Usuarios demo (contraseña: farmainvex123):");
  console.log("   admin@farmainvex.pe · supervisor@farmainvex.pe · farmaceutico@farmainvex.pe · operador@farmainvex.pe");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
