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
