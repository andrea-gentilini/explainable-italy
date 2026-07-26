import type { Metadata } from "next";
import dashboardData from "../../../data/processed/dashboard.json";
import { Dashboard, type DashboardData } from "../../components/Dashboard";

export const metadata: Metadata = {
  title: "Method",
  description: "Rules, criteria and limits behind Explainable Italy.",
};

export default function EnglishMethodPage() {
  return (
    <Dashboard
      data={dashboardData as DashboardData}
      locale="en"
      view="method"
    />
  );
}
