/**
 * @file Point d'entrée de la connexion à la base de données.
 *
 * Ce fichier initialise le client PostgreSQL (`postgres`) et l'instance
 * Drizzle ORM (`db`) partagée par toutes les requêtes et mutations du projet.
 * Il exporte également le type `DB`, pratique pour typer des fonctions
 * utilitaires ou injecter la base dans d'autres couches.
 */

// Drizzle : constructeur de l'instance ORM branchée sur un driver postgres-js
import { drizzle } from "drizzle-orm/postgres-js";
// Driver PostgreSQL bas niveau utilisé sous le capot par Drizzle
import postgres from "postgres";
// Schéma complet (tables + relations) déclaré dans ./schema
import * as schema from "./schema";

/** Chaîne de connexion récupérée depuis l'environnement (obligatoire). */
const connectionString = process.env.DATABASE_URL!;

// prepare: false → obligatoire avec le transaction pooler (pgbouncer)
const client = postgres(connectionString, {
  prepare: false,
  max: 10, // nombre maximal de connexions dans le pool
});

/**
 * Instance Drizzle unique de l'application, enrichie du schéma pour
 * permettre l'API relationnelle (`db.query.*`).
 */
export const db = drizzle(client, { schema });

/** Type de l'instance Drizzle, réutilisable pour l'injection de dépendances. */
export type DB = typeof db;

/** Ferme le pool de connexions applicatif (usage : teardown de tests). */
export const closeDb = () => client.end({ timeout: 5 });
