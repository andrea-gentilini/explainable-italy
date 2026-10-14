import { pageData } from "../../page-data";
import { pageMetadata } from "../../metadata";
import { Dashboard } from "../../components/Dashboard";

export const metadata = pageMetadata("en", "data", "Data", "Italy in 39 official, comparable indicators.");

export default function EnglishDataPage() {
  return (
    <Dashboard data={pageData("data")} locale="en" view="data" />
  );
}
