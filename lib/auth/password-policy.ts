/**
 * Politique serveur des mots de passe : liste noire des mots de passe
 * les plus fuités de l'histoire (extrait rockyou/NordVPN top ~150).
 * Un mot de passe présent ici est refusé à l'inscription même si son
 * score zxcvbn local semble correct.
 */

// Liste figée : pas besoin d'exhaustivité, zxcvbn filtre déjà la masse ;
// cette barrière serveur couvre les cas où le client est contourné.
const DENYLIST = new Set([
  "123456",
  "password",
  "123456789",
  "12345678",
  "12345",
  "qwerty",
  "1234567890",
  "1234567",
  "111111",
  "123123",
  "abc123",
  "password1",
  "1234",
  "qwerty123",
  "000000",
  "iloveyou",
  "1q2w3e4r",
  "qwertyuiop",
  "monkey",
  "dragon",
  "123321",
  "654321",
  "666666",
  "123qwe",
  "unknown",
  "123abc",
  "a1b2c3d4",
  "admin123",
  "administrator",
  "letmein",
  "welcome",
  "login",
  "princess",
  "solo",
  "flower",
  "hottie",
  "loveme",
  "zaq12wsx",
  "password123",
  "trustno1",
  "batman",
  "superman",
  "michael",
  "football",
  "shadow",
  "master",
  "jordan23",
  "superior",
  "hunter2",
  "azerty123",
  "motdepasse",
  "motdepasse123",
  "mdp123",
  "soleil",
  "loulou",
  "doudou",
  "chouchou",
  "azerty",
  "qsdfgh",
  "wxcvbn",
  "123azerty",
  "marseille",
  "psg123",
  "liverpool",
  "barcelone",
  "realmadrid",
  "napster",
  "starwars",
  "pokemon",
  "minecraft",
  "fortnite",
  "netflix",
  "spotify123",
  "google123",
]);

/** Vérifie si un mot de passe figure dans la liste des mots de passe interdits. */
export function isPasswordDenylisted(password: string): boolean {
  // Comparaison insensible à la casse ; les variantes triviales (suffixe
  // numérique simple) sont déjà couvertes par le score zxcvbn côté client
  // et par la longueur minimale côté serveur.
  return DENYLIST.has(password.toLowerCase());
}
