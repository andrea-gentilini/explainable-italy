import type { Metadata } from "next";
import dashboardData from "../../../data/processed/dashboard.json";
import { Dashboard, type DashboardData } from "../../components/Dashboard";

export const metadata: Metadata = {
  title: "About",
  description: "Why Explainable Italy exists and how it can grow.",
};

export default function EnglishAboutPage() {
  return (
    <Dashboard data={dashboardData as DashboardData} locale="en" view="about" />
  );
}
