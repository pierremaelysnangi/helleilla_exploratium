# Plan — Helleilla Exploratium

## Projet

Encyclopédie musicale metal collaborative.
Next.js 16 · React 19 · Tailwind 4 · Drizzle + PostgreSQL (double base RGPD) · Better Auth (Argon2id + Turnstile) · RBAC 4 rôles · Meilisearch · BullMQ/Redis · MinIO · Providers externes (MusicBrainz, Wikidata, Discogs, Deezer).
Règle stricte : zéro média généré par IA.

---

## État actuel

| Indicateur        | Valeur                                         |
| ----------------- | ---------------------------------------------- |
| Lint              | ✅ passe                                       |
| Typecheck         | ✅ passe                                       |
| Tests unitaires   | 245/245 ✅                                     |
| Coverage branches | 36.84 % < 45 % ❌ (seuil)                      |
| OpenAPI lint      | ✅ valide                                      |
| Tests E2E         | 48/48 ✅                                       |
| `pnpm verify`     | ⚠️ passe (test sans cov), CI échoue (test:cov) |

---

## Phase A — Stabilisation (PRÉALABLE AU COMMIT)

| Tâche                        | État       | Détail                                                                                                                                                                                                                                                           |
| ---------------------------- | ---------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| A1. Échecs RBAC E2E          | ✅ Corrigé | IP unique par client E2E via `x-forwarded-for` (isolation rate-limit) — 48/48 verts                                                                                                                                                                              |
| A2. Timeout teardown E2E     | ✅ Corrigé | `closeAuthConnections()` ferme Redis auth + pools Postgres (db + authDb)                                                                                                                                                                                         |
| A3. Coverage < 45 % branches | 🔴 À faire | Tests manquants pour `lib/actions/auth.ts` (0 %), `lib/actions/password-reset.ts` (0 %), `lib/rbac/index.ts` (0 %)                                                                                                                                               |
| A4. Aligner OpenAPI          | 🔴 À faire | `POST /api/contributions/{id}/evidence` documenté mais route réelle = `POST /api/contributions/{id}` (404 client conforme). `GET/PATCH/DELETE /api/genres/{id}` implémenté mais non documenté                                                                    |
| A5. Nettoyage résidus        | 🔴 À faire | `app/main/` dossiers vides, `commandPallete.tsx` doublon (0 octet), `albumCard.tsx` (0 octet), `genreCard.tsx` (0 octet), `genreFilter.tsx` (0 octet), `opengraphImage.tsx` mal nommé (devrait être `opengraph-image.tsx`), `lang="en"` devrait être `lang="fr"` |
| A6. Vérification finale      | 🔴 À faire | `pnpm verify` + `pnpm test:cov` + `pnpm test:e2e` tous verts                                                                                                                                                                                                     |

---

## Phase B — Pages détail

| Tâche                       | État                                                                        |
| --------------------------- | --------------------------------------------------------------------------- |
| `/albums/[slug]`            | 🔴 Placeholder (API + composants existent, le plus "prêt")                  |
| `/genres/[slug]`            | 🔴 Placeholder (déjà dans le sitemap → paradoxe SEO)                        |
| `/bands/[slug]/discography` | 🔴 Placeholder (discographie déjà rendue dans la page détail)               |
| `/bands/[slug]/members`     | 🔴 Placeholder (données éphémères MusicBrainz, aucune table `band_members`) |
| `/about`                    | 🔴 Placeholder                                                              |
| Remplir `albumCard.tsx`     | 🔴 0 octet                                                                  |
| Remplir `genreCard.tsx`     | 🔴 0 octet                                                                  |
| Remplir `genreFilter.tsx`   | 🔴 0 octet                                                                  |

---

## Phase C — Parcours contributeur

| Tâche                                         | État                                                                                                             |
| --------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| Backend workflow                              | ✅ Complet et testé (soumission + preuves anti-IA + médiation 2 relances/60j + promotion MinIO staging → public) |
| Hook `use-contributions`                      | 🔴 Inexistant                                                                                                    |
| Server Actions `lib/actions/contribution*.ts` | 🔴 Inexistant                                                                                                    |
| `components/contributions/`                   | 🔴 Dossier inexistant                                                                                            |
| Page `/contributions` (formulaire soumission) | 🔴 Aucune page                                                                                                   |
| Page `/contributions/mes-dossiers`            | 🔴 Aucune page                                                                                                   |
| File de relecture modérateur                  | 🔴 Aucune page                                                                                                   |

---

## Phase D — Espace admin

| Tâche                                                       | État                                                                       |
| ----------------------------------------------------------- | -------------------------------------------------------------------------- |
| Backend RBAC                                                | ✅ Matrice complète (4 rôles × 6 ressources × 5 actions) + `seed-admin.ts` |
| Route `GET/PATCH/DELETE /api/users`                         | 🔴 Inexistante (la matrice prévoit `user: read/update/delete/moderate`)    |
| `components/admin/`                                         | 🔴 Dossier inexistant                                                      |
| Pages admin (gestion utilisateurs/rôles, stats, modération) | 🔴 Aucune page                                                             |

---

## Phase E — Audio & profil

| Tâche                                | État                                        |
| ------------------------------------ | ------------------------------------------- |
| Upload audio MinIO                   | ✅ `POST /api/tracks/{id}/audio` (présigné) |
| Aperçus Deezer 30s                   | ✅ Via resolver + `albumTracklist`          |
| `components/audio/audioPlayer.tsx`   | 🔴 0 octet                                  |
| `components/audio/miniPlayer.tsx`    | 🔴 0 octet                                  |
| `components/audio/waveform.tsx`      | 🔴 0 octet                                  |
| `hooks/use-player-audio.ts`          | 🔴 Stub doc-only                            |
| `stores/audioPlayer.store.ts`        | 🔴 Stub doc-only                            |
| `stores/preference.store.ts`         | 🔴 Stub doc-only                            |
| Page profil/préférences (`/profile`) | 🔴 Aucune page                              |
| Table `profiles` exposée             | 🔴 Non exposée                              |

---

## Phase F — Enrichissement encyclopédique

| Tâche                                                      | État                                           |
| ---------------------------------------------------------- | ---------------------------------------------- |
| `components/widgets/`                                      | 🔴 Dossier inexistant                          |
| Widgets accueil (derniers ajouts, tops, stats, carrousels) | 🔴 Rien                                        |
| Membres persistés en DB (table `band_members`)             | 🔴 Aucune table, données éphémères MusicBrainz |
| Labels (maisons de disques)                                | 🔴 Aucun schéma/route                          |
| Lineups (formations par album)                             | 🔴 Aucun schéma/route                          |
| Ratings / notes                                            | 🔴 Aucun schéma/route                          |
| Listes utilisateur (collection / wishlist)                 | 🔴 Aucun schéma/route                          |
| `hooks/use-media-query.ts`                                 | 🔴 Stub doc-only                               |

---

## Ordre d'exécution recommandé

Phase A (stabilisation, 6 tâches restantes)
└→ Phase B (pages détail, ~6 pages + 3 cartes)
└→ Phase C (parcours contributeur, UI pour backend existant)
└→ Phase D (espace admin, route users + UI)
└→ Phase E (audio + profil)
└→ Phase F (enrichissement)

Phase A est un **préalable bloquant** : sans coverage ≥ 45 % et sans OpenAPI aligné, la CI reste en échec et le commit des 62 fichiers en attente ne peut pas être fait proprement.
