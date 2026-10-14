import source from "../data/processed/dashboard.json";
import type { DashboardData, DashboardView } from "./components/Dashboard";

// Country-level histories belong on the audit page. Keep them out of the
// catalogue and landing page payloads, where they are never rendered.
export function pageData(view: DashboardView): DashboardData {
  const data = source as DashboardData;
  return {
    ...data,
    indicators: data.indicators.map((indicator) => ({
      ...indicator,
      series: view === "data" ? indicator.series.map((point) => ({ ...point, countries: undefined })) : [],
      latest: { ...indicator.latest, countries: undefined },
      newerEstimate: indicator.newerEstimate ? { ...indicator.newerEstimate, countries: undefined } : null,
    })),
  };
}
