import { expand, withQuery, type Link } from './link.js';

/** Statuses a GET retry can fix: rate-limit and server-side ones, not a bad request. */
const RETRYABLE_STATUSES = new Set([429, 500, 502, 503, 504]);
const MAX_ATTEMPTS = 3;

/** An API failure, carrying its status so callers branch on `status`, not the message, plus the
 * response body and `www-authenticate` reason the edge sent. */
export class ApiError extends Error {
  readonly status: number;
  readonly body: unknown;
  readonly wwwAuthenticate: string | null;

  constructor(status: number, body: unknown, wwwAuthenticate: string | null) {
    super(`HTTP ${status}`);
    this.name = 'ApiError';
    this.status = status;
    this.body = body;
    this.wwwAuthenticate = wwwAuthenticate;
  }
}

export interface FollowOptions {
  /** The values the link's `{placeholders}` expand with. */
  params?: Record<string, string>;
  /** Query parameters appended to the link, absent values skipped. */
  query?: Record<string, string | undefined>;
  /** The JSON request body for methods that take one. */
  body?: unknown;
  /** The `Idempotency-Key` header for a write the server dedupes; sent only when present. */
  idempotencyKey?: string;
  /** Aborts the request; an aborted request never retries. */
  signal?: AbortSignal;
}

export interface Client {
  follow<T>(link: Link<T>, options?: FollowOptions): Promise<T>;
}

export interface ClientOptions {
  base: string;
  getToken: () => Promise<string>;
  /** Turns a failure into a domain error; defaults to the failure itself. */
  errorFor?: (failure: ApiError) => Error;
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isRetryable(error: unknown): boolean {
  return error instanceof ApiError && RETRYABLE_STATUSES.has(error.status);
}

/** Retries a transient failure with exponential backoff and jitter. Idempotent calls only: a
 * mutation that already ran must not run twice. */
async function withRetry<T>(operation: () => Promise<T>): Promise<T> {
  for (let attempt = 0; ; attempt++) {
    try {
      return await operation();
    } catch (error) {
      if (attempt >= MAX_ATTEMPTS - 1 || !isRetryable(error)) throw error;
      await delay(400 * 2 ** attempt + Math.random() * 200);
    }
  }
}

/** Builds a client for one API surface. `base` is a constructor arg; links carry only paths. */
export function createClient({ base, getToken, errorFor }: ClientOptions): Client {
  async function request<T>(link: Link<T>, options: FollowOptions): Promise<T> {
    const concrete = withQuery(expand(link, options.params ?? {}), options.query ?? {});
    const headers = new Headers();
    headers.set('Authorization', `Bearer ${await getToken()}`);
    if (options.idempotencyKey !== undefined)
      headers.set('Idempotency-Key', options.idempotencyKey);
    if (options.body !== undefined) headers.set('Content-Type', 'application/json');
    const init: RequestInit = { method: link.httpMethod, headers };
    if (options.body !== undefined) init.body = JSON.stringify(options.body);
    if (options.signal !== undefined) init.signal = options.signal;
    const response = await fetch(`${base}${concrete.href}`, init);
    if (!response.ok) {
      const body: unknown = await response.json().catch(() => null);
      throw new ApiError(response.status, body, response.headers.get('www-authenticate'));
    }
    if (response.status === 204) return undefined as T;
    const body: unknown = await response.json();
    return link.parse ? link.parse(body) : (body as T);
  }

  async function translateFailure<T>(operation: () => Promise<T>): Promise<T> {
    try {
      return await operation();
    } catch (error) {
      if (!(error instanceof ApiError) || !errorFor) throw error;
      throw errorFor(error);
    }
  }

  return {
    follow: <T>(link: Link<T>, options: FollowOptions = {}) =>
      translateFailure(() =>
        link.httpMethod === 'GET'
          ? withRetry(() => request(link, options))
          : request(link, options),
      ),
  };
}
