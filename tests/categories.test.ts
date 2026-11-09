import { describe, expect, it } from 'vitest';
import { ZodError } from 'zod';
import { categoryCollectionSchema } from '../src/models.js';
import categoriesDocument from './fixtures/categories.json' with { type: 'json' };

describe('categoryCollectionSchema', () => {
  it('accepts the categories document', () => {
    expect(categoryCollectionSchema.parse(categoriesDocument)).toEqual(categoriesDocument);
  });

  it('rejects a category missing a locale', () => {
    const malformed = {
      ...categoriesDocument,
      categories: [
        { id: 'animals', slug: { ptBR: 'animais' }, name: { ptBR: 'Animais', en: 'Animals' } },
      ],
    };

    expect(() => categoryCollectionSchema.parse(malformed)).toThrow(ZodError);
  });

  it('rejects a document without the self link', () => {
    const malformed = { ...categoriesDocument, links: {} };

    expect(() => categoryCollectionSchema.parse(malformed)).toThrow(ZodError);
  });
});
