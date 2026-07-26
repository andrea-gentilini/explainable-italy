import type { Metadata } from "next";
import { notFound } from "next/navigation";
import dashboardData from "../../../../data/processed/dashboard.json";
import { Dashboard, type DashboardData } from "../../../components/Dashboard";

const data = dashboardData as DashboardData;

type IndicatorPageProps = {
  params: Promise<{ id: string }>;
};

export function generateStaticParams() {
  return data.indicators.map((indicator) => ({ id: indicator.id }));
}

export async function generateMetadata({
  params,
}: IndicatorPageProps): Promise<Metadata> {
  const { id } = await params;
  const indicator = data.indicators.find((entry) => entry.id === id);

  return {
    title: indicator?.title.en ?? "Indicator",
    description: indicator?.plain.en,
  };
}

export default async function EnglishIndicatorPage({
  params,
}: IndicatorPageProps) {
  const { id } = await params;
  const indicator = data.indicators.find((entry) => entry.id === id);

  if (!indicator) {
    notFound();
  }

  const pageIndicators =
    id === "spending-social-protection"
      ? data.indicators.filter((entry) =>
          [
            "spending-social-protection",
            "spending-old-age",
            "pension-expenditure",
          ].includes(entry.id),
        )
      : [indicator];

  return (
    <Dashboard
      data={{ ...data, indicators: pageIndicators }}
      locale="en"
      view="indicator"
      selectedIndicatorId={id}
    />
  );
}
