/**
 * Simple template interpolation — port of glue::glue_data().
 * Replaces {key} placeholders with values from the data object.
 */
export function interpolate(
  template: string,
  data: Record<string, unknown>
): string {
  return template.replace(/\{(\w+)\}/g, (_match, key) => {
    const val = data[key];
    if (val == null) return "";
    return String(val);
  });
}
