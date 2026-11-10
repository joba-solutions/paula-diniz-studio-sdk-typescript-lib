import { z } from 'zod';
import { linkSchema, type Link } from './link.js';

/** The only caller the Studio API admits: the artist's Clerk user. */
export const actorKindSchema = z.enum(['artist']);
export type ActorKind = z.infer<typeof actorKindSchema>;

/** The verified caller, as `GET /me` returns it. */
export interface Me {
  subject: string;
  kind: ActorKind;
  links: { self: Link<Me> };
}

export const meSchema: z.ZodType<Me> = z.object({
  subject: z.string(),
  kind: actorKindSchema,
  links: z.object({ self: linkSchema }),
});

/** A text in both site locales, as every localized field is sent. */
export interface LocalizedText {
  ptBR: string;
  en: string;
}

export const localizedTextSchema: z.ZodType<LocalizedText> = z.object({
  ptBR: z.string(),
  en: z.string(),
});

/** One of the Studio's fixed artwork categories. */
export interface Category {
  id: string;
  slug: LocalizedText;
  name: LocalizedText;
}

export const categorySchema: z.ZodType<Category> = z.object({
  id: z.string(),
  slug: localizedTextSchema,
  name: localizedTextSchema,
});

/** The fixed category list: not paginated, with no per-item links. */
export interface CategoryCollection {
  categories: Category[];
  links: { self: Link<CategoryCollection> };
}

export const categoryCollectionSchema: z.ZodType<CategoryCollection> = z.object({
  categories: z.array(categorySchema),
  links: z.object({ self: linkSchema }),
});

/** The role an artwork image plays. */
export type ImageRole = 'main' | 'detail' | 'process' | 'room';

export const imageRoleSchema: z.ZodType<ImageRole> = z.enum(['main', 'detail', 'process', 'room']);

/** One image attached to an artwork, referencing a media record. */
export interface ArtworkImage {
  mediaId: string;
  role: ImageRole;
  sortOrder: number;
  altText: LocalizedText;
}

export const artworkImageSchema: z.ZodType<ArtworkImage> = z.object({
  mediaId: z.string(),
  role: imageRoleSchema,
  sortOrder: z.number().int().min(0),
  altText: localizedTextSchema,
});

/** The physical size of a work, in centimetres. */
export interface Dimensions {
  widthCm: number;
  heightCm: number;
  depthCm?: number | undefined;
}

export const dimensionsSchema: z.ZodType<Dimensions> = z.object({
  widthCm: z.number().positive(),
  heightCm: z.number().positive(),
  depthCm: z.number().positive().optional(),
});

/** The exhibition a work appeared in. */
export interface Exhibition {
  label: string;
  text: LocalizedText;
}

export const exhibitionSchema: z.ZodType<Exhibition> = z.object({
  label: z.string(),
  text: localizedTextSchema,
});

/** A verified user, as the store records who created and last updated a work. */
export interface Actor {
  subject: string;
  kind: ActorKind;
}

export const actorSchema: z.ZodType<Actor> = z.object({
  subject: z.string(),
  kind: actorKindSchema,
});

/** A Studio artwork, as the API returns it. Nulls are omitted on the wire. */
export interface Artwork {
  id: string;
  version: number;
  published: boolean;
  slug?: LocalizedText | undefined;
  title?: LocalizedText | undefined;
  year?: number | undefined;
  medium?: LocalizedText | undefined;
  dimensions?: Dimensions | undefined;
  categoryId?: string | undefined;
  description?: LocalizedText | undefined;
  images: ArtworkImage[];
  sortOrder: number;
  tags: Record<string, string>;
  exhibition?: Exhibition | undefined;
  note?: LocalizedText | undefined;
  createdAt: string;
  updatedAt: string;
  createdBy: Actor;
  updatedBy: Actor;
  links: { self: Link<Artwork>; update: Link<Artwork> };
}

export const artworkSchema: z.ZodType<Artwork> = z.object({
  id: z.string(),
  version: z.number().int().min(1),
  published: z.boolean(),
  slug: localizedTextSchema.optional(),
  title: localizedTextSchema.optional(),
  year: z.number().int().optional(),
  medium: localizedTextSchema.optional(),
  dimensions: dimensionsSchema.optional(),
  categoryId: z.string().optional(),
  description: localizedTextSchema.optional(),
  images: z.array(artworkImageSchema),
  sortOrder: z.number().int().min(0),
  tags: z.record(z.string(), z.string()),
  exhibition: exhibitionSchema.optional(),
  note: localizedTextSchema.optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
  createdBy: actorSchema,
  updatedBy: actorSchema,
  links: z.object({ self: linkSchema, update: linkSchema }),
});

/** One page of artworks; the cursor and the `next` link are omitted on the last page. */
export interface ArtworkCollection {
  artworks: Artwork[];
  nextCursor?: string | undefined;
  links: { self: Link<ArtworkCollection>; next?: Link<ArtworkCollection> | undefined };
}

export const artworkCollectionSchema: z.ZodType<ArtworkCollection> = z.object({
  artworks: z.array(artworkSchema),
  nextCursor: z.string().optional(),
  links: z.object({ self: linkSchema, next: linkSchema.optional() }),
});

/** The fields a caller may send on create; the server owns the id, version, actor and publish state. */
export interface CreateArtwork {
  slug?: LocalizedText | null | undefined;
  title?: LocalizedText | undefined;
  year?: number | null | undefined;
  medium?: LocalizedText | undefined;
  dimensions?: Dimensions | null | undefined;
  categoryId?: string | null | undefined;
  description?: LocalizedText | undefined;
  images?: ArtworkImage[] | undefined;
  sortOrder?: number | undefined;
  tags?: Record<string, string> | undefined;
  exhibition?: Exhibition | null | undefined;
  note?: LocalizedText | null | undefined;
}

const artworkDraftShape = {
  slug: localizedTextSchema.nullable().optional(),
  title: localizedTextSchema.optional(),
  year: z.number().int().nullable().optional(),
  medium: localizedTextSchema.optional(),
  dimensions: dimensionsSchema.nullable().optional(),
  categoryId: z.string().nullable().optional(),
  description: localizedTextSchema.optional(),
  images: z.array(artworkImageSchema).optional(),
  sortOrder: z.number().int().min(0).optional(),
  tags: z.record(z.string(), z.string()).optional(),
  exhibition: exhibitionSchema.nullable().optional(),
  note: localizedTextSchema.nullable().optional(),
} satisfies z.ZodRawShape;

export const createArtworkSchema: z.ZodType<CreateArtwork> = z.strictObject(artworkDraftShape);

/** A partial artwork write: `version` is the version read, and `null` clears a clearable field. */
export interface ArtworkPatch extends CreateArtwork {
  version: number;
  published?: boolean | undefined;
}

export const artworkPatchSchema: z.ZodType<ArtworkPatch> = z.strictObject({
  ...artworkDraftShape,
  version: z.number().int().min(1),
  published: z.boolean().optional(),
});
