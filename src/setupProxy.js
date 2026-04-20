const { generateSitemapXml } = require('../server/sitemap');

module.exports = function setupProxy(app) {
  app.get('/sitemap.xml', async (_req, res) => {
    try {
      const xml = await generateSitemapXml();
      res.set('Content-Type', 'application/xml; charset=utf-8');
      res.send(xml);
    } catch (error) {
      console.error('Failed to serve sitemap.xml:', error);
      res.status(500).set('Content-Type', 'application/xml; charset=utf-8');
      res.send('<?xml version="1.0" encoding="UTF-8"?><error>Failed to generate sitemap</error>');
    }
  });
};
