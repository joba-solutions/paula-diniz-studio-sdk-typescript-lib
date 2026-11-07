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
```

The SDK parses the home document and the `/me` response with Zod. `resolveStudioHome` throws
`home document missing link "me"` when the server drops the link.
