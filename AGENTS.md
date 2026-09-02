<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# RÈGLE STRICTE DU PROJET — interdiction absolue

**Génération d'images, de sons, de vidéos et de tout média similaire par IA : totalement interdite.**

- Aucun code ne doit produire, appeler ou suggérer un service génératif d'images/audio/vidéo (DALL·E, Midjourney, Stable Diffusion, Suno, Sora, TTS génératifs, etc.).
- Les médias affichés proviennent EXCLUSIVEMENT des plateformes officielles référencées (`external_refs`, `lib/providers/*`) sous forme d'URLs/embeds — jamais copiés ni recréés.
- Les contributions sont justement conçues pour bloquer le contenu IA généré (preuves officielles obligatoires).
- **Exception explicite** : les animations d'interface (motion/CSS) ne sont pas concernées.
- La génération d'embeddings textuels (pgvector, job `generate-embeddings`) n'est pas un média : elle reste autorisée.

<!-- BEGIN:project-agent-rules -->

# Conventions projet (résumé opérationnel)

- Lire `LEXIQUE.md` avant toute intervention : nomenclatures, contrats zod partagés, conventions de nommage.
- Source unique des contrats : schémas zod (`lib/api/schemas.ts`, `lib/validations/*`) partagés serveur/front/OpenAPI.
- Chose créée → chose utilisée : réutiliser les helpers existants (`route()`, hooks génériques, queryKeys).
- Tests obligatoires : unitaires à côté du code + E2E pour tout nouveau parcours ; `pnpm verify` doit passer.

<!-- END:project-agent-rules -->
