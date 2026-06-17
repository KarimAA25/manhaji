/**
 * Legacy redirect: /parent/select-courses → /parent/courses.
 *
 * The course-selection wizard moved to /parent/courses as part of the
 * three-role IA restructure. This redirect preserves any external links
 * (email reminders, shared URLs) for at least 1 academic year.
 */

import { redirect } from "next/navigation";

export default function LegacyCourseSelectionRedirect() {
  redirect("/parent/courses");
}
