import { notFound } from "next/navigation";
import { Suspense } from "react";

import ClearCockpitPrototype from "@/features/prototype-alumni-clear/ClearCockpitPrototype";

export default function ClearCockpitPrototypePage() {
  if (process.env.NODE_ENV === "production") {
    notFound();
  }

  return (
    <Suspense>
      <ClearCockpitPrototype />
    </Suspense>
  );
}
