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
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, Prefer');

  if (req.method === 'OPTIONS') { res.writeHead(204); res.end(); return; }

  const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
  const REPLICATE_TOKEN = process.env.REPLICATE_TOKEN;

  // Read request body
  const chunks = [];
  await new Promise(r => { req.on('data', c => chunks.push(c)); req.on('end', r); });
  let body = {};
  try { body = JSON.parse(Buffer.concat(chunks).toString()); } catch(e) {}

  const { prompt, imageBase64 } = body;

  if (!prompt) {
    res.writeHead(400); res.end(JSON.stringify({ error: 'prompt is required' })); return;
  }

  try {
    // Step 1: Use claude-opus-4-7 to enhance the prompt
    let enhancedPrompt = prompt;
    if (ANTHROPIC_API_KEY) {
      const messages = [
        {
          role: 'user',
          content: imageBase64
            ? [
                { type: 'image', source: { type: 'base64', media_type: 'image/jpeg', data: imageBase64 } },
                { type: 'text', text: `You are an expert AI image generation prompt engineer. The user wants to create a stylized photo using this template:\n\n${prompt}\n\nAnalyze the uploaded photo and enhance the template prompt to perfectly incorporate the person's features (skin tone, hair color, face shape, etc.) while maintaining the template's artistic style. Return ONLY the enhanced prompt, no explanations.` }
              ]
            : [{ type: 'text', text: `Enhance this AI image generation prompt to be more vivid and detailed while keeping the same style and mood. Return ONLY the enhanced prompt:\n\n${prompt}` }]
        }
      ];

      const claudeRes = await httpsPost('api.anthropic.com', '/v1/messages', {
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
        'Content-Type': 'application/json',
      }, {
        model: 'claude-opus-4-7',
        max_tokens: 1024,
        thinking: { type: 'adaptive' },
        messages,
      });

      if (claudeRes.status === 200 && claudeRes.body.content) {
        const textBlock = claudeRes.body.content.find(b => b.type === 'text');
        if (textBlock) enhancedPrompt = textBlock.text;
      }
    }

    // Step 2: Generate image via Replicate (flux-schnell)
    if (!REPLICATE_TOKEN) {
      // No Replicate token — return the enhanced prompt as a demo
      res.writeHead(200); res.end(JSON.stringify({ image: null, prompt: enhancedPrompt, demo: true })); return;
    }

    const predRes = await httpsPost('api.replicate.com', '/v1/models/black-forest-labs/flux-schnell/predictions', {
      'Authorization': `Token ${REPLICATE_TOKEN}`,
      'Content-Type': 'application/json',
    }, {
      input: { prompt: enhancedPrompt, aspect_ratio: '3:4', output_format: 'webp', output_quality: 90 }
    });

    if (predRes.status !== 201) {
      res.writeHead(502); res.end(JSON.stringify({ error: 'Replicate error', detail: predRes.body })); return;
    }

    // Poll for completion
    const predId = predRes.body.id;
    let imageUrl = null;
    for (let i = 0; i < 30; i++) {
      await new Promise(r => setTimeout(r, 2000));
      const pollRes = await new Promise((resolve, reject) => {
        https.get(`https://api.replicate.com/v1/predictions/${predId}`, {
          headers: { 'Authorization': `Token ${REPLICATE_TOKEN}` }
        }, (r) => {
          const c = []; r.on('data', d => c.push(d));
          r.on('end', () => { try { resolve(JSON.parse(Buffer.concat(c).toString())); } catch(e) { reject(e); } });
        }).on('error', reject);
      });

      if (pollRes.status === 'succeeded' && pollRes.output) {
        imageUrl = Array.isArray(pollRes.output) ? pollRes.output[0] : pollRes.output;
        break;
      }
      if (pollRes.status === 'failed') {
        res.writeHead(502); res.end(JSON.stringify({ error: 'Generation failed', detail: pollRes.error })); return;
      }
    }

    if (!imageUrl) {
      res.writeHead(504); res.end(JSON.stringify({ error: 'Generation timed out' })); return;
    }

    res.writeHead(200); res.end(JSON.stringify({ image: imageUrl, prompt: enhancedPrompt }));
  } catch(err) {
    if (!res.headersSent) {
      res.writeHead(502); res.end(JSON.stringify({ error: err.message }));
    }
  }
};
