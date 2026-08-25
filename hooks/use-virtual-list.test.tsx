import type { VirtualInfiniteListProps } from "@/components/shared/virtualInfiniteList";
/**
 * Tests de la virtualisation : logique pure `shouldLoadMore`
 * (déclenchement infinite scroll) et rendu minimal de
 * <VirtualInfiniteList> en jsdom.
 */
// Environnement DOM requis par le rendu React
// @vitest-environment jsdom
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { shouldLoadMore } from "./use-virtual-list";
import { VirtualInfiniteList } from "@/components/shared/virtualInfiniteList";

describe("shouldLoadMore", () => {
  it("vrai quand tout le contenu tient dans le viewport (liste vide)", () => {
    expect(shouldLoadMore(0, 0, 800)).toBe(true);
  });

  it("faux tant qu'on est loin de la fin", () => {
    // Contenu 10 000 px, viewport 800, seuil 400 : à offset 1000 on est loin
    expect(shouldLoadMore(1000, 10_000, 800)).toBe(false);
  });

  it("vrai quand on entre dans la zone de seuil", () => {
    // Fin du contenu atteinte : 9201 + 800 >= 10 000 - 400
    expect(shouldLoadMore(9201, 10_000, 800)).toBe(true);
  });

  it("respecte un seuil personnalisé", () => {
    expect(shouldLoadMore(8800, 10_000, 800, 2000)).toBe(true);
    expect(shouldLoadMore(5000, 10_000, 800, 2000)).toBe(false);
  });
});

describe("<VirtualInfiniteList>", () => {
  type TestItem = { id: number; name: string };
  const items: TestItem[] = Array.from({ length: 5 }, (_, i) => ({
    id: i,
    name: `Item ${i}`,
  }));

  function renderList(props: Partial<VirtualInfiniteListProps<TestItem>> = {}) {
    return render(
      <VirtualInfiniteList
        items={items}
        getItemKey={(item) => item.id}
        estimateSize={() => 60}
        renderItem={(item) => <div>{item.name}</div>}
        {...props}
      />,
    );
  }

  it("calcule la hauteur totale depuis l'estimation sans crash", () => {
    // jsdom n'a pas de layout : aucune ligne virtuelle n'est rendue,
    // mais la hauteur totale (5 x 60 px) doit être projetée dans le DOM
    const { container } = renderList();
    const inner = container.querySelector('[style*="position: relative"]');
    expect(inner?.getAttribute("style")).toContain("height: 300px");
  });

  it("affiche l'indicateur de chargement pendant fetchNextPage", () => {
    render(
      <VirtualInfiniteList
        items={items}
        getItemKey={(item) => item.id}
        estimateSize={() => 60}
        renderItem={(item: { id: number; name: string }) => (
          <div>{item.name}</div>
        )}
        hasMore
        isLoadingMore
        onLoadMore={vi.fn()}
      />,
    );
    expect(screen.getByText("Chargement…")).toBeDefined();
  });

  it("ne charge plus quand hasMore est faux", () => {
    const onLoadMore = vi.fn();
    render(
      <VirtualInfiniteList
        items={items}
        getItemKey={(item) => item.id}
        estimateSize={() => 60}
        renderItem={(item: { id: number; name: string }) => (
          <div>{item.name}</div>
        )}
        onLoadMore={onLoadMore}
      />,
    );
    expect(onLoadMore).not.toHaveBeenCalled();
  });
});
