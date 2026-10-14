import { pageData } from "../../page-data";
import { pageMetadata } from "../../metadata";
import { Dashboard } from "../../components/Dashboard";

export const metadata = pageMetadata("en", "sources", "Sources", "Official datasets, verifiable copies and the source register.");

export default function EnglishSourcesPage() {
  return (
    <Dashboard
      data={pageData("sources")}
      locale="en"
      view="sources"
    />
  );
}
