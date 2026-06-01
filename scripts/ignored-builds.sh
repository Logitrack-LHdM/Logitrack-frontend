#!/usr/bin/env bash

# Ramas que SÍ deben desplegarse
ALLOWED_BRANCHES=("main" "develop")

for branch in "${ALLOWED_BRANCHES[@]}"; do
  if [ "$VERCEL_GIT_COMMIT_REF" = "$branch" ]; then
    echo "✅ Rama '$branch' permitida — procediendo con el deploy"
    exit 1  # exit 1 = BUILD PROCEDE
  fi
done

echo "🚫 Rama '$VERCEL_GIT_COMMIT_REF' ignorada — saltando deploy"
exit 0  # exit 0 = BUILD CANCELADO