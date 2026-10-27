import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Dashboard } from "../../../components/Dashboard";
import {
  allIndicatorParams,
  indicatorPageData,
  indicatorPageMetadata,
} from "../../../page-data";

type IndicatorPageProps = {
  params: Promise<{ id: string }>;
};

export function generateStaticParams() {
  return allIndicatorParams();
}

export async function generateMetadata({
  params,
}: IndicatorPageProps): Promise<Metadata> {
  const { id } = await params;
  return indicatorPageMetadata("it", id);
}

export default async function IndicatorPage({ params }: IndicatorPageProps) {
  const { id } = await params;
  const data = indicatorPageData(id);

  if (!data) {
    notFound();
  }

  return (
    <Dashboard
      data={data}
      locale="it"
      view="indicator"
      selectedIndicatorId={id}
    />
  );
}
