import { RootDocument } from "../root-layout";

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <RootDocument lang="it">{children}</RootDocument>;
}
