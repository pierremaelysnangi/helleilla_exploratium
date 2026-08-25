/**
 * Skeleton — placeholder animé (pulse) affiché pendant le chargement.
 * Composant shadcn/ui standard.
 */
// Fusion de classes conditionnelle
import { cn } from "@/lib/utils";

/** Bloc grisé pulsant imitant la forme du contenu en cours de chargement. */
function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="skeleton"
      className={cn("bg-muted animate-pulse rounded-md", className)}
      {...props}
    />
  );
}

export { Skeleton };
