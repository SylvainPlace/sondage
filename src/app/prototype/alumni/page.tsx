import { Suspense } from "react";

import AlumniPrototype from "@/features/prototype-alumni/AlumniPrototype";

export default function AlumniPrototypePage() {
  return (
    <Suspense>
      <AlumniPrototype />
    </Suspense>
  );
}
