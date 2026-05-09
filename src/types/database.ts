export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

// ─── Row Types ────────────────────────────────────────────────────────────────

export interface Profile {
  id: string
  full_name: string | null
  username: string | null
  phone_number: string | null
  avatar_url: string | null
  notification_email: string | null
  role: 'admin' | 'collecter' | 'viewer' | null
  collect_method: 'machines' | 'total' | null
  track_denominations: boolean
  collection_cycle: 'weekly' | 'monthly' | null
  updated_at: string | null
  created_at: string
}

export interface ProfileInsert {
  id: string
  full_name?: string | null
  username?: string | null
  phone_number?: string | null
  avatar_url?: string | null
  notification_email?: string | null
  role?: 'admin' | 'collecter' | 'viewer' | null
  collect_method?: 'machines' | 'total' | null
  track_denominations?: boolean
  collection_cycle?: 'weekly' | 'monthly' | null
  updated_at?: string | null
  created_at?: string
}

export interface ProfileUpdate {
  id?: string
  full_name?: string | null
  username?: string | null
  phone_number?: string | null
  avatar_url?: string | null
  notification_email?: string | null
  role?: 'admin' | 'collecter' | 'viewer' | null
  collect_method?: 'machines' | 'total' | null
  track_denominations?: boolean
  collection_cycle?: 'weekly' | 'monthly' | null
  updated_at?: string | null
  created_at?: string
}

export interface Organization {
  id: string
  name: string
  owner_id: string
  created_at: string
}

export interface OrganizationInsert {
  id?: string
  name: string
  owner_id: string
  created_at?: string
}

export interface OrganizationUpdate {
  id?: string
  name?: string
  owner_id?: string
  created_at?: string
}

export interface OrganizationMember {
  id: string
  org_id: string
  user_id: string
  role: 'admin' | 'collecter' | 'viewer'
  joined_at: string
}

export interface OrganizationMemberInsert {
  id?: string
  org_id: string
  user_id: string
  role: 'admin' | 'collecter' | 'viewer'
  joined_at?: string
}

export interface OrganizationMemberUpdate {
  id?: string
  org_id?: string
  user_id?: string
  role?: 'admin' | 'collecter' | 'viewer'
  joined_at?: string
}

export interface OrganizationInvitation {
  id: string
  org_id: string
  email: string
  invite_token: string
  role: 'admin' | 'collecter' | 'viewer'
  inviter_id: string
  expires_at: string
  accepted_at: string | null
  created_at: string
}

export interface OrganizationInvitationInsert {
  id?: string
  org_id: string
  email: string
  invite_token: string
  role: 'admin' | 'collecter' | 'viewer'
  inviter_id: string
  expires_at: string
  accepted_at?: string | null
  created_at?: string
}

export interface OrganizationInvitationUpdate {
  id?: string
  org_id?: string
  email?: string
  invite_token?: string
  role?: 'admin' | 'collecter' | 'viewer'
  inviter_id?: string
  expires_at?: string
  accepted_at?: string | null
  created_at?: string
}

export interface LaundryStore {
  id: string
  organization_id: string
  owner_id: string
  name: string
  location: string | null
  description: string | null
  images: Json | null
  created_at: string
}

export interface LaundryStoreInsert {
  id?: string
  organization_id: string
  owner_id: string
  name: string
  location?: string | null
  description?: string | null
  images?: Json | null
  created_at?: string
}

export interface LaundryStoreUpdate {
  id?: string
  organization_id?: string
  owner_id?: string
  name?: string
  location?: string | null
  description?: string | null
  images?: Json | null
  created_at?: string
}

export interface Machine {
  id: string
  laundry_id: string
  name: string
  unit_count: number
  is_broken: boolean
  comment: string | null
  sort_order: number | null
  updated_by: string | null
  updated_at: string | null
  created_at: string
}

export interface MachineInsert {
  id?: string
  laundry_id: string
  name: string
  unit_count: number
  is_broken?: boolean
  comment?: string | null
  sort_order?: number | null
  updated_by?: string | null
  updated_at?: string | null
  created_at?: string
}

