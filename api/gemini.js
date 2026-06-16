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

  const { theme } = body;
  if (!theme) { res.writeHead(400); res.end(JSON.stringify({ error: 'theme is required' })); return; }

  const prompt = `Generate 5 creative AI photo template ideas for the theme: ${theme}. For each idea, write: 1) catchy template name (2-3 words), 2) detailed image generation prompt (50-80 words) optimized for face insertion AI like InstantID. Style: photorealistic, vivid, viral on TikTok. Format as JSON array with fields: name, prompt, suggestedCategory.`;

  try {
    const result = await httpsPost(
      'generativelanguage.googleapis.com',
      `/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
      { 'Content-Type': 'application/json' },
      {
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.9, maxOutputTokens: 2048 }
      }
    );

    if (result.status !== 200) {
      res.writeHead(502); res.end(JSON.stringify({ error: 'Gemini API error', detail: result.body })); return;
    }

    const text = result.body?.candidates?.[0]?.content?.parts?.[0]?.text || '';

    let ideas = [];
    try {
      const jsonMatch = text.match(/\[[\s\S]*\]/);
      if (jsonMatch) ideas = JSON.parse(jsonMatch[0]);
    } catch(e) {
      res.writeHead(200); res.end(JSON.stringify({ raw: text, ideas: [] })); return;
    }

    res.writeHead(200); res.end(JSON.stringify({ ideas }));
  } catch(err) {
    if (!res.headersSent) {
      res.writeHead(502); res.end(JSON.stringify({ error: err.message }));
    }
  }
};
