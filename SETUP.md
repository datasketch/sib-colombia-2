# Instalación y operación — Biodiversidad en Cifras

Guía completa para instalar, construir y ejecutar la plataforma en **Ubuntu**
(20.04 / 22.04 / 24.04), de forma local o con Docker, y para regenerar los
datos y la cartografía. Todo lo necesario está aquí; no se requieren artefactos
externos.

Resumen del camino más corto:

```sh
# 1. dependencias del sistema (una vez)
sudo apt-get update && sudo apt-get install -y curl unzip git ca-certificates

# 2. Deno (una vez)
curl -fsSL https://deno.land/install.sh | sh
echo 'export DENO_INSTALL="$HOME/.deno"' >> ~/.bashrc
echo 'export PATH="$DENO_INSTALL/bin:$PATH"' >> ~/.bashrc
source ~/.bashrc
deno --version            # debe mostrar deno 2.8 o superior

# 3. clonar, sembrar datos, construir y arrancar
git clone <URL-del-repositorio> sib-colombia-2 && cd sib-colombia-2
deno task seed --gitlab-date=2026-05-31
deno task build
deno task start           # http://localhost:3001
```

---

## 1. Dependencias del sistema (Ubuntu)

### Para ejecutar la plataforma

| Paquete | Para qué |
|---------|----------|
| `curl`, `ca-certificates` | instalar Deno; descargas HTTPS |
| `git` | clonar el repositorio |
| `unzip` | la semilla descomprime el ZIP de datos de GitLab (`packages/db/download.ts`) |
| **Deno ≥ 2.8** | runtime único de la aplicación (ver §2) |

```sh
sudo apt-get update
sudo apt-get install -y curl unzip git ca-certificates
```

> **macOS:** funciona igual; instala lo mismo con Homebrew
> (`brew install deno git` — `unzip` y `curl` ya vienen con el sistema). El
> resto de la guía (semilla, build, run, Docker) es idéntico.

> **DuckDB** se instala solo: Deno descarga el binario precompilado
> (`@duckdb/node-api`, variante `linux-x64` / `linux-arm64`) la primera vez que
> se ejecuta la semilla o el servidor. En Ubuntu (glibc) no requiere compilador
> ni paquetes adicionales.
>
> **Node.js no es necesario.** El frontend (Vite 5 + React 18) se compila con
> Deno a través de su compatibilidad con npm (`deno run -A npm:vite build`).

### Para regenerar la cartografía (opcional — ver §6)

Los mapas (`packages/api/static/geo/*.geojson`) ya vienen generados, así que
**ejecutar la plataforma no requiere herramientas de geoprocesamiento**. Solo
si vas a regenerarlos desde los shapefiles fuente:

- El procesamiento usa librerías **npm que Deno descarga automáticamente** —
  `npm:shapefile@0.6.6` (lee ESRI Shapefile), `npm:mapshaper@0.6.102`
  (simplificación de geometría) y `d3-geo` (siluetas SVG). No requieren `apt`.
- **Opcional** — `gdal-bin` (incluye `ogr2ogr`) solo si necesitas convertir
  formatos geográficos que no maneje `npm:shapefile`:

  ```sh
  sudo apt-get install -y gdal-bin
  ```

### Para el camino con Docker

```sh
sudo apt-get install -y docker.io docker-compose-v2
sudo usermod -aG docker "$USER"   # cierra sesión y vuelve a entrar
```

---

## 2. Instalar Deno

```sh
curl -fsSL https://deno.land/install.sh | sh
```

Añade Deno al `PATH` (en `~/.bashrc` o `~/.profile`):

```sh
export DENO_INSTALL="$HOME/.deno"
export PATH="$DENO_INSTALL/bin:$PATH"
```

Verifica: `deno --version` (debe ser **2.8 o superior**).

---

## 3. Clonar el repositorio

```sh
git clone <URL-del-repositorio> sib-colombia-2
cd sib-colombia-2
```

---

## 4. Canalización de datos (genera la base DuckDB)

