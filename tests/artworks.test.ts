import { describe, expect, it } from 'vitest';
import { ZodError } from 'zod';
import {
  artworkCollectionSchema,
  artworkImageSchema,
  artworkPatchSchema,
  artworkSchema,
  createArtworkSchema,
} from '../src/models.js';
import artworkDocument from './fixtures/artwork.json' with { type: 'json' };
import artworksDocument from './fixtures/artworks.json' with { type: 'json' };

describe('artworkImageSchema', () => {
  it('parses an image with alt text', () => {
    const image = artworkDocument.images[0];

    expect(artworkImageSchema.parse(image)).toEqual(image);
  });

  it('parses a draft image without alt text', () => {
    const image = { mediaId: '01JX8Z5K4M6Q2R7T9V1W3Y5A7F', role: 'main', sortOrder: 0 };

    expect(artworkImageSchema.parse(image)).toEqual(image);
  });
});

describe('artworkSchema', () => {
  it('parses a work with every optional field', () => {
    expect(artworkSchema.parse(artworkDocument)).toEqual(artworkDocument);
  });

  it('parses a draft with the optional fields omitted', () => {
    const draft = artworksDocument.artworks[1];

    expect(artworkSchema.parse(draft)).toEqual(draft);
  });

  it('rejects an unknown image role', () => {
    const malformed = {
      ...artworkDocument,
      images: [{ ...artworkDocument.images[0], role: 'thumbnail' }],
    };

    expect(() => artworkSchema.parse(malformed)).toThrow(ZodError);
  });

  it('rejects a work without the update link', () => {
    const malformed = { ...artworkDocument, links: { self: artworkDocument.links.self } };

    expect(() => artworkSchema.parse(malformed)).toThrow(ZodError);
  });

  it('rejects a work without a version', () => {
    const { version: _version, ...malformed } = artworkDocument;

    expect(() => artworkSchema.parse(malformed)).toThrow(ZodError);
  });
});

describe('artworkCollectionSchema', () => {
  it('parses a collection with its next page', () => {
    expect(artworkCollectionSchema.parse(artworksDocument)).toEqual(artworksDocument);
  });

  it('parses the last page without a cursor or a next link', () => {
    const lastPage = {
      artworks: artworksDocument.artworks,
      links: { self: artworksDocument.links.self },
    };

    expect(artworkCollectionSchema.parse(lastPage)).toEqual(lastPage);
  });

  it('rejects a collection without the self link', () => {
    const malformed = { ...artworksDocument, links: {} };

    expect(() => artworkCollectionSchema.parse(malformed)).toThrow(ZodError);
  });

  it('rejects an artwork that is not an object', () => {
    const malformed = { ...artworksDocument, artworks: ['not-an-artwork'] };

    expect(() => artworkCollectionSchema.parse(malformed)).toThrow(ZodError);
  });
});

describe('createArtworkSchema', () => {
  it('accepts an empty draft', () => {
    expect(createArtworkSchema.parse({})).toEqual({});
  });

  it('rejects a server-owned field', () => {
    expect(() => createArtworkSchema.parse({ published: true })).toThrow(ZodError);
  });

  it('accepts a complete localized pair', () => {
    const draft = { title: { ptBR: 'Sem título', en: 'Untitled' }, sortOrder: 0 };

    expect(createArtworkSchema.parse(draft)).toEqual(draft);
  });

  it('accepts a draft image without alt text', () => {
    const draft = {
      images: [{ mediaId: '01JX8Z5K4M6Q2R7T9V1W3Y5A7F', role: 'main', sortOrder: 0 }],
    };

    expect(createArtworkSchema.parse(draft)).toEqual(draft);
  });
});

describe('artworkPatchSchema', () => {
  it('requires the version that was read', () => {
    expect(() => artworkPatchSchema.parse({ year: null })).toThrow(ZodError);
  });

  it('keeps an explicit null distinct from an absent field', () => {
    const patch = artworkPatchSchema.parse({ version: 2, year: null });

    expect(patch).toHaveProperty('year', null);
    expect(patch).not.toHaveProperty('categoryId');
  });

  it('accepts an explicit null on every clearable field', () => {
    const clearable = {
      version: 2,
      slug: null,
      year: null,
      dimensions: null,
      categoryId: null,
      exhibition: null,
      note: null,
    };

    expect(artworkPatchSchema.parse(clearable)).toEqual(clearable);
  });

  it('rejects an explicit null on a field that cannot be cleared', () => {
    const fields = ['title', 'medium', 'description', 'images', 'tags', 'sortOrder', 'published'];

    for (const field of fields) {
      expect(() => artworkPatchSchema.parse({ version: 2, [field]: null })).toThrow(ZodError);
    }
  });
});
