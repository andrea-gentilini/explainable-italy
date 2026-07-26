import type { Metadata } from "next";
import dashboardData from "../data/processed/dashboard.json";
import { Dashboard, type DashboardData } from "./components/Dashboard";

export const metadata: Metadata = {
  title: "Explainable Italy",
  description: "L’Italia, i dati ufficiali per tutti.",
};

export default function Home() {
  return <Dashboard data={dashboardData as DashboardData} locale="it" />;
}
