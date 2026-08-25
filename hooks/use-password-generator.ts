"use client";

/**
 * Générateur de mots de passe cryptographiquement sûrs.
 * Utilise l'API Web Crypto (`crypto.getRandomValues`, CSPRNG du
 * navigateur) — JAMAIS Math.random (prévisible). Chaque caractère est
 * tiré sans biais modulo (rejection sampling) et le mot de passe final
 * contient au moins un caractère de chaque classe sélectionnée.
 *
 * Entropie théorique affichée : log2(alphabet^longueur).
 */

/** Classes de caractères disponibles pour la génération. */
const CHAR_CLASSES = {
  lowercase: "abcdefghijklmnopqrstuvwxyz",
  uppercase: "ABCDEFGHIJKLMNOPQRSTUVWXYZ",
  digits: "0123456789",
  symbols: "!@#$%^&*()-_=+[]{};:,.<>?",
} as const;

export type CharClassOption = keyof typeof CHAR_CLASSES;

/** Options du générateur. */
export type GeneratorOptions = {
  /** Longueur souhaitée (16–64). */
  length?: number;
  /** Classes à inclure ; minuscules toujours présentes par défaut. */
  classes?: CharClassOption[];
};

/** Entropie minimale visée (bits) pour un mot de passe « fort ». */
export const MIN_ENTROPY_BITS = 80;

/**
 * Tire un entier uniforme dans [0, max) via rejection sampling :
 * élimine le bmodulo des générateurs naïfs.
 */
function randomInt(max: number): number {
  const range = 2 ** 32;
  const limit = range - (range % max);
  const buffer = new Uint32Array(1);
  do {
    crypto.getRandomValues(buffer);
  } while (buffer[0] >= limit);
  return buffer[0] % max;
}

/** Mélange Fisher-Yates avec CSPRNG. */
function shuffle(chars: string[]): string[] {
  for (let i = chars.length - 1; i > 0; i--) {
    const j = randomInt(i + 1);
    [chars[i], chars[j]] = [chars[j], chars[i]];
  }
  return chars;
}

/**
 * Génère un mot de passe aléatoire.
 *
 * @param options - Longueur (défaut 20) et classes requises.
 * @throws Si aucune classe n'est sélectionnée ou longueur hors bornes.
 */
export function generatePassword(options: GeneratorOptions = {}): string {
  const length = options.length ?? 20;
  if (length < 12 || length > 64) {
    throw new Error("Longueur invalide : entre 12 et 64 caractères");
  }
  const classes = options.classes?.length
    ? options.classes
    : (Object.keys(CHAR_CLASSES) as CharClassOption[]);
  if (classes.length > length) {
    throw new Error("Plus de classes que de caractères demandés");
  }

  // Garantit au moins un caractère de chaque classe sélectionnée,
  // complète avec des tirages uniformes sur l'alphabet total.
  const pool = classes.map((c) => CHAR_CLASSES[c]).join("");
  const required = classes.map(
    (c) => CHAR_CLASSES[c][randomInt(CHAR_CLASSES[c].length)],
  );
  const rest = Array.from(
    { length: length - required.length },
    () => pool[randomInt(pool.length)],
  );

  return shuffle([...required, ...rest]).join("");
}

/**
 * Entropie théorique du mot de passe généré, en bits :
 * log2(taille_alphabet ^ longueur). Indicateur de force du tirage
 * aléatoire (pas de la résistance d'un mot de passe choisi à la main).
 */
export function entropyBits(
  length: number,
  classes: CharClassOption[],
): number {
  const poolSize = classes.reduce((sum, c) => sum + CHAR_CLASSES[c].length, 0);
  if (poolSize === 0 || length === 0) return 0;
  return Math.round(Math.log2(poolSize) * length);
}
