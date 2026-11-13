
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  
  "graphql_public": {
          Tables: {
            [_ in never]: never
          }
          Views: {
            [_ in never]: never
          }
          Functions: {
            "graphql":
{ Args: { "extensions"?: Json,"operationName"?: string,"query"?: string,"variables"?: Json }; Returns: Json
                           }
          }
          Enums: {
            [_ in never]: never
          }
          CompositeTypes: {
            [_ in never]: never
          }
        },"public": {
          Tables: {
            "annotations": {
                  Row: {
                    "created_at": string,"created_by": string | null,"data": NonNullable<Json>,"galaxy_id": string,"id": string,"kind": string,"rotation": number,"sphere_id": string,"updated_at": string,"x": number,"y": number
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"created_by"?: string | null,"data"?: NonNullable<Json>,"galaxy_id": string,"id"?: string,"kind": string,"rotation"?: number,"sphere_id": string,"updated_at"?: string,"x"?: number,"y"?: number
                  }
                  Update: {
                    "created_at"?: string,"created_by"?: string | null,"data"?: NonNullable<Json>,"galaxy_id"?: string,"id"?: string,"kind"?: string,"rotation"?: number,"sphere_id"?: string,"updated_at"?: string,"x"?: number,"y"?: number
                  }
                  Relationships: [
                    {
      foreignKeyName: "annotations_created_by_fkey"
      columns: ["created_by"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "annotations_galaxy_id_fkey"
      columns: ["galaxy_id"]
isOneToOne: false
      referencedRelation: "galaxies"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "annotations_sphere_id_fkey"
      columns: ["sphere_id"]
isOneToOne: false
      referencedRelation: "sphere_stats"
      referencedColumns: ["sphere_id"]
    },{
      foreignKeyName: "annotations_sphere_id_fkey"
      columns: ["sphere_id"]
isOneToOne: false
      referencedRelation: "spheres"
      referencedColumns: ["id"]
    }
                  ]
                },"galaxies": {
                  Row: {
                    "created_at": string,"id": string,"is_personal": boolean,"name": string,"owner_id": string,"setup_answers": Json | null,"setup_completed_at": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"id"?: string,"is_personal"?: boolean,"name": string,"owner_id"?: string,"setup_answers"?: Json | null,"setup_completed_at"?: string | null
                  }
                  Update: {
                    "created_at"?: string,"id"?: string,"is_personal"?: boolean,"name"?: string,"owner_id"?: string,"setup_answers"?: Json | null,"setup_completed_at"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "galaxies_owner_id_fkey"
      columns: ["owner_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"galaxy_members": {
                  Row: {
                    "galaxy_id": string,"joined_at": string,"last_seen_at": string | null,"role": string,"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "galaxy_id": string,"joined_at"?: string,"last_seen_at"?: string | null,"role"?: string,"user_id": string
                  }
                  Update: {
                    "galaxy_id"?: string,"joined_at"?: string,"last_seen_at"?: string | null,"role"?: string,"user_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "galaxy_members_galaxy_id_fkey"
      columns: ["galaxy_id"]
isOneToOne: false
      referencedRelation: "galaxies"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "galaxy_members_user_id_fkey"
      columns: ["user_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"invites": {
                  Row: {
                    "created_at": string,"created_by": string | null,"expires_at": string,"galaxy_id": string,"id": string,"role": string,"token": string,"used_at": string | null,"used_by": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"created_by"?: string | null,"expires_at"?: string,"galaxy_id": string,"id"?: string,"role"?: string,"token"?: string,"used_at"?: string | null,"used_by"?: string | null
                  }
                  Update: {
                    "created_at"?: string,"created_by"?: string | null,"expires_at"?: string,"galaxy_id"?: string,"id"?: string,"role"?: string,"token"?: string,"used_at"?: string | null,"used_by"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "invites_created_by_fkey"
      columns: ["created_by"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "invites_galaxy_id_fkey"
      columns: ["galaxy_id"]
isOneToOne: false
      referencedRelation: "galaxies"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "invites_used_by_fkey"
      columns: ["used_by"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"item_links": {
                  Row: {
                    "created_at": string,"created_by": string | null,"id": string,"source_id": string,"target_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"created_by"?: string | null,"id"?: string,"source_id": string,"target_id": string
                  }
                  Update: {
                    "created_at"?: string,"created_by"?: string | null,"id"?: string,"source_id"?: string,"target_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "item_links_created_by_fkey"
      columns: ["created_by"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "item_links_source_id_fkey"
      columns: ["source_id"]
isOneToOne: false
      referencedRelation: "items"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "item_links_source_id_fkey"
      columns: ["source_id"]
isOneToOne: false
      referencedRelation: "items_feed"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "item_links_target_id_fkey"
      columns: ["target_id"]
isOneToOne: false
      referencedRelation: "items"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "item_links_target_id_fkey"
      columns: ["target_id"]
isOneToOne: false
      referencedRelation: "items_feed"
      referencedColumns: ["id"]
    }
                  ]
                },"item_views": {
                  Row: {
                    "item_id": string,"seen_at": string,"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "item_id": string,"seen_at"?: string,"user_id"?: string
                  }
                  Update: {
                    "item_id"?: string,"seen_at"?: string,"user_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "item_views_item_id_fkey"
      columns: ["item_id"]
isOneToOne: false
      referencedRelation: "items"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "item_views_item_id_fkey"
      columns: ["item_id"]
isOneToOne: false
      referencedRelation: "items_feed"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "item_views_user_id_fkey"
      columns: ["user_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"items": {
                  Row: {
                    "body_md": string | null,"caption": string | null,"created_at": string,"created_by": string | null,"galaxy_id": string,"id": string,"image_path": string | null,"is_private": boolean,"preview": Json | null,"sphere_id": string,"title": string | null,"type": string,"updated_at": string,"updated_by": string | null,"url": string | null,"x": number,"y": number
                  }
                  ComputedFields: never
                  Insert: {
                    "body_md"?: string | null,"caption"?: string | null,"created_at"?: string,"created_by"?: string | null,"galaxy_id": string,"id"?: string,"image_path"?: string | null,"is_private"?: boolean,"preview"?: Json | null,"sphere_id": string,"title"?: string | null,"type": string,"updated_at"?: string,"updated_by"?: string | null,"url"?: string | null,"x"?: number,"y"?: number
                  }
                  Update: {
                    "body_md"?: string | null,"caption"?: string | null,"created_at"?: string,"created_by"?: string | null,"galaxy_id"?: string,"id"?: string,"image_path"?: string | null,"is_private"?: boolean,"preview"?: Json | null,"sphere_id"?: string,"title"?: string | null,"type"?: string,"updated_at"?: string,"updated_by"?: string | null,"url"?: string | null,"x"?: number,"y"?: number
                  }
                  Relationships: [
                    {
      foreignKeyName: "items_created_by_fkey"
      columns: ["created_by"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "items_galaxy_id_fkey"
      columns: ["galaxy_id"]
isOneToOne: false
      referencedRelation: "galaxies"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "items_sphere_id_fkey"
      columns: ["sphere_id"]
isOneToOne: false
      referencedRelation: "sphere_stats"
      referencedColumns: ["sphere_id"]
    },{
      foreignKeyName: "items_sphere_id_fkey"
      columns: ["sphere_id"]
isOneToOne: false
      referencedRelation: "spheres"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "items_updated_by_fkey"
      columns: ["updated_by"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"profiles": {
                  Row: {
                    "avatar_path": string | null,"color": string,"created_at": string,"display_name": string,"id": string,"tutorial_completed_at": string | null,"username": string
                  }
                  ComputedFields: never
                  Insert: {
                    "avatar_path"?: string | null,"color"?: string,"created_at"?: string,"display_name": string,"id": string,"tutorial_completed_at"?: string | null,"username": string
                  }
                  Update: {
                    "avatar_path"?: string | null,"color"?: string,"created_at"?: string,"display_name"?: string,"id"?: string,"tutorial_completed_at"?: string | null,"username"?: string
                  }
                  Relationships: [
                    
                  ]
                },"spheres": {
                  Row: {
                    "color": string,"created_at": string,"created_by": string | null,"emoji": string,"galaxy_id": string,"id": string,"is_inbox": boolean,"is_private": boolean,"name": string,"parent_id": string | null,"updated_at": string,"x": number,"y": number
                  }
                  ComputedFields: never
                  Insert: {
                    "color"?: string,"created_at"?: string,"created_by"?: string | null,"emoji"?: string,"galaxy_id": string,"id"?: string,"is_inbox"?: boolean,"is_private"?: boolean,"name": string,"parent_id"?: string | null,"updated_at"?: string,"x"?: number,"y"?: number
                  }
                  Update: {
                    "color"?: string,"created_at"?: string,"created_by"?: string | null,"emoji"?: string,"galaxy_id"?: string,"id"?: string,"is_inbox"?: boolean,"is_private"?: boolean,"name"?: string,"parent_id"?: string | null,"updated_at"?: string,"x"?: number,"y"?: number
                  }
                  Relationships: [
                    {
      foreignKeyName: "spheres_created_by_fkey"
      columns: ["created_by"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "spheres_galaxy_id_fkey"
      columns: ["galaxy_id"]
isOneToOne: false
      referencedRelation: "galaxies"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "spheres_parent_id_fkey"
      columns: ["parent_id"]
isOneToOne: false
      referencedRelation: "sphere_stats"
      referencedColumns: ["sphere_id"]
    },{
      foreignKeyName: "spheres_parent_id_fkey"
      columns: ["parent_id"]
isOneToOne: false
      referencedRelation: "spheres"
      referencedColumns: ["id"]
    }
                  ]
                }
          }
          Views: {
            "items_feed": {
                  Row: {
                    "body_md": string | null,"caption": string | null,"created_at": string,"created_by": string | null,"galaxy_id": string,"id": string,"image_path": string | null,"is_new": boolean | null,"is_private": boolean,"preview": Json | null,"since_last_visit": boolean | null,"sphere_id": string,"title": string | null,"type": string,"updated_at": string,"updated_by": string | null,"url": string | null,"x": number,"y": number
                  }
                  ComputedFields: never
                  Relationships: [
                    {
      foreignKeyName: "items_created_by_fkey"
      columns: ["created_by"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "items_galaxy_id_fkey"
      columns: ["galaxy_id"]
isOneToOne: false
      referencedRelation: "galaxies"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "items_sphere_id_fkey"
      columns: ["sphere_id"]
isOneToOne: false
      referencedRelation: "sphere_stats"
      referencedColumns: ["sphere_id"]
    },{
      foreignKeyName: "items_sphere_id_fkey"
      columns: ["sphere_id"]
isOneToOne: false
      referencedRelation: "spheres"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "items_updated_by_fkey"
      columns: ["updated_by"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"sphere_stats": {
                  Row: {
                    "galaxy_id": string,"item_count": number | null,"new_count": number | null,"sphere_id": string
                  }
                  ComputedFields: never
                  Relationships: [
                    {
      foreignKeyName: "spheres_galaxy_id_fkey"
      columns: ["galaxy_id"]
isOneToOne: false
      referencedRelation: "galaxies"
      referencedColumns: ["id"]
    }
                  ]
                }
          }
          Functions: {
            "accept_invite":
{ Args: { "_token": string }; Returns: string
                           },
"complete_galaxy_setup":
{ Args: { "_answers": Json,"_galaxy_id": string,"_spheres": Json }; Returns: {
              "color": string,
"created_at": string,
"created_by": string | null,
"emoji": string,
"galaxy_id": string,
"id": string,
"is_inbox": boolean,
"is_private": boolean,
"name": string,
"parent_id": string | null,
"updated_at": string,
"x": number,
"y": number
            }[]
                          SetofOptions: {
        from: "*"
        to: "spheres"
        isOneToOne: false
        isSetofReturn: true
      } },
"complete_tutorial":
{ Args: Record<PropertyKey, never>; Returns: string
                           },
"delete_sphere":
{ Args: { "_move_to"?: string,"_sphere_id": string }; Returns: undefined
                           },
"invite_preview":
{ Args: { "_token": string }; Returns: {
              "galaxy_name": string,"inviter_name": string,"role": string,"status": string
            }[]
                           },
"mark_seen":
{ Args: { "_item_ids": (string)[] }; Returns: undefined
                           },
"mark_sphere_seen":
{ Args: { "_sphere_id": string }; Returns: undefined
                           },
"redeem_invite":
{ Args: { "_token": string,"_user_id": string }; Returns: string
                           },
"search_items":
{ Args: { "_galaxy_id"?: string,"_limit"?: number,"_q": string }; Returns: {
              "body_md": string | null,
"caption": string | null,
"created_at": string,
"created_by": string | null,
"galaxy_id": string,
"id": string,
"image_path": string | null,
"is_new": boolean | null,
"is_private": boolean,
"preview": Json | null,
"since_last_visit": boolean | null,
"sphere_id": string,
"title": string | null,
"type": string,
"updated_at": string,
"updated_by": string | null,
"url": string | null,
"x": number,
"y": number
            }[]
                          SetofOptions: {
        from: "*"
        to: "items_feed"
        isOneToOne: false
        isSetofReturn: true
      } },
"set_member_role":
{ Args: { "_galaxy_id": string,"_role": string,"_user_id": string }; Returns: undefined
                           },
"touch_last_seen":
{ Args: Record<PropertyKey, never>; Returns: undefined
                           }
          }
          Enums: {
            [_ in never]: never
          }
          CompositeTypes: {
            [_ in never]: never
          }
        }
}

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
  ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
      Row: infer R
    }
    ? R
    : never
  : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
  ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
      Insert: infer I
    }
    ? I
    : never
  : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
  ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
      Update: infer U
    }
    ? U
    : never
  : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
  ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
  : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never
> = PublicCompositeTypeNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
  ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
  : never

export const Constants = {
  "graphql_public": {
          Enums: {
            
          }
        },"public": {
          Enums: {
            
          }
        }
} as const
