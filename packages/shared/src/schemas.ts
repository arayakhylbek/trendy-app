import { z } from 'zod';

export const PlanIdSchema = z.enum(['free', 'pro', 'studio']);

export const UserDocSchema = z.object({
  uid: z.string(),
  email: z.string().email(),
  displayName: z.string().nullable().default(null),
  tier: PlanIdSchema.default('free'),
  generationsUsed: z.number().int().nonnegative().default(0),
  generationsResetAt: z.string().datetime().optional(),
  polarCustomerId: z.string().optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export const TemplateSchema = z.object({
  id: z.string().optional(),
  emoji: z.string(),
  label: z.string(),
  style: z.string(),
  styleName: z.string().optional(),
  cat: z.string(),
  prompt: z.string(),
  image: z.string(),
  isTrending: z.boolean().default(false),
  isNew: z.boolean().default(false),
  isPro: z.boolean().default(false),
  likes: z.number().int().nonnegative().default(0),
  uses: z.number().int().nonnegative().default(0),
  createdAt: z.string().datetime(),
});

export const GenerationRunSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  status: z.enum(['pending', 'completed', 'failed']),
  templatesGenerated: z.number().int().nonnegative().default(0),
  startedAt: z.string().datetime(),
  completedAt: z.string().datetime().optional(),
  error: z.string().optional(),
});

export const WebhookEventSchema = z.object({
  eventId: z.string(),
  type: z.string(),
  processedAt: z.string().datetime(),
});

export const CheckoutRequestSchema = z.object({
  planId: z.enum(['pro', 'studio']),
});

export const GenerateRequestSchema = z.object({
  prompt: z.string().min(1).max(2000),
  imageBase64: z.string().optional(),
  templateBase64: z.string().optional(),
});

export type UserDoc = z.infer<typeof UserDocSchema>;
export type Template = z.infer<typeof TemplateSchema>;
export type GenerationRun = z.infer<typeof GenerationRunSchema>;
export type WebhookEvent = z.infer<typeof WebhookEventSchema>;
export type CheckoutRequest = z.infer<typeof CheckoutRequestSchema>;
export type GenerateRequest = z.infer<typeof GenerateRequestSchema>;
