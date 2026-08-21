#!/usr/bin/env bash
set -euo pipefail

# Génère un nom de composant lisible à partir du chemin
component_name() {
  local path="$1"
  local clean=$(echo "$path" | sed 's/app//; s|/page.tsx||; s|/loading.tsx||; s|\[slug\]|Slug|g; s|[()]||g; s|/| |g')
  if [ -z "$clean" ]; then clean="Home"; fi
  echo "$clean" | sed -r 's/(^| )([a-z])/\U\2/g' | tr -d ' '
}

# --- page.tsx ---
find app -name "page.tsx" -empty | while read -r file; do
  name=$(component_name "$file")
  route=$(dirname "$file" | sed 's/^app//; s|^$|/|')
  cat > "$file" << EOF
export default function ${name}Page() {
  return (
    <main className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold">${name}</h1>
      <p className="text-muted-foreground mt-2">Page en construction — ${route}</p>
    </main>
  );
}
EOF
  echo "✅ $file"
done

# --- loading.tsx ---
find app -name "loading.tsx" -empty | while read -r file; do
  cat > "$file" << 'EOF'
export default function Loading() {
  return (
    <div className="container mx-auto px-4 py-8 animate-pulse">
      <div className="h-8 w-48 bg-muted rounded mb-4" />
      <div className="h-4 w-full bg-muted rounded mb-2" />
      <div className="h-4 w-3/4 bg-muted rounded" />
    </div>
  );
}
EOF
  echo "✅ $file"
done

# --- error.tsx ---
find app -name "error.tsx" -empty | while read -r file; do
  cat > "$file" << 'EOF'
"use client";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="container mx-auto px-4 py-8">
      <h2 className="text-xl font-bold text-destructive">Une erreur est survenue</h2>
      <p className="text-muted-foreground mt-2">{error.message}</p>
      <button
        onClick={reset}
        className="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded"
      >
        Réessayer
      </button>
    </div>
  );
}
EOF
  echo "✅ $file"
done

# --- not-found.tsx ---
find app -name "not-found.tsx" -empty | while read -r file; do
  cat > "$file" << 'EOF'
import Link from "next/link";

export default function NotFound() {
  return (
    <div className="container mx-auto px-4 py-8 text-center">
      <h2 className="text-2xl font-bold">404 — Page introuvable</h2>
      <p className="text-muted-foreground mt-2">
        Cette page n'existe pas ou plus.
      </p>
      <Link href="/" className="text-primary underline mt-4 inline-block">
        Retour à l'accueil
      </Link>
    </div>
  );
}
EOF
  echo "✅ $file"
done

echo ""
echo "🎉 Tous les fichiers ont été remplis."