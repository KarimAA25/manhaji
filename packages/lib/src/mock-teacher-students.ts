/**
 * mock-teacher-students.ts
 *
 * Returns a filtered + enriched student list scoped to a specific teacher's
 * sections and subjects. Ms Swart teaches History / Geography / MUN in 10A
 * and History in 9A.
 *
 * Each TeacherStudentRow extends the base StudentRow with:
 *   teacher_att_pct        — attendance rate in this teacher's classes (%)
 *   last_assessment_score  — score on the most recent assessment (0-100)
 *   last_assessment_label  — short label for the assessment
 *   submission_status      — "submitted" | "in_progress" | "missing"
 *   discipline_notes_count — number of disciplinary notes the teacher has logged
 *
 * The enrichment is deterministic (seeded by student id) so tests are stable.
 */

import { MOCK_STUDENTS, type StudentRow } from "./mock-students";

export type SubmissionStatus = "submitted" | "in_progress" | "missing";

export type TeacherStudentRow = StudentRow & {
  teacher_att_pct:        number;
  last_assessment_score:  number;
  last_assessment_label:  string;
  submission_status:      SubmissionStatus;
  discipline_notes_count: number;
};

/** Ms Swart's sections */
const SWART_SECTIONS = ["10A", "9A"] as const;

/** Simple deterministic hash from a string to an integer */
function hashStr(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (Math.imul(31, h) + s.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

/** Derive a deterministic number in [min, max] from a student id + salt */
function deterministicRange(id: string, salt: string, min: number, max: number): number {
  const h = hashStr(id + salt);
  return min + (h % (max - min + 1));
}

const ASSESSMENT_LABELS_10A = [
  "Y10 Essay — Rise of Constitutional Monarchies",
  "Map Analysis · Geopolitical zones",
  "UNSC Position Paper draft",
];

const ASSESSMENT_LABELS_9A = [
  "Chapter 5 Quiz · Industrial Revolution",
  "Source Analysis · Factory Acts",
  "Essay — Social impact of industrialisation",
];

const SUBMISSION_STATUSES: SubmissionStatus[] = ["submitted", "submitted", "submitted", "in_progress", "missing"];

function enrichStudent(student: StudentRow): TeacherStudentRow {
  const id = student.id;
  const is10A = student.section_code === "10A";

  const teacher_att_pct = deterministicRange(id, "att", 80, 100);

  const last_assessment_score = deterministicRange(id, "score", 55, 95);

  const assessmentLabels = is10A ? ASSESSMENT_LABELS_10A : ASSESSMENT_LABELS_9A;
  const last_assessment_label = assessmentLabels[deterministicRange(id, "label", 0, assessmentLabels.length - 1)];

  const submission_status = SUBMISSION_STATUSES[deterministicRange(id, "sub", 0, SUBMISSION_STATUSES.length - 1)];

  const discipline_notes_count = deterministicRange(id, "disc", 0, 3);

  return {
    ...student,
    teacher_att_pct,
    last_assessment_score,
    last_assessment_label,
    submission_status,
    discipline_notes_count,
  };
}

/**
 * Returns all students in the teacher's sections, enriched with
 * subject-specific columns. Admission-pending rows are excluded.
 */
export function getStudentsForTeacher(teacherSections: readonly string[]): TeacherStudentRow[] {
  return MOCK_STUDENTS
    .filter(s =>
      s.status !== "admission-pending" &&
      (teacherSections as string[]).includes(s.section_code)
    )
    .map(enrichStudent);
}

/** Convenience export for Ms Swart specifically */
export const SWART_STUDENTS: TeacherStudentRow[] = getStudentsForTeacher(SWART_SECTIONS);
