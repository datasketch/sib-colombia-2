# syntax=docker/dockerfile:1
#
# Self-contained single-service image for Biodiversidad en Cifras.
#
# Two stages:
#   builder  — installs deps, builds the React SPA, and SEEDS the DuckDB
#              from the public SiB GitLab TSVs + Google Sheets CSVs.
#   runtime  — the Hono server serving the API + built SPA + baked DuckDB,
#              with the build-only bulk (downloads, web/src) stripped out.
#
# The DB is baked into the image (rebuild-on-deploy, mirroring the Deno
# Deploy pipeline) — no host dependency, no external data store required.
#
#   docker build -t biodiversidad-cifras .
#   docker run -p 3001:3001 biodiversidad-cifras
#   curl localhost:3001/api/health

# ---------------------------------------------------------------------------
# Builder
# ---------------------------------------------------------------------------
FROM denoland/deno:2.8.0 AS builder
WORKDIR /app

# The seeder shells out to `unzip` to extract the GitLab data ZIP
# (packages/db/download.ts). The base image doesn't ship it.
RUN apt-get update \
 && apt-get install -y --no-install-recommends unzip \
 && rm -rf /var/lib/apt/lists/*

# DENO_DIR is /deno-dir in the official image; keep it explicit so we can
# carry the populated cache into the runtime stage for offline startup.
ENV DENO_DIR=/deno-dir

# Full source (the .dockerignore drops host node_modules / dist / *.duckdb).
COPY . .

# Pin the data cut here, e.g. --build-arg SEED_ARGS=--gitlab-date=2026-05-31
# Empty default = latest published GitLab HEAD.
ARG SEED_ARGS=""

# Build the SPA (vite → packages/web/dist), seed the DuckDB, and warm the
# Deno module cache so the runtime stage can start without network.
RUN deno task build:web \
 && deno run -A packages/db/mod.ts ${SEED_ARGS} \
 && deno cache packages/api/mod.ts

# ---------------------------------------------------------------------------
# Runtime
# ---------------------------------------------------------------------------
FROM denoland/deno:2.8.0 AS runtime
WORKDIR /app

ENV DENO_DIR=/deno-dir \
    SIBDATA_ENV=production \
    PORT=3001

# `unzip` lets the seed pipeline extract the GitLab ZIP
# (packages/db/download.ts) — at build time and on any in-place re-seed.
RUN apt-get update \
 && apt-get install -y --no-install-recommends unzip \
 && rm -rf /var/lib/apt/lists/*

# Carry the warmed module cache (remote https imports + npm metadata).
COPY --from=builder --chown=deno:deno /deno-dir /deno-dir

# The built workspace, owned by the unprivileged deno user so DuckDB can
# open the baked DB read-write (and write its WAL) at runtime.
COPY --from=builder --chown=deno:deno /app /app

# Drop build-only bulk that the running server never touches. The seeder
# source + complementary CSVs stay (so the image can re-seed in place),
# but the multi-hundred-MB raw downloads do not.
RUN rm -rf \
      packages/db/data-raw/downloads \
      packages/db/data-raw/db-cifras-sib \
      packages/web/src \
      packages/web/node_modules \
      .vite tmp .git

EXPOSE 3001
USER deno

# Liveness via the new /api/health probe (no curl in the base image).
# `deno eval` runs with full permissions implicitly — no --allow-* flags.
HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 \
  CMD ["deno", "eval", "const p = Deno.env.get('PORT') ?? '3001'; const r = await fetch(`http://localhost:${p}/api/health`); Deno.exit(r.ok ? 0 : 1);"]

ENTRYPOINT ["deno", "run", "-A", "packages/api/mod.ts"]
