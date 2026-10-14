import { pageData } from "../../page-data";
import { pageMetadata } from "../../metadata";
import { Dashboard } from "../../components/Dashboard";

export const metadata = pageMetadata("en", "about", "About", "Why Explainable Italy exists and how it can grow.");

export default function EnglishAboutPage() {
  return (
    <Dashboard data={pageData("about")} locale="en" view="about" />
  );
}
