const https = require('https');

module.exports = (req, res) => {
  const REPLICATE_TOKEN = process.env.REPLICATE_TOKEN;
  const REPLICATE_HOST = 'api.replicate.com';

  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, Prefer');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  const chunks = [];
  req.on('data', chunk => chunks.push(chunk));
  req.on('end', () => {
    const body = Buffer.concat(chunks);

    const options = {
      hostname: REPLICATE_HOST,
      port: 443,
      path: req.url,
      method: req.method,
      headers: {
        'Authorization': `Token ${REPLICATE_TOKEN}`,
        'Content-Type': 'application/json',
        'Content-Length': body.length,
      },
    };

    if (req.headers['prefer']) {
      options.headers['Prefer'] = req.headers['prefer'];
    }

    const proxyReq = https.request(options, (proxyRes) => {
      const respChunks = [];
      proxyRes.on('data', chunk => respChunks.push(chunk));
      proxyRes.on('end', () => {
        const respBody = Buffer.concat(respChunks);
        res.writeHead(proxyRes.statusCode, {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': proxyRes.headers['content-type'] || 'application/json',
        });
        res.end(respBody);
      });
    });

    proxyReq.on('error', (err) => {
      if (!res.headersSent) {
        res.writeHead(502);
        res.end(JSON.stringify({ error: 'Proxy error', message: err.message }));
      }
    });

    if (body.length > 0) proxyReq.write(body);
    proxyReq.end();
  });
};
