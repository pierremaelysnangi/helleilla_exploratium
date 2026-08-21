#!/usr/bin/env bash
set -euo pipefail

echo "🏗️  Création de l'arborescence Helleilla Exploratium..."

# ==============================================================================
# app/ - Routes
# ==============================================================================

mkdir -p src/app/\(marketing\)/about
touch src/app/\(marketing\)/about/page.tsx

mkdir -p src/app/genres/\[slug\]
touch src/app/genres/page.tsx
touch src/app/genres/loading.tsx
touch src/app/genres/\[slug\]/page.tsx
touch src/app/genres/\[slug\]/loading.tsx
touch src/app/genres/\[slug\]/error.tsx
touch src/app/genres/\[slug\]/opengraph-image.tsx

mkdir -p src/app/bands/\[slug\]/discography
mkdir -p src/app/bands/\[slug\]/members
touch src/app/bands/page.tsx
touch src/app/bands/loading.tsx
touch src/app/bands/\[slug\]/page.tsx
touch src/app/bands/\[slug\]/loading.tsx
touch src/app/bands/\[slug\]/discography/page.tsx
touch src/app/bands/\[slug\]/members/page.tsx

mkdir -p src/app/albums/\[slug\]
touch src/app/albums/page.tsx
touch src/app/albums/\[slug\]/page.tsx
touch src/app/albums/\[slug\]/loading.tsx

mkdir -p src/app/members/\[slug\]
touch src/app/members/\[slug\]/page.tsx

mkdir -p src/app/search
touch src/app/search/page.tsx

mkdir -p src/app/api/search
mkdir -p src/app/api/revalidate
touch src/app/api/search/route.ts
touch src/app/api/revalidate/route.ts

# ==============================================================================
# components/
# ==============================================================================

mkdir -p src/components/ui
mkdir -p src/components/layout
mkdir -p src/components/shared
mkdir -p src/components/bands
mkdir -p src/components/genres
mkdir -p src/components/albums
mkdir -p src/components/audio
mkdir -p src/components/search

touch src/components/layout/header.tsx
touch src/components/layout/footer.tsx
touch src/components/layout/nav.tsx
touch src/components/layout/theme-toggle.tsx

touch src/components/shared/loading-skeleton.tsx
touch src/components/shared/error-boundary.tsx
touch src/components/shared/empty-state.tsx

touch src/components/bands/band-card.tsx
touch src/components/bands/band-list.tsx
touch src/components/bands/band-header.tsx
touch src/components/bands/discography-table.tsx

touch src/components/genres/genre-card.tsx
touch src/components/genres/genre-filter.tsx

touch src/components/albums/album-card.tsx
touch src/components/albums/album-tracklist.tsx

touch src/components/audio/audio-player.tsx
touch src/components/audio/waveform.tsx
touch src/components/audio/mini-player.tsx

touch src/components/search/command-palette.tsx
touch src/components/search/search-results.tsx

# ==============================================================================
# lib/
# ==============================================================================

mkdir -p src/lib/supabase
mkdir -p src/lib/validations

touch src/lib/supabase/client.ts
touch src/lib/supabase/server.ts
touch src/lib/supabase/middleware.ts

touch src/lib/utils.ts
touch src/lib/constants.ts

touch src/lib/validations/band.schema.ts
touch src/lib/validations/album.schema.ts

# ==============================================================================
# hooks/
# ==============================================================================

mkdir -p src/hooks
touch src/hooks/use-audio-player.ts
touch src/hooks/use-debounce.ts
touch src/hooks/use-media-query.ts

# ==============================================================================
# stores/
# ==============================================================================

mkdir -p src/stores
touch src/stores/audio-player.store.ts
touch src/stores/preferences.store.ts

# ==============================================================================
# types/
# ==============================================================================

mkdir -p src/types
touch src/types/database.types.ts
touch src/types/band.ts
touch src/types/album.ts
touch src/types/genre.ts

# ==============================================================================
# styles/
# ==============================================================================

mkdir -p src/styles
touch src/styles/themes.css

# ==============================================================================
# providers.tsx à la racine de src/
# ==============================================================================

touch src/providers.tsx

echo "✅ Arborescence créée avec succès !"
echo ""
echo "📁 Structure générée :"
find src -type f -name "*.tsx" -o -name "*.ts" -o -name "*.css" | sort