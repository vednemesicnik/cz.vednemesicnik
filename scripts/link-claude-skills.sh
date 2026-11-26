#!/bin/sh

# Links each project skill into a .claude/skills next to it, where Claude Code discovers
# skills: the root's .agents/skills into .claude/skills, and each application's
# apps/<app>/.agents/skills into apps/<app>/.claude/skills. Claude Code loads an
# application's skills once it reads or edits a file in that folder, so the web's stack
# skills (React Router, Prisma) and Publikace's (Remix) stay out of the other's way.
# .claude/skills is gitignored, so a fresh clone has none until this runs.
#
# Publikace's `remix` skill is the scaffolder's, not tracked: it is copied from the
# installed @remix-run/cli's template (run `pnpm install` first) on every run.
#
# One link per skill rather than one link for the whole directory, so personal skills can
# sit next to the project ones. Idempotent: a correct link is left alone, a link pointing
# elsewhere is replaced, a dangling link to a removed skill is deleted, and a real file or
# directory is never clobbered (it is reported and skipped).
#
# Usage: sh ./scripts/link-claude-skills.sh   (pnpm claude:skills:link, from the root)

# Callers invoke this as `sh ./scripts/...`, which ignores shebang flags.
set -e

cd "$(dirname "$0")/.."

# Copies the skills `remix new` writes into an app from @remix-run/cli's template, which
# only resolves through the app's own `remix` dependency (pnpm does not hoist it).
copy_scaffold_skill() {
  APP="$1"
  NAME="$2"
  TEMPLATE=$(cd "$APP" && node -e '
    const { createRequire } = require("node:module")
    const { dirname, join } = require("node:path")
    try {
      const fromRemix = createRequire(require.resolve("remix/package.json"))
      console.log(join(dirname(fromRemix.resolve("@remix-run/cli/package.json")), "template"))
    } catch {}
  ')
  if [ -z "$TEMPLATE" ] || [ ! -d "$TEMPLATE/.agents/skills/$NAME" ]; then
    echo "Skipped $APP/.agents/skills/$NAME: @remix-run/cli is not installed, run pnpm install" >&2
    return
  fi
  rm -rf "$APP/.agents/skills/$NAME"
  cp -R "$TEMPLATE/.agents/skills/$NAME" "$APP/.agents/skills/$NAME"
}

link_skills() {
  BASE="$1"
  SOURCE="$BASE/.agents/skills"
  TARGET="$BASE/.claude/skills"

  # Nothing to link, e.g. in a Docker build context without .agents/.
  [ -d "$SOURCE" ] || return 0

  mkdir -p "$TARGET"

  # Remove links to skills that were renamed or removed.
  for LINK in "$TARGET"/*; do
    [ -L "$LINK" ] && [ ! -e "$LINK" ] || continue
    case "$(readlink "$LINK")" in
      "../../.agents/skills/"*) rm "$LINK" && echo "Removed dangling $LINK" ;;
    esac
  done

  for SKILL in "$SOURCE"/*/; do
    [ -f "${SKILL}SKILL.md" ] || continue
    NAME=$(basename "$SKILL")
    LINK="$TARGET/$NAME"
    EXPECTED="../../.agents/skills/$NAME"

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
}

[ -d apps/publikace/.agents/skills ] && copy_scaffold_skill apps/publikace remix

link_skills .
for APP in apps/*/; do
  link_skills "${APP%/}"
done
