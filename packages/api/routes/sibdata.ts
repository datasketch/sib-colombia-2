import { Hono } from "hono";
import { sibdata, type SibdataParams } from "../services/sibdata.ts";

const route = new Hono();

/**
 * GET /api/sibdata
 *
 * Unified biodiversity query function. Mirrors the R
 * reference `the reference sibdata()` 1:1 in parameter space and dispatch.
 * See PLAN_PHASE_7.1.md for the full spec + usage examples.
 *
 * Error handling lives in `mod.ts`'s central `app.onError` — throwing
 * `ValidationError` / `NotFoundError` from the service layer produces
 * the right HTTP shape without per-route try/catch.
 */
route.get("/", async (c) => {
  const q = (name: string): string | undefined => {
    const v = c.req.query(name);
    return v == null || v === "" ? undefined : v;
  };
  const b = (name: string): boolean | undefined => {
    const v = q(name);
    if (v == null) return undefined;
    return v === "1" || v === "true";
  };

  const region = q("region");
  if (!region) return c.json({ error: "region is required" }, 400);

  const params: SibdataParams = {
    region,
    tipo: q("tipo"),
    cobertura: q("cobertura"),
    tematica: q("tematica"),
    indicador: q("indicador"),
    grupo: q("grupo"),
    subregiones: b("subregiones") ?? false,
    with_parent: b("with_parent") ?? false,
    tidy: b("tidy") ?? true,
    n_especies: b("n_especies") ?? false,
    all_indicators: b("all_indicators") ?? false,
  };

  const result = await sibdata(params);
  return c.json(result);
});

export default route;
