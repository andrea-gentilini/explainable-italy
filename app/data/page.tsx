import type { Metadata } from "next";
import dashboardData from "../../data/processed/dashboard.json";
import { Dashboard, type DashboardData } from "../components/Dashboard";

export const metadata: Metadata = {
  title: "I dati",
  description: "L’Italia in 39 indicatori ufficiali e confrontabili.",
};

export default function DataPage() {
  return (
    <Dashboard data={dashboardData as DashboardData} locale="it" view="data" />
  );
}
