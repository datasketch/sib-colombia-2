import acronymsData from "../data/acronyms.json";

interface AcronymEntry {
  sigla: string;
  significado: string;
  categoria: string;
  aliases?: string[];
}

// Build an exact-match lookup once: each sigla plus its aliases → meaning.
// Keys are matched exactly (case-sensitive) — siglas like "CR"/"EN" must not
// match lowercase prose, and "SiB" must not match "Sib"/"sib".
const MEANINGS = new Map<string, string>();
for (const entry of acronymsData.siglas as AcronymEntry[]) {
  MEANINGS.set(entry.sigla, entry.significado);
  for (const alias of entry.aliases ?? []) MEANINGS.set(alias, entry.significado);
}

/** Full meaning for an acronym, or `undefined` if it isn't in the dictionary. */
export function acronymMeaning(sigla: string): string | undefined {
  return MEANINGS.get(sigla);
}
