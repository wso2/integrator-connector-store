#!/bin/bash

# Prebuild script - runs before build
# Optionally generates sitemap if GENERATE_SITEMAP=true is set

if [ "$GENERATE_SITEMAP" = "true" ]; then
  echo "GENERATE_SITEMAP=true detected, generating sitemap..."
  node scripts/generate-sitemap.js
else
  echo "Skipping sitemap generation (set GENERATE_SITEMAP=true to enable)"
fi
