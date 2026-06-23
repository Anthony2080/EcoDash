# EcoDash

Sistema de gestión de envíos eco-friendly.

## Estructura del proyecto

```
EcoDash/
├── backend/                  # Código Django (API + lógica)
│   ├── apps/                 #   Aplicaciones (usuarios, clientes, repartidores, etc.)
│   ├── config/               #   Configuración (settings, urls, wsgi, asgi)
│   ├── manage.py
│   ├── requirements.txt
│   ├── DockerFile
│   └── .env                  # Variables de entorno local
├── frontend/                 # Frontend (static + nginx)
│   ├── nginx.conf            #   Configuración de nginx
│   ├── static/               #   CSS, JS, imágenes
│   └── templates/            #   Plantillas HTML
├── database/                 # Scripts SQL
│   └── EcoDash-db.sql
├── docker-compose.yml        # Orquestación Docker (3 servicios)
└── .gitignore
```

## Levantar con Docker (recomendado)

```bash
# 1. Construir y levantar todos los servicios
docker compose up --build

# 2. Aplicar migraciones (en otra terminal o esperar a que levante)
docker compose exec backend python manage.py migrate
```

La app queda disponible en **http://localhost:3000/**.

### Servicios

| Servicio    | Puerto | Container name      | Descripción                         |
|-------------|--------|---------------------|-------------------------------------|
| `database`  | 3306   | `ecodash_database`  | MySQL 8.0                           |
| `backend`   | —      | `ecodash_backend`   | Django (interno, no expuesto)       |
| `frontend`  | 3000   | `ecodash_frontend`  | nginx (archivos estáticos + proxy)  |

> **Puerto 3000** es el punto de entrada. nginx sirve `/static/` directamente y redirige el resto a Django.

### Comandos útiles

```bash
# Ver logs
docker compose logs -f

# Reconstruir después de cambios en requirements.txt
docker compose build backend

# Detener
docker compose down

# Detener y borrar volúmenes (borra datos de BD)
docker compose down -v
```

## Desarrollo local (sin Docker)

**Requisitos:** Python 3.12+, MySQL 8+ corriendo en `localhost:3306`.

```bash
# 1. Entorno virtual
python -m venv .venv
# Windows: .venv\Scripts\activate
# Linux/macOS: source .venv/bin/activate

# 2. Dependencias
pip install -r backend/requirements.txt

# 3. Configurar BD
#    Crear la base de datos:
#    CREATE DATABASE EcoDash_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
#    Ajustar backend/.env si es necesario (DB_USER, DB_PASSWORD)

# 4. Migraciones
cd backend
python manage.py migrate

# 5. Servidor
python manage.py runserver
```

## Frontend

El frontend son **plantillas HTML + CSS/JS estáticos**. En Docker, nginx sirve los archivos estáticos y redirige las páginas a Django.

| Archivo                    | Descripción                              |
|----------------------------|------------------------------------------|
| `frontend/nginx.conf`      | Configuración de nginx (proxy + static)  |
| `frontend/templates/`      | Plantillas HTML (Django Templates)       |
| `frontend/static/`         | CSS, JS, imágenes                        |

Para trabajar en el frontend, editá los archivos en `frontend/` y refrescá el navegador.

### Iconos

Se usa **Hugeicons** vía CDN. Los estilos y scripts usan sus clases (`hgi-stroke hgi-{nombre}`). Ver [catálogo de iconos](https://hugeicons.com/icons).

## Rutas disponibles

| Ruta           | Descripción             |
|----------------|-------------------------|
| `/`            | Landing page            |
| `/acceso/`     | Iniciar sesión / registro |
| `/panel/`      | Dashboard               |
| `/admin/`      | Administración Django   |
