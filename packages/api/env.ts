/**
 * Environment detection.
 *
 * Production mode is opt-in via SIBDATA_ENV=production. Anything else
 * (unset, "development", arbitrary) is treated as dev. Deno Deploy
 * production environments should set SIBDATA_ENV=production in the
 * project's env vars.
 */

export function isProduction(): boolean {
  return Deno.env.get("SIBDATA_ENV") === "production";
}

export function envLabel(): "production" | "development" {
  return isProduction() ? "production" : "development";
}
