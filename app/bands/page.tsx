/**
 * Page listant les groupes (/bands) — catalogue virtualisé avec filtres
 * d'URL synchronisés et chargement progressif.
 */

import type { Metadata } from "next";
import { BandList } from "@/components/bands/bandList";

export const metadata: Metadata = {
  title: "Groupes",
  description:
    "Catalogue des groupes metal : recherche, tri par nom ou année, période d'activité et pays.",
};

export default function BandsPage() {
  return (
    <div className="flex flex-col gap-4">
      <header>
        <h1 className="metal-title text-2xl">Groupes</h1>
        <div className="metal-rule mt-2 w-40" />
      </header>
      <BandList />
    </div>
  );
}
