import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Dashboard } from "../../../../components/Dashboard";
import {
  allIndicatorParams,
  indicatorSourcePageData,
  indicatorSourcePageMetadata,
} from "../../../../page-data";

type IndicatorSourcePageProps = {
  params: Promise<{ id: string }>;
};

export function generateStaticParams() {
  return allIndicatorParams();
}

export async function generateMetadata({
  params,
}: IndicatorSourcePageProps): Promise<Metadata> {
  const { id } = await params;
  return indicatorSourcePageMetadata("it", id);
}

export default async function IndicatorSourcePage({
  params,
}: IndicatorSourcePageProps) {
  const { id } = await params;
  const data = indicatorSourcePageData(id);

  if (!data) {
    notFound();
  }

  return (
    <Dashboard
      data={data}
      locale="it"
      view="indicatorSource"
      selectedIndicatorId={id}
    />
  );
}
