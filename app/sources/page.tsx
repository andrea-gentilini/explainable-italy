import type { Metadata } from "next";
import dashboardData from "../../data/processed/dashboard.json";
import { Dashboard, type DashboardData } from "../components/Dashboard";

export const metadata: Metadata = {
  title: "Fonti",
  description: "Dataset ufficiali, copie verificabili e registro delle fonti.",
};

export default function SourcesPage() {
  return (
    <Dashboard
      data={dashboardData as DashboardData}
      locale="it"
      view="sources"
    />
  );
}
