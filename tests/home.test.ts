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
    expect(home.artworks).toMatchObject({
      href: '/artworks',
      rel: 'artworks',
      httpMethod: 'GET',
    });
    expect(home.artwork).toMatchObject({
      href: '/artworks/{id}',
      rel: 'artwork',
      httpMethod: 'GET',
      templated: true,
    });
    expect(home.createArtwork).toMatchObject({
      href: '/artworks',
      rel: 'create-artwork',
      httpMethod: 'POST',
    });
  });

  it('advertises the five entry links in order', () => {
    expect(Object.keys(studioHomeDocument.links)).toEqual([
      'me',
      'categories',
      'artworks',
      'artwork',
      'create-artwork',
    ]);
  });

  it('throws when the server drops the me link', () => {
    expect(() => resolveStudioHome({})).toThrow('home document missing link "me"');
  });

  it('throws when the server drops the categories link', () => {
    const links = { me: studioHomeDocument.links.me };

    expect(() => resolveStudioHome(links)).toThrow('home document missing link "categories"');
  });

  it('throws when the server drops the artworks link', () => {
    const links = {
      me: studioHomeDocument.links.me,
      categories: studioHomeDocument.links.categories,
    };

    expect(() => resolveStudioHome(links)).toThrow('home document missing link "artworks"');
  });

  it('throws when the server drops the artwork link', () => {
    const links = {
      me: studioHomeDocument.links.me,
      categories: studioHomeDocument.links.categories,
      artworks: studioHomeDocument.links.artworks,
    };

    expect(() => resolveStudioHome(links)).toThrow('home document missing link "artwork"');
  });

  it('throws when the server drops the create-artwork link', () => {
    const links = {
      me: studioHomeDocument.links.me,
      categories: studioHomeDocument.links.categories,
      artworks: studioHomeDocument.links.artworks,
      artwork: studioHomeDocument.links.artwork,
    };

    expect(() => resolveStudioHome(links)).toThrow('home document missing link "create-artwork"');
  });
});

describe('studioHome', () => {
  it('is the one path a client may know', () => {
    expect(studioHome).toMatchObject({ href: '/', rel: 'home', httpMethod: 'GET' });
  });
});
