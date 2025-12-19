import { HTMLAttributes } from "react";
import Image from "next/image";
import styles from "./Skeleton.module.css";

export function Skeleton({
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return <div className={`${styles.skeleton} ${className || ""}`} {...props} />;
}

export function DashboardSkeleton() {
  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.logoContainer}>
          <Image src="/logo.webp" alt="Logo" width={60} height={40} />
          <h1>Panorama des Carrières Alumnis</h1>
        </div>
        <p>Bienvenue sur le Panorama des Carrières...</p>
      </header>

      <main className={styles.mainGrid}>
        {/* Sidebar Skeleton (Comparison + Filters) */}
        <div>
          {/* Comparison Form Skeleton */}
          <div className={styles.filtersPanel}>
            <div className={styles.filterHeader}>
              <Skeleton style={{ height: "24px", width: "150px" }} />
            </div>
            <div
              style={{
                display: "block",
                gap: "1rem",
                flexWrap: "wrap",
                alignItems: "flex-end",
              }}
            >
              <div style={{ flex: 1, minWidth: "200px" }}>
                <Skeleton
                  style={{
                    height: "14px",
                    width: "100px",
                    marginBottom: "8px",
                  }}
                />
                <Skeleton
                  style={{
                    height: "42px",
                    width: "100%",
                    borderRadius: "4px",
                  }}
                />
              </div>
              <div style={{ flex: 1, minWidth: "200px" }}>
                <Skeleton
                  style={{
                    height: "14px",
                    width: "100px",
                    marginBottom: "8px",
                  }}
                />
                <Skeleton
                  style={{
                    height: "42px",
                    width: "100%",
                    borderRadius: "4px",
                  }}
                />
              </div>
              <Skeleton
                style={{ height: "42px", width: "100px", borderRadius: "4px" }}
              />
            </div>
          </div>

          {/* Filters Skeleton */}
          <aside className={styles.filtersPanel}>
            <div className={styles.filterHeader}>
              <Skeleton style={{ height: "24px", width: "100px" }} />
              <Skeleton style={{ height: "16px", width: "80px" }} />
            </div>
            <div className={styles.filtersContainerResponsive}>
              {[1, 2, 3, 4, 5, 6, 7].map((i) => (
                <div key={i} className={styles.filterGroup}>
                  <Skeleton
                    style={{
                      height: "14px",
                      width: "120px",
                      marginBottom: "8px",
                    }}
                  />
                  <Skeleton
                    style={{
                      height: "40px",
                      width: "100%",
                      borderRadius: "4px",
                    }}
                  />
                </div>
              ))}
            </div>
          </aside>
        </div>

        <div className={styles.resultsPanel}>
          {/* Stats Grid Skeleton */}
          <div className={styles.statsGrid}>
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className={styles.statCard}>
                <Skeleton
                  style={{
                    height: "14px",
                    width: "60%",
                    margin: "0 auto 8px",
                  }}
                />
                <Skeleton
                  style={{
                    height: "32px",
                    width: "80%",
                    margin: "0 auto 4px",
                  }}
                />
                <Skeleton
                  style={{ height: "12px", width: "40%", margin: "0 auto" }}
                />
              </div>
            ))}
          </div>

          {/* Charts Section Skeleton */}
          <div className={styles.chartsSection}>
            <Skeleton
              style={{ height: "24px", width: "200px", marginBottom: "16px" }}
            />
            <div className={styles.chartContainer}>
              <Skeleton style={{ height: "300px", width: "100%" }} />
            </div>
          </div>

          <div className={styles.chartsSection}>
            <Skeleton
              style={{ height: "24px", width: "250px", marginBottom: "16px" }}
            />
            <div className={styles.chartContainer}>
              <Skeleton style={{ height: "300px", width: "100%" }} />
            </div>
          </div>

          {/* No need for more since it already take all the screen*/}
        </div>
      </main>
    </div>
  );
}
