export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          full_name: string | null;
          subscription_status: string;
          monthly_fixed_costs: Json;
          created_at: string;
        };
        Insert: {
          id: string;
          full_name?: string | null;
          subscription_status?: string;
          monthly_fixed_costs?: Json;
          created_at?: string;
        };
        Update: {
          id?: string;
          full_name?: string | null;
          subscription_status?: string;
          monthly_fixed_costs?: Json;
          created_at?: string;
        };
      };
      properties: {
        Row: {
          id: string;
          owner_id: string;
          name: string;
          zodomus_property_id: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          owner_id: string;
          name: string;
          zodomus_property_id?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          owner_id?: string;
          name?: string;
          zodomus_property_id?: string | null;
          created_at?: string;
        };
      };
      circles_network: {
        Row: {
          id: string;
          host_id: string;
          trusted_peer_id: string;
          status: "pending" | "accepted";
          created_at: string;
        };
        Insert: {
          id?: string;
          host_id: string;
          trusted_peer_id: string;
          status?: "pending" | "accepted";
          created_at?: string;
        };
        Update: {
          id?: string;
          host_id?: string;
          trusted_peer_id?: string;
          status?: "pending" | "accepted";
          created_at?: string;
        };
      };
      inventory_rules: {
        Row: {
          id: string;
          property_id: string;
          item_name: string;
          usage_per_guest: number;
          current_stock: number;
          alert_threshold: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          property_id: string;
          item_name: string;
          usage_per_guest: number;
          current_stock?: number;
          alert_threshold?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          property_id?: string;
          item_name?: string;
          usage_per_guest?: number;
          current_stock?: number;
          alert_threshold?: number;
          created_at?: string;
        };
      };
      expenses: {
        Row: {
          id: string;
          property_id: string;
          amount_kes: number;
          category: string;
          date: string;
          receipt_url: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          property_id: string;
          amount_kes: number;
          category: string;
          date?: string;
          receipt_url?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          property_id?: string;
          amount_kes?: number;
          category?: string;
          date?: string;
          receipt_url?: string | null;
          created_at?: string;
        };
      };
    };
    Views: Record<string, never>;
    Functions: {
      get_user_id_by_email: {
        Args: { user_email: string };
        Returns: string;
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}

export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
export type Property = Database["public"]["Tables"]["properties"]["Row"];
export type CircleNetwork = Database["public"]["Tables"]["circles_network"]["Row"];
export type InventoryRule = Database["public"]["Tables"]["inventory_rules"]["Row"];
export type Expense = Database["public"]["Tables"]["expenses"]["Row"];

export type CircleMember = CircleNetwork & {
  peer: Pick<Profile, "id" | "full_name">;
};

export type AvailabilityProperty = Property & {
  owner_name: string | null;
  is_own: boolean;
  mock_availability: string[];
};
