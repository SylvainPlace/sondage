import { Suspense } from "react";

import ClearCockpitPrototype from "@/features/prototype-alumni-clear/ClearCockpitPrototype";

export default function ClearCockpitPrototypePage() {
  return (
    <Suspense>
      <ClearCockpitPrototype />
    </Suspense>
  );
}
