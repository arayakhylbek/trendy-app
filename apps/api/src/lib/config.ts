import { z } from 'zod';

const ConfigSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  FIREBASE_PROJECT_ID: z.string().min(1),
  FIREBASE_CLIENT_EMAIL: z.string().email(),
  FIREBASE_PRIVATE_KEY: z.string().min(1),
  POLAR_ACCESS_TOKEN: z.string().min(1),
  POLAR_WEBHOOK_SECRET: z.string().min(1),
  POLAR_SERVER: z.enum(['sandbox', 'production']).default('sandbox'),
  POLAR_PRODUCT_PRO: z.string().min(1),
  POLAR_PRODUCT_STUDIO: z.string().min(1),
  GEMINI_API_KEY: z.string().min(1),
  ANTHROPIC_API_KEY: z.string().min(1),
  REPLICATE_TOKEN: z.string().min(1),
  APP_BASE_URL: z.string().url(),
  CRON_SECRET: z.string().min(16),
});

type Config = z.infer<typeof ConfigSchema>;

let _config: Config | undefined;

export function getConfig(): Config {
  if (_config) return _config;

  const result = ConfigSchema.safeParse(process.env);
  if (!result.success) {
    const missing = result.error.issues
      .map((i) => `  ${i.path.join('.')}: ${i.message}`)
      .join('\n');
    throw new Error(`Missing or invalid environment variables:\n${missing}`);
  }
  _config = result.data;
  return _config;
}
