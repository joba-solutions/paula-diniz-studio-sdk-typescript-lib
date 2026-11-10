# @joba/paula-diniz-studio-sdk

HATEOAS client and models for the Paula Diniz Studio API.

## Install

```bash
aws codeartifact login --tool npm --domain joba --domain-owner <ACCOUNT_ID> --repository internal --namespace @joba
npm install @joba/paula-diniz-studio-sdk
```

## Use

```ts
import { createClient, resolveStudioHome, studioHome } from '@joba/paula-diniz-studio-sdk';

const client = createClient({ base: 'https://api.example.com', getToken: async () => token });
const document = await client.follow(studioHome);
const home = resolveStudioHome(document.links);
const me = await client.follow(home.me);
const categories = await client.follow(home.categories);
const artworks = await client.follow(home.artworks, { query: { published: 'true' } });
```

The SDK parses the home document, the `/me` response, the `/categories` collection and the
artwork documents with Zod. `resolveStudioHome` throws `home document missing link "<rel>"` when
the server drops one of `me`, `categories`, `artworks`, `artwork`, `create-artwork`.

## Categories

`GET /categories` returns the Studio's fixed category list. Each category carries an `id` and a
localized `slug` and `name`:

```ts
import type { Category } from '@joba/paula-diniz-studio-sdk';

const category: Category = {
  id: 'animals',
  slug: { ptBR: 'animais', en: 'animals' },
  name: { ptBR: 'Animais', en: 'Animals' },
};
```

The list is not paginated and carries no per-item links. Its only link is `links.self`.

## Artworks

The home advertises `artworks` (`GET /artworks`), `artwork` (`GET /artworks/{id}`, templated) and
`create-artwork` (`POST /artworks`). A work carries its images, metadata, tags, actor and links:

```ts
import type { Artwork } from '@joba/paula-diniz-studio-sdk';

const artwork: Artwork = {
  id: '01JX8Z5K4M6Q2R7T9V1W3Y5A7B',
  version: 3,
  published: true,
  slug: { ptBR: 'guardiao-da-floresta', en: 'forest-guardian' },
  title: { ptBR: 'Guardião da Floresta', en: 'Forest Guardian' },
  year: 2024,
  medium: { ptBR: 'óleo sobre tela', en: 'oil on canvas' },
  dimensions: { widthCm: 120, heightCm: 90 },
  categoryId: 'animals',
  description: { ptBR: 'Uma onça observa a mata.', en: 'A jaguar watches the forest.' },
  images: [
    {
      mediaId: '01JX8Z5K4M6Q2R7T9V1W3Y5A7D',
      role: 'main',
      sortOrder: 0,
      altText: { ptBR: 'Pintura de uma onça.', en: 'Painting of a jaguar.' },
    },
  ],
  sortOrder: 10,
  tags: { availability: 'available', priority: 'high' },
  createdAt: '2026-11-01T09:00:00Z',
  updatedAt: '2026-11-09T12:00:00Z',
  createdBy: { subject: 'user_1', kind: 'artist' },
  updatedBy: { subject: 'user_1', kind: 'artist' },
  links: {
    self: { href: '/artworks/01JX8Z5K4M6Q2R7T9V1W3Y5A7B', rel: 'self', httpMethod: 'GET' },
    update: { href: '/artworks/01JX8Z5K4M6Q2R7T9V1W3Y5A7B', rel: 'update', httpMethod: 'PATCH' },
  },
};
```

A collection is `{ artworks, nextCursor?, links: { self, next? } }`; the cursor and the `next`
link are omitted on the last page. Follow the templated link with the work id:

```ts
const artwork = await client.follow(home.artwork, { params: { id } });
```

`POST /artworks` creates a draft: every field is optional and the server owns the id, version,
timestamp, actor and `published`. Send an `Idempotency-Key` so a retry replays the same `201`:

```ts
import type { CreateArtwork } from '@joba/paula-diniz-studio-sdk';

const draft: CreateArtwork = { title: { ptBR: 'Sem título', en: 'Untitled' } };
const created = await client.follow(home.createArtwork, {
  body: draft,
  idempotencyKey: 'create-1',
});
```

`PATCH /artworks/{id}` is a partial merge. `version` is required. An explicit `null` clears only
`slug`, `year`, `dimensions`, `categoryId`, `exhibition` and `note`; a field left absent is not
touched:

```ts
import type { ArtworkPatch } from '@joba/paula-diniz-studio-sdk';

const patch: ArtworkPatch = { version: artwork.version, year: null };
const updated = await client.follow(artwork.links.update, {
  body: patch,
  idempotencyKey: 'update-1',
});
```
