/**
 * Page « Festivals et salles » (/festivals) — Server Component.
 *
 * Recense les rendez-vous récurrents de la scène, pays par pays :
 * festivals d'abord, salles ensuite. Les deux figurent sur la même page
 * parce qu'ils répondent à la même question — où voir des concerts —, et
 * qu'un festival annuel et un club qui programme toute l'année sont
 * complémentaires, pas concurrents.
 *
 * Chaque entrée renvoie au site officiel de l'organisateur : c'est lui
 * qui fait foi sur les dates, la billetterie et la programmation, que
 * l'encyclopédie ne cherche pas à recopier.
 */

import type { Metadata } from "next";
import { listVenuesByCountry } from "@/db/queries/venues";
import { getTranslations } from "@/lib/i18n/server";
import { countryName } from "@/lib/i18n/countries";

/** URL de base absolue (cohérente avec le layout racine). */
const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

const TITLE = "Festivals et salles";
const DESCRIPTION =
  "Les festivals et les salles de la scène metal, pays par pays, avec le lien vers chaque organisateur.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: "/festivals" },
  openGraph: {
    type: "website",
    title: TITLE,
    description: DESCRIPTION,
    url: `${BASE_URL}/festivals`,
  },
};

/** Période d'existence : « depuis 1990 », « 1988 – 2015 ». */
function period(founded: number | null, ended: number | null): string | null {
  if (founded && ended) return `${founded} – ${ended}`;
  if (founded) return `depuis ${founded}`;
  if (ended) return `jusqu'en ${ended}`;
  return null;
}

export default async function FestivalsPage() {
  const [countries, { locale }] = await Promise.all([
    listVenuesByCountry(),
    getTranslations(),
  ]);

  const total = countries.reduce((sum, c) => sum + c.venues.length, 0);

  return (
    <article className="flex flex-col gap-8">
      <header>
        <h1 className="metal-title text-3xl sm:text-4xl">{TITLE}</h1>
        <div className="metal-rule mt-2 w-48" />
        <p className="text-muted-foreground mt-3 text-sm leading-relaxed">
          Où la scène se retrouve : {total} lieux dans {countries.length} pays.
          Dates et billetterie chez les organisateurs — cette page ne fait que
          les recenser.
        </p>
      </header>

      {countries.map((country) => (
        <section
          key={country.countryCode}
          aria-label={countryName(country.countryCode, locale)}
          className="flex flex-col gap-3"
        >
          <h2 className="metal-title flex items-baseline gap-2 text-lg">
            {countryName(country.countryCode, locale)}
            <span className="text-muted-foreground font-mono text-xs">
              {country.venues.length}
            </span>
          </h2>

          <ul className="3xl:grid-cols-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {country.venues.map((venue) => {
              const years = period(venue.foundedYear, venue.endedYear);
              return (
                <li
                  key={venue.id}
                  className="metal-card flex flex-col gap-2 p-4"
                >
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="text-sm font-semibold">{venue.name}</h3>
                    <span className="border-border text-muted-foreground shrink-0 rounded border px-1.5 py-0.5 text-[10px] tracking-wide uppercase">
                      {venue.kind === "festival" ? "Festival" : "Salle"}
                    </span>
                  </div>

                  <p className="text-muted-foreground flex flex-wrap gap-x-2 text-xs">
                    {venue.city && <span>{venue.city}</span>}
                    {years && <span>· {years}</span>}
                    {venue.capacity && (
                      <span>
                        · ~{venue.capacity.toLocaleString(locale)} pers.
                      </span>
                    )}
                  </p>

                  {venue.description && (
                    <p className="text-sm leading-relaxed">
                      {venue.description}
                    </p>
                  )}

                  {venue.websiteUrl && (
                    <a
                      href={venue.websiteUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="border-border hover:border-primary/50 mt-auto self-start rounded-md border px-3 py-1.5 text-xs tracking-wide uppercase transition-colors"
                    >
                      Site officiel ↗
                    </a>
                  )}
                </li>
              );
            })}
          </ul>
        </section>
      ))}
    </article>
  );
}
