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
```

The SDK parses the home document, the `/me` response and the `/categories` collection with Zod.
`resolveStudioHome` throws `home document missing link "me"` or
`home document missing link "categories"` when the server drops a link.

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