El repositorio **no incluye datos**. La semilla descarga las tablas públicas
del SiB Colombia desde GitLab más unas hojas complementarias, las valida y las
carga en `data/sibdata.duckdb`.

```sh
deno task seed --gitlab-date=2026-05-31     # corte hasta esa fecha
# o:
deno task seed                              # último corte publicado (HEAD)
deno task seed --gitlab-ref=<rama|tag|sha>  # un punto exacto del repositorio
```

Qué hace (`packages/db/mod.ts`):

1. Descarga el ZIP de datos del repositorio público de GitLab
   `sib-colombia/cifras-biodiversidad` (ruta `db-cifras-sib`) y lo descomprime.
2. Descarga las hojas complementarias (galerías, textos, FAQ, glosario,
   metodología).
3. Las ingiere en una base **DuckDB** unificada (~77 MB) con índices.
4. Registra la trazabilidad del corte (referencia + fecha de GitLab).

Requiere **salida a internet** hacia `gitlab.com` y Google Sheets. La primera
ejecución también descarga los módulos de Deno (se cachean para las siguientes).

**Elegir el corte sin editar código:** pasa `--gitlab-date` / `--gitlab-ref` en
la línea de comandos, o —para Docker— define `SEED_ARGS` (ver §5).

> **Sin internet hacia la fuente:** si ya tienes los TSV/CSV en disco,
> `deno task seed:local` los usa sin descargar nada.

---

## 5. Ejecutar

### Local (producción)

```sh
deno task build      # compila el SPA React → packages/web/dist
deno task start      # sirve API + SPA en http://localhost:3001
```

Cambiar el puerto: `PORT=8080 deno task start`.

### Local (desarrollo, recarga en caliente)

```sh
deno task dev        # API + servidor Vite en http://localhost:5173
```

### Docker

La base de datos se construye **dentro de la imagen**:

```sh
docker compose up --build           # construye (incluida la semilla) y arranca
docker compose up -d                # en segundo plano
curl localhost:3001/api/health
```

Fijar el corte de datos al construir, sin editar archivos:

```sh
SEED_ARGS="--gitlab-date=2026-05-31" docker compose up --build
# (o define SEED_ARGS en un archivo .env junto al docker-compose.yml)
```

---

## 6. Regenerar la cartografía (opcional)

Los GeoJSON de los mapas y las siluetas SVG ya están versionados, así que esto
**solo** hace falta si cambian los shapefiles fuente o la simplificación.

Coloca los shapefiles ESRI fuente (CRS EPSG:4326, ya listos para web) en
`cartography/downloads/` —carpeta ignorada por git— y luego ejecuta:

```sh
deno task geo:build
```

Lee los shapefiles ESRI fuente, simplifica la geometría con `mapshaper` y emite:

- GeoJSON de geometría pura en `packages/api/static/geo/` (las cifras se cruzan
  en vivo desde DuckDB; nunca se hornean en el GeoJSON).
- Siluetas SVG por región en `packages/web/public/data/<slug>/`.

Herramientas (descargadas por Deno; no requieren `apt`): `npm:shapefile`,
`npm:mapshaper`, `d3-geo`. `gdal-bin` solo como alternativa para conversiones de
formato (§1).

---

## 7. Configuración (variables de entorno)

Copia la plantilla y ajusta lo que necesites:

```sh
cp .env.example .env
```

| Variable | Por defecto | Para qué |
|----------|-------------|----------|
| `PORT` | `3001` | puerto del servidor (API + SPA) |
| `SIBDATA_ENV` | — | `production` en despliegue |
| `SIBDATA_DB_PATH` | `data/sibdata.duckdb` | ruta de la base DuckDB |
| `SEED_ARGS` | _(vacío)_ | argumentos de la semilla para el `build` de Docker |

### Fuentes de datos de la semilla (opcionales)

Todas tienen un valor por defecto que apunta a los repositorios públicos
actuales; defínelas solo si necesitas apuntar a otra fuente. Equivalen a las
banderas de `deno task seed` (la bandera, si se pasa, tiene prioridad).

