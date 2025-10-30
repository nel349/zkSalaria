#!/bin/bash

# Check if compile cache exists and if source files haven't changed
if [ -f .compile-cache ]; then
  # Check if any .compact file is newer than the cache
  if [ -z "$(find src -name '*.compact' -newer .compile-cache)" ]; then
    echo "✓ Using cached compilation results (source unchanged)"
    exit 0
  else
    echo "→ Source files changed, recompiling..."
  fi
else
  echo "→ No cache found, compiling contracts..."
fi

exit 1