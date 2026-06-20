# FarmaInvex — Guía del proyecto (CLAUDE.md)

> Sistema especializado para la **trazabilidad de medicamentos, control de lotes y monitoreo de vencimientos** en establecimientos farmacéuticos. Basado en la especificación `FarmaInvex_Giuliana_Roberto_Cesar.docx`.

## ⚠️ Regla fundamental: obra original e independiente

FarmaInvex es una **compilación conceptual** de los proyectos hermanos **goalvend** (ventas) y **LogiRevers** (logística reversa), pero debe registrarse como **software DIFERENTE**. Comparte *ideas y patrones*, **nunca código literal**.

- ❌ **NO** copiar archivos de goalvend/LogiRevers ni importar nada de ellos. Sin dependencias cruzadas.
- ❌ **NO** agregar módulo de **ventas** (no está en el Word; ventas es dominio de goalvend — mantener la separación que sustenta el registro independiente).
- ✅ Las librerías estándar compartidas (Next.js, Prisma, etc.) son legítimas; lo que debe ser propio es el **código de aplicación**.
- ✅ Identidad visual propia: **header + sidebar colapsable** (goalvend usa otro layout), componentes UI escritos a mano, tipografía Plus Jakarta Sans, paleta del logo.

Ver `PLAN.md` §1.5 para el detalle de diferenciación.

## Stack

- **Next.js 16** (App Router) + **React 19** + **TypeScript** (¡Next 16 tiene breaking changes! `searchParams`/`params` son `Promise`, hay que `await`).
- **PostgreSQL** + **Prisma 7** (driver adapter `@prisma/adapter-pg`; cliente generado en `src/generated/prisma`).
- **NextAuth v5** (Credentials + JWT) + **bcryptjs**.
- **Tailwind CSS v4** (config por `@theme inline` en `globals.css`, sin `tailwind.config`) + componentes propios + **lucide-react** (¡nunca emojis para iconos!).
- **jspdf** + **jspdf-autotable** (PDF) · **exceljs** (Excel) · **recharts** · **react-hook-form** + **zod** · **sonner** · **date-fns**.

## Comandos

```bash
npm run dev          # http://localhost:3000
npm run build        # build de producción
npm run lint
npm run db:generate  # prisma generate
npm run db:migrate   # prisma migrate dev
npm run db:seed      # datos demo
npm run db:studio    # prisma studio
```

## Entorno local

- Postgres 17 (Homebrew), base **`farmainvex`**, rol `postgres` / `postgres`.
- `.env`: `DATABASE_URL` (postgres local) + `AUTH_SECRET` (generado con `openssl rand -base64 32`).
- Cookie de sesión con **nombre propio** `farmainvex.session-token` (en `src/auth.ts`) para no colisionar con goalvend/LogiRevers en el mismo `localhost`.

### Cuentas demo (contraseña `farmainvex123`)
`admin@farmainvex.pe` · `supervisor@farmainvex.pe` · `farmaceutico@farmainvex.pe` · `operador@farmainvex.pe`

## Arquitectura

```
src/
├── app/
│   ├── (app)/                 # rutas protegidas (auth + layout con header/sidebar)
│   │   ├── dashboard/         # KPIs + semáforo + próximos a vencer
│   │   ├── medicamentos/      # CRUD (page, nuevo, [id]/editar, actions, form)
│   │   ├── lotes/             # CRUD + detalle [id] + [id]/editar
│   │   ├── vencimientos/      # tabla con semáforo + recalcular
│   │   ├── alertas/           # lista + acciones (leída/resuelta)
│   │   ├── supervision/       # incidencias: lista + estados + nueva
│   │   └── admin/             # umbrales + usuarios/ + establecimientos/
│   ├── login/                 # login (server action useActionState)
│   ├── api/
│   │   ├── auth/[...nextauth]/
│   │   ├── cron/vencimientos/ # recálculo del monitoreo (POST)
│   │   └── reportes/          # genera PDF/Excel (GET ?tipo=&formato=)
│   ├── actions/auth.ts        # iniciar/cerrar sesión
│   ├── globals.css            # Tailwind v4 + paleta FarmaInvex
│   └── layout.tsx             # root (fuentes, ThemeProvider, Toaster)
├── auth.ts                    # NextAuth v5 (cookie propia)
├── components/
│   ├── ui/                    # button, card, badge, input, label, select, textarea, sonner
│   ├── layout/                # app-shell (header + sidebar), en-construccion
│   ├── estado-badge.tsx       # semáforo 🟢🟡🔴 con iconos Lucide
│   ├── boton-eliminar.tsx     # eliminar genérico (confirm + toast)
│   └── dato.tsx               # par etiqueta/valor para detalles
├── domain/                    # LÓGICA DE NEGOCIO PURA (sin framework)
│   ├── vencimiento.ts         # días restantes + clasificación de semáforo
│   └── reglas.ts              # motor de reglas (sección VII del Word)
├── services/                  # casos de uso + acceso a datos
│   ├── config.service.ts      # lee umbrales de ConfigRegla
│   ├── vencimientos.service.ts# recalcularVencimientos + evaluarLotePorId
│   ├── dashboard.service.ts   # KPIs
│   └── reportes.service.ts    # datos + generarPDF + generarExcel
├── lib/
│   ├── prisma.ts  · session.ts (requireSession/requireRol)
│   ├── nav.ts     · enums.ts (etiquetas) · format.ts (fechas)
│   └── utils.ts (cn)
└── generated/prisma/          # cliente Prisma (NO editar)
```

