#!/bin/sh -e

# Compares two running servers path by path: the status, the headers a server swap could
# change, cookie names, and the decoded body's size and hash. Prints only what differs.
# Bodies that carry a token or a date differ by nature; read those lines, don't fail on them.
#
# Usage: sh ./scripts/compare-servers.sh <base-url-a> <base-url-b> [paths-file]
#   paths-file — one path per line, optionally "HEAD /path"; the default list is below.
#
# Example: sh ./scripts/compare-servers.sh http://localhost:8080 http://localhost:8081

BASE_A="${1:?base URL A}"
BASE_B="${2:?base URL B}"
PATHS_FILE="$3"

HEADERS='cache-control content-type content-encoding vary x-content-type-options x-frame-options content-security-policy referrer-policy strict-transport-security location accept-ranges'

WORK=$(mktemp -d)
trap 'rm -rf "$WORK"' EXIT

if [ -z "$PATHS_FILE" ]; then
  PATHS_FILE="$WORK/paths"
  cat >"$PATHS_FILE" <<'EOF'
/
HEAD /
/health
/articles
/archive
/podcasts
/organization
/support
/editorial-board
/this-page-does-not-exist
/favicon.ico
/favicon.svg
/robots.txt
/_root.data
/articles.data
EOF
fi

hash() {
  if command -v sha256sum >/dev/null 2>&1; then sha256sum | cut -c1-12; else shasum -a 256 | cut -c1-12; fi
}

# Writes "key: value" lines describing one response to stdout.
describe() {
  METHOD="$1"
  URL="$2"
  HEADER_FILE="$WORK/headers"
  BODY_FILE="$WORK/body"
  : >"$HEADER_FILE"
  : >"$BODY_FILE"

  # The body travels as gzip, which every curl decodes (macOS curl has no Brotli); what a
  # browser offering Brotli gets is read from a second, header-only request.
  if [ "$METHOD" = HEAD ]; then
    curl -s -I -H 'Accept-Encoding: gzip' -D "$HEADER_FILE" -o /dev/null "$URL" || true
  else
    curl -s --compressed -H 'Accept-Encoding: gzip' -D "$HEADER_FILE" -o "$BODY_FILE" "$URL" || true
  fi
  HEAD_ONLY=''
  [ "$METHOD" = HEAD ] && HEAD_ONLY='-I'
  BROTLI=$(curl -s $HEAD_ONLY -H 'Accept-Encoding: br, gzip' -D - -o /dev/null "$URL" 2>/dev/null |
    tr -d '\r' | grep -i '^content-encoding:' | cut -d: -f2- | sed 's/^ //' || true)

  tr -d '\r' <"$HEADER_FILE" | head -1 | cut -d' ' -f2 | sed 's/^/status: /'
  echo "content-encoding offering br: $BROTLI"
  for NAME in $HEADERS; do
    VALUE=$(tr -d '\r' <"$HEADER_FILE" | grep -i "^$NAME:" | head -1 | cut -d: -f2- | sed 's/^ //')
    echo "$NAME: $VALUE"
  done
  ETAG=$(tr -d '\r' <"$HEADER_FILE" | grep -ci '^etag:' || true)
  echo "etag present: $ETAG"
  COOKIES=$(tr -d '\r' <"$HEADER_FILE" | grep -i '^set-cookie:' | sed 's/^[^:]*: *//; s/=.*//' | sort | tr '\n' ' ')
  echo "set-cookie names: $COOKIES"
  # Each server's own base URL (BASE_URL in links) is replaced, so two ports compare.
  sed "s|$3|BASE_URL|g" "$BODY_FILE" >"$BODY_FILE.normalized"
  echo "body bytes: $(wc -c <"$BODY_FILE.normalized" | tr -d ' ')"
  echo "body hash: $(hash <"$BODY_FILE.normalized")"
}

DIFFERENT=0
while read -r LINE; do
  [ -z "$LINE" ] && continue
  case "$LINE" in
    '#'*) continue ;;
    'HEAD '*) METHOD=HEAD; PATH_PART="${LINE#HEAD }" ;;
    *) METHOD=GET; PATH_PART="$LINE" ;;
  esac

  describe "$METHOD" "$BASE_A$PATH_PART" "$BASE_A" >"$WORK/a"
  describe "$METHOD" "$BASE_B$PATH_PART" "$BASE_B" >"$WORK/b"

  if grep -qx 'status: ' "$WORK/a" || grep -qx 'status: ' "$WORK/b"; then
    echo "== $METHOD $PATH_PART: no answer from A or B" >&2
    exit 1
  fi

  if ! cmp -s "$WORK/a" "$WORK/b"; then
    DIFFERENT=$((DIFFERENT + 1))
    echo "== $METHOD $PATH_PART"
    diff "$WORK/a" "$WORK/b" | grep '^[<>]' | sed "s|^<|  A|; s|^>|  B|"
  fi
done <"$PATHS_FILE"

echo "-- $DIFFERENT path(s) differ"
