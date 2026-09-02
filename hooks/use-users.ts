"use client";

/**
 * Hooks d'administration des comptes (/api/users).
 *
 * La liste est paginée comme les autres entités, mais les écritures ne
 * sont pas un CRUD : on ne « met pas à jour un utilisateur », on change
 * son rôle ou son état de bannissement. Les hooks portent donc ces
 * intentions plutôt qu'un `useUpdateUser` générique — et l'API refuse
 * certaines combinaisons (dernier admin, auto-rétrogradation) que le
 * client ne doit pas prétendre pouvoir forcer.
 */

import {
  queryOptions,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { z } from "zod";
import { apiJsonEnvelope, apiJson, type ApiClientError } from "./api/client";
import { userKeys } from "./api/queryKeys";
import {
  adminUserRowSchema,
  type AdminUserRow,
  type UserRole,
} from "./api/schemas";
import { updateUserSchema } from "@/lib/validations/user";

/** Enveloppe paginée renvoyée par GET /api/users. */
const usersPageSchema = z.object({
  data: z.array(adminUserRowSchema),
  meta: z.object({
    total: z.number(),
    page: z.number(),
    perPage: z.number(),
    totalPages: z.number(),
  }),
});

export type UsersPage = z.infer<typeof usersPageSchema>;

/** Filtres de la liste d'administration. */
export type UsersFilters = {
  page?: number;
  perPage?: number;
  q?: string;
  role?: UserRole;
};

/** Options de requête de la liste paginée des comptes. */
export function usersListOptions(filters: UsersFilters = {}) {
  return queryOptions({
    queryKey: userKeys.list(filters),
    queryFn: async ({ signal }): Promise<UsersPage> => {
      const payload = await apiJsonEnvelope("/api/users", {
        query: filters,
        signal,
      });
      return usersPageSchema.parse(payload);
    },
  });
}

/** Liste paginée des comptes (admin). */
export function useUsers(filters: UsersFilters = {}) {
  return useQuery(usersListOptions(filters));
}

/**
 * Change le rôle d'un compte.
 *
 * Séparé du bannissement : ce sont deux décisions distinctes, et les
 * confondre dans un même hook rendrait les invalidations et les messages
 * d'erreur ambigus.
 */
export function useSetUserRole() {
  const qc = useQueryClient();
  return useMutation<
    AdminUserRow,
    ApiClientError,
    { id: string; role: UserRole }
  >({
    mutationFn: async ({ id, role }) => {
      const body = updateUserSchema.parse({ role });
      const data = await apiJson<unknown>(
        `/api/users/${encodeURIComponent(id)}`,
        { method: "PATCH", body },
      );
      return adminUserRowSchema.parse(data);
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: userKeys.all });
    },
  });
}

/** Bannit ou réhabilite un compte. */
export function useSetUserBan() {
  const qc = useQueryClient();
  return useMutation<
    AdminUserRow,
    ApiClientError,
    { id: string; banned: boolean; banReason?: string | null }
  >({
    mutationFn: async ({ id, banned, banReason }) => {
      const body = updateUserSchema.parse({
        banned,
        // Lever un bannissement efface son motif côté serveur ; ne pas
        // l'envoyer ici éviterait un aller-retour incohérent.
        ...(banned ? { banReason: banReason ?? null } : {}),
      });
      const data = await apiJson<unknown>(
        `/api/users/${encodeURIComponent(id)}`,
        { method: "PATCH", body },
      );
      return adminUserRowSchema.parse(data);
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: userKeys.all });
    },
  });
}

/** Supprime définitivement un compte. */
export function useDeleteUser() {
  const qc = useQueryClient();
  return useMutation<{ deleted: boolean; id: string }, ApiClientError, string>({
    mutationFn: (id) =>
      apiJson<{ deleted: boolean; id: string }>(
        `/api/users/${encodeURIComponent(id)}`,
        { method: "DELETE" },
      ),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: userKeys.all });
    },
  });
}
