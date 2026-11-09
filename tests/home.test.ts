import { describe, expect, it } from 'vitest';
import studioHomeDocument from './fixtures/home.json' with { type: 'json' };
import { resolveStudioHome, studioHome } from '../src/home.js';

describe('resolveStudioHome', () => {
  it('resolves the shipped home fixture to the typed entry points', () => {
    const home = resolveStudioHome(studioHomeDocument.links);

    expect(home.me).toMatchObject({ href: '/me', rel: 'me', httpMethod: 'GET' });
    expect(home.categories).toMatchObject({
      href: '/categories',
      rel: 'categories',
      httpMethod: 'GET',
    });
  });

  it('advertises the me and categories links', () => {
    expect(Object.keys(studioHomeDocument.links)).toEqual(['me', 'categories']);
  });

  it('throws when the server drops the me link', () => {
    expect(() => resolveStudioHome({})).toThrow('home document missing link "me"');
  });

  it('throws when the server drops the categories link', () => {
    const links = { me: studioHomeDocument.links.me };

    expect(() => resolveStudioHome(links)).toThrow('home document missing link "categories"');
  });
});

describe('studioHome', () => {
  it('is the one path a client may know', () => {
    expect(studioHome).toMatchObject({ href: '/', rel: 'home', httpMethod: 'GET' });
  });
});
