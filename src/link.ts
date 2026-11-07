import { z } from 'zod';

/** A link as the API sends it in a document's `links`. */
export interface WireLink {
  href: string;
  rel: string;
  httpMethod: string;
  /** Set when `href` carries an RFC 6570 placeholder the client expands. */
  templated?: boolean | undefined;
}

/** A link the SDK hands out, typed by the result `follow` returns for it. */
export interface Link<Result = unknown> extends WireLink {
  /** Validates the response body into `Result`; the SDK attaches it to its entry links. */
  parse?: (body: unknown) => Result;
}

/** The wire shape of a link, as the API sends it in a document's `links`. */
export const linkSchema: z.ZodType<WireLink> = z.object({
  href: z.string(),
  rel: z.string(),
  httpMethod: z.string(),
  templated: z.boolean().optional(),
});

/** Expands a templated link's `{placeholders}` into a concrete link. */
export function expand<T>(link: Link<T>, placeholders: Record<string, string>): Link<T> {
  const href = Object.entries(placeholders).reduce(
    (template, [name, value]) => template.replaceAll(`{${name}}`, encodeURIComponent(value)),
    link.href,
  );
  const concrete: Link<T> = { href, rel: link.rel, httpMethod: link.httpMethod };
  if (link.parse) concrete.parse = link.parse;
  return concrete;
}

/** Appends the query parameters to a link, skipping absent ones. */
export function withQuery<T>(link: Link<T>, query: Record<string, string | undefined>): Link<T> {
  const params = new URLSearchParams();
  for (const [name, value] of Object.entries(query)) {
    if (value !== undefined) params.set(name, value);
  }
  const queryString = params.toString();
  if (!queryString) return link;
  const separator = link.href.includes('?') ? '&' : '?';
  return { ...link, href: `${link.href}${separator}${queryString}` };
}
