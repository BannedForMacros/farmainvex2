# FarmaInvex — Plan de Desarrollo

> **Sistema especializado para la trazabilidad de medicamentos, control de lotes y monitoreo de vencimientos en establecimientos farmacéuticos.**

Este documento es la especificación técnica completa para construir FarmaInvex. Está basado en el Word del proyecto (`FarmaInvex_Giuliana_Roberto_Cesar.docx`).

> ⚠️ **Objetivo legal — los 3 sistemas se registran como software DIFERENTES.**
> FarmaInvex es una **compilación conceptual** de goalvend y LogiRevers: comparte la *lógica de negocio en teoría* (catálogos → registros → motor de reglas → alertas → reportes), pero debe ser una **obra original e independiente**, no un fork copy-paste. Se reutilizan **ideas y patrones de arquitectura**, NO archivos literales. Ver [§1.5 Diferenciación y originalidad](#15-diferenciación-y-originalidad).

---

## 1. Decisiones técnicas

| Tema | Decisión | Por qué |
|------|----------|---------|
| **Framework** | Next.js 16 (App Router) + React 19 + TypeScript | Lo que pediste; full-stack en un solo proceso (más simple que el monolito de 2 puertos de LogiRevers). UI/UX ya resuelta. |
| **Base de datos** | PostgreSQL (la que ya tienes) + Prisma 7 | Reutilizas tu Postgres; solo cambia `DATABASE_URL`. ORM tipado end-to-end. |
| **Auth** | NextAuth v5 (Credentials + JWT) + bcryptjs | Mismo enfoque que goalvend, **reimplementado** (no copiado). RBAC por rol. |
| **UI** | shadcn/ui + Tailwind v4 + lucide-react | Misma librería base, pero **diseño visual propio** (layout, tema y componentes con identidad FarmaInvex — ver §1.5). |
| **Reportes** | jspdf + jspdf-autotable + exceljs | Mismas librerías estándar; plantillas y maquetación originales. |
| **Gráficos** | recharts | Dashboard. |
| **Formularios** | react-hook-form + zod | Validación tipada. |
| **Notificaciones** | sonner | Toasts. |
| **Fechas** | date-fns | Cálculo de días restantes / vencimientos. |
| **Despliegue** | **Local por ahora** | El monitoreo de vencimientos corre on-demand (al cargar dashboard + botón "recalcular"). Diseñado para migrar a cron (Vercel Cron o node-cron) sin reescribir lógica. |

### Qué se reutiliza (a nivel de IDEA/PATRÓN, reimplementado)

- **De goalvend (concepto):** el enfoque full-stack con Next.js, el patrón "semáforo" para estados, la idea de exportar reportes, RBAC. → Se **reimplementa** con código, nombres y organización propios.
- **De LogiRevers (concepto):** la idea de un motor de reglas declarativo, el timeline de auditoría, umbrales configurables, alertas automáticas. → Se **rediseña** para el dominio farmacéutico.

> **Regla de oro:** se comparten *ideas* (qué hace), nunca *archivos* (cómo está escrito). Cada línea de FarmaInvex se escribe para FarmaInvex.

---

## 1.5. Diferenciación y originalidad

Para que los 3 sistemas sean registrables como **software diferentes** (en Perú, el software se protege por **derecho de autor** vía registro en INDECOPI — no es una "patente" en sentido estricto, pero el principio es el mismo: debe ser **obra original**), FarmaInvex se diferencia en estas 7 capas. Esto **no es opcional**: es el núcleo del encargo.

| Capa | goalvend | LogiRevers | **FarmaInvex (distinto a propósito)** |
|------|----------|-----------|----------------------------------------|
| **Dominio** | Ventas / metas | Logística reversa / devoluciones | **Farmacéutico / sanitario** (medicamentos, lotes, vencimientos) |
| **Arquitectura** | Next + server actions | React/Vite + Express monolito | Next + **capa de servicios explícita** (`src/services/`) + API routes — patrón distinto a ambos |
| **Modelo de datos** | Ventas/Clientes/Metas | Incidencias/Devoluciones/Daños | **Medicamento/Lote/Movimiento/Vencimiento** — entidades y relaciones propias |
| **Lógica central** | KPI de cumplimiento | SLA por horas | **Días-a-vencimiento sanitario** (fórmula y umbrales propios del Word V.3/VII) |
| **UI / identidad visual** | Sidebar + tema goalvend | Componentes CSS Modules propios | **Layout y design system propio** de FarmaInvex (ver abajo) — debe *verse* distinto |
| **Vocabulario / nombres** | `Venta`, `Meta`, `vendedorId` | `Incidencia`, `slaHoras` | `Lote`, `estadoVencimiento`, `MovimientoFarmaceutico` — terminología sanitaria original |
| **Elemento innovador** | Proyección de ventas | Reglas de recurrencia | **Trazabilidad + monitoreo sanitario integrado** (Word VIII) — el diferenciador patentable |

### Cómo se hace en la práctica (no copiar archivos)

1. **Código escrito desde cero** siguiendo este plan. Las librerías son estándar (Next, Prisma, shadcn) — eso es legítimo y común; lo que debe ser original es **el código de aplicación** (componentes, servicios, motor de reglas, schema, vistas).
2. **Identidad visual propia de FarmaInvex:** paleta del logo (§2), y un *layout* distinto al de goalvend — p. ej. **topbar + nav horizontal/secciones** o sidebar con tratamiento visual propio, tipografía distinta, tarjetas y tablas con estilo sanitario. No reusar `globals.css` de goalvend tal cual.
3. **Estructura de carpetas propia** (`src/services/`, `src/domain/`) que no calque la de goalvend.
4. **Motor de reglas redactado para el dominio** (lotes/vencimientos/sanidad), no adaptado del de SLA.
5. **Cabeceras de autoría** en los archivos y un `README`/`LICENSE` propios que declaren a FarmaInvex como obra independiente.
6. **Sin dependencias cruzadas** entre los 3 repos (FarmaInvex no importa nada de goalvend ni LogiRevers).

> **Nota legal (orientativa, no asesoría):** el registro de software ante INDECOPI protege la *expresión* (el código), no la *idea*. Tres programas que resuelven problemas distintos, con código y datos propios, son perfectamente registrables por separado aunque compartan el patrón conceptual. Para el trámite formal conviene confirmar requisitos con un especialista en propiedad intelectual.

---

## 2. Paleta de marca (extraída del logo)

```css
/* Primarios (azul marino del texto "FarmaInvex" y la cápsula) */
--primary:      #002878;   /* sidebar, headers, botón primario */
--primary-700:  #001464;   /* hover, fondos oscuros */
--brand-blue:   #0064B4;   /* azul brillante, links */
--brand-cyan:   #008CDC;   /* info, badges informativos */
--accent-teal:  #00A08C;   /* verde-azulado (cápsula/checks), acentos */

/* Semáforo sanitario (sección V.3 del Word) */
--success:  #18B981;   /* 🟢 Producto vigente */
--warning:  #F5A623;   /* 🟡 Alerta preventiva */
--danger:   #E5304B;   /* 🔴 Riesgo crítico (vencido) */

/* Superficies */
--background: #F4F6FB;
--surface:    #FFFFFF;
--border:     #DDE3F0;
--text:       #0B1437;
--text-muted: #5A6486;

--gradient-brand: linear-gradient(135deg, #00A08C 0%, #0064B4 50%, #002878 100%);
```

---

## 3. Modelo de datos (Prisma — PostgreSQL)

```prisma
// ===== Enums =====
enum Rol            { ADMIN  SUPERVISOR  FARMACEUTICO  OPERADOR }
enum TipoEstablecimiento { FARMACIA  BOTICA  CENTRO_DISTRIBUCION  CLINICA  ALMACEN_MEDICO }
enum EstadoLote     { VIGENTE  PROXIMO_VENCER  VENCIDO  OBSERVADO  RETIRADO }
enum EstadoVencimiento { VIGENTE  PREVENTIVA  CRITICO }          // 🟢 🟡 🔴
enum TipoMovimiento { ENTRADA  SALIDA  TRASLADO  AJUSTE  BAJA }
enum TipoAlerta     { PROXIMO_VENCER  LOTE_OBSERVADO  RIESGO_ALMACENAMIENTO  INCIDENCIA_SANITARIA  PRODUCTO_VENCIDO }
enum Severidad      { INFO  PREVENTIVA  CRITICA }
enum EstadoIncidencia { ABIERTA  EN_SEGUIMIENTO  EN_VALIDACION  RESUELTA  CERRADA }

// ===== Catálogos =====
model Usuario {
  id            String   @id @default(cuid())
  nombre        String
  email         String   @unique
  passwordHash  String
  rol           Rol      @default(OPERADOR)
  establecimiento   Establecimiento? @relation(fields: [establecimientoId], references: [id])
  establecimientoId String?
  activo        Boolean  @default(true)
  creadoEn      DateTime @default(now())
  movimientos   MovimientoFarmaceutico[]
  incidencias   Incidencia[]
  @@index([rol])
}

model Establecimiento {
  id        String   @id @default(cuid())
  nombre    String
  tipo      TipoEstablecimiento
  direccion String?
  usuarios  Usuario[]
  lotes     Lote[]
}

model Medicamento {
  id             String   @id @default(cuid())
  codigo         String   @unique          // Código del medicamento
  nombreComercial String
  laboratorio    String
  principioActivo String?
  presentacion   String?
  lotes          Lote[]
  @@index([laboratorio])
}

// ===== Núcleo: trazabilidad y lotes =====
model Lote {
  id             String   @id @default(cuid())
  codigo         String   @unique          // autogenerado: FI-LOT-####
  numeroLote     String                    // Número de lote del fabricante
  medicamento    Medicamento @relation(fields: [medicamentoId], references: [id])
  medicamentoId  String
  establecimiento   Establecimiento? @relation(fields: [establecimientoId], references: [id])
  establecimientoId String?
  fechaFabricacion DateTime
  fechaVencimiento DateTime
  cantidad       Int      @default(0)
  estado         EstadoLote @default(VIGENTE)
  estadoVencimiento EstadoVencimiento @default(VIGENTE)  // recalculado por el motor
  diasRestantes  Int?                      // cache del cálculo (Vencimiento - Hoy)
  creadoEn       DateTime @default(now())
  actualizadoEn  DateTime @updatedAt
  movimientos    MovimientoFarmaceutico[]
  alertas        Alerta[]
  @@index([estadoVencimiento])
  @@index([fechaVencimiento])
  @@index([medicamentoId])
}

model MovimientoFarmaceutico {       // ← "historial de movimientos" (trazabilidad)
  id        String   @id @default(cuid())
  lote      Lote     @relation(fields: [loteId], references: [id])
  loteId    String
  tipo      TipoMovimiento
  cantidad  Int
  motivo    String?
  usuario   Usuario? @relation(fields: [usuarioId], references: [id])
  usuarioId String?
  fecha     DateTime @default(now())
  @@index([loteId, fecha])
}

// ===== Alertas e incidencias =====
model Alerta {
  id        String   @id @default(cuid())
  tipo      TipoAlerta
  severidad Severidad
  mensaje   String
  lote      Lote?    @relation(fields: [loteId], references: [id])
  loteId    String?
  leida     Boolean  @default(false)
  resuelta  Boolean  @default(false)
  creadoEn  DateTime @default(now())
  @@index([leida, resuelta])
}

model Incidencia {                   // riesgos / observaciones sanitarias
  id          String   @id @default(cuid())
  codigo      String   @unique       // FI-INC-####
  titulo      String
  descripcion String?
  severidad   Severidad @default(PREVENTIVA)
  estado      EstadoIncidencia @default(ABIERTA)
  evidencias  String[]               // URLs de imágenes subidas
  loteId      String?
  reportadoPor   Usuario? @relation(fields: [reportadoPorId], references: [id])
  reportadoPorId String?
  creadoEn    DateTime @default(now())
  @@index([estado, severidad])
}

// ===== Configuración (umbrales editables por ADMIN) =====
model ConfigRegla {
  clave       String  @id           // ej. "DIAS_ALERTA_PREVENTIVA"
  valor       String
  descripcion String?
}
```

**Umbrales iniciales (`ConfigRegla`, seed):**
- `DIAS_ALERTA_PREVENTIVA = 90` → a 90 días o menos del vencimiento ⇒ 🟡 PREVENTIVA
- `DIAS_ALERTA_CRITICA = 30` → a 30 días o menos ⇒ 🔴 CRITICO
- (vencido, `diasRestantes < 0`) ⇒ 🔴 CRITICO + estado `VENCIDO` + incidencia automática

---

## 4. Motor de reglas (sección VII del Word)

Archivo: `src/lib/engine/reglas.ts`. Funciones puras + side-effects de persistencia.

| Regla (Word VII) | Implementación |
|------------------|----------------|
| Medicamento próximo a vencer → alerta preventiva | `evaluarVencimiento(lote)` calcula `diasRestantes` y setea `estadoVencimiento`; si entra en ventana preventiva/crítica, crea `Alerta`. |
| Lote con observaciones → seguimiento sanitario | `marcarObservado(lote)` → estado `OBSERVADO` + alerta `LOTE_OBSERVADO`. |
| Producto vencido → incidencia crítica | `evaluarVencimiento` con `diasRestantes < 0` → estado `VENCIDO`, alerta `PRODUCTO_VENCIDO`, `Incidencia` severidad `CRITICA`. |
| Actualización de registros → recalcula estado | Cualquier mutación de `Lote` llama a `evaluarVencimiento`. |
| Riesgo operativo → notifica supervisión | Severidad `CRITICA` genera alerta visible al rol SUPERVISOR/ADMIN. |

**Función central del semáforo (sección V.3):**
```ts
// Días Restantes = Fecha de Vencimiento − Fecha Actual
function clasificar(diasRestantes: number, cfg): EstadoVencimiento {
  if (diasRestantes < 0 || diasRestantes <= cfg.DIAS_ALERTA_CRITICA) return 'CRITICO';   // 🔴
  if (diasRestantes <= cfg.DIAS_ALERTA_PREVENTIVA)                    return 'PREVENTIVA'; // 🟡
  return 'VIGENTE';                                                                        // 🟢
}
```

**Monitoreo (modo local):** un Route Handler `GET/POST /api/cron/vencimientos` recorre todos los lotes y aplica `evaluarVencimiento`. Se dispara: (a) al cargar el dashboard, y (b) con un botón "Recalcular estados". Para producción, el mismo endpoint se conecta a Vercel Cron o node-cron sin tocar la lógica.

---

## 5. Módulos funcionales (mapeo al Word, sección V)

| # | Módulo (Word) | Ruta `(app)/` | Server / lógica |
|---|---------------|---------------|-----------------|
| 1 | Trazabilidad farmacéutica | `/medicamentos`, `/lotes/[id]` | timeline de `MovimientoFarmaceutico` |
| 2 | Control de lotes | `/lotes` | CRUD + clasificación + filtros |
| 3 | Monitoreo de vencimientos | `/vencimientos` | tabla con semáforo 🔴🟡🟢 + `/api/cron/vencimientos` |
| 4 | Alertas sanitarias | `/alertas` | panel + campana en header + `engine/reglas` |
| 5 | Supervisión farmacéutica | `/supervision` | incidencias, validación de estados (rol SUPERVISOR/ADMIN) |
| 6 | Reportes | `/reportes` + `/api/reportes` | PDF (jspdf) / Excel (exceljs) |
| — | Dashboard | `/dashboard` | KPIs + gráficos recharts |
| — | Administración | `/admin` | catálogos (medicamentos, establecimientos, usuarios) + umbrales `ConfigRegla` |

**Reportes (sección X):** medicamentos registrados, control de lotes, próximos a vencer, alertas sanitarias, historial farmacéutico, incidencias. Exportación PDF + Excel.

**Usuarios del sistema (sección IX) → roles RBAC:**
- `ADMIN` — todo + configuración de umbrales
- `SUPERVISOR` — supervisión, validación, reportes
- `FARMACEUTICO` — registro de medicamentos/lotes/movimientos
- `OPERADOR` — consulta y registro básico

---

## 6. Estructura de carpetas (propia de FarmaInvex)

> Organización deliberadamente distinta a goalvend: se añade una **capa de servicios** (`src/services/`) y **dominio** (`src/domain/`) que separa la lógica de negocio de las rutas — patrón arquitectónico propio.

```
FarmaInvex/
├── prisma/
│   ├── schema.prisma          # modelo de la sección 3
│   └── seed.ts                # usuarios demo + catálogos + ConfigRegla
├── src/
│   ├── app/
│   │   ├── (app)/             # layout autenticado (sidebar + header)
│   │   │   ├── dashboard/
│   │   │   ├── medicamentos/
│   │   │   ├── lotes/
│   │   │   ├── vencimientos/
│   │   │   ├── alertas/
│   │   │   ├── supervision/
│   │   │   ├── reportes/
│   │   │   └── admin/
│   │   ├── login/
│   │   ├── api/
│   │   │   ├── auth/[...nextauth]/
│   │   │   ├── reportes/route.ts
│   │   │   └── cron/vencimientos/route.ts
│   │   ├── actions/           # server actions (mutaciones)
│   │   ├── globals.css        # paleta del logo (sección 2)
│   │   └── layout.tsx
│   ├── auth.ts
│   ├── components/
│   │   ├── ui/                # shadcn (copiados de goalvend)
│   │   ├── layout/            # sidebar, header, theme-toggle
│   │   ├── lotes/  alertas/  reportes/  dashboard/  ...
│   ├── domain/                # entidades, enums y reglas del dominio farmacéutico
│   │   ├── vencimiento.ts     # fórmula días-restantes + clasificación semáforo
│   │   └── reglas.ts          # motor de reglas (sección 4)
│   ├── services/              # capa de servicios (acceso a datos + casos de uso)
│   │   ├── lotes.service.ts
│   │   ├── alertas.service.ts
│   │   └── reportes.service.ts
│   └── lib/
│       ├── prisma.ts
│       ├── nav.ts             # navegación role-based
│       └── format.ts
├── components.json
├── next.config.ts
├── package.json
└── .env                       # DATABASE_URL, AUTH_SECRET
```

---

## 7. Plan por fases

- **Fase 0 — Scaffold:** copiar base de goalvend, limpiar dominio de ventas, configurar `.env` con tu Postgres, instalar deps.
- **Fase 1 — Auth + layout:** NextAuth, login, sidebar/header con la marca FarmaInvex + paleta del logo, RBAC.
- **Fase 2 — Datos:** schema Prisma (sección 3), migración, `seed.ts` con datos demo (medicamentos, lotes con vencimientos variados, usuarios por rol).
- **Fase 3 — Catálogos:** medicamentos, establecimientos, lotes (CRUD con react-hook-form + zod).
- **Fase 4 — Motor + vencimientos:** `engine/reglas.ts`, semáforo, página `/vencimientos`, endpoint de recálculo.
- **Fase 5 — Alertas + supervisión:** panel de alertas, campana en header, incidencias con evidencias.
- **Fase 6 — Dashboard:** KPIs (lotes vigentes/próximos/vencidos, alertas activas) + gráficos recharts.
- **Fase 7 — Reportes:** los 6 reportes en PDF/Excel.
- **Fase 8 — Pulido:** dark mode, responsividad, datos demo realistas para la presentación.

---

## 8. Setup local

```bash
# 1. variables de entorno
DATABASE_URL="postgresql://user:pass@localhost:5432/farmainvex"
AUTH_SECRET="<openssl rand -base64 32>"

# 2. instalar y preparar BD
npm install
npx prisma migrate dev --name init
npx prisma db seed

# 3. desarrollo
npm run dev        # http://localhost:3000
```

**Cuentas demo (seed):** un usuario por rol (admin / supervisor / farmaceutico / operador), contraseña común para la demo.
