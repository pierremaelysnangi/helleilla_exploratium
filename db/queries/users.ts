/**
 * @file Requêtes (lectures) sur les comptes utilisateurs.
 *
 * ⚠️ Ces lectures visent la base IDENTITÉ (`authDb`), pas la base contenu.
 * C'est le seul endroit de l'application, hors Better Auth lui-même, qui
 * lit des données personnelles (email, statut de bannissement) : elles
 * sont indispensables à l'administration des comptes, et n'ont donc de
 * sens que derrière la permission `user:read`, réservée aux admins.
 *
 * La table `profiles` de la base contenu n'est qu'une projection publique
 * (nom affiché + rôle) : elle ne suffit pas à administrer un compte.
 */

// Instance Drizzle dédiée à la base identité
import { authDb } from "@/lib/auth-db";
import { user } from "@/db/schema/auth";
import { and, asc, count, eq, ilike, or, type SQL } from "drizzle-orm";

/** Ligne utilisateur complète telle que stockée en base identité. */
export type UserRow = typeof user.$inferSelect;

/**
 * Projection exposée par l'API d'administration.
 *
 * Volontairement explicite plutôt qu'un `select()` global : cela garantit
 * qu'aucune colonne sensible ajoutée plus tard à la table (jeton, secret)
 * ne se retrouve exposée par simple effet de bord.
 */
const ADMIN_COLUMNS = {
  id: user.id,
  name: user.name,
  email: user.email,
  emailVerified: user.emailVerified,
  role: user.role,
  banned: user.banned,
  banReason: user.banReason,
  banExpires: user.banExpires,
  createdAt: user.createdAt,
  updatedAt: user.updatedAt,
} as const;

/** Utilisateur tel que renvoyé à l'administration. */
export type AdminUser = {
  id: string;
  name: string;
  email: string;
  emailVerified: boolean;
  role: UserRow["role"];
  banned: boolean | null;
  banReason: string | null;
  banExpires: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

/** Options de la liste paginée d'utilisateurs. */
type ListUsersOptions = {
  page: number;
  perPage: number;
  /** Recherche sur le nom ou l'email. */
  q?: string;
  /** Filtre par rôle exact. */
  role?: UserRow["role"];
};

/**
 * Liste paginée des comptes, triés par date de création croissante
 * (l'ordre d'arrivée est plus parlant qu'un tri alphabétique pour
 * administrer une communauté).
 *
 * @returns Les lignes de la page et le total correspondant au filtre.
 */
export async function listUsers({
  page,
  perPage,
  q,
  role,
}: ListUsersOptions): Promise<{ items: AdminUser[]; total: number }> {
  const filters: (SQL | undefined)[] = [
    q ? or(ilike(user.name, `%${q}%`), ilike(user.email, `%${q}%`)) : undefined,
    role ? eq(user.role, role) : undefined,
  ];
  const where = and(...filters.filter(Boolean));

  const [items, [totals]] = await Promise.all([
    authDb
      .select(ADMIN_COLUMNS)
      .from(user)
      .where(where)
      .orderBy(asc(user.createdAt))
      .limit(perPage)
      .offset((page - 1) * perPage),
    authDb.select({ value: count() }).from(user).where(where),
  ]);

  return { items, total: totals?.value ?? 0 };
}

/**
 * Récupère un compte par identifiant Better Auth.
 * @returns Le compte, ou null s'il n'existe pas.
 */
export async function getUserById(id: string): Promise<AdminUser | null> {
  const [row] = await authDb
    .select(ADMIN_COLUMNS)
    .from(user)
    .where(eq(user.id, id))
    .limit(1);
  return row ?? null;
}

/**
 * Compte les administrateurs existants.
 *
 * Sert de garde-fou : rétrograder ou supprimer le dernier admin
 * verrouillerait définitivement l'espace d'administration, sans recours
 * possible depuis l'interface.
 */
export async function countAdmins(): Promise<number> {
  const [row] = await authDb
    .select({ value: count() })
    .from(user)
    .where(eq(user.role, "admin"));
  return row?.value ?? 0;
}
