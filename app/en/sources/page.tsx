import type { Metadata } from "next";
import dashboardData from "../../../data/processed/dashboard.json";
import { Dashboard, type DashboardData } from "../../components/Dashboard";

export const metadata: Metadata = {
  title: "Sources",
  description: "Official datasets, verifiable copies and the source register.",
};

export default function EnglishSourcesPage() {
  return (
    <Dashboard
      data={dashboardData as DashboardData}
      locale="en"
      view="sources"
    />
  );
}
