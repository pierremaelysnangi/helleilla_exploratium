"use client";

/**
 * Separator — ligne de séparation visuelle entre des sections.
 * Composant shadcn/ui basé sur le primitive Separator de Base UI.
 */
// Primitive Separator de Base UI
import { Separator as SeparatorPrimitive } from "@base-ui/react/separator";

// Fusion de classes conditionnelle
import { cn } from "@/lib/utils";

/**
 * Séparateur horizontal ou vertical.
 * @param orientation - "horizontal" (défaut) ou "vertical".
 */
function Separator({
  className,
  orientation = "horizontal",
  ...props
}: SeparatorPrimitive.Props) {
  return (
    <SeparatorPrimitive
      data-slot="separator"
      orientation={orientation}
      className={cn(
        "bg-border shrink-0 data-horizontal:h-px data-horizontal:w-full data-vertical:w-px data-vertical:self-stretch",
        className,
      )}
      {...props}
    />
  );
}

export { Separator };
