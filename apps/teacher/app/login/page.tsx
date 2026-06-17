/**
 * Login page wrapper.
 *
 * Server component that renders the client-side form inside a Suspense boundary
 * — required because useSearchParams() inside the form is a CSR bailout signal
 * for Next.js, and pages using it must be Suspense-wrapped at build time.
 */

import { Suspense } from "react";
import LoginForm from "./LoginForm";

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--muted)", fontSize: 12 }}>
        Loading…
      </div>
    }>
      <LoginForm />
    </Suspense>
  );
}
