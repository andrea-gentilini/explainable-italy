import type { Metadata } from "next";
import dashboardData from "../../../data/processed/dashboard.json";
import { Dashboard, type DashboardData } from "../../components/Dashboard";

export const metadata: Metadata = {
  title: "Contribute",
  description: "Propose data and improvements with clear, verifiable rules.",
};

export default function EnglishContributePage() {
  return (
    <Dashboard
      data={dashboardData as DashboardData}
      locale="en"
      view="contribute"
    />
  );
}
