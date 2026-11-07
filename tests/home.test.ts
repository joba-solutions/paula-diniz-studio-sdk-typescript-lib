import { describe, expect, it } from 'vitest';
import studioHomeDocument from './fixtures/home.json' with { type: 'json' };
import { resolveStudioHome, studioHome } from '../src/home.js';

describe('resolveStudioHome', () => {
  it('resolves the shipped home fixture to the typed entry points', () => {
    const home = resolveStudioHome(studioHomeDocument.links);

    expect(home.me).toMatchObject({ href: '/me', rel: 'me', httpMethod: 'GET' });
  });

  it('advertises only the me link', () => {
    expect(Object.keys(studioHomeDocument.links)).toEqual(['me']);
  });

  it('throws when the server drops the me link', () => {
    expect(() => resolveStudioHome({})).toThrow('home document missing link "me"');
  });
});

describe('studioHome', () => {
  it('is the one path a client may know', () => {
    expect(studioHome).toMatchObject({ href: '/', rel: 'home', httpMethod: 'GET' });
  });
});
