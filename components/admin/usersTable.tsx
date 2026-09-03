"use client";

/**
 * <UsersTable> — gestion des comptes.
 *
 * Deux principes de conception, hérités des garde-fous de l'API :
 *
 * - le compte de l'administrateur courant est signalé et ses actions
 *   destructrices masquées : l'API les refuse déjà, les afficher ne
 *   produirait qu'une erreur ;
 * - la suppression demande une confirmation explicite par saisie du nom,
 *   car elle efface une identité et n'a aucun retour en arrière.
 */

import { useState } from "react";
import {
  useUsers,
  useSetUserRole,
  useSetUserBan,
  useDeleteUser,
} from "@/hooks/use-users";
import type { AdminUserRow, UserRole } from "@/hooks/api/schemas";
import { RoleBadge, ROLE_ORDER, roleLabel } from "./roleBadge";
import { EmptyState } from "@/components/shared/emptyState";
import { Skeleton } from "@/components/ui/skeleton";
import { useT, usePlural } from "@/lib/i18n/client";
import { interpolate } from "@/lib/i18n/format";

type UsersTableProps = {
  /** Identifiant de l'administrateur connecté, pour l'auto-protection. */
  currentUserId: string;
};

/** Formate une date ISO en date courte. */
function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export function UsersTable({ currentUserId }: UsersTableProps) {
  const t = useT();
  const n = usePlural();
  const [q, setQ] = useState("");
  const [role, setRole] = useState<UserRole | "">("");
  const [page, setPage] = useState(1);

  const users = useUsers({
    page,
    perPage: 20,
    q: q.trim() || undefined,
    role: role || undefined,
  });

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-end gap-3">
        <label className="min-w-0 flex-1 sm:max-w-xs">
          <span className="text-muted-foreground mb-1 block text-xs">
            {t.admin.searchAccount}
          </span>
          <input
            type="search"
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setPage(1);
            }}
            className="border-border bg-card focus:border-primary/50 w-full rounded-md border px-3 py-2 text-sm outline-none"
          />
        </label>

        <label className="sm:w-52">
          <span className="text-muted-foreground mb-1 block text-xs">
            {t.admin.role}
          </span>
          <select
            value={role}
            onChange={(e) => {
              setRole(e.target.value as UserRole | "");
              setPage(1);
            }}
            className="border-border bg-card focus:border-primary/50 w-full rounded-md border px-3 py-2 text-sm outline-none"
          >
            <option value="">{t.app.allRoles}</option>
            {ROLE_ORDER.map((r) => (
              <option key={r} value={r}>
                {roleLabel(t, r)}
              </option>
            ))}
          </select>
        </label>
      </div>

      {users.isPending && (
        <div className="flex flex-col gap-2">
          <Skeleton className="h-20" />
          <Skeleton className="h-20" />
          <Skeleton className="h-20" />
        </div>
      )}

      {users.isError && (
        <p role="alert" className="text-destructive text-sm">
          {t.app.accountsLoadFailed}
        </p>
      )}

      {users.isSuccess && users.data.data.length === 0 && (
        <EmptyState
          title={t.admin.noAccount}
          description={t.admin.noAccountDescription}
        />
      )}

      <ul className="flex flex-col gap-2">
        {(users.data?.data ?? []).map((account) => (
          <li key={account.id}>
            <UserRow account={account} isSelf={account.id === currentUserId} />
          </li>
        ))}
      </ul>

      {users.isSuccess && users.data.meta.totalPages > 1 && (
        <nav
          aria-label={t.app.pagination}
          className="flex items-center justify-between gap-3 text-sm"
        >
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
            className="border-border hover:bg-accent/30 rounded-md border px-3 py-1.5 text-xs font-semibold tracking-wide uppercase disabled:opacity-40"
          >
            {t.app.previous}
          </button>
          <span className="text-muted-foreground text-xs">
            {`${interpolate(t.app.pageOf, {
              page: users.data.meta.page,
              total: users.data.meta.totalPages,
            })} · ${n(t.count.accounts, users.data.meta.total)}`}
          </span>
          <button
            type="button"
            disabled={page >= users.data.meta.totalPages}
            onClick={() => setPage((p) => p + 1)}
            className="border-border hover:bg-accent/30 rounded-md border px-3 py-1.5 text-xs font-semibold tracking-wide uppercase disabled:opacity-40"
          >
            {t.app.next}
          </button>
        </nav>
      )}
    </div>
  );
}

