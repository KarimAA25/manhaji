"use server";

import { login, type Role } from "@manhaj/auth";
import { redirect } from "next/navigation";

const PASSWORDS: Record<Role, string> = {
  admin:   process.env.DEMO_PASSWORD_ADMIN   ?? "",
  teacher: process.env.DEMO_PASSWORD_TEACHER ?? "",
  student: process.env.DEMO_PASSWORD_STUDENT ?? "",
  parent:  process.env.DEMO_PASSWORD_PARENT  ?? "",
};

export async function demoLogin(role: Role) {
  await login(PASSWORDS[role]);
  redirect(`/${role}`);
}
