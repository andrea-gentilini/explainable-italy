import { pageData } from "../../page-data";
import { pageMetadata } from "../../metadata";
import { Dashboard } from "../../components/Dashboard";

export const metadata = pageMetadata("it", "sources", "Fonti", "Dataset ufficiali, copie verificabili e registro delle fonti.");

export default function SourcesPage() {
  return (
    <Dashboard
      data={pageData("sources")}
      locale="it"
      view="sources"
    />
  );
}
