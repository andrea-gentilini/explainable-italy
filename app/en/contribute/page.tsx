import { pageData } from "../../page-data";
import { pageMetadata } from "../../metadata";
import { Dashboard } from "../../components/Dashboard";

export const metadata = pageMetadata("en", "contribute", "Open source", "An open project created to help people read public data.");

export default function EnglishContributePage() {
  return (
    <Dashboard
      data={pageData("contribute")}
      locale="en"
      view="contribute"
    />
  );
}
