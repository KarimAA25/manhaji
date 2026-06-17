/**
 * Subject code → bilingual labels.
 *
 * Mirrors etl/parse_workbook.py SUBJECT_CATALOG so the Next.js app can render
 * a subject's EN/AR name without round-tripping to Supabase for every code.
 *
 * If a new code appears here that's missing from the DB, we fall back to the
 * code itself + 'Unknown' department.
 */

export type SubjectLabel = { code: string; name_en: string; name_ar: string; department: string };

export const SUBJECT_LABELS: Record<string, SubjectLabel> = {
  "A3":    { code: "A3",    name_en: "Arabic (Advanced)",        name_ar: "اللغة العربية متقدم",   department: "Arabic" },
  "Ar":    { code: "Ar",    name_en: "Arabic",                   name_ar: "اللغة العربية",          department: "Arabic" },
  "En":    { code: "En",    name_en: "English",                  name_ar: "اللغة الإنجليزية",       department: "English" },
  "ER":    { code: "ER",    name_en: "English Reading",          name_ar: "القراءة الإنجليزية",      department: "English" },
  "ES":    { code: "ES",    name_en: "English Support",          name_ar: "دعم اللغة الإنجليزية",   department: "English" },
  "F2":    { code: "F2",    name_en: "French (Stage 2)",         name_ar: "اللغة الفرنسية ٢",       department: "French" },
  "F3":    { code: "F3",    name_en: "French (Stage 3)",         name_ar: "اللغة الفرنسية ٣",       department: "French" },
  "SSE":   { code: "SSE",   name_en: "Social Studies (English)", name_ar: "الدراسات الاجتماعية (إنجليزي)", department: "Social-English" },
  "Hi":    { code: "Hi",    name_en: "History",                  name_ar: "التاريخ",               department: "Social-English" },
  "CV":    { code: "CV",    name_en: "Civics",                   name_ar: "التربية الوطنية",        department: "Social-English" },
  "dv":    { code: "dv",    name_en: "Environmental Management", name_ar: "الإدارة البيئية",        department: "Social-English" },
  "Ec":    { code: "Ec",    name_en: "Economics",                name_ar: "الاقتصاد",              department: "Social-English" },
  "BS":    { code: "BS",    name_en: "Business Studies",         name_ar: "إدارة الأعمال",          department: "Social-English" },
  "SSA":   { code: "SSA",   name_en: "Arabic Social Studies",    name_ar: "الدراسات الاجتماعية",    department: "Social-Arabic" },
  "IS":    { code: "IS",    name_en: "Islamic Studies",          name_ar: "التربية الإسلامية",      department: "Social-Arabic" },
  "Sc":    { code: "Sc",    name_en: "Science",                  name_ar: "العلوم",                 department: "Science" },
  "Bi":    { code: "Bi",    name_en: "Biology",                  name_ar: "الأحياء",                department: "Science" },
  "Bi AP": { code: "Bi AP", name_en: "Biology (Advanced)",       name_ar: "الأحياء متقدم",          department: "Science" },
  "Bi SS": { code: "Bi SS", name_en: "Biology (Self-Study)",     name_ar: "الأحياء دراسة ذاتية",    department: "Science" },
  "Ch":    { code: "Ch",    name_en: "Chemistry",                name_ar: "الكيمياء",               department: "Science" },
  "Ch AP": { code: "Ch AP", name_en: "Chemistry (Advanced)",     name_ar: "الكيمياء متقدم",         department: "Science" },
  "Ph":    { code: "Ph",    name_en: "Physics",                  name_ar: "الفيزياء",               department: "Science" },
  "Ph AP": { code: "Ph AP", name_en: "Physics (Advanced)",       name_ar: "الفيزياء متقدم",         department: "Science" },
  "IT":    { code: "IT",    name_en: "ICT",                      name_ar: "تكنولوجيا المعلومات",    department: "Science" },
  "Ma":    { code: "Ma",    name_en: "Mathematics",              name_ar: "الرياضيات",              department: "Math" },
  "Ma AP": { code: "Ma AP", name_en: "Mathematics (Advanced)",   name_ar: "الرياضيات متقدم",        department: "Math" },
  "MS":    { code: "MS",    name_en: "Math Support",             name_ar: "دعم الرياضيات",          department: "Math" },
  "Mu":    { code: "Mu",    name_en: "Music",                    name_ar: "الموسيقى",               department: "Recreational" },
  "PE":    { code: "PE",    name_en: "Physical Education",       name_ar: "التربية البدنية",        department: "Recreational" },
  "rt":    { code: "rt",    name_en: "Art",                      name_ar: "الفن",                  department: "Recreational" },
};

export function labelFor(code: string): SubjectLabel {
  return SUBJECT_LABELS[code] ?? {
    code, name_en: code, name_ar: code, department: "Unknown",
  };
}
