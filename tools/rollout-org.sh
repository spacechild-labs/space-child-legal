#!/usr/bin/env bash
# rollout-org.sh — apply the Space Child License canonical form to every repository of an
# organisation that has a local checkout, one pull request each.
#
#   tools/rollout-org.sh <org> <checkouts-dir> [repo ...]
#
# Per repository: reuse the manifest-fix branch if one is already open, else branch from the
# default branch; run scl-apply; commit only the license-bearing files; push; open a PR or update
# the existing one's title. A checkout with uncommitted changes is skipped and named — never
# stashed. Requires gh authenticated for the organisation.
set -uo pipefail
ORG="${1:?org}"; SRC="${2:?checkouts dir}"; shift 2
HERE="$(cd "$(dirname "$0")" && pwd)"
OLD_BR="fix/license-manifest-matches-license-file"
NEW_BR="license/space-child-license-canonical"
TITLE="license: full Space Child License text, NOTICE, and consistent metadata"
read -r -d '' BODY <<'EOF'
Brings this repository to the canonical form of the [Space Child License v1.0](https://legal.spacechild.love/license):

- `LICENSE` is the **full license text** (previously a 17-line notice pointing at legal.spacechild.love, or absent). A reference-only LICENSE grants nothing if the URL is ever down.
- `NOTICE` carries the short form with the copyright holder and years.
- Package metadata points at the file (`SEE LICENSE IN LICENSE` / `license-file`), so npm and scanners advertise the license the file grants.
- A `## License` section in the README where there was none.

No terms change for a repository that already carried the license; a repository that had no license is offered under it from this merge. Produced by `spacechild-labs/space-child-legal` `tools/scl-apply.mjs`; verified by `tools/scl-check.mjs --require-notice`.

🤖 Generated with [Claude Code](https://claude.com/claude-code)

https://claude.ai/code/session_01KTNEBgonu6ASph6w8R2Wcp
EOF

if [ $# -eq 0 ]; then
  mapfile -t REPOS < <(gh repo list "$ORG" --limit 200 --json name -q '.[].name' | sort)
else
  REPOS=("$@")
fi

for r in "${REPOS[@]}"; do
  d="$SRC/$r"
  printf '\n== %s/%s\n' "$ORG" "$r"
  if [ ! -d "$d/.git" ]; then echo "   skip: no local checkout at $d"; continue; fi
  if [ -n "$(git -C "$d" status --porcelain --untracked-files=no)" ]; then echo "   skip: uncommitted changes in the checkout"; continue; fi
  git -C "$d" fetch -q origin || { echo "   skip: fetch failed"; continue; }
  def="$(gh repo view "$ORG/$r" --json defaultBranchRef -q .defaultBranchRef.name)"
  if git -C "$d" ls-remote --exit-code --heads origin "$OLD_BR" >/dev/null 2>&1; then br="$OLD_BR"; base="origin/$OLD_BR"; else br="$NEW_BR"; base="origin/$def"; fi
  git -C "$d" checkout -q -B "$br" "$base" || { echo "   skip: could not check out $br"; continue; }
  out="$(node "$HERE/scl-apply.mjs" "$d" 2>&1)"; rc=$?
  echo "$out" | sed 's/^/   /'
  if [ $rc -ne 0 ]; then echo "   skip: apply refused"; continue; fi
  (cd "$d" && git add LICENSE NOTICE 2>/dev/null; for f in README.md readme.md package.json Cargo.toml pyproject.toml RELICENSING.md LICENSE-*-prior LICENSE.md LICENSE.txt; do [ -e "$f" ] && git add "$f"; done; true)
  if git -C "$d" diff --cached --quiet; then echo "   nothing to commit (already canonical on this branch)"; continue; fi
  git -C "$d" commit -q -m "$TITLE

The LICENSE file is now the full Space Child License v1.0 text rather than
a notice pointing at legal.spacechild.love; NOTICE carries the short form
with holder and years; package metadata points at the file; the README
names the license. Produced by space-child-legal tools/scl-apply.mjs and
verified by tools/scl-check.mjs --require-notice.

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01KTNEBgonu6ASph6w8R2Wcp" || { echo "   skip: commit failed"; continue; }
  git -C "$d" push -q -u origin "$br" 2>&1 | grep -vE "^remote:\s*$" | tail -1
  existing="$(gh pr list -R "$ORG/$r" --head "$br" --json number -q '.[0].number')"
  if [ -n "$existing" ]; then
    gh pr edit "$existing" -R "$ORG/$r" --title "$TITLE" --body "$BODY" >/dev/null && echo "   PR #$existing updated"
  else
    gh pr create -R "$ORG/$r" --base "$def" --head "$br" --title "$TITLE" --body "$BODY" 2>&1 | tail -1
  fi
  node "$HERE/scl-check.mjs" "$d" --require-notice | tail -1 | sed 's/^/   check:/'
done
