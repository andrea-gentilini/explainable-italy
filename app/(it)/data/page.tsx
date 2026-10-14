import { pageData } from "../../page-data";
import { pageMetadata } from "../../metadata";
import { Dashboard } from "../../components/Dashboard";

export const metadata = pageMetadata("it", "data", "I dati", "L’Italia in 39 indicatori ufficiali e confrontabili.");

export default function DataPage() {
  return (
    <Dashboard data={pageData("data")} locale="it" view="data" />
  );
}
