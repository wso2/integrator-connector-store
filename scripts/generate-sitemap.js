#!/usr/bin/env node

/**
 * Generate sitemap.xml for all connectors
 * Fetches connectors from Ballerina Central API and creates a sitemap
 */

const fs = require('fs');
const path = require('path');

const REST_ENDPOINT = 'https://api.central.ballerina.io/2.0/registry/search-packages';
// Use environment variable or default placeholder
// Set this via: SITE_URL=https://yourdomain.com npm run generate-sitemap
const BASE_URL = process.env.SITE_URL || 'https://example.com'; // CHANGE THIS to your production domain

async function fetchAllPackages() {
  const batchSize = 100;
  let allPackages = [];
  let offset = 0;
  let hasMore = true;

  console.log('Fetching connector packages...');

  while (hasMore) {
    try {
      const query = `org:ballerinax`;
      const sort = 'createdDate,DESC';
      const url = `${REST_ENDPOINT}?offset=${offset}&limit=${batchSize}&sort=${sort}&q=${encodeURIComponent(query)}`;

      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      allPackages = [...allPackages, ...data.packages];
      offset += batchSize;

      console.log(`Fetched ${allPackages.length} of ${data.count} packages...`);

      // Check if we've fetched everything
      hasMore = offset < data.count;

      // Add a small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 100));
    } catch (error) {
      console.error(`Failed to fetch batch at offset ${offset}:`, error);
      break;
    }
  }

  console.log(`Total packages fetched: ${allPackages.length}`);
  return allPackages;
}

function generateSitemap(packages) {
  const urls = [];

  // Add homepage
  urls.push({
    loc: BASE_URL,
    changefreq: 'daily',
    priority: '1.0',
    lastmod: new Date().toISOString().split('T')[0],
  });

  // Add connector URLs
  packages.forEach(pkg => {
    // Parse URL to extract org and package name
    const urlPath = pkg.URL.replace(/^packages\//, '').replace(/^\//, '');
    const urlParts = urlPath.split('/').filter(Boolean);

    if (urlParts.length >= 2) {
      const [org, packageName] = urlParts;
      urls.push({
        loc: `${BASE_URL}/connector/${org}/${packageName}/latest`,
        changefreq: 'weekly',
        priority: '0.8',
        lastmod: pkg.createdDate ? new Date(pkg.createdDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
      });
    }
  });

  // Generate XML
  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
  xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';

  urls.forEach(url => {
    xml += '  <url>\n';
    xml += `    <loc>${url.loc}</loc>\n`;
    xml += `    <lastmod>${url.lastmod}</lastmod>\n`;
    xml += `    <changefreq>${url.changefreq}</changefreq>\n`;
    xml += `    <priority>${url.priority}</priority>\n`;
    xml += '  </url>\n';
  });

  xml += '</urlset>';

  return xml;
}

async function main() {
  try {
    // Validate BASE_URL
    if (BASE_URL === 'https://example.com') {
      console.warn('⚠️  WARNING: Using placeholder domain "https://example.com"');
      console.warn('⚠️  Set your domain via: SITE_URL=https://yourdomain.com npm run generate-sitemap');
      console.warn('');
    }

    // Fetch all packages
    const packages = await fetchAllPackages();

    if (packages.length === 0) {
      console.error('No packages found. Exiting.');
      process.exit(1);
    }

    // Generate sitemap
    console.log('Generating sitemap...');
    const sitemap = generateSitemap(packages);

    // Write to public folder
    const publicDir = path.join(__dirname, '..', 'public');
    const sitemapPath = path.join(publicDir, 'sitemap.xml');

    fs.writeFileSync(sitemapPath, sitemap, 'utf8');
    console.log(`✓ Sitemap generated successfully at: ${sitemapPath}`);
    console.log(`✓ Total URLs: ${packages.length + 1}`); // +1 for homepage

  } catch (error) {
    console.error('Error generating sitemap:', error);
    process.exit(1);
  }
}

main();
