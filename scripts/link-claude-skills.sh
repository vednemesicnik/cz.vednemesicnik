#!/bin/sh

# Links each project skill in .agents/skills into .claude/skills, where Claude
# Code discovers skills. /.claude is gitignored, so a fresh clone has none until
# this runs.
#
# One link per skill rather than one link for the whole directory, so personal
# skills can sit next to the project ones in .claude/skills. Idempotent: a
# correct link is left alone, a link pointing elsewhere is replaced, a dangling
# link to a removed skill is deleted, and a real file or directory is never
# clobbered (it is reported and skipped).
#
# Usage: sh ./scripts/link-claude-skills.sh   (pnpm claude:skills:link)

# Callers invoke this as `sh ./scripts/...`, which ignores shebang flags.
set -e

cd "$(dirname "$0")/.."

SOURCE=.agents/skills
TARGET=.claude/skills

# Nothing to link, e.g. in a Docker build context without .agents/.
[ -d "$SOURCE" ] || exit 0

mkdir -p "$TARGET"

# Remove links to skills that were renamed or removed.
for LINK in "$TARGET"/*; do
  [ -L "$LINK" ] && [ ! -e "$LINK" ] || continue
  case "$(readlink "$LINK")" in
    "../../$SOURCE/"*) rm "$LINK" && echo "Removed dangling $LINK" ;;
  esac
done

for SKILL in "$SOURCE"/*/; do
  [ -f "${SKILL}SKILL.md" ] || continue
  NAME=$(basename "$SKILL")
  LINK="$TARGET/$NAME"
  EXPECTED="../../$SOURCE/$NAME"

  if [ -L "$LINK" ]; then
    [ "$(readlink "$LINK")" = "$EXPECTED" ] && continue
    rm "$LINK"
  elif [ -e "$LINK" ]; then
    echo "Skipped $LINK: it is a real file or directory, not a link. Remove it to use the project skill." >&2
    continue
  fi

  ln -s "$EXPECTED" "$LINK"
  echo "Linked $LINK -> $EXPECTED"
done
