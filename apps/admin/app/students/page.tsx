import { getCurrentAcademicYearId } from "@manhaj/lib/queries/auth";
import { getStudentsForAdmin, getApplicantsForYear, getBehaviourNotes } from "@manhaj/lib/queries/students";
import StudentsPageClient from "./StudentsPageClient";

export const dynamic = "force-dynamic";

export default async function AdminStudentsPage() {
  const academicYearId = await getCurrentAcademicYearId();
  const [dbStudents, applicants, behaviourNotes] = await Promise.all([
    academicYearId ? getStudentsForAdmin(academicYearId) : Promise.resolve([]),
    academicYearId ? getApplicantsForYear(academicYearId) : Promise.resolve([]),
    getBehaviourNotes(undefined, 50),
  ]);
  return <StudentsPageClient dbStudents={dbStudents} applicants={applicants} behaviourNotes={behaviourNotes} />;
}
