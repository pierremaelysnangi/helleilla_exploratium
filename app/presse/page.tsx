/**
 * Page « Presse et médias » (/presse) — Server Component.
 *
 * Pendant de la page Festivals, pour ce qui s'écrit et se diffuse plutôt
 * que pour ce qui se joue. Même principe, et c'est là tout son propos :
 * on RECENSE et on renvoie. Aucun article n'est repris, aucun extrait
 * n'est rejoué — le contenu rédactionnel appartient à ses auteurs, et
 * ces titres vivent de leur audience.
 *
 * Chaque entrée n'est donc qu'un nom, un format, un pays et un lien.
 * Y ajouter une description aurait redit ce que l'insigne et le
 * regroupement montrent déjà.
 */

import type { Metadata } from "next";
import { listOutletsByCountry } from "@/db/queries/mediaOutlets";
import { getTranslations } from "@/lib/i18n/server";
import { countryName } from "@/lib/i18n/countries";
import { interpolate } from "@/lib/i18n/format";
import { externalLabel } from "@/lib/media/externalLabel";

/** URL de base absolue (cohérente avec le layout racine). */
const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getTranslations();
  const title = t.press.title;
  const description = t.meta.pressDescription;
  return {
    title,
    description,
    alternates: { canonical: "/presse" },
    openGraph: {
      type: "website",
      title,
      description,
      url: `${BASE_URL}/presse`,
    },
  };
}

export default async function PressPage() {
  const { locale, t, n } = await getTranslations();
  const countries = await listOutletsByCountry();
  const total = countries.reduce((sum, c) => sum + c.outlets.length, 0);

  return (
    <article className="flex flex-col gap-8">
      <header>
        <h1 className="metal-title text-3xl sm:text-4xl">{t.press.title}</h1>
        <div className="metal-rule mt-2 w-48" />
        <p className="text-muted-foreground mt-3 max-w-2xl text-sm leading-relaxed">
          {interpolate(t.press.lead, {
            outlets: n(t.count.outlets, total),
            countries: n(t.count.countries, countries.length),
          })}
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
              {country.outlets.length}
            </span>
          </h2>

          <ul className="3xl:grid-cols-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
            {country.outlets.map((outlet) => (
              <li key={outlet.id}>
                <a
                  href={outlet.websiteUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="metal-card hover:bg-accent/30 flex h-full flex-col gap-2 p-4"
                >
                  <span className="border-border text-muted-foreground self-start rounded border px-1.5 py-0.5 text-[10px] tracking-wide uppercase">
                    {t.outletKind[outlet.kind]}
                  </span>
                  <span className="text-sm font-semibold">{outlet.name}</span>
                  <span className="text-muted-foreground mt-auto text-xs tracking-wide uppercase">
                    {externalLabel(t.press.visit)}
                  </span>
                </a>
              </li>
            ))}
          </ul>
        </section>
      ))}

      <p className="text-muted-foreground text-xs">{t.press.notice}</p>
    </article>
  );
}
