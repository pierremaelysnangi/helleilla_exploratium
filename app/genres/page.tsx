/**
 * Page des genres (/genres) — taxonomie filtrable ; chaque genre renvoie
 * vers le catalogue de groupes filtré.
 */

import type { Metadata } from "next";
import { GenresView } from "@/components/genres/genresView";

export const metadata: Metadata = {
  title: "Genres",
  description: "Taxonomie des genres et sous-genres metal.",
};

export default function GenresPage() {
  return (
    <div className="flex flex-col gap-4">
      <header>
        <h1 className="metal-title text-2xl">Genres</h1>
        <div className="metal-rule mt-2 w-40" />
      </header>
      <GenresView />
    </div>
  );
}
