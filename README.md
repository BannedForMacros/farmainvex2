# FarmaInvex

> Sistema especializado para la **trazabilidad de medicamentos, control de lotes y monitoreo de vencimientos** en establecimientos farmacéuticos.

Obra de software original e independiente. Aunque comparte la lógica conceptual de los proyectos hermanos GoalVend y LogiRevers, su código, dominio, modelo de datos e identidad visual son propios (ver `PLAN.md`, §1.5).

## Stack

- **Next.js 16** (App Router) + **React 19** + **TypeScript**
- **PostgreSQL** + **Prisma 7** (driver adapter `@prisma/adapter-pg`)
- **NextAuth v5** (credenciales + JWT) + bcryptjs
- **Tailwind CSS v4** + componentes propios + lucide-react
- Reportes con **jspdf** / **exceljs** · gráficos con **recharts**

## Arquitectura

```
src/
├── app/            # rutas (App Router): (app) protegido + login + api
├── components/     # UI propia + layout (topbar)
├── domain/         # lógica de negocio pura: vencimiento.ts, reglas.ts
├── services/       # casos de uso + acceso a datos
└── lib/            # prisma, utils, navegación
```

La lógica sanitaria central vive en `src/domain/`:
- `vencimiento.ts` — fórmula días-restantes y semáforo 🔴🟡🟢.
- `reglas.ts` — motor de reglas (sección VII del documento).

## Puesta en marcha (local)

```bash
# 1. Configura el entorno
cp .env.example .env        # y edita DATABASE_URL + AUTH_SECRET
#   AUTH_SECRET: openssl rand -base64 32

# 2. Instala dependencias
npm install

# 3. Genera el cliente Prisma y la base de datos
npm run db:generate
npm run db:migrate -- --name init
npm run db:seed

# 4. Arranca
npm run dev                 # http://localhost:3000
```

## Cuentas demo

Contraseña común: `farmainvex123`

| Rol | Correo |
|-----|--------|
| Administrador | admin@farmainvex.pe |
| Supervisor | supervisor@farmainvex.pe |
| Farmacéutico | farmaceutico@farmainvex.pe |
| Operador | operador@farmainvex.pe |

## Monitoreo de vencimientos

En modo local, el recálculo de estados y la generación de alertas se ejecuta
on-demand desde el botón **"Recalcular estados"** (panel / vencimientos), que
llama a `POST /api/cron/vencimientos`. Ese mismo endpoint puede conectarse a un
cron (Vercel Cron / node-cron) en producción sin cambiar la lógica.
