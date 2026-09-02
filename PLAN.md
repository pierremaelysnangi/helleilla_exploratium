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
| Tests unitaires   | 454/454 ✅ (54 fichiers)                 |
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

## Phase D — Espace admin ✅ TERMINÉE

**Contrainte structurante** : les comptes vivent dans la base IDENTITÉ
(`authDb`), pas dans la base contenu. `profiles` n'en est qu'une projection
publique (nom + rôle), insuffisante pour administrer — l'email, la
vérification et le bannissement n'existent que côté identité. `/api/users`
est donc la seule famille de routes qui lit la base identité hors Better
Auth, et la seule qui expose des emails : d'où `user:read`, permission que
la matrice n'accorde qu'aux admins.

| Tâche                              | État      | Détail                                                                                                                                                      |
| ---------------------------------- | --------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `GET /api/users`                   | ✅ Créée  | Liste paginée, recherche nom/email, filtre par rôle. Colonnes projetées explicitement pour qu'aucun champ sensible futur ne fuite par effet de bord.        |
| `GET/PATCH/DELETE /api/users/{id}` | ✅ Créées | Changement de rôle, bannissement, suppression                                                                                                               |
| Garde-fou auto-protection          | ✅        | Un admin ne peut ni se rétrograder, ni se bannir, ni se supprimer — la façon la plus simple de se verrouiller hors de l'administration                      |
| Garde-fou dernier admin            | ✅        | Le dernier administrateur est intouchable (409). Sans cela, l'espace admin devenait inaccessible à tous, sans recours autre que `pnpm seed:admin`.          |
| Synchronisation des deux bases     | ✅        | Un écrit Drizzle direct ne déclenche pas les hooks Better Auth : `updateUserAsAdmin` met à jour `authDb.user` ET `profiles`, comme le fait `seed-admin.ts`. |
| `components/admin/`                | ✅ Créé   | `usersTable` (rôle, bannissement, suppression confirmée par saisie du nom), `roleBadge`                                                                     |
| `/admin`                           | ✅ Écrite | Tableau de bord : compteurs catalogue et communauté, accès rapide relecture et doc API                                                                      |
| `/admin/utilisateurs`              | ✅ Écrite | Gestion des comptes                                                                                                                                         |

**Suppression d'un compte** : l'identité et le profil public sont effacés
(sessions et `account` en cascade), mais les contributions déjà soumises
sont CONSERVÉES. Leur `submittedBy` ne renvoie alors plus à aucune
identité : la trace devient anonyme tout en préservant l'historique de
modération, ce qui est l'effet recherché.

---

## Phase E — Audio & profil ✅ TERMINÉE

