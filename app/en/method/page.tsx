import { pageData } from "../../page-data";
import { pageMetadata } from "../../metadata";
import { Dashboard } from "../../components/Dashboard";

export const metadata = pageMetadata("en", "method", "Method", "Rules, criteria and limits behind Explainable Italy.");

export default function EnglishMethodPage() {
  return (
    <Dashboard
      data={pageData("method")}
      locale="en"
      view="method"
    />
  );
}
