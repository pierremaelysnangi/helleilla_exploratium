# Plan — Helleilla Exploratium

## Projet

Encyclopédie musicale metal collaborative.
Next.js 16 · React 19 · Tailwind 4 · Drizzle + PostgreSQL (double base RGPD) · Better Auth (Argon2id + Turnstile) · RBAC 4 rôles · Meilisearch · BullMQ/Redis · MinIO · Providers externes (MusicBrainz, Wikidata, Discogs, Deezer).
Règle stricte : zéro média généré par IA.

---

## État actuel

| Indicateur        | Valeur                                   |
| ----------------- | ---------------------------------------- |
| Prettier          | ✅ passe                                 |
| Lint              | ✅ passe                                 |
| Typecheck         | ✅ passe                                 |
| Tests unitaires   | 393/393 ✅ (49 fichiers)                 |
| Coverage branches | 100 % ✅ (seuil relevé à 90 %)           |
| OpenAPI lint      | ✅ valide, aligné sur les routes réelles |
| Build             | ✅ passe                                 |
| `pnpm verify`     | ✅ identique à la CI (format + test:cov) |

---

## Phase A — Stabilisation ✅ TERMINÉE

| Tâche                      | État       | Détail                                                                                                                                                                                                    |
| -------------------------- | ---------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| A1. Échecs RBAC E2E        | ✅ Corrigé | IP unique par client E2E via `x-forwarded-for` (isolation rate-limit) — 48/48 verts                                                                                                                       |
| A2. Timeout teardown E2E   | ✅ Corrigé | `closeAuthConnections()` ferme Redis auth + pools Postgres (db + authDb)                                                                                                                                  |
| A0. Alias `server-only`    | ✅ Corrigé | **Cause racine du 0 %** : `server-only` n'existe pas dans `node_modules` (Next l'aliase au bundling). Vitest ne pouvait pas charger `auth.ts`/`password-reset.ts`. Alias ajouté dans `vitest.config.mts`. |
| A3. Coverage branches      | ✅ Corrigé | 36,84 % → **100 %** (114/114). +99 tests : auth, password-reset, gardes RBAC, `handleActionError`, validations band + contribution. Seuils relevés à 95/90/95/95.                                         |
| A4. Aligner OpenAPI        | ✅ Corrigé | `POST` déplacé vers `app/api/contributions/[id]/evidence/route.ts` ; `GET/PATCH/DELETE /api/genres/{id}` documentés. Spec et disque correspondent exactement.                                             |
| A5. Nettoyage résidus      | ✅ Corrigé | 7 fichiers 0 octet et `app/main/` supprimés ; `opengraphImage.tsx` → `opengraph-image.tsx` (le fichier était mort) ; `lang="fr"` ; `/genres/{slug}` retiré du sitemap ; `<main>` imbriqués supprimés.     |
| A6. Alignement verify ↔ CI | ✅ Corrigé | `pnpm verify` lance désormais `format:check` et `test:cov` comme la CI — c'était la cause du « verify vert / CI rouge ».                                                                                  |

---

## Phase B — Pages détail ✅ TERMINÉE

**Décision structurante** : le slug d'album n'est unique QUE dans son groupe
(`albums_band_slug_uq` sur `(band_id, slug)`). L'URL canonique d'un album est
donc **band-scopée** — `/bands/[slug]/albums/[albumSlug]`. Sans cela,
`/albums/[slug]` affichait un album arbitraire dès que deux groupes ont une
sortie homonyme (« live », « demo »…).

