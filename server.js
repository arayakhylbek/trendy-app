const http = require('http');
const https = require('https');

const PORT = 3001;
const REPLICATE_TOKEN = 'REPLICATE_TOKEN_HERE';
const REPLICATE_HOST = 'api.replicate.com';

const server = http.createServer((req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, Prefer');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  // Collect full body before forwarding — required to set correct Content-Length
  const chunks = [];
  req.on('data', chunk => chunks.push(chunk));
  req.on('end', () => {
    const body = Buffer.concat(chunks);

    // Log request (truncate base64 images)
    console.log(`\n→ ${req.method} https://${REPLICATE_HOST}${req.url}`);
    console.log(`  Authorization: Token ${REPLICATE_TOKEN.slice(0, 8)}...`);
    if (body.length > 0) {
      try {
        const parsed = JSON.parse(body.toString());
        if (parsed.input?.input_image) {
          parsed.input.input_image = `[base64 ~${Math.round(parsed.input.input_image.length / 1024)}KB]`;
        }
        console.log('  Body:', JSON.stringify(parsed, null, 2));
      } catch {
        console.log(`  Body: ${body.length} bytes (non-JSON)`);
      }
    }

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

        // Log response
        console.log(`\n← ${proxyRes.statusCode} from Replicate`);
        try {
          console.log('  Response:', JSON.stringify(JSON.parse(respBody.toString()), null, 2));
        } catch {
          console.log(`  Response: ${respBody.length} bytes (non-JSON)`);
        }

        res.writeHead(proxyRes.statusCode, {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': proxyRes.headers['content-type'] || 'application/json',
        });
        res.end(respBody);
      });
    });

    proxyReq.on('error', (err) => {
      console.error('Proxy error:', err.message);
      if (!res.headersSent) {
        res.writeHead(502);
        res.end(JSON.stringify({ error: 'Proxy error', message: err.message }));
      }
    });

    if (body.length > 0) proxyReq.write(body);
    proxyReq.end();
  });
});

server.listen(PORT, () => {
  console.log(`Proxy running on http://localhost:${PORT}`);
  console.log(`Forwarding to https://${REPLICATE_HOST}`);
  console.log(`Token: ${REPLICATE_TOKEN.slice(0, 8)}...`);
});
