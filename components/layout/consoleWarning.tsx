"use client";

/**
 * <ConsoleWarning> — avertissement affiché dans la console du navigateur.
 *
 * IMPORTANT sur ce que ce composant fait, et ne fait pas.
 *
 * Il est IMPOSSIBLE d'empêcher quiconque d'ouvrir la console de son
 * navigateur. Elle fait partie du navigateur, pas de la page : aucun
 * code servi ne peut la désactiver, et les contournements qu'on voit
 * parfois (piéger F12, détecter la taille de la fenêtre, boucler sur
 * `debugger`) se retirent en un clic, dégradent le site pour tout le
 * monde et gênent surtout les personnes qui utilisent un lecteur
 * d'écran ou un outil d'accessibilité.
 *
 * Ce que fait Meta, et ce que fait ce composant, est autre chose : un
 * avertissement contre l'auto-XSS. L'attaque type consiste à persuader
 * quelqu'un de coller dans sa console un code qui vole sa session. Le
 * message s'adresse donc à la victime potentielle, pas à un attaquant.
 *
 * La vraie protection, elle, est ailleurs et déjà en place : cookies de
 * session `httpOnly` (inaccessibles au JavaScript de la page),
 * Content-Security-Policy, autorisations vérifiées côté serveur à chaque
 * requête. Rien de ce qu'on peut taper dans une console ne contourne
 * cela.
 */

import { useEffect } from "react";

/** N'avertir qu'une fois par onglet, même après une navigation. */
const FLAG = "__helleillaConsoleWarned";

export function ConsoleWarning() {
  useEffect(() => {
    const w = window as unknown as Record<string, unknown>;
    if (w[FLAG]) return;
    w[FLAG] = true;

    const title = "font: 700 28px/1.2 system-ui, sans-serif; color: #c0392b;";
    const body = "font: 14px/1.5 system-ui, sans-serif; color: #ddd;";

    // `console.info` plutôt que `log` : c'est la règle du dépôt, et le
    // niveau convient — il s'agit d'une information, pas d'un rejet.
    console.info("%cUn instant.", title);
    console.info(
      "%cSi quelqu'un vous a demandé de coller du code ici, il cherche à " +
        "prendre le contrôle de votre compte.\n" +
        "Ne collez jamais dans cette console un code que vous ne " +
        "comprenez pas.\n\n" +
        "Cette console reste ouverte à tous : le projet est libre, et son " +
        "code est consultable.",
      body,
    );
  }, []);

  return null;
}
