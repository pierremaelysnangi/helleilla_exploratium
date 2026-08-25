/**
 * Conversion des erreurs PostgreSQL en erreurs API propres.
 * Sans ce mapping, une violation de contrainte (slug dupliqué, FK vers
 * une entité inexistante…) remontait en 500 générique ; elle devient
 * ici un 409/422 explicite exploitable par les clients.
 */

// Erreur métier standard de l'API
import { ApiError, type ErrorCodeKey } from "./response";

/** Codes SQLSTATE PostgreSQL gérés, avec leur traduction HTTP. */
const PG_CODE_MAP: Record<string, { code: ErrorCodeKey; message: string }> = {
  // unique_violation : la ressource existe déjà (slug, email…)
  "23505": {
    code: "CONFLICT",
    message: "Un enregistrement identique existe déjà",
  },
  // foreign_key_violation : référence vers une entité inexistante
  "23503": {
    code: "VALIDATION",
    message: "Référence vers une entité inexistante",
  },
  // check_violation / not_null_violation : données hors contraintes
  "23514": {
    code: "VALIDATION",
    message: "Valeur rejetée par une contrainte de données",
  },
  "23502": { code: "VALIDATION", message: "Champ obligatoire manquant" },
  // invalid_text_representation : cast échoué (ex : UUID malformé en SQL)
  "22P02": { code: "VALIDATION", message: "Identifiant ou valeur malformée" },
};

/**
 * Tente de convertir une erreur technique (Drizzle/postgres.js) en
 * ApiError selon le SQLSTATE PostgreSQL.
 *
 * Les erreurs sont cherchées à deux endroits : `err.code` (postgres.js
 * brut) et `err.cause.code` (enveloppé par DrizzleQueryError).
 *
 * @param err - Erreur attrapée par le pipeline `route()`.
 * @returns Une ApiError si le code est connu, sinon null (erreur non-SQL).
 */
export function pgErrorToApiError(err: unknown): ApiError | null {
  const candidate = err as
    { code?: string; cause?: { code?: string } } | null | undefined;
  if (!candidate) return null;

  const pgCode = candidate.code ?? candidate.cause?.code;
  if (!pgCode) return null;

  const mapped = PG_CODE_MAP[pgCode];
  if (!mapped) return null;

  return new ApiError(mapped.code, mapped.message, { sqlState: pgCode });
}
