import type { Metadata } from "next";
import dashboardData from "../../../data/processed/dashboard.json";
import { Dashboard, type DashboardData } from "../../components/Dashboard";

export const metadata: Metadata = {
  title: "Data",
  description: "Italy in 39 official, comparable indicators.",
};

export default function EnglishDataPage() {
  return (
    <Dashboard data={dashboardData as DashboardData} locale="en" view="data" />
  );
}
