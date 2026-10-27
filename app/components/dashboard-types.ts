export type Locale = "it" | "en";
export type LocalizedText = Record<Locale, string>;

export type CountryObservation = {
  geo: string;
  value: number;
  status: string | null;
};

export type DataPoint = {
  year: number;
  italy: number;
  eu: number | null;
  median: number;
  coverage: number;
  euMethod: "official_aggregate" | "unavailable";
  status: string | null;
  sourceStatus: string | null;
  euStatus: string | null;
  countryStatuses: Array<{ geo: string; status: string }>;
  missingCountries: string[];
  countries?: CountryObservation[];
};

export type Source = {
  institution: string;
  originalInstitution: string;
  datasetCode: string;
  datasetLabel: string;
  dataBrowserUrl: string;
  apiUrl: string;
  metadataUrl: string | null;
  doi: string;
  sourceUpdatedAt: string;
  accessedAt: string;
  snapshotPath?: string;
  sha256?: string;
  bytes?: number;
};

export type IndicatorNote = {
  type:
    | "provisional"
    | "method_change"
    | "comparability"
    | "scope"
    | "reference_period"
    | "data_gap";
  year?: number;
  text: LocalizedText;
  sourceUrl: string;
};

export type Indicator = {
  id: string;
  section: string;
  title: LocalizedText;
  plain: LocalizedText;
  technical: LocalizedText;
  unitKey: string;
  precision: number;
  featured: boolean;
  isDetail: boolean;
  definitionSourceUrl: string | null;
  definitionKind: "project_paraphrase";
  notes: IndicatorNote[];
  startYear: number;
  latest: DataPoint;
  newerEstimate: DataPoint | null;
  series: DataPoint[];
  source: Source;
};

export type Section = {
  id: string;
  title: LocalizedText;
  description: LocalizedText;
};

export type DashboardData = {
  generatedAt: string;
  methodologyVersion: string;
  comparison: LocalizedText;
  sections: Section[];
  indicators: Indicator[];
};

export type DashboardView =
  | "home"
  | "data"
  | "method"
  | "sources"
  | "about"
  | "contribute"
  | "indicator"
  | "indicatorSource";

export type DashboardProps = {
  data: DashboardData;
  locale: Locale;
  view?: DashboardView;
  selectedIndicatorId?: string;
};
