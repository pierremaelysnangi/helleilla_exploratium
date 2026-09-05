"use client";

/**
 * <ForumComposer> — écrire un avis sur un groupe ou un album.
 *
 * Le sujet n'est PAS choisi ici : le composant le reçoit de la page qui
 * l'affiche. Un sélecteur libre aurait demandé de charger tout le
 * catalogue dans une liste déroulante, et surtout de choisir hors
 * contexte ce qu'on vient justement de lire. On écrit son avis là où on
 * l'a formé — sur la fiche du groupe ou de l'album.
 */

import { useState } from "react";
import Link from "next/link";
import { useSession } from "@/lib/auth-client";
import { useT } from "@/lib/i18n/client";
import { interpolate } from "@/lib/i18n/format";
import { rich } from "@/lib/i18n/rich";
import { useCreateForumPost } from "@/hooks/use-forum";
import {
  FORUM_POST_MIN_LENGTH,
  FORUM_POST_MAX_LENGTH,
} from "@/db/schema/forum";

export function ForumComposer({
  bandId,
  albumId,
}: {
  bandId?: string;
  albumId?: string;
}) {
  const t = useT();
  const { data: session } = useSession();
  const [body, setBody] = useState("");
  const create = useCreateForumPost();

  if (!session) {
    return (
      <p className="text-muted-foreground text-sm">
        {rich(t.forum.signInToPost, {
          link: (
            <Link href="/sign-in" className="hover:text-foreground underline">
              {t.account.signInAction}
            </Link>
          ),
        })}
      </p>
    );
  }

  const trimmed = body.trim();
  const ready =
    trimmed.length >= FORUM_POST_MIN_LENGTH &&
    trimmed.length <= FORUM_POST_MAX_LENGTH;

  return (
    <form
      className="flex flex-col gap-2"
      onSubmit={(e) => {
        e.preventDefault();
        if (!ready) return;
        create.mutate(
          { bandId, albumId, body: trimmed },
          { onSuccess: () => setBody("") },
        );
      }}
    >
      <label className="flex flex-col gap-1">
        <span className="text-muted-foreground text-xs">
          {t.forum.bodyLabel}
        </span>
        <textarea
          rows={4}
          value={body}
          maxLength={FORUM_POST_MAX_LENGTH}
          onChange={(e) => setBody(e.target.value)}
          className="border-border bg-card focus:border-primary/50 w-full rounded-md border px-3 py-2 text-sm outline-none"
        />
      </label>

      <p className="text-muted-foreground text-xs">
        {interpolate(t.forum.bodyHint, {
          min: FORUM_POST_MIN_LENGTH,
          max: FORUM_POST_MAX_LENGTH,
        })}
      </p>

      {create.isError && (
        <p role="alert" className="text-destructive text-sm">
          {create.error.message}
        </p>
      )}

      <button
        type="submit"
        disabled={!ready || create.isPending}
        className="bg-primary text-primary-foreground self-start rounded-md px-4 py-2 text-sm font-semibold tracking-wide uppercase transition-opacity hover:opacity-90 disabled:opacity-50"
      >
        {create.isPending ? t.forum.publishing : t.forum.publish}
      </button>
    </form>
  );
}
