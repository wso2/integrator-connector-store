const REST_ENDPOINT = 'https://api.central.ballerina.io/2.0/registry/search-packages';
const BASE_URL = 'https://wso2.com/integration-platform/connectors';
const REQUEST_TIMEOUT_MS = Number(process.env.SITEMAP_REQUEST_TIMEOUT_MS) || 30000;
const MAX_FETCH_RETRIES = 3;
const BUILD_SITEMAP_FILE = require('path').join(__dirname, '..', 'build', 'sitemap.xml');
const PUBLIC_SITEMAP_FILE = require('path').join(__dirname, '..', 'public', 'sitemap.xml');

async function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchWithRetry(url) {
  let lastError;

  for (let attempt = 0; attempt < MAX_FETCH_RETRIES; attempt += 1) {
    try {
      const response = await fetch(url, {
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch connector packages: HTTP ${response.status}`);
      }

      return response;
    } catch (error) {
      lastError = error;

      if (attempt < MAX_FETCH_RETRIES - 1) {
        await delay(250 * 2 ** attempt);
      }
    }
  }

  throw lastError;
}

function escapeXml(str) {
  if (typeof str !== 'string') {
    return String(str);
  }

  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

async function loadFallbackSitemapXml() {
  const sitemapCandidates = [BUILD_SITEMAP_FILE, PUBLIC_SITEMAP_FILE];

  for (const filePath of sitemapCandidates) {
    try {
      return await require('fs').promises.readFile(filePath, 'utf8');
    } catch {
      // Try the next fallback location.
    }
  }

  return null;
}

async function fetchAllPackages() {
  const batchSize = 500;
  let offset = 0;
  let totalCount = Infinity;
  const allPackages = [];

  while (offset < totalCount) {
    const query = 'org:ballerinax';
    const sort = 'createdDate,DESC';
    const url = `${REST_ENDPOINT}?offset=${offset}&limit=${batchSize}&sort=${sort}&q=${encodeURIComponent(query)}&readme=false`;

    const response = await fetchWithRetry(url);
    const data = await response.json();
    if (!Array.isArray(data.packages) || data.packages.length === 0) {
      break;
    }

    allPackages.push(...data.packages);

    if (Number.isFinite(data.count)) {
      totalCount = data.count;
    } else {
      totalCount = offset + data.packages.length;
    }

    offset += data.packages.length;
  }

  return allPackages;
}

function buildSitemapUrls(packages) {
  const today = new Date().toISOString().split('T')[0];
  const urls = [
    {
      loc: BASE_URL,
      lastmod: today,
      changefreq: 'daily',
      priority: '1.0',
    },
  ];

  const seenConnectors = new Set();

  packages.forEach((pkg) => {
    const urlPath = String(pkg.URL || '')
      .replace(/^packages\//, '')
      .replace(/^\//, '');
    const urlParts = urlPath.split('/').filter(Boolean);

    if (urlParts.length < 2) {
      return;
    }

    const [org, packageName] = urlParts;
    const key = `${org}/${packageName}`;

    if (seenConnectors.has(key)) {
      return;
    }

    seenConnectors.add(key);
    urls.push({
      loc: `${BASE_URL}/connector/${org}/${packageName}/latest`,
      lastmod: pkg.createdDate ? new Date(pkg.createdDate).toISOString().split('T')[0] : today,
      changefreq: 'weekly',
      priority: '0.8',
    });
  });

  return urls;
}

async function generateSitemapXml() {
  const packages = await fetchAllPackages();
  const urls = buildSitemapUrls(packages);

  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
  xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';

  urls.forEach((url) => {
    xml += '  <url>\n';
    xml += `    <loc>${escapeXml(url.loc)}</loc>\n`;
    xml += `    <lastmod>${escapeXml(url.lastmod)}</lastmod>\n`;
    xml += `    <changefreq>${escapeXml(url.changefreq)}</changefreq>\n`;
    xml += `    <priority>${escapeXml(url.priority)}</priority>\n`;
    xml += '  </url>\n';
  });

  xml += '</urlset>';
  return xml;
}

module.exports = {
  generateSitemapXml,
  loadFallbackSitemapXml,
};
