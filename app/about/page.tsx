import type { Metadata } from "next";
import dashboardData from "../../data/processed/dashboard.json";
import { Dashboard, type DashboardData } from "../components/Dashboard";

export const metadata: Metadata = {
  title: "About",
  description: "Perché esiste Explainable Italy e come può crescere.",
};

export default function AboutPage() {
  return (
    <Dashboard data={dashboardData as DashboardData} locale="it" view="about" />
  );
}
