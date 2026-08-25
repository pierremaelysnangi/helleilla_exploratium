import type { Metadata } from "next";
import { ApiDocs } from "./apiDocs";

export const metadata: Metadata = {
  title: "API Docs — Helleilla Exploratium",
  robots: { index: false, follow: false },
};

export default function DocsPage() {
  return <ApiDocs />;
}
