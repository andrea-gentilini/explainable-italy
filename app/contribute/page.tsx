import type { Metadata } from "next";
import dashboardData from "../../data/processed/dashboard.json";
import { Dashboard, type DashboardData } from "../components/Dashboard";

export const metadata: Metadata = {
  title: "Open source",
  description:
    "Un progetto aperto nato per aiutare le persone a leggere i dati pubblici.",
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
