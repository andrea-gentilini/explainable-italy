import { pageData } from "../page-data";
import { pageMetadata } from "../metadata";
import { Dashboard } from "../components/Dashboard";

export const metadata = pageMetadata("en", "", "Explainable Italy", "Italy, official data for everyone.");

export default function EnglishHome() {
  return (
    <Dashboard data={pageData("home")} locale="en" view="home" />
  );
}