export interface MachineUpdate {
  id?: string
  laundry_id?: string
  name?: string
  unit_count?: number
  is_broken?: boolean
  comment?: string | null
  sort_order?: number | null
  updated_by?: string | null
  updated_at?: string | null
  created_at?: string
}

export interface InventoryType {
  id: string
  org_id: string
  name: string
  unit: string | null
  alert_threshold: number | null
  sort_order: number | null
  created_at: string
}

export interface InventoryTypeInsert {
  id?: string
  org_id: string
  name: string
  unit?: string | null
  alert_threshold?: number | null
  sort_order?: number | null
  created_at?: string
}

export interface InventoryTypeUpdate {
  id?: string
  org_id?: string
  name?: string
  unit?: string | null
  alert_threshold?: number | null
  sort_order?: number | null
  created_at?: string
}

export interface LaundryInventory {
  id: string
  laundry_id: string
  inventory_type_id: string
  quantity: number
  updated_by: string | null
  updated_at: string | null
}

export interface LaundryInventoryInsert {
  id?: string
  laundry_id: string
  inventory_type_id: string
  quantity: number
  updated_by?: string | null
  updated_at?: string | null
}

export interface LaundryInventoryUpdate {
  id?: string
  laundry_id?: string
  inventory_type_id?: string
  quantity?: number
  updated_by?: string | null
  updated_at?: string | null
}

export interface CollectFunds {
  id: string
  laundry_id: string
  collected_at: string
  total_funds: number
  funds_array: Json | null
  collector_id: string
  created_at: string
}

export interface CollectFundsInsert {
  id?: string
  laundry_id: string
  collected_at: string
  total_funds: number
  funds_array?: Json | null
  collector_id: string
  created_at?: string
}

export interface CollectFundsUpdate {
  id?: string
  laundry_id?: string
  collected_at?: string
  total_funds?: number
  funds_array?: Json | null
  collector_id?: string
  created_at?: string
}

export interface ActionMessage {
  id: number
  org_id: string
  actor_id: string
  message: string
  occurred_at: string
}

export interface ActionMessageInsert {
  id?: number
  org_id: string
  actor_id: string
  message: string
  occurred_at?: string
}

export interface ActionMessageUpdate {
  id?: number
  org_id?: string
  actor_id?: string
  message?: string
  occurred_at?: string
}

// ─── Database Type ────────────────────────────────────────────────────────────

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: Profile
        Insert: ProfileInsert
        Update: ProfileUpdate
      }
      organizations: {
        Row: Organization
        Insert: OrganizationInsert
        Update: OrganizationUpdate
      }
      organization_members: {
        Row: OrganizationMember
        Insert: OrganizationMemberInsert
        Update: OrganizationMemberUpdate
      }
      organization_invitations: {
        Row: OrganizationInvitation
        Insert: OrganizationInvitationInsert
        Update: OrganizationInvitationUpdate
      }
      laundry_store: {
        Row: LaundryStore
        Insert: LaundryStoreInsert
        Update: LaundryStoreUpdate
      }
      machines: {
        Row: Machine
        Insert: MachineInsert
        Update: MachineUpdate
      }
      inventory_types: {
        Row: InventoryType
        Insert: InventoryTypeInsert
        Update: InventoryTypeUpdate
      }
      laundry_inventory: {
        Row: LaundryInventory
        Insert: LaundryInventoryInsert
        Update: LaundryInventoryUpdate
      }
      collect_funds: {
        Row: CollectFunds
        Insert: CollectFundsInsert
        Update: CollectFundsUpdate
      }
      action_message: {
        Row: ActionMessage
        Insert: ActionMessageInsert
        Update: ActionMessageUpdate
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
  }
}

// ─── Convenience Types ────────────────────────────────────────────────────────

export type FundsItem = {
  machine_id: string
  name: string
  amount: number
  denominations?: {
    '10': number
    '50': number
    '100': number
    '500': number
    '1000': number
  }
}
