import { getCurrentParentId } from "@manhaj/lib/queries/auth";
import { getParentChildren } from "@manhaj/lib/queries/parents";
import {
  getUpcomingActivitySlipsForStudent,
  getStudentHealthForSlip,
  getParentContactForStudent,
} from "@manhaj/lib/queries/permissionslip";
import PermissionSlipClient from "./PermissionSlipClient";

export const dynamic = "force-dynamic";

export default async function PermissionSlipPage() {
  const today = new Date().toISOString().slice(0, 10);
  const parentId = await getCurrentParentId().catch(() => null);

  const children = parentId
    ? await getParentChildren(parentId).catch(() => [])
    : [];

  const childSlipData = await Promise.all(
    children.map(async child => {
      const sectionId = child.section_id ?? "";
      const [slips, health, parentContact] = await Promise.all([
        getUpcomingActivitySlipsForStudent(child.student_id, sectionId, today).catch(() => []),
        getStudentHealthForSlip(child.student_id).catch(() => null),
        parentId
          ? getParentContactForStudent(parentId, child.student_id).catch(() => null)
          : Promise.resolve(null),
      ]);
      return { child, slips, health, parentContact };
    }),
  );

  const isMock = children.length === 0;

  return (
    <PermissionSlipClient
      kids={children}
      childSlipData={childSlipData}
      isMock={isMock}
    />
  );
}
