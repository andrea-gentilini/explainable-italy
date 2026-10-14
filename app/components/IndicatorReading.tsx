import { getIndicatorReading } from "./indicator-reading.mjs";

type IndicatorReadingProps = {
  indicator: { id: string; unitKey: string; precision: number };
  point: { year: number; italy: number; eu: number | null };
  locale: "it" | "en";
};

export function IndicatorReading({ indicator, point, locale }: IndicatorReadingProps) {
  const reading = getIndicatorReading(indicator, point, locale);
  if (!reading) return null;

  return (
    <aside className="reading-context" aria-label={locale === "it" ? "Come leggere il dato" : "Reading this value"}>
      <p className="reading-context-title">
        {locale === "it" ? "Come leggere il dato" : "Reading this value"}
      </p>
      <p>{reading.description}{reading.comparison ? " " + reading.comparison : ""}</p>
      {reading.caution ? <p className="reading-context-caution">{reading.caution}</p> : null}
    </aside>
  );
}
