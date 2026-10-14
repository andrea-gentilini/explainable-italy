import { pageData } from "../../page-data";
import { pageMetadata } from "../../metadata";
import { Dashboard } from "../../components/Dashboard";

export const metadata = pageMetadata("it", "method", "Metodo", "Regole, criteri e limiti dei confronti di Explainable Italy.");

export default function MethodPage() {
  return (
    <Dashboard
      data={pageData("method")}
      locale="it"
      view="method"
    />
  );
}
