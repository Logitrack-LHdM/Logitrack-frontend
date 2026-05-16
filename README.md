# LogiTrack Agro — Sistema de Gestión Logística

## Descripción del Proyecto
**LogiTrack Agro** es un ERP logístico integral diseñado específicamente para el sector agrícola en Argentina. La plataforma permite gestionar el ciclo de vida completo del transporte de granos (soja, trigo, maíz, etc.), desde el alta del envío en origen (campos/acopios) hasta la entrega en destino (puertos/fábricas).

El sistema se enfoca en la **trazabilidad total**, integrando validaciones de seguridad (licencias, Vto. SENASA) y un módulo de Inteligencia Artificial para la predicción de prioridades.

---

## Stack Tecnológico

### Backend
* **Lenguaje:** Java 21
* **Framework:** Spring Boot (v4.0.6)
* **Persistencia:** Spring Data JPA / Hibernate
* **Seguridad:** Spring Security + JWT (JSON Web Tokens) + BCrypt
* **Gestión de Dependencias:** Maven

### Base de Datos
* **Motor:** PostgreSQL
* **Contenedor:** Docker

### Frontend
* **Tecnologías:** Bootstrap 
* **Herramienta de servidor:** Live Server 

---

## Instalación y Configuración

### 1. Requisitos Previos
* Java JDK 21 o superior instalado.
* Docker instalado y corriendo.
* Maven.

### 2. Base de Datos (Docker)
Para levantar la instancia de PostgreSQL con la configuración del proyecto, ejecutá en tu terminal:
```bash
docker run --name logitrack-postgres \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=1234 \
  -e POSTGRES_DB=logitrack_db \
  -p 5432:5432 -d postgres
```

### 3. Backend
1. Cloná el repositorio.
2. Navegá a la carpeta raíz del proyecto.
3. Verificá los datos de conexión en `src/main/resources/application.properties`.
4. Compilá y ejecutá el proyecto:
```bash
mvn spring-boot:run
```

### 4. Frontend
1. Navegá a la carpeta `/frontend`.
2. Con Live Server en VS Code: Clic derecho en `index.html` > *Open with Live Server*.

---

## Arquitectura de la Solución
El proyecto sigue una arquitectura de **capas (N-Tier)** para asegurar la escalabilidad y el mantenimiento:

* **Model:** Entidades JPA que mapean las tablas de PostgreSQL (Camiones, Choferes, Envíos, etc.).
* **Repository:** Interfaces que extienden de `JpaRepository` para el acceso a datos.
* **DTO (Data Transfer Objects):** Objetos para recibir y enviar datos de forma segura (ej. `EnvioRequestDTO`, `MetadatosDTO`).
* **Service:** Capa de lógica de negocio y transacciones `@Transactional`.
* **Controller:** Endpoints REST que exponen los servicios al Frontend.
* **Security:** Filtros JWT para autenticación stateless.

---

## Funcionalidades Principales (Sprint 1)
* **Autenticación:** Login seguro con roles (Supervisor, Operador, Chofer).
* **Gestión de Catálogos:** Endpoints centralizados para obtener listas de camiones, choferes y establecimientos.
* **Alta de Envíos:** Creación de viajes con generación de ID tipo "LT-XXXXXX" y registro automático de historial.
* **Tracking Básico:** Listado de envíos en tiempo real con su estado actual.
