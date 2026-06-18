import { describe, it, expect } from 'vitest';
import { UserDocSchema, TemplateSchema, GenerationRunSchema } from '../schemas.js';

const now = new Date().toISOString();

describe('UserDocSchema', () => {
  it('parses a valid user document', () => {
    const result = UserDocSchema.parse({
      uid: 'abc123',
      email: 'test@example.com',
      tier: 'free',
      generationsUsed: 0,
      createdAt: now,
      updatedAt: now,
    });
    expect(result.tier).toBe('free');
    expect(result.displayName).toBeNull();
  });

  it('defaults tier to free', () => {
    const result = UserDocSchema.parse({
      uid: 'abc123',
      email: 'test@example.com',
      createdAt: now,
      updatedAt: now,
    });
    expect(result.tier).toBe('free');
  });

  it('rejects invalid email', () => {
    expect(() =>
      UserDocSchema.parse({
        uid: 'abc',
        email: 'not-an-email',
        createdAt: now,
        updatedAt: now,
      })
    ).toThrow();
  });

  it('rejects invalid tier', () => {
    expect(() =>
      UserDocSchema.parse({
        uid: 'abc',
        email: 'a@b.com',
        tier: 'enterprise',
        createdAt: now,
        updatedAt: now,
      })
    ).toThrow();
  });
});

describe('TemplateSchema', () => {
  it('parses a valid template', () => {
    const result = TemplateSchema.parse({
      emoji: '⚾',
      label: 'Baseball Cam',
      style: 'Cinematic',
      cat: 'kdrama',
      prompt: 'A test prompt',
      image: 'test.png',
      createdAt: now,
    });
    expect(result.isTrending).toBe(false);
    expect(result.isPro).toBe(false);
  });
});

describe('GenerationRunSchema', () => {
  it('parses a valid run', () => {
    const result = GenerationRunSchema.parse({
      date: '2026-06-18',
      status: 'completed',
      templatesGenerated: 3,
      startedAt: now,
    });
    expect(result.status).toBe('completed');
  });

  it('rejects invalid date format', () => {
    expect(() =>
      GenerationRunSchema.parse({
        date: '2026/06/18',
        status: 'completed',
        templatesGenerated: 0,
        startedAt: now,
      })
    ).toThrow();
  });
});
