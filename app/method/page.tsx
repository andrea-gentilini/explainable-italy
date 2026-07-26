import type { Metadata } from "next";
import dashboardData from "../../data/processed/dashboard.json";
import { Dashboard, type DashboardData } from "../components/Dashboard";

export const metadata: Metadata = {
  title: "Metodo",
  description: "Regole, criteri e limiti dei confronti di Explainable Italy.",
};

export default function MethodPage() {
  return (
    <Dashboard
      data={dashboardData as DashboardData}
      locale="it"
      view="method"
    />
  );
}
