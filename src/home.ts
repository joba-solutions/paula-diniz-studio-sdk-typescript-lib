import { z } from 'zod';
import { linkSchema, type Link, type WireLink } from './link.js';
import { meSchema, type Me } from './models.js';

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

/** The Studio's entry points, typed by what each returns. Stage 1 ships only the caller's identity. */
export interface StudioHome {
  me: Link<Me>;
}

/** Requires every link the home promises, throwing at sign-in if the server dropped one. */
export function resolveStudioHome(links: Record<string, WireLink>): StudioHome {
  const me = links.me;
  if (!me) throw new Error('home document missing link "me"');
  return { me: { ...me, parse: (body) => meSchema.parse(body) } };
}
