import { AppError } from '@trendy/shared';

interface AnthropicMessage {
  role: 'user';
  content: Array<{ type: string; text?: string; source?: { type: string; media_type: string; data: string } }>;
}

interface AnthropicResponse {
  content?: Array<{ type: string; text?: string }>;
}

export class ClaudePromptEnhancer {
  async enhance(basePrompt: string, imageBase64?: string): Promise<string> {
    const apiKey = process.env['ANTHROPIC_API_KEY'];
    if (!apiKey) {
      return basePrompt;
    }

    const messages: AnthropicMessage[] = [
      {
        role: 'user',
        content: imageBase64
          ? [
              {
                type: 'image',
                source: { type: 'base64', media_type: 'image/jpeg', data: imageBase64 },
              },
              {
                type: 'text',
                text: `You are an expert AI image generation prompt engineer. The user wants to create a stylized photo using this template:\n\n${basePrompt}\n\nAnalyze the uploaded photo and enhance the template prompt to perfectly incorporate the person's features (skin tone, hair color, face shape, etc.) while maintaining the template's artistic style. Return ONLY the enhanced prompt, no explanations.`,
              },
            ]
          : [
              {
                type: 'text',
                text: `Enhance this AI image generation prompt to be more vivid and detailed while keeping the same style and mood. Return ONLY the enhanced prompt:\n\n${basePrompt}`,
              },
            ],
      },
    ];

    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-opus-4-8',
        max_tokens: 1024,
        thinking: { type: 'adaptive' },
        messages,
      }),
    });

    if (!res.ok) {
      return basePrompt;
    }

    const data = (await res.json()) as AnthropicResponse;
    const textBlock = data.content?.find((b) => b.type === 'text');
    return textBlock?.text ?? basePrompt;
  }
}