/** Ligne d'un compte : rôle modifiable, bannissement, suppression. */
function UserRow({
  account,
  isSelf,
}: {
  account: AdminUserRow;
  isSelf: boolean;
}) {
  const t = useT();
  const [confirming, setConfirming] = useState(false);
  const [confirmName, setConfirmName] = useState("");

  const setRole = useSetUserRole();
  const setBan = useSetUserBan();
  const remove = useDeleteUser();

  // Une seule erreur à la fois : celle de la dernière action tentée
  const error = setRole.error ?? setBan.error ?? remove.error;
  const busy = setRole.isPending || setBan.isPending || remove.isPending;

  return (
    <article className="metal-card flex flex-col gap-3 p-4">
      <header className="flex flex-wrap items-center justify-between gap-2">
        <div className="min-w-0">
          <h3 className="truncate text-sm font-semibold">
            {account.name}
            {isSelf && (
              <span className="text-muted-foreground ml-2 text-xs font-normal">
                {t.admin.you}
              </span>
            )}
          </h3>
          <p className="text-muted-foreground truncate text-xs">
            {account.email}
            {!account.emailVerified && ` · ${t.admin.emailUnverified}`}
            {` · ${interpolate(t.admin.registeredOn, {
              date: formatDate(account.createdAt),
            })}`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {account.banned && (
            <span className="border-destructive/40 text-destructive rounded-full border px-2 py-0.5 text-xs uppercase">
              {t.admin.banned}
            </span>
          )}
          <RoleBadge t={t} role={account.role} />
        </div>
      </header>

      {account.banned && account.banReason && (
        <p className="text-muted-foreground text-xs">
          {interpolate(t.admin.banReason, { reason: account.banReason })}
        </p>
      )}

      {error && (
        <p role="alert" className="text-destructive text-sm">
          {error.message}
        </p>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <label className="flex items-center gap-2 text-xs">
          <span className="text-muted-foreground">{t.admin.role}</span>
          <select
            value={account.role}
            disabled={busy || isSelf}
            onChange={(e) =>
              setRole.mutate({
                id: account.id,
                role: e.target.value as UserRole,
              })
            }
            className="border-border bg-card focus:border-primary/50 rounded-md border px-2 py-1 text-xs outline-none disabled:opacity-50"
          >
            {ROLE_ORDER.map((r) => (
              <option key={r} value={r}>
                {roleLabel(t, r)}
              </option>
            ))}
          </select>
        </label>

        {/* L'API refuse déjà l'auto-sanction : on ne propose pas l'action */}
        {!isSelf && (
          <>
            <button
              type="button"
              disabled={busy}
              onClick={() =>
                setBan.mutate({
                  id: account.id,
                  banned: !account.banned,
                  ...(account.banned
                    ? {}
                    : { banReason: t.admin.banDefaultReason }),
                })
              }
              className="border-border hover:bg-accent/30 rounded-md border px-3 py-1.5 text-xs font-semibold tracking-wide uppercase disabled:opacity-50"
            >
              {account.banned ? t.admin.unban : t.admin.ban}
            </button>

            {confirming ? (
              <span className="flex flex-wrap items-center gap-2">
                <input
                  type="text"
                  placeholder={interpolate(t.admin.typeNameToConfirm, {
                    name: account.name,
                  })}
                  value={confirmName}
                  onChange={(e) => setConfirmName(e.target.value)}
                  className="border-destructive/40 bg-card rounded-md border px-2 py-1 text-xs outline-none"
                />
                <button
                  type="button"
                  disabled={busy || confirmName !== account.name}
                  onClick={() => remove.mutate(account.id)}
                  className="border-destructive/40 text-destructive hover:bg-destructive/10 rounded-md border px-3 py-1.5 text-xs font-semibold tracking-wide uppercase disabled:opacity-40"
                >
                  {t.app.confirmDeletion}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setConfirming(false);
                    setConfirmName("");
                  }}
                  className="text-muted-foreground text-xs underline"
                >
                  {t.app.cancel}
                </button>
              </span>
            ) : (
              <button
                type="button"
                disabled={busy}
                onClick={() => setConfirming(true)}
                className="text-muted-foreground hover:text-destructive text-xs underline disabled:opacity-50"
              >
                {t.app.delete}
              </button>
            )}
          </>
        )}
      </div>

      {confirming && (
        <p className="text-muted-foreground text-xs">
          {t.admin.deletionWarning}
        </p>
      )}
    </article>
  );
}
