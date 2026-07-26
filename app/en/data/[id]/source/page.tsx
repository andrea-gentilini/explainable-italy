import type { Metadata } from "next";
import { notFound } from "next/navigation";
import dashboardData from "../../../../../data/processed/dashboard.json";
import {
  Dashboard,
  type DashboardData,
} from "../../../../components/Dashboard";

const data = dashboardData as DashboardData;

type IndicatorSourcePageProps = {
  params: Promise<{ id: string }>;
};

export function generateStaticParams() {
  return data.indicators.map((indicator) => ({ id: indicator.id }));
}

export async function generateMetadata({
  params,
}: IndicatorSourcePageProps): Promise<Metadata> {
  const { id } = await params;
  const indicator = data.indicators.find((entry) => entry.id === id);

  return {
    title: indicator ? `Source · ${indicator.title.en}` : "Source",
    description: indicator
      ? `Source, selection and calculation for ${indicator.title.en}.`
      : undefined,
  };
}

export default async function IndicatorSourcePage({
  params,
}: IndicatorSourcePageProps) {
  const { id } = await params;
  const indicator = data.indicators.find((entry) => entry.id === id);

  if (!indicator) {
    notFound();
  }

  return (
    <Dashboard
      data={{ ...data, indicators: [indicator] }}
      locale="en"
      view="indicatorSource"
      selectedIndicatorId={id}
    />
  );
}
