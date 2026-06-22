# Migration fixtures — kept for reference, slated for removal

These files were copied from the legacy **sib-colombia** Next.js site and
used during the migration for **validation** (the visual-contract / shape
checks that confirmed the Deno port matched the old site). They are **not**
the live data path.

What the running app actually uses instead:
- **Geometry** → `packages/api/static/geo/*.geojson`, served at `/static/geo/...`
  (being replaced by the single-origin cartography pipeline, an earlier stage).
- **Region data** → live DuckDB via the API; static profile JSONs under
  `packages/api/static/*.json`.

Contents here: per-region `.svg` silhouettes, three special-region
`.geojson` + `.json` (region-amazonia, reserva-forestal-la-planada,
resguardo-indigena-pialapi-pueblo-viejo), `tooltips.json`, and
`info/methodology.md`.

**Do not** add to these or wire new code to `/data/...`. They will be
deleted once the cartography pipeline lands; they remain only as a record
of what the migration validated against.
