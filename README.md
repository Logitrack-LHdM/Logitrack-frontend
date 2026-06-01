# LogiTrack Agro — Frontend
![Next.js](https://img.shields.io/badge/Next.js-16-000000?style=for-the-badge&logo=next.js&logoColor=white)
![React](https://img.shields.io/badge/React-19-%2320232a.svg?style=for-the-badge&logo=react&logoColor=%2361DAFB)
![TypeScript](https://img.shields.io/badge/TypeScript-5-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_4-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)

---

## Descripción del Proyecto

Este repositorio contiene el frontend de **LogiTrack Agro**, un sistema de gestión logística orientado al transporte de granos y los flujos operativos del sector agrícola.

La aplicación está desarrollada con **Next.js 16** y **React 19**, y se integra con un backend RESTful para administrar:

- Autenticación segura con **JWT**
- Gestión de envíos y asignaciones
- Historial y auditoría de envíos
- Búsqueda avanzada de envíos
- Sección exclusiva para choferes
- Catálogos de empresas, establecimientos, choferes y camiones
---
## Entornos cloud
El proyecto se encuentra desplegado y funciona de manera continua
* **Aplicación web (frontend):** **[Vercel](https://logitrackagro.vercel.app)**
* **API REST (backend):** **[Render](https://logitrack-omv3.onrender.com)**
* **Documentación de API:** **[Swagger UI](https://logitrack-omv3.onrender.com/swagger-ui/index.html)**

---
## Stack Tecnológico

* **Framework Core:** Next.js 16 / React 19
* **Lenguaje:** TypeScript 5
* **Estilos:** Tailwind CSS 4
* **Componentes UI:** Radix UI
* **Formularios y validación:** React Hook Form + Zod
* **Gestor de paquetes:** pnpm
---
## Características principales

- Inicio de sesión con usuario y contraseña
- Control de acceso por roles
- Redirección automática según rol
- Rutas protegidas y navegación condicional
- Peticiones API con un cliente HTTP centralizado (`lib/api.ts`)
- Soporte para búsqueda paginada de envíos
- Gestión de envíos, historial y auditoría
- Módulo de chofer con ciclo de viaje y reporte de incidencias
---

## Rutas principales

* `/login` — pantalla de inicio de sesión
* `/` — redirección según rol
* `/menu` — dashboard administrativo
* `/busqueda` — buscador de envíos
* `/envios` — listado de envíos
* `/envios/nuevo` — alta de nuevo envío
* `/auditoria` — auditoría y historial completo
* `/mi-viaje` — sección exclusiva de chofer

---
## Roles soportados

El sistema reconoce los siguientes roles:

* `ROLE_OPERADOR`
* `ROLE_SUPERVISOR`
* `ROLE_ADMINISTRADOR`
* `ROLE_CHOFER`

### Comportamiento por rol

- `ROLE_CHOFER` accede solo a `/mi-viaje`
- Otros roles acceden al dashboard administrativo (`/menu`, `/busqueda`, `/envios`, `/auditoria`)
- El rol se normaliza automáticamente al iniciar sesión

---
## Instalación y configuración para usar localmente

### 1. Requisitos Previos
* Node.js 18+ compatible.
* Gestor de paquetes `pnpm` (versión 9+).
* Backend REST funcionando y accesible desde `NEXT_PUBLIC_API_URL`

### 2. Instalación
Cloná el repositorio, abrí tu terminal y ejecutá:
```bash
pnpm install
```
### 3. Variables de Entorno

Crea el archivo `.env.local` en la raíz del proyecto con la URL base de la API:

```env
NEXT_PUBLIC_API_URL=http://localhost:8080/api
```

> Si `NEXT_PUBLIC_API_URL` no está definido, la aplicación usa `http://localhost:8080/api` por defecto.


### 4. Comandos Disponibles

```bash
pnpm dev      # Inicia el servidor en modo desarrollo
pnpm build    # Genera la versión de producción
pnpm start    # Inicia el servidor de producción
pnpm lint     # Ejecuta ESLint
```

---
## Estructura del proyecto
La estructura sigue las convenciones del **App Router** de Next.js:

* `app/` — Rutas y layouts de Next.js
* `components/` — Componentes UI reutilizables
* `contexts/` — Contexto de autenticación y estado global
* `hooks/` — Hooks personalizados
* `lib/` — Cliente API, utilidades y constantes
* `types/` — Tipos TypeScript globales
* `public/` — Archivos estáticos
* `styles/` — Estilos globales


---
## Puntos clave de implementación

- El cliente HTTP está en `lib/api.ts`.
- La autenticación y manejo de sesión están en `contexts/auth-context.tsx`.
- El formulario de login está en `components/auth/login-form.tsx`.
- Las rutas dinámicas y layouts están en `app/(chofer)` y `app/(dashboard)`.
- La redirección inicial se controla desde `app/page.tsx`.

---
## Observaciones

- El proyecto está configurado para usarse con `pnpm`.
- El frontend depende de un backend que exponga los endpoints definidos en `lib/api.ts`.
- El token JWT se almacena en `sessionStorage` y se envía en la cabecera `Authorization`.

---

### Contacto

Para dudas o para extender funcionalidades, revisá los módulos en `app/`, `components/`, `contexts/`, `lib/` y `types/`.
