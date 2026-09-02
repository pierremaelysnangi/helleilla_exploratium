/**
 * Routes /api/users/:id — administration d'un compte.
 *
 * Deux garde-fous structurent ces handlers, parce qu'ils portent sur le
 * mécanisme de contrôle d'accès lui-même :
 *
 * 1. un administrateur ne peut ni se rétrograder ni se supprimer — c'est
 *    la façon la plus simple de se verrouiller hors de l'administration ;
 * 2. le DERNIER administrateur est intouchable — le rétrograder rendrait
 *    l'espace d'administration inaccessible à tout le monde, sans recours
 *    depuis l'interface (il faudrait repasser par `pnpm seed:admin`).
 */

// Wrapper standard + réponses
import { route } from "@/lib/api/handler";
import { ok, fail } from "@/lib/api/response";
import { z } from "zod";
// Contrat d'écriture (source unique)
import { updateUserSchema } from "@/lib/validations/user";
// Accès base identité
import { getUserById, countAdmins } from "@/db/queries/users";
import { updateUserAsAdmin, deleteUserAsAdmin } from "@/db/mutations/users";

/**
 * Le paramètre est un identifiant Better Auth (texte généré par la
 * bibliothèque), et non un UUID applicatif : `idParamSchema` du reste de
 * l'API rejetterait des identifiants pourtant valides.
 */
const userParamSchema = z.object({ id: z.string().min(1).max(200) });

/** GET /api/users/:id — détail d'un compte (admin). */
export const GET = route(
  {
    params: userParamSchema,
    permission: { resource: "user", action: "read" },
    rateLimit: { limit: 60, window: 60 },
  },
  async ({ params }) => {
    const found = await getUserById(params.id);
    if (!found) return fail("NOT_FOUND", "Compte introuvable");
    return ok(found);
  },
);

/**
 * PATCH /api/users/:id — change le rôle ou l'état de bannissement.
 *
 * @returns 200 avec le compte à jour, 409 si l'opération viderait
 *   l'administration de ses derniers droits.
 */
export const PATCH = route(
  {
    params: userParamSchema,
    body: updateUserSchema,
    permission: { resource: "user", action: "update" },
    rateLimit: { limit: 20, window: 60, failMode: "closed" },
  },
  async ({ params, body, session }) => {
    const target = await getUserById(params.id);
    if (!target) return fail("NOT_FOUND", "Compte introuvable");

    const isSelf = target.id === session!.user.id;
    const losesAdmin = body.role !== undefined && body.role !== "admin";

    // 1. Auto-protection : ni auto-rétrogradation, ni auto-bannissement
    if (isSelf && (losesAdmin || body.banned === true)) {
      return fail(
        "FORBIDDEN",
        "Vous ne pouvez pas retirer vos propres droits ni vous bannir",
      );
    }

    // 2. Dernier administrateur : la rétrograder ou la bannir fermerait
    //    l'administration à tout le monde.
    if (target.role === "admin" && (losesAdmin || body.banned === true)) {
      if ((await countAdmins()) <= 1) {
        return fail(
          "CONFLICT",
          "Dernier administrateur : nommez-en un autre avant de retirer ces droits",
        );
      }
    }

    const updated = await updateUserAsAdmin(params.id, {
      ...(body.role !== undefined ? { role: body.role } : {}),
      ...(body.banned !== undefined ? { banned: body.banned } : {}),
      ...(body.banReason !== undefined ? { banReason: body.banReason } : {}),
    });
    if (!updated) return fail("NOT_FOUND", "Compte introuvable");
    return ok(updated);
  },
);

/**
 * DELETE /api/users/:id — supprime un compte.
 *
 * Les contributions déjà soumises sont conservées : leur `submittedBy` ne
 * renvoie alors plus à aucune identité, ce qui anonymise la trace tout en
 * préservant l'historique de modération.
 */
export const DELETE = route(
  {
    params: userParamSchema,
    permission: { resource: "user", action: "delete" },
    rateLimit: { limit: 10, window: 60, failMode: "closed" },
  },
  async ({ params, session }) => {
    const target = await getUserById(params.id);
    if (!target) return fail("NOT_FOUND", "Compte introuvable");

    if (target.id === session!.user.id) {
      return fail(
        "FORBIDDEN",
        "Vous ne pouvez pas supprimer votre propre compte",
      );
    }

    if (target.role === "admin" && (await countAdmins()) <= 1) {
      return fail(
        "CONFLICT",
        "Dernier administrateur : nommez-en un autre avant de supprimer ce compte",
      );
    }

    const deleted = await deleteUserAsAdmin(params.id);
    if (!deleted) return fail("NOT_FOUND", "Compte introuvable");
    return ok({ deleted: true, id: params.id });
  },
);
