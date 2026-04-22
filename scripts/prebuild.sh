#!/bin/sh

# Prebuild script - runs before build
# Always generates sitemap.xml for static deployments

echo "Generating sitemap.xml..."
node scripts/generate-sitemap.js
