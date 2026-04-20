const { generateSitemapXml } = require('../server/sitemap');

module.exports = async function handler(_req, res) {
  try {
    const xml = await generateSitemapXml();
    res.setHeader('Content-Type', 'application/xml; charset=utf-8');
    res.status(200).send(xml);
  } catch (error) {
    console.error('Failed to generate sitemap.xml:', error);
    res.setHeader('Content-Type', 'application/xml; charset=utf-8');
    res
      .status(500)
      .send('<?xml version="1.0" encoding="UTF-8"?><error>Failed to generate sitemap</error>');
  }
};
