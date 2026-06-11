/**
 * FarmaInvex — datos de demostración (realistas y abundantes).
 * Ejecuta: npm run db:seed
 */
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";
import { evaluarLote, UMBRALES_POR_DEFECTO } from "../src/domain/vencimiento";
import { consultarDocumento } from "../src/services/decolecta.service";

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
  await prisma.cliente.deleteMany();
  await prisma.proveedor.deleteMany();
  await prisma.lote.deleteMany();
  await prisma.medicamento.deleteMany();
  await prisma.usuario.deleteMany();
  await prisma.establecimiento.deleteMany();
  await prisma.configRegla.deleteMany();

  await prisma.configRegla.createMany({
    data: [
      { clave: "DIAS_ALERTA_PREVENTIVA", valor: "90", descripcion: "Días para alerta preventiva 🟡" },
      { clave: "DIAS_ALERTA_CRITICA", valor: "30", descripcion: "Días para riesgo crítico 🔴" },
    ],
  });

  // Establecimientos (los 5 tipos del Word)
  const ests = await Promise.all(
    [
      { nombre: "Farmacia Central FarmaInvex", tipo: "FARMACIA", direccion: "Av. Salud 123, Lima" },
      { nombre: "Botica Norte", tipo: "BOTICA", direccion: "Jr. Comercio 456, Trujillo" },
      { nombre: "Centro de Distribución Lima", tipo: "CENTRO_DISTRIBUCION", direccion: "Av. Industrial 900, Callao" },
      { nombre: "Clínica San Pablo", tipo: "CLINICA", direccion: "Av. El Polo 789, Surco" },
      { nombre: "Almacén Regional Sur", tipo: "ALMACEN_MEDICO", direccion: "Av. Ejército 321, Arequipa" },
    ].map((e) => prisma.establecimiento.create({ data: e as never })),
  );

  // Usuarios (uno por rol) — contraseña común para la demo
  const passwordHash = await bcrypt.hash("farmainvex123", 10);
  await prisma.usuario.createMany({
    data: [
      { nombre: "Administrador", email: "admin@farmainvex.pe", passwordHash, rol: "ADMIN", establecimientoId: ests[0].id },
      { nombre: "Supervisor Sanitario", email: "supervisor@farmainvex.pe", passwordHash, rol: "SUPERVISOR", establecimientoId: ests[0].id },
      { nombre: "Químico Farmacéutico", email: "farmaceutico@farmainvex.pe", passwordHash, rol: "FARMACEUTICO", establecimientoId: ests[0].id },
      { nombre: "Operador de Almacén", email: "operador@farmainvex.pe", passwordHash, rol: "OPERADOR", establecimientoId: ests[0].id },
    ],
  });
  const usuarios = await prisma.usuario.findMany();
  const byEmail = (e: string) => usuarios.find((u) => u.email === e);
  const farmaceutico = byEmail("farmaceutico@farmainvex.pe");
  const supervisor = byEmail("supervisor@farmainvex.pe");
  const operador = byEmail("operador@farmainvex.pe");
  const receptores = ["Químico Farmacéutico", "Supervisor Sanitario", "Operador de Almacén"];

  // Clientes y proveedores: datos REALES traídos de la API Decolecta (NO hardcodeados).
  // Solo se fijan los números de documento; nombre/dirección los provee la API.
  // Si un documento no se encuentra (o no hay token), cae a MANUAL con un nombre genérico.
  const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
  const datosDoc = async (tipo: "RUC" | "DNI", numero: string, fallback: string) => {
    await sleep(350); // evita el rate limit de la API (consultas secuenciales espaciadas)
    const r = await consultarDocumento(tipo, numero);
    if (r.ok) {
      const d = r.datos;
      return {
        tipoDocumento: tipo,
        numeroDocumento: numero,
        nombre: d.nombre,
        direccion: d.direccion ?? null,
        estado: d.estado ?? null,
        condicion: d.condicion ?? null,
        distrito: d.distrito ?? null,
        provincia: d.provincia ?? null,
        departamento: d.departamento ?? null,
        origenDatos: "API",
      };
    }
    return { tipoDocumento: tipo, numeroDocumento: numero, nombre: fallback, origenDatos: "MANUAL" };
  };

  const DOCS_CLIENTES: ["RUC" | "DNI", string, string][] = [
    ["DNI", "46027897", "Cliente persona 1"],
    ["DNI", "09342176", "Cliente persona 2"],
    ["RUC", "20517182673", "Cliente institucional"],
    ["RUC", "20100070970", "Cliente corporativo"],
  ];
  const clientes = [];
  for (const [t, n, f] of DOCS_CLIENTES) {
    clientes.push(await prisma.cliente.create({ data: (await datosDoc(t, n, f)) as never }));
  }

  const DOCS_PROVEEDORES: ["RUC" | "DNI", string, string][] = [
    ["RUC", "20601030013", "Proveedor 1"],
    ["RUC", "20100128056", "Proveedor 2"],
    ["RUC", "20100047218", "Proveedor 3"],
    ["RUC", "20418108151", "Proveedor 4"],
  ];
  const proveedores = [];
  for (const [t, n, f] of DOCS_PROVEEDORES) {
    proveedores.push(await prisma.proveedor.create({ data: (await datosDoc(t, n, f)) as never }));
  }

  // Medicamentos
  const MEDS = [
    { codigo: "MED-001", nombreComercial: "Paracetamol 500mg", laboratorio: "Genfar", principioActivo: "Paracetamol", presentacion: "Caja x 100 tab", costo: 4.5 },
    { codigo: "MED-002", nombreComercial: "Amoxicilina 500mg", laboratorio: "Medifarma", principioActivo: "Amoxicilina", presentacion: "Caja x 100 cap", costo: 12.8 },
    { codigo: "MED-003", nombreComercial: "Ibuprofeno 400mg", laboratorio: "Portugal", principioActivo: "Ibuprofeno", presentacion: "Caja x 50 tab", costo: 8.2 },
    { codigo: "MED-004", nombreComercial: "Omeprazol 20mg", laboratorio: "Farmindustria", principioActivo: "Omeprazol", presentacion: "Caja x 30 cap", costo: 15.0 },
    { codigo: "MED-005", nombreComercial: "Losartán 50mg", laboratorio: "Genfar", principioActivo: "Losartán", presentacion: "Caja x 30 tab", costo: 18.5 },
    { codigo: "MED-006", nombreComercial: "Metformina 850mg", laboratorio: "Medifarma", principioActivo: "Metformina", presentacion: "Caja x 60 tab", costo: 9.9 },
    { codigo: "MED-007", nombreComercial: "Atorvastatina 20mg", laboratorio: "Pfizer", principioActivo: "Atorvastatina", presentacion: "Caja x 30 tab", costo: 25.4 },
    { codigo: "MED-008", nombreComercial: "Salbutamol inhalador", laboratorio: "GSK", principioActivo: "Salbutamol", presentacion: "Inhalador 200 dosis", costo: 22.0 },
    { codigo: "MED-009", nombreComercial: "Loratadina 10mg", laboratorio: "Portugal", principioActivo: "Loratadina", presentacion: "Caja x 30 tab", costo: 6.3 },
    { codigo: "MED-010", nombreComercial: "Azitromicina 500mg", laboratorio: "Farmindustria", principioActivo: "Azitromicina", presentacion: "Caja x 30 tab", costo: 16.7 },
    { codigo: "MED-011", nombreComercial: "Diclofenaco 50mg", laboratorio: "Genfar", principioActivo: "Diclofenaco", presentacion: "Caja x 100 tab", costo: 5.4 },
    { codigo: "MED-012", nombreComercial: "Cetirizina 10mg", laboratorio: "Medifarma", principioActivo: "Cetirizina", presentacion: "Caja x 30 tab", costo: 7.1 },
  ];
  const meds = await Promise.all(
    MEDS.map((m) =>
      prisma.medicamento.create({
        data: {
          codigo: m.codigo,
          nombreComercial: m.nombreComercial,
          laboratorio: m.laboratorio,
          principioActivo: m.principioActivo,
          presentacion: m.presentacion,
        },
      }),
    ),
  );

  // Ventanas de vencimiento (días desde hoy) — mezcla de estados.
  const ventanas = [430, 365, 300, 250, 200, 160, 120, 88, 70, 55, 40, 22, 14, -6, -20];
  const motivosSalida = ["Dispensación", "Consumo interno", "Traslado entre establecimientos"];

  let loteNum = 1;
  let entradaDoc = 1000;
  let salidaDoc = 5000;
  let actaNum = 1;
  let incNum = 1;

  for (let i = 0; i < MEDS.length; i++) {
    const numLotes = 2 + (i % 2); // 2 o 3 lotes por medicamento
    for (let j = 0; j < numLotes; j++) {
      const dias = ventanas[(loteNum + i) % ventanas.length];
      const cantidadInicial = 80 + ((i * 37 + j * 53) % 420); // 80..500
      const fechaVenc = enDias(dias);
      const ev = evaluarLote(fechaVenc, UMBRALES_POR_DEFECTO);
      const estIdx = (i + j) % ests.length;

      const lote = await prisma.lote.create({
        data: {
          codigo: `FI-LOT-${String(loteNum).padStart(4, "0")}`,
          numeroLote: `L-${MEDS[i].codigo.slice(-3)}-${j + 1}`,
          medicamentoId: meds[i].id,
          establecimientoId: ests[estIdx].id,
          fechaFabricacion: enDias(dias - 540),
          fechaVencimiento: fechaVenc,
          cantidad: cantidadInicial,
          costoUnitario: MEDS[i].costo,
          diasRestantes: ev.dias,
          estadoVencimiento: ev.estado,
          estado: ev.vencido
            ? "VENCIDO"
            : ev.estado === "PREVENTIVA" || ev.estado === "CRITICO"
              ? "PROXIMO_VENCER"
              : "VIGENTE",
        },
      });
      loteNum++;

      // ENTRADA inicial (distribuida en los últimos ~5 meses)
      await prisma.movimientoFarmaceutico.create({
        data: {
          loteId: lote.id,
          tipo: "ENTRADA",
          cantidad: cantidadInicial,
          motivo: "Compra / reposición",
          documentoRef: `GR-${entradaDoc++}`,
          proveedorId: proveedores[i % proveedores.length].id,
          usuarioId: operador?.id,
          fecha: enDias(-(150 - ((i * 7 + j * 11) % 140))),
        },
      });

      // Salidas / bajas
      let stock = cantidadInicial;
      if (ev.vencido) {
        const baja = Math.min(stock, Math.max(5, Math.floor(stock * 0.4)));
        await prisma.movimientoFarmaceutico.create({
          data: {
            loteId: lote.id,
            tipo: "BAJA",
            cantidad: baja,
            motivo: "Vencimiento",
            documentoRef: `ACTA-${String(actaNum++).padStart(3, "0")}`,
            usuarioId: supervisor?.id,
            fecha: enDias(-3),
          },
        });
        stock -= baja;
      } else {
        const numSalidas = 1 + (i % 3); // 1..3 salidas
        for (let k = 0; k < numSalidas; k++) {
          if (stock <= 15) break;
          const cant = Math.max(5, Math.floor(stock * (0.12 + 0.05 * k)));
          if (cant >= stock) break;
          const esTraslado = k === numSalidas - 1 && i % 4 === 0;
          const esVenta = k === 0 && i % 2 === 0 && !esTraslado;
          await prisma.movimientoFarmaceutico.create({
            data: {
              loteId: lote.id,
              tipo: esVenta ? "VENTA" : esTraslado ? "TRASLADO" : "SALIDA",
              cantidad: cant,
              motivo: esVenta
                ? "Venta mostrador"
                : esTraslado
                  ? "Traslado entre establecimientos"
                  : motivosSalida[k % motivosSalida.length],
              destino: esVenta ? null : ests[(estIdx + k + 1) % ests.length].nombre,
              recibidoPor: esVenta ? null : receptores[(i + k) % receptores.length],
              clienteId: esVenta ? clientes[i % clientes.length].id : undefined,
              documentoRef: esVenta
                ? `B001-${String(salidaDoc++).padStart(6, "0")}`
                : `GR-${salidaDoc++}`,
              usuarioId: farmaceutico?.id,
              fecha: enDias(-(120 - ((i * 9 + k * 20) % 110))),
            },
          });
          stock -= cant;
        }
      }
      await prisma.lote.update({ where: { id: lote.id }, data: { cantidad: stock } });

      // Alertas e incidencias según el estado (lo que generaría el motor de reglas)
      if (ev.vencido) {
        await prisma.alerta.create({
          data: {
            loteId: lote.id,
            tipo: "PRODUCTO_VENCIDO",
            severidad: "CRITICA",
            mensaje: `El lote ${lote.codigo} (${MEDS[i].nombreComercial}) está VENCIDO. Retirar de inmediato.`,
          },
        });
        await prisma.incidencia.create({
          data: {
            codigo: `FI-INC-${String(incNum++).padStart(4, "0")}`,
            titulo: `Producto vencido: ${MEDS[i].nombreComercial} (lote ${lote.codigo})`,
            severidad: "CRITICA",
            estado: "ABIERTA",
            loteId: lote.id,
            reportadoPorId: supervisor?.id,
            evidencias: [],
          },
        });
      } else if (ev.estado === "CRITICO" || ev.estado === "PREVENTIVA") {
        await prisma.alerta.create({
          data: {
            loteId: lote.id,
            tipo: "PROXIMO_VENCER",
            severidad: ev.estado === "CRITICO" ? "CRITICA" : "PREVENTIVA",
            mensaje: `El lote ${lote.codigo} (${MEDS[i].nombreComercial}) vence en ${ev.dias} día(s).`,
          },
        });
      }
    }
  }

  const totales = await Promise.all([
    prisma.lote.count(),
    prisma.movimientoFarmaceutico.count(),
    prisma.alerta.count(),
    prisma.incidencia.count(),
  ]);
  const ventas = await prisma.movimientoFarmaceutico.count({ where: { tipo: "VENTA" } });
  console.log(`✅ Listo: ${meds.length} medicamentos · ${totales[0]} lotes · ${totales[1]} movimientos (${ventas} ventas) · ${clientes.length} clientes · ${proveedores.length} proveedores · ${totales[2]} alertas · ${totales[3]} incidencias`);
  console.log("   Usuarios demo (contraseña: farmainvex123): admin@farmainvex.pe · supervisor@farmainvex.pe · farmaceutico@farmainvex.pe · operador@farmainvex.pe");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
