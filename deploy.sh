#!/usr/bin/env bash
# Publish the committed site to https://mavtchem.ethz.ch (ETH web instance mavtchemprd).
#
# Uploads exactly what is committed on the current branch (git HEAD), not the working tree,
# so the server always matches a commit. Needs the ETH VPN (or the ETH network) for SSH.
#
#   ./deploy.sh            upload
#   ./deploy.sh --dry-run  show what would change, upload nothing

set -euo pipefail

REMOTE="w3_mavtchemprd@mavtchem.ethz.ch"
DOCROOT="htdocs/"

cd "$(dirname "$0")"

if [ -n "$(git status --porcelain)" ]; then
  echo "Note: uncommitted changes are NOT deployed (only HEAD $(git rev-parse --short HEAD) is)." >&2
fi

tmp="$(mktemp -d)"
trap 'rm -rf "$tmp"' EXIT
git archive HEAD | tar -x -C "$tmp"

# Server files are rwxr-s--- / rw-r----- (Apache reads them through the group).
rsync -rlt --delete --itemize-changes "$@" \
  --chmod=Du=rwx,Dg=rx,Do=,Fu=rw,Fg=r,Fo= \
  --exclude='.git*' --exclude='.nojekyll' --exclude='README.md' --exclude='deploy.sh' --exclude='.DS_Store' \
  "$tmp/" "$REMOTE:$DOCROOT"

case " $* " in
  *" --dry-run "*|*" -n "*) echo "Dry run: nothing uploaded." ;;
  *) echo "Deployed $(git rev-parse --short HEAD) to https://mavtchem.ethz.ch" ;;
esac
