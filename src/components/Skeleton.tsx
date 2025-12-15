export function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`skeleton ${className || ""}`}
      {...props}
    />
  );
}

export function DashboardSkeleton() {
  return (
    <div className="results-panel">
      {/* Stats Grid Skeleton */}
      <div className="stats-grid">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="stat-card">
            <Skeleton style={{ height: "14px", width: "60%", margin: "0 auto 8px" }} />
            <Skeleton style={{ height: "32px", width: "80%", margin: "0 auto 4px" }} />
            <Skeleton style={{ height: "12px", width: "40%", margin: "0 auto" }} />
          </div>
        ))}
      </div>

      {/* Charts Section Skeleton */}
      <div className="charts-section">
        <Skeleton style={{ height: "24px", width: "200px", marginBottom: "16px" }} />
        <div className="chart-container">
          <Skeleton style={{ height: "300px", width: "100%" }} />
        </div>
      </div>

      <div className="charts-section">
        <Skeleton style={{ height: "24px", width: "250px", marginBottom: "16px" }} />
        <div className="chart-container">
          <Skeleton style={{ height: "300px", width: "100%" }} />
        </div>
      </div>

      {/* Benefits Section Skeleton */}
      <div className="benefits-section">
        <Skeleton style={{ height: "24px", width: "250px", marginBottom: "16px" }} />
        <div className="benefits-list" style={{ padding: "1.5rem" }}>
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
              <Skeleton style={{ height: "16px", width: "100px" }} />
              <Skeleton style={{ height: "8px", width: "60%" }} />
            </div>
          ))}
        </div>
      </div>

      {/* Map Section Skeleton */}
      <div className="charts-section">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
          <Skeleton style={{ height: "24px", width: "250px" }} />
          <Skeleton style={{ height: "32px", width: "150px" }} />
        </div>
        <div className="chart-container" style={{ height: "500px" }}>
          <Skeleton style={{ height: "100%", width: "100%" }} />
        </div>
      </div>
    </div>
  );
}
