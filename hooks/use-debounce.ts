/**
 * Hook utilitaire de debounce : ne renvoie la valeur que lorsqu'elle est
 * stable depuis `delay` ms. Utilisé par use-search pour éviter de
 * déclencher une requête à chaque frappe.
 */
import { useEffect, useState } from "react";

/**
 * Retarde la propagation d'une valeur changeante.
 *
 * @param value - Valeur source (ex : contenu d'un champ de recherche).
 * @param delay - Délai de stabilisation en ms (défaut 300).
 * @returns La dernière valeur stable depuis au moins `delay` ms.
 */
export function useDebounce<T>(value: T, delay = 300): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    // Chaque changement relance le minuteur ; seule la valeur qui reste
    // stable pendant `delay` est propagée
    const timer = setTimeout(() => setDebounced(value), delay);
    // Nettoyage : annule le timer si `value`/`delay` changent avant échéance
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debounced;
}
