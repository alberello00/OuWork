import type { Database } from '@/lib/supabase/database.types';

type Tables = Database['public']['Tables'];
type Views = Database['public']['Views'];

export type Profile = Pick<Tables['profiles']['Row'], 'id' | 'username' | 'display_name' | 'color'>;
export type Galaxy = Tables['galaxies']['Row'];
export type Sphere = Tables['spheres']['Row'];
export type ItemLink = Tables['item_links']['Row'];
export type Annotation = Tables['annotations']['Row'];
export type Invite = Tables['invites']['Row'];

export type ItemType = 'note' | 'link' | 'image';

/** A row of the `items_feed` view: view columns are nullable in generated types, so we pin them. */
type FeedRow = Views['items_feed']['Row'];
export type Item = {
  [K in keyof FeedRow]: K extends
    | 'title' | 'body_md' | 'url' | 'preview' | 'image_path' | 'caption' | 'created_by' | 'updated_by'
    ? FeedRow[K]
    : NonNullable<FeedRow[K]>;
} & { type: ItemType };

export interface LinkPreview {
  title?: string | null;
  image?: string | null;
  domain?: string | null;
  favicon?: string | null;
  description?: string | null;
}

export interface Member {
  user_id: string;
  role: 'owner' | 'member';
  joined_at: string;
  last_seen_at: string | null;
  profile: Profile;
}

export interface GalaxyWithMembers extends Galaxy {
  members: Member[];
}

export interface SphereStat {
  sphere_id: string;
  galaxy_id: string;
  item_count: number;
  new_count: number;
}

export type AnnotationKind = 'stroke' | 'arrow' | 'sticker';
export interface StrokeData {
  points: number[][];
  color: string;
  size: number;
}
export interface ArrowData {
  dx: number;
  dy: number;
  color: string;
  size: number;
}
export interface StickerData {
  emoji?: string;
  image_path?: string;
  size?: number;
}
