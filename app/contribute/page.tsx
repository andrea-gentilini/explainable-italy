import type { Metadata } from "next";
import dashboardData from "../../data/processed/dashboard.json";
import { Dashboard, type DashboardData } from "../components/Dashboard";

export const metadata: Metadata = {
  title: "Contribuisci",
  description: "Proponi dati e miglioramenti con regole chiare e verificabili.",
};

export default function ContributePage() {
  return (
    <Dashboard
      data={dashboardData as DashboardData}
      locale="it"
      view="contribute"
    />
  );
}
