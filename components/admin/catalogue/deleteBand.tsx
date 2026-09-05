"use client";

/**
 * <DeleteBand> — retrait d'un groupe depuis son écran d'édition.
 *
 * Enveloppe `<DeleteEntity>` avec la mutation et l'avertissement qui
 * conviennent : un groupe emporte toute sa discographie.
 */

import { useDeleteBand } from "@/hooks/use-bands";
import { useT } from "@/lib/i18n/client";
import { DeleteEntity } from "./deleteEntity";

export function DeleteBand({ id, name }: { id: string; name: string }) {
  const t = useT();
  const remove = useDeleteBand();

  return (
    <DeleteEntity
      name={name}
      warning={t.admin.deleteBandWarning}
      pending={remove.isPending}
      error={remove.error}
      redirectTo="/admin/catalogue"
      onDelete={() => remove.mutateAsync(id)}
    />
  );
}
