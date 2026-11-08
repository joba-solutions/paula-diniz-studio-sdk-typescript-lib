import { afterEach, describe, expect, it, vi } from 'vitest';
import { ZodError } from 'zod';
import {
  ApiError,
  createClient,
  resolveStudioHome,
  studioHome,
  type ClientOptions,
} from '../src/index.js';
import studioHomeDocument from './fixtures/home.json' with { type: 'json' };

afterEach(() => {
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

function jsonResponse(body: unknown, status = 200, headers: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', ...headers },
  });
}

function client(overrides: Partial<ClientOptions> = {}) {
  return createClient({
    base: 'https://api.studio.example.com',
    getToken: async () => 'access-token',
    ...overrides,
  });
}

describe('follow', () => {
  it('sets the bearer header, expands the placeholders and appends the query', async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({ subject: 'user_1' }));
    vi.stubGlobal('fetch', fetchMock);

    const result = await client().follow(
      { href: '/artworks/{id}', rel: 'artwork', httpMethod: 'GET', templated: true },
      { params: { id: '01H' }, query: { view: 'full' } },
    );

    expect(result).toEqual({ subject: 'user_1' });
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe('https://api.studio.example.com/artworks/01H?view=full');
    expect((init.headers as Headers).get('Authorization')).toBe('Bearer access-token');
  });

  it('parses the home document and the me response through their links', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse(studioHomeDocument))
      .mockResolvedValueOnce(
        jsonResponse({
          subject: 'user_1',
          kind: 'artist',
          links: { self: { href: '/me', rel: 'self', httpMethod: 'GET' } },
        }),
      );
    vi.stubGlobal('fetch', fetchMock);

    const document = await client().follow(studioHome);
    const home = resolveStudioHome(document.links);
    const me = await client().follow(home.me);

    expect(me).toMatchObject({ subject: 'user_1', kind: 'artist' });
  });

  it('rejects a home document that does not match the contract', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(jsonResponse({ links: { me: 'not-a-link' } })),
    );

    await expect(client().follow(studioHome)).rejects.toBeInstanceOf(ZodError);
  });

  it('rejects a me response that does not match the contract', async () => {
    const me = resolveStudioHome(studioHomeDocument.links).me;
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(jsonResponse({ subject: 'user_1', kind: 'robot', links: {} })),
    );

    await expect(client().follow(me)).rejects.toBeInstanceOf(ZodError);
  });

  it('throws an ApiError carrying the status, body and www-authenticate reason', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      jsonResponse({ message: 'Unauthorized' }, 401, {
        'WWW-Authenticate': 'Bearer error="invalid_token"',
      }),
    );
    vi.stubGlobal('fetch', fetchMock);

    const failure = await client()
      .follow({ href: '/me', rel: 'me', httpMethod: 'GET' })
      .catch((error: unknown) => error);

    expect(failure).toBeInstanceOf(ApiError);
    expect(failure).toMatchObject({
      status: 401,
      body: { message: 'Unauthorized' },
      wwwAuthenticate: 'Bearer error="invalid_token"',
    });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('throws the errorFor result after a non-retryable failure', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        jsonResponse({ message: 'Subject is not permitted.' }, 403, {
          'WWW-Authenticate': 'Bearer',
        }),
      ),
    );
    const mapped = new Error('Subject is not permitted.');
    const errorFor = vi.fn((_failure: ApiError) => mapped);

    const failure = await client({ errorFor })
      .follow({ href: '/me', rel: 'me', httpMethod: 'GET' })
      .catch((error: unknown) => error);

    expect(failure).toBe(mapped);
    expect(errorFor.mock.calls[0]?.[0]).toBeInstanceOf(ApiError);
    expect(errorFor).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 403,
        body: { message: 'Subject is not permitted.' },
        wwwAuthenticate: 'Bearer',
      }),
    );
  });

  it('retries a transient GET failure and returns the eventual success', async () => {
    vi.useFakeTimers();
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(new Response('', { status: 503 }))
      .mockResolvedValueOnce(new Response('', { status: 503 }))
      .mockResolvedValueOnce(jsonResponse({ subject: 'user_1' }));
    vi.stubGlobal('fetch', fetchMock);

    const promise = client().follow({ href: '/me', rel: 'me', httpMethod: 'GET' });
    await vi.advanceTimersByTimeAsync(5000);

    expect(await promise).toEqual({ subject: 'user_1' });
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });

  it('retries before it maps a failure with errorFor', async () => {
    vi.useFakeTimers();
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(new Response('', { status: 429 }))
      .mockResolvedValueOnce(jsonResponse({ subject: 'user_1' }));
    vi.stubGlobal('fetch', fetchMock);
    const errorFor = vi.fn((failure: ApiError) => new Error(failure.message));

    const promise = client({ errorFor }).follow({ href: '/me', rel: 'me', httpMethod: 'GET' });
    await vi.advanceTimersByTimeAsync(5000);

    expect(await promise).toEqual({ subject: 'user_1' });
    expect(errorFor).not.toHaveBeenCalled();
  });

  it('does not retry a mutation', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response('', { status: 503 }));
    vi.stubGlobal('fetch', fetchMock);

    await expect(
      client().follow(
        { href: '/media', rel: 'media', httpMethod: 'POST' },
        { body: { fileHash: 'hash-1' } },
      ),
    ).rejects.toBeInstanceOf(ApiError);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('returns undefined for a 204 response', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(null, { status: 204 })));

    await expect(
      client().follow({ href: '/media', rel: 'media', httpMethod: 'POST' }),
    ).resolves.toBeUndefined();
  });
});
