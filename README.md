# Ubica2 Backend

Backend en Node.js + TypeScript + Express + Prisma para la plataforma Ubica2 (lugares y eventos). Incluye autenticacion, gestion de lugares, agenda de eventos, favoritos, reportes, analiticas y administracion.

## Requisitos

- Node.js 18+
- MySQL 8+ (usuario `root` sin password, base `ubica2_pro`)

## Configuracion

1) Variables de entorno en `.env`:

- `DATABASE_URL="mysql://root:@localhost:3306/ubica2_pro"`
- `JWT_SECRET`
- `JWT_REFRESH_SECRET`
- `CLOUD_NAME` / `CLOUD_KEY` / `CLOUD_SECRET`

2) Instalar dependencias:

```bash
npm install
```

3) Migraciones y seed:

```bash
npx prisma generate --schema prisma/schema.prisma
npx prisma migrate dev
npm run db:seed
```

4) Iniciar servidor:

```bash
npm run dev
```

## Modulos

- **Auth**: registro e inicio de sesion con JWT.
- **Catalogs**: listas de ciudades, tipos de lugar y categorias de eventos.
- **Places**: CRUD de lugares, estado (DRAFT/PUBLISHED/SUSPENDED), contactos, redes, horarios.
- **Events**: CRUD de eventos, recurrencias semanales y fechas especiales.
- **Favorites**: guardar y quitar lugares favoritos por usuario.
- **Reports**: reportar informacion incorrecta y moderar estados de reportes.
- **Analytics**: registro de vistas/clics y resumen de eventos.
- **Admin**: moderacion de estados y auditoria.

## Endpoints

### Salud

- `GET /health`

### Auth

- `POST /api/auth/register`
  - Body: `{ email, password, fullName, phone? }`
- `POST /api/auth/login`
  - Body: `{ email, password }`

### Catalogos

- `GET /api/catalogs/cities`
- `GET /api/catalogs/place-types`
- `GET /api/catalogs/event-categories`

### Places

- `GET /api/places`
  - Query: `cityId? placeTypeId? priceLevel? search? status? openNow? page? pageSize?`
- `GET /api/places/:id`
- `POST /api/places`
  - Auth: OWNER/ADMIN
  - Body: `{ cityId, placeTypeId, name, description?, addressLine?, neighborhood?, latitude?, longitude?, priceLevel?, status?, contacts?, socialLinks?, openingHours? }`
- `PATCH /api/places/:id`
  - Auth: OWNER/ADMIN
  - Body: parcial de create
- `PATCH /api/places/:id/status`
  - Auth: ADMIN
  - Body: `{ status: "DRAFT" | "PUBLISHED" | "SUSPENDED" }`

### Events

- `GET /api/events/agenda`
  - Query: `cityId? weekday? date? page? pageSize?`
- `GET /api/events/place/:placeId`
  - Query: `weekday? date? page? pageSize?`
- `GET /api/events/:id`
- `POST /api/events`
  - Auth: OWNER/ADMIN
  - Body: `{ placeId, categoryId?, title, description?, dressCode?, minAge?, currency?, priceFrom?, priceTo?, startTime, endTime?, status?, recurrence?, specialDates? }`
- `PATCH /api/events/:id`
  - Auth: OWNER/ADMIN
  - Body: parcial de create

### Favorites

- `GET /api/favorites`
  - Auth: USER
- `POST /api/favorites/:placeId`
  - Auth: USER
- `DELETE /api/favorites/:placeId`
  - Auth: USER

### Reports

- `POST /api/reports`
  - Auth opcional
  - Body: `{ targetType, placeId?, eventId?, reason, details? }`
- `GET /api/reports`
  - Auth: ADMIN
  - Query: `status?`
- `PATCH /api/reports/:id`
  - Auth: ADMIN
  - Body: `{ status }`

### Analytics

- `POST /api/analytics`
  - Auth opcional
  - Body: `{ eventType, placeId?, eventId?, meta? }`
- `GET /api/analytics/summary`
  - Auth: ADMIN

### Admin

- `PATCH /api/admin/places/:id/status`
  - Auth: ADMIN
  - Body: `{ status }`
- `PATCH /api/admin/events/:id/status`
  - Auth: ADMIN
  - Body: `{ status }`
- `PATCH /api/admin/businesses/:id/validate`
  - Auth: ADMIN
- `PATCH /api/admin/businesses/:id/approve`
  - Auth: ADMIN
- `PATCH /api/admin/events/:id/validate`
  - Auth: ADMIN
- `PATCH /api/admin/events/:id/approve`
  - Auth: ADMIN
- `GET /api/admin/roles`
  - Auth: ADMIN
- `POST /api/admin/roles`
  - Auth: ADMIN
- `PATCH /api/admin/roles/:id`
  - Auth: ADMIN
- `DELETE /api/admin/roles/:id`
  - Auth: ADMIN
- `GET /api/admin/users`
  - Auth: ADMIN
- `POST /api/admin/users`
  - Auth: ADMIN
- `PATCH /api/admin/users/:id`
  - Auth: ADMIN
- `PATCH /api/admin/users/:id/suspend`
  - Auth: ADMIN
- `DELETE /api/admin/users/:id`
  - Auth: ADMIN
- `GET /api/admin/activity-report`
  - Auth: ADMIN
- `GET /api/admin/comments`
  - Auth: ADMIN
- `PATCH /api/admin/comments/:id/moderate`
  - Auth: ADMIN
- `GET /api/admin/conflicts`
  - Auth: ADMIN
- `PATCH /api/admin/conflicts/:id`
  - Auth: ADMIN
- `GET /api/admin/audit`
  - Auth: ADMIN

## Notas

- Los endpoints protegidos requieren `Authorization: Bearer <token>`.
- La zona horaria se toma de la ciudad para calcular "abierto ahora".
