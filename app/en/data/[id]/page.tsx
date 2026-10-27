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
  return indicatorPageMetadata("en", id);
}

export default async function EnglishIndicatorPage({
  params,
}: IndicatorPageProps) {
  const { id } = await params;
  const data = indicatorPageData(id);

  if (!data) {
    notFound();
  }

  return (
    <Dashboard
      data={data}
      locale="en"
      view="indicator"
      selectedIndicatorId={id}
    />
  );
}
