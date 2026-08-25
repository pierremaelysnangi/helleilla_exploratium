/**
 * Route catch-all de l'API d'authentification (better-auth).
 * Délègue toutes les requêtes sous /api/auth/* (inscription, connexion,
 * déconnexion, sessions, etc.) au handler de better-auth.
 */
// `auth` : instance better-auth configurée dans `@/lib/auth`
// (fournit le handler traitant toutes les routes d'authentification).
// `toNextJsHandler` : adaptateur convertissant le handler better-auth
// en exports GET/POST compatibles avec les App Routes Next.js.
import { auth } from "@/lib/auth";
import { toNextJsHandler } from "better-auth/next-js";

/**
 * Expose les méthodes HTTP GET et POST gérées par better-auth.
 * Toute requête /api/auth/** est transmise telle quelle au handler.
 */
export const { GET, POST } = toNextJsHandler(auth.handler);
