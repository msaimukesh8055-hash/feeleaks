// src/lib/reports.ts
// Server-side helpers shared by publishing and editing reports.

import "server-only";
import { findCandidates, normaliseName } from "./matching";
import type { InstitutionChoice } from "./report-schema";
import { getStore } from "./store";
import type { Institution, InstitutionOption } from "./types";

export function toOption(institution: Institution): InstitutionOption {
  const { id, slug, name, city, state, type } = institution;
  return { id, slug, name, city, state, type };
}

export async function institutionOptions(name: string, city: string | null): Promise<InstitutionOption[]> {
  if (name.trim().length < 2) return [];
  const all = await getStore().listInstitutions();
  return findCandidates(all, name, city).map((c) => toOption(c.institution));
}

// Finds or creates the institution the reporter chose.
export async function resolveInstitution(choice: InstitutionChoice): Promise<Institution> {
  const store = getStore();
  if (choice.mode === "existing") {
    const institution = await store.getInstitution(choice.id);
    if (!institution) throw new Error("That institution no longer exists. Please choose again.");
    if (choice.nameAsWritten && normaliseName(choice.nameAsWritten) !== normaliseName(institution.name)) {
      await store.addInstitutionAlias(institution.id, choice.nameAsWritten);
    }
    return institution;
  }

  const input = choice.institution;
  const all = await store.listInstitutions();
  const sameName = all.find(
    (i) =>
      normaliseName(i.city) === normaliseName(input.city) &&
      [i.name, ...i.aliases].some((n) => normaliseName(n) === normaliseName(input.name)),
  );
  if (sameName) return sameName;
  return store.createInstitution(input, []);
}
