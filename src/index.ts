export {
  ApiError,
  createClient,
  type Client,
  type ClientOptions,
  type FollowOptions,
} from './client.js';
export { expand, withQuery, type Link, type WireLink } from './link.js';
export { resolveStudioHome, studioHome, type StudioHome, type StudioHomeDocument } from './home.js';
export {
  type Actor,
  type ActorKind,
  type Artwork,
  type ArtworkCollection,
  type ArtworkImage,
  type ArtworkPatch,
  type Category,
  type CategoryCollection,
  type CreateArtwork,
  type Dimensions,
  type Exhibition,
  type ImageRole,
  type LocalizedText,
  type Me,
} from './models.js';
