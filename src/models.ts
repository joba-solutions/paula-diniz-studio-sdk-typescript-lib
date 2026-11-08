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
