#!/usr/bin/env zsh
# Usage: ./lib/scripts/cmt.zsh [project flags] [--project-name <name>] [--comment <message>]
# Run from the catalog root (browser-extensions/).
# Project flags: -r ALL-PRJ-REQ, -l lib, -c element-copier, -d element-deleter, -e element-explorer, -g generate-n-decode, -m macros-repeater
# Without project flags: commit in every repo with .git under the catalog.
# Without --comment: message defaults to "auto commit".

set -euo pipefail

CATALOG="$(cd "$(dirname "$0")/../.." && pwd)"
typeset -a SELECTED=()
COMMENT="auto commit"

usage() {
  print -r -- "Usage: ./lib/scripts/cmt.zsh [-r|-l|-c|-d|-e|-g|-m] [--project-name <name>] [--comment <message>]"
  print -r -- "  -r  ALL-PRJ-REQ"
  print -r -- "  -l  lib"
  print -r -- "  -c  element-copier"
  print -r -- "  -d  element-deleter"
  print -r -- "  -e  element-explorer"
  print -r -- "  -g  generate-n-decode"
  print -r -- "  -m  macros-repeater"
}

select_project() {
  SELECTED+=("$1")
}

while (( $# )); do
  case "$1" in
    --project-name)
      (( $# >= 2 )) || { print -P "%F{red}❌ --project-name requires a value%f"; usage; exit 1 }
      select_project "$2"
      shift 2
      ;;
    --comment)
      (( $# >= 2 )) || { print -P "%F{red}❌ --comment requires a value%f"; usage; exit 1 }
      COMMENT="$2"
      shift 2
      ;;
    -r) select_project ALL-PRJ-REQ; shift ;;
    -l) select_project lib; shift ;;
    -c) select_project element-copier; shift ;;
    -d) select_project element-deleter; shift ;;
    -e) select_project element-explorer; shift ;;
    -g) select_project generate-n-decode; shift ;;
    -m) select_project macros-repeater; shift ;;
    -h|--help)
      usage
      exit 0
      ;;
    *)
      print -P "%F{red}❌ Unknown argument: $1%f"
      usage
      exit 1
      ;;
  esac
done

commit_repo() {
  local name="$1"
  local dir="$CATALOG/$name"

  [[ -d "$dir/.git" ]] || {
    print -P "%F{red}❌ Not a git repo: $dir%f"
    return 1
  }

  print -P "%F{blue}▶ $name%f"
  (
    cd "$dir"
    if [[ -z "$(git status --porcelain)" ]]; then
      print -P "%F{yellow}  ⚠ Nothing to commit, skipped%f"
      return 0
    fi

    git add -A
    if git diff --cached --quiet; then
      print -P "%F{yellow}  ⚠ Nothing staged, skipped%f"
      return 0
    fi

    git commit -m "$COMMENT"
    print -P "%F{green}  ✅ Committed%f"
  )
}

collect_repos() {
  local -a repos=()
  local gitdir name

  while IFS= read -r gitdir; do
    name="${gitdir:h:t}"
    repos+=("$name")
  done < <(find "$CATALOG" -maxdepth 2 -name .git -type d 2>/dev/null | sort)

  print -l "${repos[@]}"
}

if (( ${#SELECTED[@]} )); then
  failed=0
  for name in "${SELECTED[@]}"; do
    commit_repo "$name" || (( failed++ ))
  done
  (( failed == 0 )) || exit 1
  print -P "%F{green}✅ Done (${#SELECTED[@]} repos)%f"
  exit 0
fi

repos=("${(@f)$(collect_repos)}")
(( ${#repos[@]} )) || { print -P "%F{red}❌ No git repos found under $CATALOG%f"; exit 1 }

failed=0
for name in "${repos[@]}"; do
  commit_repo "$name" || (( failed++ ))
done

(( failed == 0 )) || exit 1
print -P "%F{green}✅ Done (${#repos[@]} repos)%f"
