/**
 * TypeScript types mirroring the `galleries` Supabase table.
 *
 * Table schema (already created in Supabase):
 *   id               uuid        PK, default gen_random_uuid()
 *   user_id          uuid        NOT NULL, FK → auth.users(id) ON DELETE CASCADE
 *   title            text        NOT NULL
 *   client_name      text        nullable
 *   cover_image_url  text        nullable
 *   created_at       timestamptz default now()
 *   is_public        boolean     default false — when true, the /g/[id] route is accessible
 */

/** A gallery row as returned by Supabase. */
export type Gallery = {
  id: string;
  user_id: string;
  title: string;
  client_name: string | null;
  cover_image_url: string | null;
  created_at: string; // ISO 8601 timestamp string from Supabase
  is_public: boolean;
};

/** Shape required to insert a new gallery row. */
export type GalleryInsert = {
  title: string;
  client_name?: string | null;
  user_id: string; // populated from supabase.auth.getUser() on the client
  is_public?: boolean; // defaults to false on the DB side
};
