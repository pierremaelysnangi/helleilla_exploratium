/**
 * @file Point d'entrée unique du schéma de base de données.
 *
 * Ré-exporte l'ensemble des tables, enums et relations pour permettre
 * des imports centralisés (ex. `import { albums } from "@/db/schema"`)
 * et alimenter l'instance Drizzle (`drizzle(client, { schema })`).
 */

// Tables et enums liés aux groupes musicaux
export * from "./bands";
// Table et enum liés aux albums
export * from "./albums";
// Table liée aux pistes
export * from "./tracks";
// Tables genres + jonction band_genres
export * from "./genres";
// Références externes vers les plateformes (musicbrainz, discogs…)
export * from "./externalRefs";
// Contributions modérées (workflow contributeur/modérateur)
export * from "./contributions";
// Déclarations des relations entre tables (API db.query.*)
export * from "./relations";
// Tables d'authentification (user, session, account, verification)
// NB : migrées vers la base dédiée AUTH_DATABASE_URL (voir lib/auth-db.ts)
export * from "./auth";
// Profils publics répliqués depuis la base identité
export * from "./profiles";
// Labels (maisons de disques) référencés par les albums
export * from "./labels";
// Membres, appartenances aux groupes et formations par album
export * from "./members";
// Notes et listes personnelles des utilisateurs
export * from "./collections";
