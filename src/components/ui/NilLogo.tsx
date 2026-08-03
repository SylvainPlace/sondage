import Image from "next/image";

import styles from "./NilLogo.module.css";

interface NilLogoProps {
  className?: string;
  priority?: boolean;
  size?: "compact" | "full";
}

export function NilLogo({ className = "", priority = false, size = "full" }: NilLogoProps) {
  const dimensions = size === "compact" ? { width: 60, height: 48 } : { width: 126, height: 101 };

  return (
    <Image
      className={`${styles.logo} ${styles[size]} ${className}`}
      src="/logo-nil.jpg"
      alt="NIL"
      width={dimensions.width}
      height={dimensions.height}
      priority={priority}
    />
  );
}