**Bug bloquant trouvé d'entrée** : la CSP n'avait pas de directive
`media-src`, elle retombait donc sur `default-src 'self'`. Les extraits
Deezer déjà branchés dans la tracklist étaient **purement et simplement
bloqués par le navigateur** — la fonctionnalité audio ne marchait pas.
`next.config.ts` déclare désormais `media-src` (et `connect-src`, requis
pour décoder une forme d'onde), avec l'origine du stockage lue à la volée
depuis `MINIO_ENDPOINT`.

| Tâche                          | État      | Détail                                                                                                                                        |
| ------------------------------ | --------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| `stores/audioPlayer.store.ts`  | ✅ Écrit  | Décrit une intention de lecture ; garantit qu'une seule piste joue dans toute l'application. File d'attente, progression, déplacement.        |
| `stores/preference.store.ts`   | ✅ Écrit  | Volume et sourdine persistés (`zustand/persist`). Le thème reste à `next-themes` — le dupliquer créerait deux sources pour un même réglage.   |
| `hooks/use-player-audio.ts`    | ✅ Écrit  | Traduit l'intention du store en appels impératifs sur l'élément, et remonte la progression réelle                                             |
| `components/audio/audioPlayer` | ✅ Écrit  | Contrôles : lecture, déplacement, volume, piste suivante. La provenance du média est toujours affichée.                                       |
| `components/audio/miniPlayer`  | ✅ Écrit  | Barre persistante montée dans le layout — **seul** composant à posséder un `<audio>`, d'où l'impossibilité de superposer deux lectures        |
| `components/audio/waveform`    | ✅ Écrit  | Forme d'onde **réelle**, décodée via Web Audio API. Aucune donnée inventée : si le décodage échoue (CORS, format), le composant ne rend rien. |
| `hooks/use-media-query.ts`     | ✅ Écrit  | `useSyncExternalStore` avec snapshot serveur explicite, pour éviter l'écart d'hydratation                                                     |
| `GET/PATCH /api/profile`       | ✅ Créées | Lit la projection publique ; l'écriture passe par Better Auth pour que ses hooks répliquent le nom vers `profiles`                            |
| `/profile`                     | ✅ Écrite | Nom affiché (serveur) et préférences de lecture (locales) — la distinction est dite à l'utilisateur                                           |

`albumTracklist` ne rend plus un `<audio>` par ligne : chaque piste
alimente le lecteur global, avec la suite de la tracklist en file d'attente.

---

## Phase F — Enrichissement ✅ TERMINÉE

Migration `0005_clever_peter_parker` : **purement additive**, aucun `DROP`.
Six tables et une colonne, appliquées et validées contre un PostgreSQL réel.

| Tâche                      | État         | Détail                                                                                                                                                         |
| -------------------------- | ------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `members` + `band_members` | ✅ Créées    | Modèle en trois tables : la PERSONNE, son appartenance à un groupe (période, rôle), sa participation à un album. `musicbrainzId` garde le lien vers la source. |
| `album_lineups`            | ✅ Créée     | Distincte de l'appartenance : un musicien de session figure sur un album sans être membre                                                                      |
| `labels`                   | ✅ Créée     | + `albums.label_id` en `set null` — perdre un label ne doit pas effacer les albums                                                                             |
| `ratings`                  | ✅ Créée     | Note 1-5, clé primaire `(user_id, album_id)` : une seule note par personne. Borne **aussi** en base par un `CHECK` — vérifié.                                  |
| `user_albums`              | ✅ Créée     | Collection / liste d'envies, un statut par couple                                                                                                              |
| Routes                     | ✅ Créées    | `/api/members`, `/api/members/by-slug/{slug}`, `/api/bands/{id}/members` (sync complète), `/api/labels`, `/api/albums/{id}/ratings`, `/api/me/collection`      |
| `/members/[slug]`          | ✅ Restaurée | Supprimée en phase B faute de modèle de données ; elle revient maintenant qu'une table la porte réellement                                                     |
| `/bands/[slug]/members`    | ✅ Revue     | Privilégie la formation persistée, retombe sur MusicBrainz sinon. `noindex` seulement dans ce second cas.                                                      |
| `components/widgets/`      | ✅ Créé      | Dernières sorties, mieux notés, derniers groupes — sur l'accueil, avec repli si la base est indisponible                                                       |
| `hooks/use-media-query`    | ✅ Écrit     | (livré en phase E)                                                                                                                                             |

**Décisions de conception notables :**

- Le classement « mieux notés » exige un **minimum de 3 votes**. Sans ce
  seuil, un album noté 5 par une seule personne coifferait un classique
  noté 4,6 par cinquante — un classement statistiquement mensonger. Le
  nombre de votes est toujours affiché à côté de la moyenne.
- `GET /api/albums/{id}/ratings` ne renvoie qu'un **agrégat** : exposer qui
  a noté quoi révélerait les goûts d'une personne identifiable. `mine` ne
  contient que la note de l'appelant.
- `/api/me/collection` est cadrée sur la session ; aucun `userId` n'est
  accepté en entrée, sans quoi n'importe qui lirait les goûts d'autrui en
  changeant un chiffre d'URL.

---

## Ordre d'exécution recommandé

~~Phase A (stabilisation)~~ ✅ terminée — la CI est verte
~~Phase B (pages détail)~~ ✅ terminée
~~Phase C (parcours contributeur)~~ ✅ terminée
~~Phase D (espace admin)~~ ✅ terminée
~~Phase E (audio + profil)~~ ✅ terminée
~~Phase F (enrichissement)~~ ✅ terminée

**Les six phases du plan sont livrées.** Reste la dette signalée ci-dessous,
qui demande des arbitrages plutôt que du code.

---

## Dette résorbée

Les constats relevés au fil des phases ont été traités.

| Sujet                              | Traitement                                                                                                                                                                                                                            |
| ---------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Approbation sans effet             | ✅ `lib/contributions/approve.ts` matérialise le dossier (phase C)                                                                                                                                                                    |
| Délai d'expiration incohérent      | ✅ Les docstrings disent 30 jours, comme `CONTRIBUTION_POLICY`                                                                                                                                                                        |
| Repli d'URL fragile                | ✅ `\|\|` partout : une variable définie mais VIDE retombe désormais sur le défaut, là où `??` ne rattrapait que `undefined`                                                                                                          |
| Rôles codés en dur                 | ✅ Les deux routes de contributions interrogent `can()` (`contribution:moderate` et `:delete`) au lieu de comparer des chaînes                                                                                                        |
| Doublons                           | ✅ `lib/meili.ts` supprimé au profit de `lib/search/meilisearch.ts`, qui porte désormais `INDEXES` ; `scripts/check-tables.ts` supprimé ; `scripts/setup/*.sh` supprimés (ils recréaient les placeholders effacés)                    |
| `mark-migration-applied` figé      | ✅ Prend la migration en argument ; il visait la 0000 en dur, donc la mauvaise migration passé 0000                                                                                                                                   |
| Thème « metal » rendu en gris      | ✅ `--primary` passe en rouge sang `oklch(… 0.18 25)`. Contrastes mesurés : **7,5:1** (clair) et **6,1:1** (sombre) avec le texte blanc, **3,25:1** du bouton sur fond sombre — au-dessus des seuils WCAG.                            |
| Duplication des fichiers d'état    | ✅ 6 `loading.tsx` réduits à une déclaration de forme (`LoadingSkeleton` / `DetailSkeleton`) ; `error.tsx` partagent `<ErrorFallback>`, qui n'expose plus `error.message` mais le `digest` corrélable aux journaux                    |
| `types/*` doc-only                 | ✅ Les 4 fichiers sans export supprimés ; les types vivent dans les schémas zod                                                                                                                                                       |
| Cloisonnement RGPD — **côté code** | ✅ `db/schema/index.ts` ne ré-exporte plus `./auth`. Migration `0006` volontairement INERTE : le snapshot cesse de suivre les tables identité, donc `db:generate` ne propose plus de `DROP` surprise, et aucune donnée n'est touchée. |

---

## Reste à arbitrer : les tables identité résiduelles

La base CONTENU héberge encore physiquement `user`, `session`, `account`
et `verification` — vestiges du mode mono-base initial. Comptage réel au
moment de l'écriture :

| Base                                    | `user` | `account` |
| --------------------------------------- | ------ | --------- |
| contenu (`DATABASE_URL`)                | 1      | 1         |
| identité (`IDENTITY_AUTH_DATABASE_URL`) | 1      | 1         |

Les identités ont donc bien été recopiées : la version côté contenu est un
**doublon de données personnelles** (email, hash de mot de passe) dans la
base qui ne devrait en contenir aucune.

Les supprimer est une opération **irréversible sur une base réelle**, et ne
peut pas passer par une migration : en mode mono-base — le repli de
`lib/auth-db.ts` quand `IDENTITY_AUTH_DATABASE_URL` est absente, ce qui est
le cas des **tests E2E** — ces tables portent les comptes réels. Une
migration qui les supprime casserait l'authentification en E2E.

L'opération se fait donc à la main, sur la seule base contenu, après avoir
confirmé que la base identité est bien à jour :

```sql
-- À exécuter UNIQUEMENT sur la base contenu, jamais sur la base identité
DROP TABLE IF EXISTS "session", "account", "verification", "user" CASCADE;
DROP TYPE IF EXISTS "user_role";
```

Tant que ce n'est pas fait, le cloisonnement est correct au niveau du code
et de l'application, mais pas au niveau des données au repos.
