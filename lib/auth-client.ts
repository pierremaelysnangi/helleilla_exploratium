/**
 * Client d'authentification Better Auth pour le navigateur.
 * Fournit une instance unique `authClient` utilisée côté client React
 * pour la connexion, l'inscription, la déconnexion et l'accès à la session.
 */

// Client Better Auth adapté aux composants React
import { createAuthClient } from "better-auth/react";
// Plugins client : gestion des fonctions admin + inférence des champs additionnels
import { adminClient, inferAdditionalFields } from "better-auth/client/plugins";
// Type du serveur auth, utilisé pour déduire les champs personnalisés côté client
import type { auth } from "@/lib/auth";

/**
 * Instance du client Better Auth configurée avec :
 * - baseURL : URL de l'app (variable publique NEXT_PUBLIC_APP_URL)
 * - plugins : fonctions admin et typage des champs additionnels définis côté serveur
 */
export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
  plugins: [adminClient(), inferAdditionalFields<typeof auth>()],
});

// Réexport des méthodes courantes : connexion, inscription, déconnexion et hook de session
export const { signIn, signUp, signOut, useSession } = authClient;