### Patrón de arquitectura propio
- **`domain/`** = lógica pura testeable (semáforo, motor de reglas), sin Prisma ni React.
- **`services/`** = orquestan dominio + Prisma (capa propia, distinta a goalvend).
- **Server Actions** para mutaciones (`actions.ts` por módulo) con validación **zod** y guard `requireRol`.
- **Route Handlers** para descargas (reportes) y el recálculo (cron local).

## Modelo de datos (Prisma)

`Usuario` · `Establecimiento` · `Medicamento` · **`Lote`** (núcleo) · `MovimientoFarmaceutico` (trazabilidad) · `Alerta` · `Incidencia` · `ConfigRegla` (umbrales).

Enums clave: `Rol` (ADMIN/SUPERVISOR/FARMACEUTICO/OPERADOR), `EstadoLote`, `EstadoVencimiento` (VIGENTE/PREVENTIVA/CRITICO), `TipoMovimiento`, `TipoAlerta`, `Severidad`, `EstadoIncidencia`.

## Lógica central — semáforo y motor de reglas

**Semáforo de vencimiento** (`domain/vencimiento.ts`):
```
Días Restantes = Fecha de Vencimiento − Fecha Actual
  🔴 CRITICO     → vencido o ≤ DIAS_ALERTA_CRITICA (default 30)
  🟡 PREVENTIVA  → ≤ DIAS_ALERTA_PREVENTIVA (default 90)
  🟢 VIGENTE     → fuera de toda ventana
```
Los iconos del semáforo son **lucide-react** (`CircleCheck` / `TriangleAlert` / `CircleAlert`) vía `components/estado-badge.tsx`. **No usar emojis** como iconos en la UI.

**Motor de reglas** (`domain/reglas.ts`, sección VII del Word): lote observado → seguimiento; vencido → incidencia crítica; próximo a vencer → alerta preventiva/crítica; al actualizar → recalcula estado. Se ejecuta vía `services/vencimientos.service.ts`:
- `evaluarLotePorId(id)` — al crear/editar un lote.
- `recalcularVencimientos()` — al cargar dashboard, botón "Recalcular" y al cambiar umbrales (POST `/api/cron/vencimientos`).

> ⚠️ Importante: un lote **crítico pero NO vencido** debe quedar `estadoLote = PROXIMO_VENCER` (solo `VENCIDO` cuando `diasRestantes < 0`). Los umbrales viven en `ConfigRegla` y son editables desde `/admin`.

## Estado de los módulos (todos completos)

| Módulo (Word) | Ruta | Estado |
|---|---|---|
| Trazabilidad (V.1) | `/lotes/[id]` | ✅ Detalle completo + movimientos + alertas |
| Control de lotes (V.2) | `/lotes` | ✅ CRUD (crear dispara motor + movimiento ENTRADA) |
| Monitoreo vencimientos (V.3) | `/vencimientos` | ✅ Semáforo + recálculo |
| Alertas sanitarias (V.4) | `/alertas` | ✅ Motor + marcar leída/resolver |
| Supervisión (V.5) | `/supervision` | ✅ Incidencias + cambio de estado + crear |
| Reportes (V.6) | `/reportes` | ✅ PDF + Excel (5 reportes) |
| Administración | `/admin` | ✅ Umbrales + CRUD usuarios + CRUD establecimientos |

## Convenciones

- **Iconos**: siempre `lucide-react`. Nunca emojis para representar estados/acciones en la UI.
- **Fechas**: helpers de `lib/format.ts` (`fechaCorta`, `fechaLarga`, `fechaHora`, `textoDiasRestantes`), locale `es-PE`.
- **Etiquetas de enums**: en `lib/enums.ts`.
- **Permisos**: `requireSession()` / `requireRol([...])` de `lib/session.ts` al inicio de cada server action.
- **Eliminar**: `components/boton-eliminar.tsx` (confirm + toast); las actions de borrado devuelven `{ ok, error? }` y bloquean si hay dependencias (FK).
- **Forms**: `useActionState` + server action que devuelve `{ error?, fieldErrors? }`.
- **Paleta** (del logo): navy `#002878`, azul `#0064B4`, cian `#008CDC`, teal `#00A08C`; semáforo `#18B981`/`#F5A623`/`#E5304B`. Tokens en `globals.css`.

## Verificación

Tras cambios, ejecutar `npx tsc --noEmit` (debe pasar limpio). El servidor de dev registra logs en `.next/dev/logs/next-development.log`. Las páginas que consultan la BD son dinámicas (`ƒ`); los errores `prisma:error` durante `build` solo ocurren si no existe la BD y son benignos (no rompen el build).

## Pendientes / extras opcionales (no exigidos por el Word)

- Módulo **Movimientos/Dispensación** (registrar ENTRADA/SALIDA de lotes desde la UI — encaja con la trazabilidad, NO es "ventas").
- **Gráficos** (recharts) en el dashboard.
- **Evidencias** con subida de imágenes en incidencias (`Incidencia.evidencias` ya existe en el schema).
- **Paginación/filtros** en tablas.
- **Tests** automatizados (el dominio puro es ideal para unit tests).
