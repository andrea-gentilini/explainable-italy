import type { Metadata } from "next";
import dashboardData from "../../../data/processed/dashboard.json";
import { Dashboard, type DashboardData } from "../../components/Dashboard";

export const metadata: Metadata = {
  title: "Open source",
  description:
    "An open project created to help people read public data.",
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
