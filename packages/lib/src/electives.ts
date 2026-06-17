/**
 * Course offerings per grade — ISO pilot.
 *
 * Source of truth for which subjects are compulsory and which elective bundles
 * a student picks from. Currently hard-coded from etl/parse_workbook.py /
 * course_offerings() which reads the official AY 2026/27 .doc circulars.
 *
 * When we onboard school #2, these move to the database (elective_bundles +
 * elective_options tables already exist — see schema/001_init.sql) so each
 * school can define their own. For Tier 1 demo, in-app data is fine.
 */

export type Bundle = { label: string; options: string[] };

export type GradeOffering = {
  stage: "IGCSE" | "AS" | "A2";
  pick_count: number;
  compulsory: string[];                   // subject codes that ALL students take
  language_alt: Record<string, string[]>; // e.g. {"Ar": ["F2","F3"]} = swap Arabic for French
  bundles: Bundle[];                      // pick one option per bundle
};

export const OFFERINGS: Record<"9" | "10" | "11" | "12", GradeOffering> = {
  "9": {
    stage: "IGCSE",
    pick_count: 5,
    compulsory: ["Ma", "En", "Ar", "SSA", "IS"],
    language_alt: { "Ar": ["F2", "F3"] },
    bundles: [
      { label: "Science 1",        options: ["Ph", "BS"] },
      { label: "Science 2",        options: ["Ch", "dv"] },
      { label: "Science 3",        options: ["Bi", "IT"] },
      { label: "Humanities/Arts",  options: ["Ec", "Hi", "rt"] },
      { label: "Activity",         options: ["PE", "rt"] },
    ],
  },
  "10": {
    stage: "IGCSE",
    pick_count: 5,
    compulsory: ["Ma", "En", "Ar", "SSA", "IS"],
    language_alt: { "Ar": ["F2", "F3"] },
    bundles: [
      { label: "Science 1",   options: ["Ph", "Bi"] },
      { label: "Science 2",   options: ["Ch", "dv"] },
      { label: "Applied/Arts",options: ["IT", "BS", "rt"] },
      { label: "Humanities",  options: ["Hi", "Bi SS", "Ec"] },
      { label: "Activity",    options: ["PE", "rt"] },
    ],
  },
  "11": {
    stage: "AS",
    pick_count: 3,
    compulsory: ["Ma", "En", "Ar", "IS", "CV"],
    language_alt: {},
    bundles: [
      { label: "Science/Business 1", options: ["Ph", "BS"] },
      { label: "Science/Business 2", options: ["Ch", "Ec"] },
      { label: "Bio/IT",             options: ["Bi", "IT"] },
      { label: "Activity",           options: ["PE", "rt"] },
    ],
  },
  "12": {
    stage: "A2",
    pick_count: 3,
    compulsory: ["Ma", "En", "CV", "IS"],
    language_alt: { "Ar": ["F2", "F3"] },
    bundles: [
      { label: "Science 1",        options: ["Ph", "Bi"] },
      { label: "Science/Business", options: ["Ch", "Ec"] },
      { label: "Applied",          options: ["BS", "Bi SS", "IT"] },
      { label: "Activity",         options: ["rt", "PE"] },
    ],
  },
};

/** All subject codes referenced by any offering — handy for prefetching names from DB. */
export function allReferencedSubjectCodes(): string[] {
  const set = new Set<string>();
  for (const off of Object.values(OFFERINGS)) {
    off.compulsory.forEach(c => set.add(c));
    Object.values(off.language_alt).forEach(arr => arr.forEach(c => set.add(c)));
    off.bundles.forEach(b => b.options.forEach(c => set.add(c)));
  }
  return [...set].sort();
}
