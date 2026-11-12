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

type FeedRow = Views['items_feed']['Row'];
/** A row of the `items_feed` view, with the boolean flags made non-null. */
export type Item = Omit<FeedRow, 'is_new' | 'since_last_visit' | 'type' | 'preview'> & {
  type: ItemType;
  is_new: boolean;
  since_last_visit: boolean;
  preview: LinkPreview | null;
};

export interface LinkPreview {
  title?: string | null;
  image?: string | null;
  domain?: string | null;
  favicon?: string | null;
  description?: string | null;
}

/** Membership role (RW3.1). */
export type Role = 'owner' | 'editor' | 'viewer';
export type InviteRole = Exclude<Role, 'owner'>;

export interface Member {
  user_id: string;
  role: Role;
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
