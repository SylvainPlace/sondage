"use client";

import { AuthProvider } from "@/context/AuthContext";
import { DashboardProvider } from "@/context/DashboardContext";
import Dashboard from "@/features/dashboard/Dashboard";

export default function Home() {
  return (
    <AuthProvider>
      <DashboardProvider>
        <Dashboard />
      </DashboardProvider>
    </AuthProvider>
  );
}