| Variable | Por defecto | Para qué |
|----------|-------------|----------|
| `SIBDATA_GITLAB_DATE` | _(vacío)_ | corte por fecha (`YYYY-MM-DD`); = `--gitlab-date` |
| `SIBDATA_GITLAB_REF` | `main` | rama/etiqueta/SHA; = `--gitlab-ref` (excluyente con la fecha) |
| `SIBDATA_GITLAB_PROJECT` | repo público SiB | URL del proyecto GitLab de los TSV |
| `SIBDATA_GITLAB_PROJECT_ID` | `sib-colombia/cifras-biodiversidad` | ID/ruta del proyecto para la API REST |
| `SIBDATA_GITLAB_DATA_PATH` | `db-cifras-sib` | subcarpeta con los TSV |
| `SIBDATA_SHEET_DICTIONARY_ID` | hoja actual | Google Sheet del diccionario de indicadores |
| `SIBDATA_SHEET_TEXTOS_ID` | hoja actual | Google Sheet de textos editoriales / galerías |

El archivo `.env` **no se versiona** (está en `.gitignore`); solo se versiona
`.env.example`.

---

## 8. Verificar

```sh
curl -s http://localhost:3001/api/health      # {"ok":true,...}
```

Comprobaciones rápidas en el navegador (`http://localhost:3001`):

- Página principal (perfil de Colombia): `http://localhost:3001/`
- Un **departamento**: `/<slug>` — p. ej. `http://localhost:3001/boyaca`
- Un **municipio**: `/<departamento>/<municipio>` — p. ej. `/boyaca/tunja`
- Un **núcleo**: `/especial/<slug>` — p. ej. `/especial/nucleos-dfyb-agua-bonita`
- El **Explorador**: filtra por región/grupo/temática y descarga (CSV/XLSX/JSON).

> El slug es la última parte de la URL (sin `/region/` ni prefijos). Las cifras,
> los menús y los mapas se calculan en vivo desde DuckDB.

Verificación del código (opcional): `deno task check`.

---

## 9. Publicar detrás de un dominio (TLS)

La aplicación habla **HTTP** en su puerto (no termina TLS). En producción,
coloca un proxy inverso (nginx / Caddy) que termine TLS en 443 y reenvíe al
puerto de la app:

```
cliente ──443/TLS──▶ nginx ──HTTP──▶ app 127.0.0.1:3001
```

Ejemplo mínimo de nginx:

```nginx
server {
    listen 443 ssl;
    server_name cifras.example.gov.co;
    ssl_certificate     /ruta/fullchain.pem;
    ssl_certificate_key /ruta/privkey.pem;
    location / {
        proxy_pass http://127.0.0.1:3001;
        proxy_set_header Host $host;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```

Para que el servicio sobreviva a reinicios, usa `docker compose up -d`
(`restart: unless-stopped` ya está configurado) o un servicio `systemd` que
ejecute `deno task start`.

---

## 10. Problemas comunes

| Síntoma | Causa / solución |
|---------|------------------|
| `unzip: command not found` durante la semilla | falta `unzip` (§1) |
| La semilla falla al descargar | sin salida a internet hacia `gitlab.com` / Google Sheets |
| `/api/health` responde error tras arrancar | la base está vacía: corre `deno task seed` antes de `start` |
| El puerto 3001 está ocupado | usa otro: `PORT=8080 deno task start` |
| `deno: command not found` | Deno no está en el `PATH` (§2) |
| La primera ejecución tarda | Deno descarga sus módulos y el binario de DuckDB (se cachea) |

---

## Actualizar el corte de datos

Para publicar cifras de un corte distinto: vuelve a sembrar con la nueva fecha
y reconstruye.

```sh
deno task seed --gitlab-date=<nueva-fecha> && deno task build
# Docker:
SEED_ARGS="--gitlab-date=<nueva-fecha>" docker compose up --build
```
