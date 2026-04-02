/*
 Copyright (c) 2026 WSO2 LLC. (http://www.wso2.com) All Rights Reserved.

 WSO2 LLC. licenses this file to you under the Apache License,
 Version 2.0 (the "License"); you may not use this file except
 in compliance with the License.
 You may obtain a copy of the License at

 http://www.apache.org/licenses/LICENSE-2.0

 Unless required by applicable law or agreed to in writing,
 software distributed under the License is distributed on an
 "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 KIND, either express or implied.  See the License for the
 specific language governing permissions and limitations
 under the License.
*/

import { useEffect } from 'react';

const REST_ENDPOINT = 'https://api.central.ballerina.io/2.0/registry/search-packages';

function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

interface PackageInfo {
  URL: string;
  createdDate?: string;
}

async function fetchAllPackages(): Promise<PackageInfo[]> {
  const batchSize = 100;
  const allPackages: PackageInfo[] = [];
  let offset = 0;
  let hasMore = true;

  while (hasMore) {
    const query = 'org:ballerinax';
    const sort = 'createdDate,DESC';
    const url = `${REST_ENDPOINT}?offset=${offset}&limit=${batchSize}&sort=${sort}&q=${encodeURIComponent(query)}`;

    const response = await fetch(url);
    if (!response.ok) break;

    const data = await response.json();
    allPackages.push(...data.packages);
    offset += batchSize;
    hasMore = offset < data.count;
  }

  return allPackages;
}

function generateSitemapXml(packages: PackageInfo[]): string {
  const baseUrl = `${window.location.origin}${window.__BASE_PATH__ || ''}`;
  const today = new Date().toISOString().split('T')[0];

  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
  xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';

  // Homepage
  xml += '  <url>\n';
  xml += `    <loc>${escapeXml(baseUrl)}</loc>\n`;
  xml += `    <lastmod>${today}</lastmod>\n`;
  xml += '    <changefreq>daily</changefreq>\n';
  xml += '    <priority>1.0</priority>\n';
  xml += '  </url>\n';

  // Connector pages
  packages.forEach((pkg) => {
    const urlPath = pkg.URL.replace(/^packages\//, '').replace(/^\//, '');
    const parts = urlPath.split('/').filter(Boolean);

    if (parts.length >= 2) {
      const [org, packageName] = parts;
      const lastmod = pkg.createdDate
        ? new Date(pkg.createdDate).toISOString().split('T')[0]
        : today;

      xml += '  <url>\n';
      xml += `    <loc>${escapeXml(`${baseUrl}/connector/${org}/${packageName}/latest`)}</loc>\n`;
      xml += `    <lastmod>${escapeXml(lastmod)}</lastmod>\n`;
      xml += '    <changefreq>weekly</changefreq>\n';
      xml += '    <priority>0.8</priority>\n';
      xml += '  </url>\n';
    }
  });

  xml += '</urlset>';
  return xml;
}

export default function SitemapPage() {
  useEffect(() => {
    fetchAllPackages().then((packages) => {
      const xml = generateSitemapXml(packages);
      document.open('text/xml');
      document.write(xml);
      document.close();
    });
  }, []);

  return null;
}
