const REST_ENDPOINT = 'https://api.central.ballerina.io/2.0/registry/search-packages';
const BASE_URL = 'https://wso2.com/integration-platform/connectors';

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

async function fetchAllPackages() {
  const batchSize = 500;
  let offset = 0;
  let totalCount = Infinity;
  const allPackages = [];

  while (offset < totalCount) {
    const query = 'org:ballerinax';
    const sort = 'createdDate,DESC';
    const url = `${REST_ENDPOINT}?offset=${offset}&limit=${batchSize}&sort=${sort}&q=${encodeURIComponent(query)}&readme=false`;

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch connector packages: HTTP ${response.status}`);
    }

    const data = await response.json();
    allPackages.push(...data.packages);
    totalCount = data.count;
    offset += batchSize;
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
};
