import { pageData } from "../../page-data";
import { pageMetadata } from "../../metadata";
import { Dashboard } from "../../components/Dashboard";

export const metadata = pageMetadata("it", "contribute", "Contribuisci", "Un progetto aperto nato per aiutare le persone a leggere i dati pubblici.");

export default function ContributePage() {
  return (
    <Dashboard
      data={pageData("contribute")}
      locale="it"
      view="contribute"
    />
  );
}
