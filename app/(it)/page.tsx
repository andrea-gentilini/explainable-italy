import { pageData } from "../page-data";
import { pageMetadata } from "../metadata";
import { Dashboard } from "../components/Dashboard";

export const metadata = pageMetadata("it", "", "Explainable Italy", "L’Italia, i dati ufficiali per tutti.");

export default function Home() {
  return (
    <Dashboard data={pageData("home")} locale="it" view="home" />
  );
}
