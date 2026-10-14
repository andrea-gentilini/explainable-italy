import { pageData } from "../../page-data";
import { pageMetadata } from "../../metadata";
import { Dashboard } from "../../components/Dashboard";

export const metadata = pageMetadata("it", "about", "About", "Perché esiste Explainable Italy e come può crescere.");

export default function AboutPage() {
  return (
    <Dashboard data={pageData("about")} locale="it" view="about" />
  );
}
