const https = require('https');

function httpsPost(hostname, path, headers, body) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(body);
    const req = https.request(
      { hostname, path, method: 'POST', headers: { ...headers, 'Content-Length': Buffer.byteLength(data) } },
      (res) => {
        const chunks = [];
        res.on('data', c => chunks.push(c));
        res.on('end', () => {
          try { resolve({ status: res.statusCode, body: JSON.parse(Buffer.concat(chunks).toString()) }); }
          catch(e) { reject(e); }
        });
      }
    );
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') { res.writeHead(204); res.end(); return; }
  if (req.method !== 'POST') { res.writeHead(405); res.end(JSON.stringify({ error: 'Method not allowed' })); return; }

  const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
  if (!GEMINI_API_KEY) {
    res.writeHead(500); res.end(JSON.stringify({ error: 'GEMINI_API_KEY not configured' })); return;
  }

  const chunks = [];
  await new Promise(r => { req.on('data', c => chunks.push(c)); req.on('end', r); });
  let body = {};
  try { body = JSON.parse(Buffer.concat(chunks).toString()); } catch(e) {}

  const { prompt } = body;
  if (!prompt) { res.writeHead(400); res.end(JSON.stringify({ error: 'prompt is required' })); return; }

  try {
    const result = await httpsPost(
      'generativelanguage.googleapis.com',
      `/v1beta/models/gemini-2.0-flash-preview-image-generation:generateContent?key=${GEMINI_API_KEY}`,
      { 'Content-Type': 'application/json' },
      {
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { responseModalities: ['IMAGE', 'TEXT'] }
      }
    );

    if (result.status !== 200) {
      res.writeHead(502); res.end(JSON.stringify({ error: 'Gemini API error', detail: result.body })); return;
    }

    const parts = result.body?.candidates?.[0]?.content?.parts || [];
    const imagePart = parts.find(p => p.inlineData);

    if (!imagePart) {
      res.writeHead(502); res.end(JSON.stringify({ error: 'No image in response', raw: parts })); return;
    }

    const { mimeType, data } = imagePart.inlineData;
    res.writeHead(200);
    res.end(JSON.stringify({
      imageUrl: `data:${mimeType};base64,${data}`,
      mimeType,
    }));
  } catch(err) {
    if (!res.headersSent) {
      res.writeHead(502); res.end(JSON.stringify({ error: err.message }));
    }
  }
};
