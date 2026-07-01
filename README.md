# Biodiversidad en Cifras

Plataforma de cifras de biodiversidad de Colombia: un único servicio en
**Deno + Hono + React** que sirve la API, los mapas y el sitio web desde un
solo puerto. Los datos se construyen a partir de las tablas públicas del SiB
Colombia (GitLab) y unas hojas complementarias, y se cargan en una base
**DuckDB** que la aplicación consulta en vivo.

```
Tablas públicas (GitLab) ─┐
                          ├─→ semilla (packages/db) ─→ data/sibdata.duckdb
Hojas complementarias  ───┘                                   │
                                                              ▼
                                                   servidor Hono (packages/api)
                                                   ├─ /api/*        consultas DuckDB
                                                   ├─ /static/geo/* mapas GeoJSON
                                                   └─ *             SPA React (packages/web)
                                                              │
                                                       un solo puerto :3001
```

## Arranque rápido

Este repositorio **no incluye datos**: cualquiera que lo clone reconstruye la
base de datos ejecutando la canalización (descarga las cifras públicas y las
carga en DuckDB). Hay dos caminos; elige uno.

### Opción A — Docker (lo más simple)

```sh
docker compose up --build
# luego:
curl localhost:3001/api/health        # {"ok":true,...}
# abre http://localhost:3001
```

La base de datos se construye **dentro de la imagen** durante el `build`. Por
defecto toma el último corte publicado en GitLab; para fijar una fecha:

```sh
SEED_ARGS="--gitlab-date=2026-05-31" docker compose up --build
```

### Opción B — Deno local

```sh
deno task seed --gitlab-date=2026-05-31   # descarga + carga DuckDB (~1–3 min)
deno task build                           # compila el frontend React
deno task start                           # sirve en http://localhost:3001
```

Para desarrollo con recarga en caliente: `deno task dev` (API + Vite en
http://localhost:5173).

## Requisitos

- **Deno ≥ 2.8** y **unzip**; o **Docker** para la Opción A.
- Salida a internet la primera vez (descarga las cifras de GitLab, las hojas
  complementarias y los módulos de Deno).

La guía completa de instalación en Ubuntu —dependencias del sistema, la
canalización de datos, el procesamiento cartográfico y el despliegue— está en
**[`SETUP.md`](./SETUP.md)**.

## Estructura

```
.
├── deno.json            # workspace + tareas
├── packages/
│   ├── shared/          # tipos TypeScript compartidos
│   ├── db/              # semilla: GitLab + hojas → DuckDB
│   ├── api/             # servidor Hono (API + mapas + SPA)
│   │   └── static/geo/  # mapas GeoJSON (ya generados)
│   └── web/             # frontend React + Vite
├── Dockerfile
└── docker-compose.yml
```

## Datos

La aplicación lee de `data/sibdata.duckdb`, que **tú generas** con
`deno task seed`. El corte de datos se elige al sembrar:

| Cómo | Resultado |
|------|-----------|
| `deno task seed` | último corte publicado en GitLab |
| `deno task seed --gitlab-date=2026-05-31` | último commit hasta esa fecha |
| `deno task seed --gitlab-ref=<rama\|tag\|sha>` | un punto exacto del repositorio |

Ver `SETUP.md` §«Canalización de datos» para los detalles y para actualizar el
corte sin editar código.

### Cuidado: la estructura de temáticas afecta toda la navegación

La tabla `tematica` define el árbol de temáticas que alimenta **la navegación
del sitio y los filtros del explorador**. Cambiar su estructura en la fuente
(relaciones `parent`/`slug`, el `orden`, o el campo `activa`) puede **romper la
navegación de todo el sitio y ocultar categorías del explorador**.

Puntos clave:

- Solo se muestran las filas con **`activa = TRUE`**: el árbol de temáticas
  (`/api/tematicas/tree`) filtra `WHERE activa = TRUE`. Si una subcategoría
  llega como `FALSE`, desaparece del explorador (por ejemplo, los apéndices de
  CITES o las subcategorías de exóticas).
- Las correcciones se hacen **en la fuente de datos** (GitLab / hojas), no
  editando archivos locales.
- El archivo [`docs/tematica-muestra.csv`](./docs/tematica-muestra.csv) es una
  **muestra de referencia** con una estructura conocida y correcta (incluye qué
  filas deben quedar en `activa=TRUE`). Compárala con tu `tematica` de origen
  antes de una resiembra de producción.

## Licencia

Ver [`LICENSE`](./LICENSE).
