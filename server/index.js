const fs = require('fs');
const path = require('path');
const http = require('http');
const { generateSitemapXml, loadFallbackSitemapXml } = require('./sitemap');

const BUILD_DIR = path.join(__dirname, '..', 'build');
const INDEX_FILE = path.join(BUILD_DIR, 'index.html');
const PORT = Number(process.env.PORT) || 3000;
const HOST = '0.0.0.0';

const MIME_TYPES = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.ico': 'image/x-icon',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.map': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.txt': 'text/plain; charset=utf-8',
  '.webp': 'image/webp',
};

function send(res, statusCode, body, headers = {}) {
  res.writeHead(statusCode, headers);
  res.end(body);
}

async function serveFile(res, filePath) {
  const extension = path.extname(filePath).toLowerCase();
  const contentType = MIME_TYPES[extension] || 'application/octet-stream';
  const body = await fs.promises.readFile(filePath);

  send(res, 200, body, {
    'Content-Type': contentType,
  });
}

function shouldServeSpa(pathname) {
  return pathname === '/' || pathname.startsWith('/connector/') || !pathname.includes('.');
}

function resolveStaticPath(pathname) {
  const decodedPath = decodeURIComponent(pathname);
  const relativePath = decodedPath.replace(/^\/+/, '');
  const resolvedBuild = path.resolve(BUILD_DIR);
  const filePath = path.resolve(resolvedBuild, relativePath);
  const relativeToBuild = path.relative(resolvedBuild, filePath);

  if (
    relativeToBuild === '..' ||
    relativeToBuild.startsWith(`..${path.sep}`) ||
    path.isAbsolute(relativeToBuild)
  ) {
    return null;
  }

  return filePath;
}

async function requestHandler(req, res) {
  if (!req.url) {
    send(res, 400, 'Bad Request', { 'Content-Type': 'text/plain; charset=utf-8' });
    return;
  }

  const { pathname } = new URL(req.url, `http://${req.headers.host || 'localhost'}`);

  if (pathname === '/sitemap.xml') {
    try {
      const xml = await generateSitemapXml();
      send(res, 200, xml, {
        'Cache-Control': 'public, max-age=0, s-maxage=3600, stale-while-revalidate=86400',
        'Content-Type': 'application/xml; charset=utf-8',
      });
    } catch (error) {
      console.error('Failed to generate sitemap.xml:', error);
      const fallbackXml = await loadFallbackSitemapXml();

      if (fallbackXml) {
        send(res, 200, fallbackXml, {
          'Cache-Control': 'public, max-age=0, s-maxage=600, stale-while-revalidate=3600',
          'Content-Type': 'application/xml; charset=utf-8',
        });
        return;
      }

      send(
        res,
        500,
        '<?xml version="1.0" encoding="UTF-8"?><error>Failed to generate sitemap</error>',
        {
          'Cache-Control': 'no-cache, no-store, max-age=0',
          'Content-Type': 'application/xml; charset=utf-8',
        }
      );
    }
    return;
  }

  const filePath = resolveStaticPath(pathname);

  if (filePath) {
    try {
      const stats = await fs.promises.stat(filePath);
      if (stats.isFile()) {
        await serveFile(res, filePath);
        return;
      }
    } catch {
      // Fall through to SPA handling / 404 below.
    }
  }

  if (shouldServeSpa(pathname)) {
    try {
      await serveFile(res, INDEX_FILE);
      return;
    } catch (error) {
      console.error('Failed to serve SPA index.html:', error);
      send(res, 500, 'Failed to serve application', {
        'Content-Type': 'text/plain; charset=utf-8',
      });
      return;
    }
  }

  send(res, 404, 'Not Found', {
    'Content-Type': 'text/plain; charset=utf-8',
  });
}

async function ensureBuildExists() {
  try {
    await fs.promises.access(INDEX_FILE, fs.constants.R_OK);
  } catch {
    throw new Error(
      `Production build not found at ${INDEX_FILE}. Run "npm run build" before "npm start".`
    );
  }
}

async function main() {
  await ensureBuildExists();

  const server = http.createServer((req, res) => {
    requestHandler(req, res).catch((error) => {
      console.error('Unhandled server error:', error);
      send(res, 500, 'Internal Server Error', {
        'Content-Type': 'text/plain; charset=utf-8',
      });
    });
  });

  server.listen(PORT, HOST, () => {
    console.log(`Connector store server listening on http://${HOST}:${PORT}`);
  });
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
