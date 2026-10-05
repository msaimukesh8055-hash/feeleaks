// src/lib/accountability.ts
// Looks up the sourced rules, authorities, declared fees and inflation figures
// that apply to an institution.

import { AUTHORITIES } from "@/data/authorities";
import { DECLARED_FEES } from "@/data/declared-fees";
import { INFLATION } from "@/data/inflation";
import { RULES } from "@/data/rules";
import type { Authority, DeclaredFee, InflationFigure, Rule } from "@/data/types";
import type { FlagKind, Institution } from "./types";

function matches(list: string[] | null, value: string | null): boolean {
  if (list === null) return true;
  if (!value) return false;
  return list.some((item) => item.toLowerCase() === value.toLowerCase());
}

function appliesTo(
  entry: { states: string[] | null; boards: string[] | null; institutionTypes: string[] | null },
  institution: Institution,
): boolean {
  return (
    matches(entry.states, institution.state) &&
    matches(entry.boards, institution.board) &&
    matches(entry.institutionTypes, institution.type)
  );
}

export function rulesFor(institution: Institution, flag: FlagKind): Rule[] {
  return RULES.filter((rule) => rule.flagKinds.includes(flag) && appliesTo(rule, institution));
}

export function authoritiesFor(institution: Institution): Authority[] {
  return AUTHORITIES.filter((authority) => appliesTo(authority, institution));
}

export function declaredFeesFor(institution: Institution): DeclaredFee[] {
  return DECLARED_FEES.filter((fee) => fee.institutionSlug === institution.slug);
}

export function inflationFor(academicYear: string): InflationFigure | null {
  return INFLATION.find((figure) => figure.year === academicYear) ?? null;
}
