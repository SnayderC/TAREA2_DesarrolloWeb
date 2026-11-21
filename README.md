# API Catálogo de Productos con Favoritos y Roles

API REST construida con **Node.js + Express + PostgreSQL** que gestiona un catálogo de productos y la lista de favoritos de cada usuario, con **autenticación JWT** y **autorización por roles** (`usuario`, `admin`).

Tarea 2 — Desarrollo Web, UNEMI.

**Autor:** Snayder Cedeño (todos los módulos).

---

## Contenido

1. [Propósito](#1-propósito)
2. [Base de datos elegida y justificación](#2-base-de-datos-elegida-y-justificación)
3. [Requisitos](#3-requisitos)
4. [Instalación](#4-instalación)
5. [Variables de entorno](#5-variables-de-entorno)
6. [Inicialización de datos y del admin](#6-inicialización-de-datos-y-del-admin)
7. [Comandos de ejecución](#7-comandos-de-ejecución)
8. [Rutas de la API](#8-rutas-de-la-api)
9. [Formato de respuestas y códigos de error](#9-formato-de-respuestas-y-códigos-de-error)
10. [Decisión: favoritos al borrar un producto](#10-decisión-favoritos-al-borrar-un-producto)
11. [Pruebas con Postman](#11-pruebas-con-postman)
12. [Estructura del proyecto](#12-estructura-del-proyecto)
13. [Seguridad](#13-seguridad)
14. [Herramientas de apoyo usadas](#14-herramientas-de-apoyo-usadas)

---

## 1. Propósito

- Cualquier persona puede **consultar** el catálogo y filtrarlo por categoría.
- Solo un **admin** puede **crear, editar y eliminar** productos.
- Cada usuario registrado puede guardar productos como **favoritos**. Cada usuario ve y modifica **solo los suyos**.
- El registro público **siempre** crea cuentas con rol `usuario`. El admin se crea con un script, nunca desde la API.

## 2. Base de datos elegida y justificación

Se eligió **PostgreSQL 16**, con el driver [`pg`](https://node-postgres.com/).

El dominio es **relacional**: un usuario tiene muchos favoritos y cada favorito apunta a un producto. Una base relacional permite que **la propia base de datos garantice la consistencia**, como segunda barrera además de la validación del servidor:

| Regla del negocio | Cómo la garantiza PostgreSQL |
|---|---|
| No puede haber dos usuarios con el mismo correo | `UNIQUE (correo)` → la API responde **409** |
| Un producto no puede estar dos veces en los favoritos de un usuario | `PRIMARY KEY (usuario_id, producto_id)` → **409** |
| No puede haber favoritos de productos inexistentes | `FOREIGN KEY ... REFERENCES productos(id)` → **404** |
| Al borrar un producto no quedan favoritos huérfanos | `ON DELETE CASCADE` |
| El precio siempre es positivo | `CHECK (precio > 0)` |
| El rol solo puede ser `usuario` o `admin` | `CHECK (rol IN ('usuario', 'admin'))` |

Todo el SQL vive en [db/schema.sql](db/schema.sql). La base corre en Docker, así que la instalación es igual en cualquier equipo.

## 3. Requisitos

- **Node.js 20 LTS o superior**. El proyecto usa `--env-file` y `--watch` nativos de Node, por eso no necesita `dotenv` ni `nodemon`.
- **Docker** con **Docker Compose** para PostgreSQL. Si ya tienes un PostgreSQL 16 instalado, puedes usarlo: crea la base y ajusta `DATABASE_URL`.
- **Postman** para ejecutar las pruebas.

## 4. Instalación

```bash
git clone https://github.com/SnayderC/TAREA2_DesarrolloWeb.git
cd TAREA2_DesarrolloWeb

npm ci                     # instala exactamente las versiones de package-lock.json
cp .env.example .env       # en Windows (PowerShell): Copy-Item .env.example .env
```

Edita `.env`: como mínimo, cambia `JWT_SECRET` y `ADMIN_PASSWORD` (ver la sección 5).

Levanta PostgreSQL:

```bash
docker compose up -d
docker compose ps          # esperar a que el estado diga "healthy"
```

> El contenedor publica PostgreSQL en el puerto **5433** del host (no en el 5432), para no chocar con otro PostgreSQL instalado en el equipo.

## 5. Variables de entorno

Se definen en `.env`, que **no se sube al repositorio**. La plantilla es [.env.example](.env.example).

| Variable | Ejemplo | Descripción |
|---|---|---|
| `PORT` | `3000` | Puerto HTTP de la API |
| `DATABASE_URL` | `postgresql://catalogo:catalogo_dev@localhost:5433/catalogo` | Conexión a PostgreSQL. Coincide con `docker-compose.yml` |
| `JWT_SECRET` | *(valor largo y aleatorio)* | Clave para firmar los tokens. **Obligatoria** |
| `JWT_EXPIRES_IN` | `1h` | Duración de los tokens |
| `ADMIN_NOMBRE` | `Administrador` | Nombre del admin que crea el script |
| `ADMIN_CORREO` | `admin@ejemplo.com` | Correo del admin |
| `ADMIN_PASSWORD` | *(mínimo 8 caracteres)* | Contraseña del admin |

Si falta `DATABASE_URL` o `JWT_SECRET`, el servidor **no arranca** y muestra qué variable falta (ver [src/config/env.js](src/config/env.js)).

Para generar un `JWT_SECRET` seguro:

```bash
node -e "console.log(require('node:crypto').randomBytes(48).toString('hex'))"
```

## 6. Inicialización de datos y del admin

```bash
npm run db:init        # crea las tablas (schema.sql) e inserta 8 productos de ejemplo (seed.sql)
npm run crear-admin    # crea el usuario admin con los valores ADMIN_* del .env
```

Los dos comandos se pueden ejecutar varias veces sin problema:
- `db:init` usa `CREATE TABLE IF NOT EXISTS`, y el seed solo inserta si la tabla de productos está vacía.
- `crear-admin` usa `INSERT ... ON CONFLICT (correo) DO NOTHING`: si el admin ya existe, no lo duplica. Si el correo pertenece a un usuario normal, avisa y **no** lo convierte en admin.

## 7. Comandos de ejecución

| Comando | Qué hace |
|---|---|
| `npm start` | Arranca la API en `http://localhost:3000` |
| `npm run dev` | Igual que `start`, pero se reinicia sola al guardar cambios (`node --watch`) |
| `npm run db:init` | Crea el esquema y carga los productos de ejemplo |
| `npm run crear-admin` | Crea el admin (idempotente) |
| `npm run token:expirado` | Imprime un JWT con firma válida pero **vencido**, para la prueba de 401 |
| `docker compose up -d` / `docker compose stop` | Inicia o detiene PostgreSQL. Los datos se guardan en el volumen `catalogo_data` |

## 8. Rutas de la API

Todas las rutas llevan el prefijo **`/api`**. Las rutas protegidas exigen el header `Authorization: Bearer <token>`.

| Método | Ruta | Acceso | Éxito | Errores posibles |
|---|---|---|---|---|
| POST | `/api/auth/registro` | Público | 201 | 400, 422, 409 |
| POST | `/api/auth/login` | Público | 200 | 400, 422, 401 |
| GET | `/api/productos?categoria=x` | Público | 200 | 400 |
| GET | `/api/productos/:id` | Público | 200 | 400, 404 |
| POST | `/api/productos` | **Admin** | 201 | 400, 422, 401, 403 |
| PUT | `/api/productos/:id` | **Admin** | 200 | 400, 422, 401, 403, 404 |
| DELETE | `/api/productos/:id` | **Admin** | 204 | 400, 401, 403, 404 |
| GET | `/api/favoritos` | Autenticado | 200 | 401 |
| POST | `/api/favoritos` | Autenticado | 201 | 400, 422, 401, 404, 409 |
| DELETE | `/api/favoritos/:productoId` | Autenticado | 204 | 400, 401, 404 |

### Auth

**`POST /api/auth/registro`**

```json
{ "nombre": "Usuario A", "correo": "usuarioa@ejemplo.com", "password": "Clave_Prueba_2026" }
```

- Solo se leen `nombre`, `correo` y `password`. Cualquier otro campo se **ignora**; enviar `"rol": "admin"` no tiene efecto.
- Al correo se le quitan los espacios de los extremos y se pasa a minúsculas. La contraseña debe tener al menos 8 caracteres y se guarda con hash **bcrypt** (10 salt rounds).

Respuesta `201` (nunca incluye la contraseña ni su hash):

```json
{ "data": { "id": 3, "nombre": "Usuario A", "correo": "usuarioa@ejemplo.com", "rol": "usuario", "creado_en": "2026-11-21T16:00:00.000Z" } }
```

**`POST /api/auth/login`**

```json
{ "correo": "usuarioa@ejemplo.com", "password": "Clave_Prueba_2026" }
```

Respuesta `200`:

```json
{ "data": { "token": "eyJhbGciOiJIUzI1NiIs...", "usuario": { "id": 3, "nombre": "Usuario A", "correo": "usuarioa@ejemplo.com", "rol": "usuario" } } }
```

- El token es un JWT firmado con `HS256`. Su payload es `{ sub: <id del usuario>, rol, iat, exp }` y expira según `JWT_EXPIRES_IN`.
- Si el correo no existe o la contraseña es incorrecta, la respuesta es la **misma**: `401 "Credenciales inválidas"`. Así no se puede averiguar qué correos están registrados.

### Productos

**`GET /api/productos`** devuelve todos los productos. Con `?categoria=tecnologia` filtra por categoría **sin distinguir mayúsculas** (`LOWER(categoria) = LOWER($1)`).

```json
{ "data": [ { "id": 1, "nombre": "Laptop Orion 14", "descripcion": "Portátil de 14 pulgadas, 16 GB RAM, 512 GB SSD", "categoria": "Tecnologia", "precio": 899.99, "creado_en": "...", "actualizado_en": "..." } ] }
```

**`GET /api/productos/:id`** devuelve un producto: `{ "data": { ... } }`.

**`POST /api/productos`** (admin) y **`PUT /api/productos/:id`** (admin) reciben el mismo cuerpo:

```json
{ "nombre": "Teclado Mecánico", "descripcion": "Switches rojos, 87 teclas", "categoria": "Tecnologia", "precio": 59.90 }
```

- Los cuatro campos son obligatorios, porque `PUT` es un **reemplazo completo**.
- `precio` debe ser un número mayor que 0, con máximo 2 decimales.
- `PUT` también actualiza `actualizado_en`.

**`DELETE /api/productos/:id`** (admin) responde `204` sin cuerpo.

### Favoritos

El usuario **siempre** se obtiene del token (`req.usuario.id`), nunca del body ni de la URL.

**`GET /api/favoritos`** devuelve los productos favoritos del usuario autenticado, con la fecha en que los agregó:

```json
{ "data": [ { "id": 1, "nombre": "Laptop Orion 14", "categoria": "Tecnologia", "precio": 899.99, "agregado_en": "2026-11-21T16:10:00.000Z", "...": "..." } ] }
```

**`POST /api/favoritos`**

```json
{ "productoId": 1 }
```

- Respuesta `201` con el producto agregado.
- Si el body incluye `usuarioId`, se **ignora**.
- Si el producto ya está en favoritos → 409. Si el producto no existe → 404.

**`DELETE /api/favoritos/:productoId`** responde `204`. La consulta es `DELETE ... WHERE usuario_id = $1 AND producto_id = $2`. Si no se borra ninguna fila, la respuesta es **404**. Por eso un usuario B **no puede borrar el favorito de A**: para B ese favorito no existe.

## 9. Formato de respuestas y códigos de error

Respuestas exitosas: `{ "data": ... }`. Las respuestas `204` no llevan cuerpo.

Todos los errores tienen el mismo formato:

```json
{
  "error": {
    "codigo": "VALIDACION",
    "mensaje": "Datos inválidos",
    "detalles": [ { "campo": "precio", "mensaje": "Debe ser mayor que 0" } ]
  }
}
```

### Criterio 400 vs 422

| Código | Cuándo | Ejemplos |
|---|---|---|
| **400 Bad Request** | La petición está **mal formada**: el servidor no puede ni interpretarla | JSON inválido; `:id` o `productoId` que no es un entero positivo (`/productos/abc`); `?categoria=` vacío o repetido; body que no es un objeto |
| **422 Unprocessable Entity** | La petición está **bien formada**, pero los **valores** no cumplen las reglas | Campos vacíos; correo con formato inválido; contraseña de menos de 8 caracteres; precio ≤ 0 o no numérico; falta `productoId` |

### Otros códigos

| Código | `error.codigo` | Cuándo |
|---|---|---|
| 401 | `NO_AUTENTICADO` | No se envió token, o no tiene el formato `Bearer <token>` |
| 401 | `TOKEN_INVALIDO` | Firma incorrecta o token alterado |
| 401 | `TOKEN_EXPIRADO` | El token venció |
| 401 | `CREDENCIALES_INVALIDAS` | Login con correo o contraseña incorrectos |
| 403 | `PROHIBIDO` | Autenticado, pero sin el rol necesario (un `usuario` intentando modificar productos) |
| 404 | `NO_ENCONTRADO` / `RUTA_NO_ENCONTRADA` | El recurso o la ruta no existe |
| 409 | `DUPLICADO` | Correo ya registrado o favorito repetido |
| 413 | `CUERPO_DEMASIADO_GRANDE` | El body supera 10 kB |
| 500 | `ERROR_INTERNO` | Error inesperado. El detalle se registra en la consola del servidor y **nunca** se envía al cliente |

El [manejador de errores](src/middlewares/manejadorErrores.js) también traduce los errores de PostgreSQL: `23505` (unique) → 409, `23503` (foreign key) → 404, `22P02` y `23514` (formato o check) → 422.

## 10. Decisión: favoritos al borrar un producto

**Cuando un admin elimina un producto, sus favoritos se eliminan en cascada** (`ON DELETE CASCADE` en la tabla `favoritos`).

- **Por qué:** un favorito que apunta a un producto que ya no existe no tiene utilidad, y mostrarlo obligaría a manejar "productos fantasma" en el listado. Con la cascada, la base de datos garantiza que **nunca** haya favoritos huérfanos, sin código adicional en la API.
- **Consecuencia:** el usuario deja de ver ese producto en `GET /api/favoritos` sin recibir aviso. Para un catálogo es un comportamiento aceptable.

## 11. Pruebas con Postman

Archivos en [postman/](postman/):
- `Catalogo.postman_collection.json`: 57 peticiones en 7 carpetas, cada una con tests (`pm.test`) que verifican el código HTTP y los campos relevantes.
- `Catalogo.postman_environment.example.json`: entorno con `baseUrl` (los tokens y los ids se completan solos durante la ejecución).

Además, en **todas** las peticiones se comprueba que ninguna respuesta contenga `password_hash` y que los errores tengan el formato estándar.

### Preparación (una sola vez)

1. Importar en Postman la colección y el entorno, y seleccionar el entorno **"Catálogo - Local"**.
2. En el entorno, **agregar** estas variables (quedan solo en tu Postman y no se suben al repositorio):
   - `adminCorreo` y `adminPassword`: los mismos valores de `ADMIN_CORREO` y `ADMIN_PASSWORD` del `.env`.
   - `tokenExpirado`: pegar la salida de `npm run token:expirado`.
3. Tener la API corriendo (`npm start`), con la base inicializada y el admin creado.

### Ejecución

1. Con el **Collection Runner**, ejecutar las carpetas **1 a 6** en orden:

   | Carpeta | Qué prueba |
   |---|---|
   | 1. Auth | Registro (201, rol `usuario`, sin hash), intento de registrarse como admin, correo duplicado (409), login (200 + token), credenciales incorrectas (401) |
   | 2. Productos (admin) | Crear, listar, filtrar por categoría, ver, actualizar, eliminar, ver eliminado (404) |
   | 3. Validación | Precio 0 / negativo / texto, campos vacíos (422), JSON inválido e id no numérico (400), inexistentes (404) |
   | 4. Seguridad | Sin token, formato inválido, token manipulado y token vencido (401); crear, editar y borrar con rol usuario (403) |
   | 5. Favoritos | Agregar (201), listar, duplicado (409), producto inexistente (404), quitar (204) |
   | 6. Aislamiento A-B | A agrega un favorito → B no lo ve → B intenta borrarlo (404) → A lo sigue teniendo |

2. **Prueba de persistencia:** detener el servidor (`Ctrl + C`), volver a arrancarlo (`npm start`) y ejecutar la carpeta **7. Persistencia (tras reiniciar)** con el mismo entorno. Comprueba que el producto, el usuario A y su favorito creados antes **siguen en la base de datos**.

> Para reiniciar también la base de datos: `docker compose restart db`. Los datos se mantienen porque están en un volumen de Docker.

La colección se puede ejecutar varias veces: los correos de registro llevan `{{$timestamp}}`, así que no se producen 409 inesperados.

### Opcional: ejecutar desde la terminal con Newman

```bash
npx newman run postman/Catalogo.postman_collection.json \
  -e postman/Catalogo.postman_environment.example.json \
  --env-var "adminCorreo=<ADMIN_CORREO>" --env-var "adminPassword=<ADMIN_PASSWORD>" \
  --env-var "tokenExpirado=$(npm run -s token:expirado)" \
  --folder "1. Auth" --folder "2. Productos (admin)" --folder "3. Validación" \
  --folder "4. Seguridad" --folder "5. Favoritos" --folder "6. Aislamiento A-B" \
  --export-environment entorno-run.json
# reiniciar el servidor y luego:
npx newman run postman/Catalogo.postman_collection.json -e entorno-run.json \
  --folder "7. Persistencia (tras reiniciar)"
```

> `entorno-run.json` contiene tokens vigentes: bórralo al terminar y no lo subas al repositorio.

## 12. Estructura del proyecto

```
src/
├── server.js            # Solo arranca el servidor HTTP
├── app.js               # Middlewares, rutas y manejador de errores
├── config/              # env.js (valida variables) y db.js (pool de pg)
├── routes/              # Método + ruta + middlewares + controlador
├── controllers/         # Lee req, valida, llama al repositorio, arma la respuesta
├── repositories/        # ÚNICO lugar con SQL
├── middlewares/         # autenticar, autorizar, noEncontrado, manejadorErrores
├── validators/          # Validación de body, params y query
└── utils/ApiError.js    # Error con status, código y detalles
db/                      # schema.sql y seed.sql
scripts/                 # init-db, crear-admin, token-expirado
postman/                 # Colección y entorno
```

**Flujo de una petición:** Postman → **ruta** → middlewares (`autenticar` → `autorizar`) → **controlador** (valida) → **repositorio** (SQL parametrizado) → **PostgreSQL** → respuesta JSON. Si algo falla en cualquier paso, el error llega al `manejadorErrores`. Express 5 reenvía automáticamente los errores lanzados en funciones `async`.

**Regla de capas:** los controladores nunca escriben SQL y los repositorios nunca usan `req` ni `res`.

## 13. Seguridad

- **Contraseñas:** se guardan con hash `bcryptjs` y nunca se devuelven. En la tabla `usuarios` los repositorios eligen las columnas una por una, sin `SELECT *`. Si el correo no existe, el login igual ejecuta `bcrypt.compare` contra un hash de relleno, para que la respuesta tarde lo mismo y no revele qué correos existen.
- **JWT:** `jwt.verify` comprueba la firma y la expiración y acepta solo el algoritmo `HS256`, lo que impide ataques como `alg: none`. Cambiar el payload (por ejemplo, poner `rol: admin`) invalida la firma.
- **Roles:** el rol se fija como `'usuario'` en el propio SQL del registro. El admin solo se puede crear con `npm run crear-admin`.
- **SQL injection:** todas las consultas usan parámetros (`$1, $2...`); nunca se concatena la entrada del usuario.
- **Body limitado a 10 kB** con `express.json({ limit: '10kb' })`.
- **Secretos:** solo en `.env`, que está en `.gitignore`. Los datos de ejemplo son ficticios.

## 14. Herramientas de apoyo usadas

- **Claude (Anthropic), a través de Claude Code:** asistente de programación usado durante el desarrollo para:
  - Proponer la estructura por capas y el orden de implementación.
  - Generar una primera versión del código de cada módulo (configuración, esquema SQL, CRUD de productos, validaciones, manejador de errores, registro y login, middlewares `autenticar` y `autorizar`, scripts `crear-admin` y `token-expirado`, favoritos).
  - Generar la colección de Postman y este README.
  - Probar cada etapa con `curl` y Newman.

  Todo el código incorporado fue revisado, probado y comprendido por el autor, que puede explicar cada decisión. Entre ellas: el criterio 400/422, el uso de `ON CONFLICT DO NOTHING` para que `crear-admin` no duplique, el filtro por `usuario_id` que aísla los favoritos, y por qué un token con el payload alterado se rechaza.
- **Postman / Newman:** pruebas de la API.
- **Docker:** base de datos PostgreSQL reproducible.
