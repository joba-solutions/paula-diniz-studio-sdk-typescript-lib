import { z } from 'zod';
import { linkSchema, type Link, type WireLink } from './link.js';
import {
  artworkCollectionSchema,
  artworkSchema,
  categoryCollectionSchema,
  meSchema,
  type Artwork,
  type ArtworkCollection,
  type CategoryCollection,
  type Me,
} from './models.js';

/** The home document as the API returns it: the links the client resolves into entry points. */
export interface StudioHomeDocument {
  links: Record<string, WireLink>;
}

export const studioHomeDocumentSchema: z.ZodType<StudioHomeDocument> = z.object({
  links: z.record(z.string(), linkSchema),
});

/** The Studio's home: `/` is the one path a client may know. */
export const studioHome: Link<StudioHomeDocument> = {
  href: '/',
  rel: 'home',
  httpMethod: 'GET',
  parse: (body) => studioHomeDocumentSchema.parse(body),
};

/** The Studio's entry points, typed by what each returns. */
export interface StudioHome {
  me: Link<Me>;
  categories: Link<CategoryCollection>;
  artworks: Link<ArtworkCollection>;
  artwork: Link<Artwork>;
  createArtwork: Link<Artwork>;
}

/** Requires every link the home promises, throwing at sign-in if the server dropped one. */
export function resolveStudioHome(links: Record<string, WireLink>): StudioHome {
  const me = links.me;
  if (!me) throw new Error('home document missing link "me"');
  const categories = links.categories;
  if (!categories) throw new Error('home document missing link "categories"');
  const artworks = links.artworks;
  if (!artworks) throw new Error('home document missing link "artworks"');
  const artwork = links.artwork;
  if (!artwork) throw new Error('home document missing link "artwork"');
  const createArtwork = links['create-artwork'];
  if (!createArtwork) throw new Error('home document missing link "create-artwork"');
  return {
    me: { ...me, parse: (body) => meSchema.parse(body) },
    categories: { ...categories, parse: (body) => categoryCollectionSchema.parse(body) },
    artworks: { ...artworks, parse: (body) => artworkCollectionSchema.parse(body) },
    artwork: { ...artwork, parse: (body) => artworkSchema.parse(body) },
    createArtwork: { ...createArtwork, parse: (body) => artworkSchema.parse(body) },
  };
}
