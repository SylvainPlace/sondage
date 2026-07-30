import { notFound } from "next/navigation";
import { Suspense } from "react";

import AlumniPrototype from "@/features/prototype-alumni/AlumniPrototype";

export default function AlumniPrototypePage() {
  if (process.env.NODE_ENV === "production") {
    notFound();
  }

  return (
    <Suspense>
      <AlumniPrototype />
    </Suspense>
  );
}
