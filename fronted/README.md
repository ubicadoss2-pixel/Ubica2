# Ubica2 Fronted (Angular)

Frontend Angular profesional para consumir el backend de Ubica2.

## Requisitos

- Node.js 18+
- Backend Ubica2 corriendo en `http://localhost:3000`

## Instalación

```bash
cd fronted
npm install
```

## Ejecutar

```bash
npm start
```

La app levanta en `http://localhost:4200` y consume el API desde:

- `src/environments/environment.ts`
- `apiBaseUrl: http://localhost:3000/api`

## Build

```bash
npm run build
```

## Funcionalidades implementadas

- Autenticación (`/api/auth/register`, `/api/auth/login`)
- Catálogos (`/api/catalogs/*`)
- Exploración de lugares (`/api/places`)
- Agenda y eventos (`/api/events/*`)
- Favoritos (`/api/favorites/*`)
- Reportes (`/api/reports`)
- Analítica (`/api/analytics` y `/api/analytics/summary`)
- Administración (`/api/admin/*`)
- Formularios OWNER/ADMIN para crear lugar y evento según esquema backend

## Rutas principales

- `/` explorar lugares
- `/agenda`
- `/places/:id`
- `/login`
- `/register`
- `/favorites`
- `/owner/place/new`
- `/owner/event/new`
- `/admin`
