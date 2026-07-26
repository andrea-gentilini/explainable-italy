import type { Metadata } from "next";
import dashboardData from "../../data/processed/dashboard.json";
import { Dashboard, type DashboardData } from "../components/Dashboard";

export const metadata: Metadata = {
  title: "Explainable Italy",
  description: "Italy, official data for everyone.",
};

export default function EnglishHome() {
  return (
    <Dashboard data={dashboardData as DashboardData} locale="en" view="home" />
  );
}
