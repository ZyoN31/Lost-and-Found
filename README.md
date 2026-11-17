# Lost & Found — UPEMOR

Plataforma web de la comunidad UPEMOR para reportar, buscar y recuperar pertenencias perdidas en el campus.

## Estructura

```
backend/    API REST — Node 20 + Express + TypeScript + MongoDB (driver nativo)
frontend/   SPA — SvelteKit 2 + Svelte 5 (Runes) + Tailwind CSS v4
mockups/    Diseños de referencia (login, feed, modales, perfil, admin)
```

## Requisitos

- Node.js 20+
- Una cuenta de MongoDB Atlas (capa gratuita M0 es suficiente)
- Una cuenta de Cloudinary (para subir fotografías de los reportes)

## Backend

```bash
cd backend
npm install
cp .env.example .env   # y rellena los valores reales
npm run dev            # desarrollo con tsx (http://localhost:4000)
npm run build          # compila a dist/ con tsc
npm start              # sirve dist/ compilado
```

### Variables de entorno del backend (`backend/.env`)

| Clave | Descripción |
| --- | --- |
| `PORT` | Puerto del servidor (por defecto `4000`) |
| `MONGODB_URI` | Cadena de conexión de Atlas: `mongodb+srv://<usuario>:<password>@<cluster>.mongodb.net/?retryWrites=true&w=majority` |
| `JWT_SECRET` | Secreto largo y aleatorio para firmar los JWT (p. ej. `openssl rand -base64 48`) |
| `CLOUDINARY_CLOUD_NAME` | Nombre del cloud en el dashboard de Cloudinary |
| `CLOUDINARY_API_KEY` | API Key del dashboard |
| `CLOUDINARY_API_SECRET` | API Secret del dashboard |
| `FRONTEND_URL` | Origen permitido por CORS (p. ej. `http://localhost:5173`) |

La base `upemor_lost_found` se crea sola al conectar. Se crean automáticamente:

- Índice único en `usuarios.correo`
- Colecciones: `usuarios`, `objetos`, `bitacora`

### Cómo obtener `MONGODB_URI` (MongoDB Atlas)

1. Crea un cluster gratuito (M0) en [Atlas](https://cloud.mongodb.com).
2. **Database Access** → crea un usuario con contraseña.
3. **Network Access** → añade tu IP (o `0.0.0.0/0` para desarrollo).
4. **Connect** → *Drivers* → copia la cadena y reemplaza `<password>` por la contraseña real (sin los símbolos `<` `>`).
5. Pega el resultado en `MONGODB_URI`.

### Cómo obtener las credenciales de Cloudinary

1. Entra a tu dashboard en [Cloudinary](https://cloudinary.com/console).
2. Copia **Cloud name**, **API Key** y **API Secret**.
3. Las fotos de los reportes se suben a la carpeta `lost-and-found` en Cloudinary.

## Frontend

```bash
cd frontend
npm install
./node_modules/.bin/vite dev          # desarrollo (http://localhost:5173)
./node_modules/.bin/vite build        # build de producción
./node_modules/.bin/svelte-check --tsconfig ./tsconfig.json
```

### Variables de entorno del frontend (`frontend/.env`)

| Clave | Descripción |
| --- | --- |
| `VITE_API_URL` | URL base de la API backend (p. ej. `http://localhost:4000`) |

## Rutas principales

- `/` → redirige a `/login` (o `/feed` si hay sesión)
- `/login` → inicio de sesión y registro con correo `@upemor.edu.mx`
- `/feed` → tabs Perdidos / Encontrados / Devueltos, búsqueda, filtros por zona y categoría
- `/profile` → perfil del estudiante y sus reportes
- `/admin` → panel de moderación (solo administradores): KPIs, gestión de usuarios y Bitácora de Auditoría
