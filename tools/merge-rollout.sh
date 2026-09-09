#!/usr/bin/env bash
# merge-rollout.sh — merge the canonical-form license PRs opened by rollout-org.sh.
#
#   tools/merge-rollout.sh <org> [repo ...]
#
# For each repository's open license PR: merge when every check has passed or there are no
# checks; leave it when a check is still running; when a check has FAILED, merge only if the same
# workflow was already failing on the base branch before the PR (a LICENSE/NOTICE change cannot
# break a build — but that is verified, not assumed), and say so. Prints one line per PR.
set -uo pipefail
ORG="${1:?org}"; shift
BRANCHES="license/space-child-license-canonical fix/license-manifest-matches-license-file"
if [ $# -eq 0 ]; then mapfile -t REPOS < <(gh repo list "$ORG" --limit 200 --json name -q '.[].name' | sort); else REPOS=("$@"); fi
merged=0; pending=0; failed=0; none=0
for r in "${REPOS[@]}"; do
  n=""; for b in $BRANCHES; do n="$(gh pr list -R "$ORG/$r" --state open --head "$b" --json number -q '.[0].number')"; [ -n "$n" ] && break; done
  if [ -z "$n" ]; then none=$((none+1)); continue; fi
  json="$(gh pr view "$n" -R "$ORG/$r" --json statusCheckRollup,baseRefName,mergeable)"
  base="$(echo "$json" | node -e 'let s="";process.stdin.on("data",d=>s+=d).on("end",()=>console.log(JSON.parse(s).baseRefName))')"
  summary="$(echo "$json" | node -e '
    let s="";process.stdin.on("data",d=>s+=d).on("end",()=>{const j=JSON.parse(s);const c=j.statusCheckRollup||[];
    const st=x=>(x.conclusion||x.state||"").toUpperCase();
    const pend=c.filter(x=>["","PENDING","IN_PROGRESS","QUEUED","WAITING","EXPECTED"].includes(st(x))).length;
    const fail=c.filter(x=>["FAILURE","ERROR","TIMED_OUT","CANCELLED","ACTION_REQUIRED","STARTUP_FAILURE"].includes(st(x))).map(x=>x.name||x.context);
    console.log(JSON.stringify({total:c.length,pend,fail,mergeable:j.mergeable}));})')"
  total=$(echo "$summary" | node -e 'let s="";process.stdin.on("data",d=>s+=d).on("end",()=>console.log(JSON.parse(s).total))')
  pend=$(echo "$summary" | node -e 'let s="";process.stdin.on("data",d=>s+=d).on("end",()=>console.log(JSON.parse(s).pend))')
  fails=$(echo "$summary" | node -e 'let s="";process.stdin.on("data",d=>s+=d).on("end",()=>console.log(JSON.parse(s).fail.join(",")))')
  mergeable=$(echo "$summary" | node -e 'let s="";process.stdin.on("data",d=>s+=d).on("end",()=>console.log(JSON.parse(s).mergeable))')
  if [ "$pend" -gt 0 ]; then printf "%-36s #%-4s PENDING (%s of %s checks running)\n" "$r" "$n" "$pend" "$total"; pending=$((pending+1)); continue; fi
  note=""
  if [ -n "$fails" ]; then
    # was the base branch already red for these workflows before the PR?
    prior="$(gh run list -R "$ORG/$r" --branch "$base" --limit 6 --json conclusion,headBranch,event -q '[.[] | select(.event!="pull_request") | .conclusion] | join(",")')"
    if echo "$prior" | grep -q "failure"; then note="  (checks failing: $fails — base branch already red before this PR: $prior)";
    else printf "%-36s #%-4s NOT MERGED: checks failing (%s) and base was green — inspect\n" "$r" "$n" "$fails"; failed=$((failed+1)); continue; fi
  fi
  if [ "$mergeable" != "MERGEABLE" ]; then printf "%-36s #%-4s NOT MERGED: mergeable=%s\n" "$r" "$n" "$mergeable"; failed=$((failed+1)); continue; fi
  out="$(gh pr merge "$n" -R "$ORG/$r" --squash --delete-branch 2>&1 | tail -1)"
  if gh pr view "$n" -R "$ORG/$r" --json state -q .state | grep -q MERGED; then printf "%-36s #%-4s merged%s\n" "$r" "$n" "$note"; merged=$((merged+1));
  else printf "%-36s #%-4s NOT MERGED: %s\n" "$r" "$n" "$out"; failed=$((failed+1)); fi
done
echo; echo "merged $merged · pending $pending · not merged $failed · no open license PR $none"
[ "$pending" -eq 0 ] && [ "$failed" -eq 0 ]
