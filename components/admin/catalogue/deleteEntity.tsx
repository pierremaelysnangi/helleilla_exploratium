"use client";

/**
 * <DeleteEntity> — retrait d'un groupe ou d'une sortie.
 *
 * La confirmation demande de RECOPIER le nom, comme la suppression d'un
 * compte. Une boîte « êtes-vous sûr ? » se valide par réflexe ; recopier
 * « Darkthrone » oblige à regarder ce qu'on est en train de détruire.
 *
 * La conséquence est annoncée avant l'action, pas après : supprimer un
 * groupe emporte ses sorties et leurs pistes, la base le fait en
 * cascade. Découvrir cela une fois le bouton pressé serait un piège.
 */

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useT } from "@/lib/i18n/client";
import { interpolate } from "@/lib/i18n/format";
import { FIELD_CLASS, FormError } from "@/components/shared/formField";

export function DeleteEntity({
  name,
  warning,
  onDelete,
  redirectTo,
  pending,
  error,
}: {
  /** Nom à recopier — celui que l'on voit à l'écran. */
  name: string;
  /** Ce que la suppression emporte avec elle, dit avant d'agir. */
  warning: string;
  onDelete: () => Promise<unknown>;
  /** Où aller ensuite : la page supprimée n'existera plus. */
  redirectTo: string;
  pending: boolean;
  error?: Error | null;
}) {
  const t = useT();
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [typed, setTyped] = useState("");

  if (!confirming) {
    return (
      <button
        type="button"
        onClick={() => setConfirming(true)}
        className="border-destructive/40 text-destructive hover:bg-destructive/10 self-start rounded-md border px-4 py-2 text-xs font-semibold tracking-wide uppercase"
      >
        {t.app.delete}
      </button>
    );
  }

  return (
    <div className="border-destructive/40 flex flex-col gap-3 rounded-md border p-4">
      <p className="text-muted-foreground text-sm">{warning}</p>

      <label className="flex flex-col gap-1 text-sm">
        <span className="text-muted-foreground text-xs">
          {interpolate(t.admin.typeNameToConfirm, { name })}
        </span>
        <input
          value={typed}
          onChange={(e) => setTyped(e.target.value)}
          className={`${FIELD_CLASS} max-w-sm`}
        />
      </label>

      {error && <FormError>{error.message}</FormError>}

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          disabled={typed !== name || pending}
          onClick={async () => {
            await onDelete();
            router.push(redirectTo);
          }}
          className="border-destructive/40 text-destructive hover:bg-destructive/10 rounded-md border px-4 py-2 text-xs font-semibold tracking-wide uppercase disabled:opacity-40"
        >
          {t.app.confirmDeletion}
        </button>
        <button
          type="button"
          onClick={() => {
            setConfirming(false);
            setTyped("");
          }}
          className="text-muted-foreground text-xs underline"
        >
          {t.app.cancel}
        </button>
      </div>
    </div>
  );
}