| Tâche                               | État         | Détail                                                                                                                                                                                                     |
| ----------------------------------- | ------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/bands/[slug]/albums/[albumSlug]`  | ✅ Nouveau   | Page détail canonique : pochette, tracklist, fil d'Ariane, JSON-LD `MusicAlbum`, OpenGraph                                                                                                                 |
| `/albums/[slug]`                    | ✅ Écrite    | Résolveur : 404 si inconnu, redirection **temporaire** vers l'URL canonique si unique, page de levée d'ambiguïté si plusieurs                                                                              |
| `/genres/[slug]`                    | ✅ Écrite    | Genre + parent + sous-genres + groupes rattachés ; remise au sitemap                                                                                                                                       |
| `/bands/[slug]/discography`         | ✅ Écrite    | Grille de pochettes SSR groupée par type — vue complémentaire de `<DiscographyTable>` (client, dépliable), pas un doublon                                                                                  |
| `/bands/[slug]/members`             | ✅ Écrite    | Membres lus à la demande depuis MusicBrainz, chacun lié à sa fiche source. `noindex` : données non persistées                                                                                              |
| `/members/[slug]`                   | ✅ Supprimée | Aucun modèle de données derrière (pas de table `band_members`, MusicBrainz utilise des MBID). Une route répondant 200 à n'importe quel slug est pire que pas de route. À recréer avec la table, en phase F |
| `/about`                            | ✅ Écrite    | Porte la règle fondatrice : zéro média IA, preuves officielles obligatoires, déroulé de la modération                                                                                                      |
| `albumCard.tsx`                     | ✅ Créé      | Carte pochette ; exige `bandSlug` en prop, le lien canonique étant band-scopé                                                                                                                              |
| `genreCard.tsx` / `genreFilter.tsx` | ✅ Créés     | Extraits de `genresView`, réutilisés par la page genre                                                                                                                                                     |

Effets de bord corrigés au passage : les genres pointaient vers `/bands?q=` et
`/genres?q=` faute de page dédiée (désormais `/genres/[slug]`), et
`useBandMedia` validait l'enveloppe `{ data }` avec le schéma du DTO — la
section média du groupe était donc **toujours** en erreur.

---

## Phase C — Parcours contributeur ✅ TERMINÉE

**Préalable traité d'abord** : l'approbation ne produisait aucune donnée
(cf. commit `454ed4b`). Construire l'interface par-dessus aurait donné une
façade — un contributeur aurait vu « approuvé » sans qu'aucune fiche
n'existe.

| Tâche                           | État        | Détail                                                                                                                                                     |
| ------------------------------- | ----------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Matérialisation à l'approbation | ✅ Corrigée | `lib/contributions/approve.ts` : groupe créé/enrichi, `payload.refs` écrites, médias promus, visuel rattaché, réindexation. Rejouable après panne MinIO.   |
| Hook `use-contributions`        | ✅ Créé     | Écrit à la main : la ressource n'est pas un CRUD paginé (deux vues selon le rôle, transitions métier). `createEntityHooks` ne s'y applique pas.            |
| Server Actions `contribution*`  | ❌ Écartées | Les routes API portent déjà le contrat, sont documentées et testées. Les doubler en Server Actions aurait créé deux sources pour la même règle.            |
| `components/contributions/`     | ✅ Créé     | `contributionForm`, `evidenceFields`, `myContributions`, `reviewQueue`, `contributionStatusBadge`, `accessNotice`                                          |
| `/contributions`                | ✅ Écrite   | Formulaire verrouillé tant que la règle n'est pas satisfaite — la soumission est plafonnée à 5/h, laisser partir un dossier voué au refus serait hostile   |
| `/contributions/mes-dossiers`   | ✅ Écrite   | Suivi + réponse inline aux demandes de preuves, échéance et compteur de relances affichés                                                                  |
| `/contributions/relecture`      | ✅ Écrite   | File modérateur : preuves cliquables, demande de preuves en action par défaut, rejet terminal visible aux seuls admins                                     |
| Garde RBAC de page              | ✅ Créée    | `lib/rbac/page.ts` : anonyme → redirection ; connecté sans droit → message explicatif, pas de renvoi vers une connexion sans effet. Resservira en phase D. |

`OFFICIAL_EVIDENCE_KINDS` / `MIN_EVIDENCE_COUNT` sont désormais exportés
depuis `lib/validations/contribution.ts` : le verrou du formulaire et le
refine serveur lisent la même règle. Un test vérifie explicitement que
client et serveur rendent le même verdict.

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
| `components/audio/audioPlayer.tsx`   | 🔴 À écrire (fichier vide supprimé)         |
| `components/audio/miniPlayer.tsx`    | 🔴 À écrire (fichier vide supprimé)         |
| `components/audio/waveform.tsx`      | 🔴 À écrire (fichier vide supprimé)         |
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

~~Phase A (stabilisation)~~ ✅ terminée — la CI est verte
~~Phase B (pages détail)~~ ✅ terminée
~~Phase C (parcours contributeur)~~ ✅ terminée
└→ **Phase D (espace admin : route /api/users + UI)** ← prochaine étape
└→ Phase E (audio + profil)
└→ Phase F (enrichissement)

---

## Dette signalée, non traitée (décisions à prendre)

Constats relevés au fil des phases, volontairement laissés de côté car ils
demandent un arbitrage plutôt qu'un correctif mécanique.

| Sujet                                | Détail                                                                                                                                                                                                                                                                          |
| ------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Cloisonnement RGPD non étanche**   | `db/schema/index.ts` ré-exporte `./auth` : `drizzle.config.ts` embarque donc `user/session/account/verification` dans le schéma de la base _contenu_, en doublon de `migrations-auth/`. Aucun code n'en dépend, mais retirer la ré-export génère une migration **destructive**. |
| **L'approbation ne crée aucun band** | Une contribution approuvée passe en `approved` sans créer ni `band` ni `external_refs` depuis le `payload`. `promoteContributionFiles` n'est de plus jamais atteint pour `band_create` (la garde exige `targetBandId`, propre à `band_update`). À traiter avec la phase C.      |
| **Délai d'expiration incohérent**    | `CONTRIBUTION_POLICY.evidenceDeadlineDays = 30` alors que les docstrings et `LEXIQUE.md` annoncent 60 jours.                                                                                                                                                                    |
| **Repli d'URL fragile**              | `process.env.NEXT_PUBLIC_APP_URL ?? "…"` : une variable **définie mais vide** produit un lien de reset relatif cassé (`??` ne rattrape que `undefined`). Un `                                                                                                                   |     | ` suffirait. |
| **Rôles codés en dur**               | Les deux routes de contributions testent `["moderator","admin"].includes(role)` alors que la matrice exprime déjà `contribution:moderate` / `:delete`.                                                                                                                          |
| **Doublons**                         | `lib/meili.ts` ↔ `lib/search/meilisearch.ts` (deux clients Meilisearch) ; `scripts/check-tables.ts` ↔ `list-tables.ts`.                                                                                                                                                         |
| **Thème « metal » rendu en gris**    | `styles/theme.css` bâtit ses accents « rouge sang » sur `var(--primary)`, resté à la valeur shadcn `neutral` (chroma 0). Les tokens de marque n'ont jamais été personnalisés.                                                                                                   |
| **Duplication de fichiers d'état**   | 5 `loading.tsx` strictement identiques, 2 `error.tsx` quasi identiques exposant `error.message` brut à l'utilisateur.                                                                                                                                                           |
| **`types/*` entièrement doc-only**   | 4 fichiers sans aucun export ; les types réels vivent dans les schémas zod.                                                                                                                                                                                                     |
