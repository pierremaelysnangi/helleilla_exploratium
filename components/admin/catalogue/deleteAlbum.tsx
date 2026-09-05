"use client";

/**
 * <DeleteAlbum> — retrait d'une sortie depuis son écran d'édition.
 *
 * Une sortie emporte ses pistes, mais rien d'autre : l'avertissement le
 * dit, sans dramatiser plus que nécessaire.
 */

import { useDeleteAlbum } from "@/hooks/use-albums";
import { useT } from "@/lib/i18n/client";
import { DeleteEntity } from "./deleteEntity";

export function DeleteAlbum({
  id,
  title,
  bandId,
}: {
  id: string;
  title: string;
  /** Où revenir : la discographie du groupe qui signait la sortie. */
  bandId: string;
}) {
  const t = useT();
  const remove = useDeleteAlbum();

  return (
    <DeleteEntity
      name={title}
      warning={t.admin.deleteAlbumWarning}
      pending={remove.isPending}
      error={remove.error}
      redirectTo={`/admin/catalogue/groupes/${bandId}`}
      onDelete={() => remove.mutateAsync(id)}
    />
  );
}
