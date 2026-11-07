import { z } from 'zod';
import { linkSchema, type Link } from './link.js';

/** The two allow-listed subjects: the artist's Clerk user and the CLI's machine identity. */
export const actorKindSchema = z.enum(['artist', 'machine']);
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
