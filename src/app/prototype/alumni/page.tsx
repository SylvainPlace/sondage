import { notFound } from "next/navigation";
import { Suspense } from "react";

import AlumniPrototype from "@/features/prototype-alumni/AlumniPrototype";

export default function AlumniPrototypePage() {
  // Only hide prototype pages in production unless explicitly enabled via ENABLE_PROTOS env var
  if (process.env.NODE_ENV === "production" && process.env.ENABLE_PROTOS !== "true") {
    notFound();
  }

  return (
    <Suspense>
      <AlumniPrototype />
    </Suspense>
  );
}
