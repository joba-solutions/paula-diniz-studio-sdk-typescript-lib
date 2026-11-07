import { describe, expect, it } from 'vitest';
import { expand, withQuery } from '../src/link.js';

const link = { href: '/artworks/{id}', rel: 'artwork', httpMethod: 'GET', templated: true };

describe('expand', () => {
  it('replaces every placeholder with its URL-encoded value', () => {
    expect(expand(link, { id: '01H/XYZ' }).href).toBe('/artworks/01H%2FXYZ');
  });

  it('replaces every occurrence of a repeated placeholder', () => {
    const repeated = {
      href: '/artworks/{id}/versions/{id}',
      rel: 'artwork-version',
      httpMethod: 'GET',
      templated: true,
    };

    expect(expand(repeated, { id: '01H' }).href).toBe('/artworks/01H/versions/01H');
  });
});

describe('withQuery', () => {
  it('appends present parameters and skips absent ones', () => {
    expect(withQuery(link, { published: 'true', cursor: undefined }).href).toBe(
      '/artworks/{id}?published=true',
    );
  });

  it('returns the link unchanged when no parameter is present', () => {
    const resolved = withQuery({ href: '/artworks', rel: 'artworks', httpMethod: 'GET' }, {});

    expect(resolved.href).toBe('/artworks');
  });
});
