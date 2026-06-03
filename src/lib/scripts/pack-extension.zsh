#!/usr/bin/env zsh
# Usage: ./lib/scripts/pack-extension.zsh <project-name> [--no-build]
# Run from the catalog root (browser-extensions/).
# Produces:  <project>/dist/   — clean store-ready files
#            <project>/PUBLICATION/<name>-<version>.zip — ready to upload

set -euo pipefail

CATALOG="$(cd "$(dirname "$0")/../.." && pwd)"
PROJECT="${1:?Usage: pack-extension.zsh <project-name> [--no-build]}"
NO_BUILD="${2:-}"

PROJECT_DIR="$CATALOG/$PROJECT"
LIB_DIR="$CATALOG/lib"
STAGING=""

cleanup_staging() {
  [[ -n "$STAGING" && -d "$STAGING" ]] && rm -rf "$STAGING"
}
trap cleanup_staging EXIT INT TERM

[[ -d "$PROJECT_DIR" ]] || { print -P "%F{red}❌ Project not found: $PROJECT_DIR%f"; exit 1 }
[[ -f "$PROJECT_DIR/manifest.json" ]] || { print -P "%F{red}❌ manifest.json not found in $PROJECT_DIR%f"; exit 1 }

if [[ "$NO_BUILD" != "--no-build" ]]; then
  print -P "%F{blue}▶ Building $PROJECT...%f"
  cd "$PROJECT_DIR"
  node scripts/build.mjs
  cd "$CATALOG"
fi

VERSION=$(node -e "process.stdout.write(require('$PROJECT_DIR/manifest.json').version)")
ZIP_NAME="${PROJECT}-${VERSION}.zip"
DIST_DIR="$PROJECT_DIR/dist"
STAGING="$(mktemp -d "${TMPDIR:-/tmp}/pack-${PROJECT}.XXXXXX")"

print -P "%F{blue}▶ Populating dist/ (manifest whitelist)...%f"
node "$LIB_DIR/scripts/pack-extension-files.mjs" "$PROJECT_DIR" "$STAGING"

print -P "%F{blue}▶ Minifying staging (store zip)...%f"
node "$LIB_DIR/scripts/minify-extension.mjs" "$STAGING"

if [[ -d "$DIST_DIR" ]]; then
  OLD_DIST="${DIST_DIR}.old.$$"
  mv "$DIST_DIR" "$OLD_DIST"
  chmod -R u+w "$OLD_DIST" 2>/dev/null || true
  rm -rf "$OLD_DIST" 2>/dev/null || print -P "%F{yellow}⚠ Удалите вручную: $OLD_DIST%f"
fi
mv "$STAGING" "$DIST_DIR"
STAGING=""
trap - EXIT INT TERM

PUBLICATION_DIR="$PROJECT_DIR/PUBLICATION"
mkdir -p "$PUBLICATION_DIR"

print -P "%F{blue}▶ Creating $ZIP_NAME...%f"
rm -f "$PUBLICATION_DIR/$ZIP_NAME"
(cd "$DIST_DIR" && zip -qr "$PUBLICATION_DIR/$ZIP_NAME" .)

print -P "%F{green}✅ Done: $PUBLICATION_DIR/$ZIP_NAME%f"
print -P "   dist/ → $(find "$DIST_DIR" -type f | wc -l | tr -d ' ') files"
