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
          ical_url: string | null;
          last_synced_at: string | null;
          visible_to_circle: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          owner_id: string;
          name: string;
          zodomus_property_id?: string | null;
          ical_url?: string | null;
          last_synced_at?: string | null;
          visible_to_circle?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          owner_id?: string;
          name?: string;
          zodomus_property_id?: string | null;
          ical_url?: string | null;
          last_synced_at?: string | null;
          visible_to_circle?: boolean;
          created_at?: string;
        };
      };
      bookings: {
        Row: {
          id: string;
          property_id: string;
          start_date: string;
          end_date: string;
          is_manual_block: boolean;
          guest_count: number | null;
          external_uid: string | null;
          guest_name: string | null;
          guest_phone: string | null;
          bedroom_type: string | null;
          amount_kes: number | null;
          payment_method: string | null;
          notes: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          property_id: string;
          start_date: string;
          end_date: string;
          is_manual_block?: boolean;
          guest_count?: number | null;
          external_uid?: string | null;
          guest_name?: string | null;
          guest_phone?: string | null;
          bedroom_type?: string | null;
          amount_kes?: number | null;
          payment_method?: string | null;
          notes?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          property_id?: string;
          start_date?: string;
          end_date?: string;
          is_manual_block?: boolean;
          guest_count?: number | null;
          external_uid?: string | null;
          guest_name?: string | null;
          guest_phone?: string | null;
          bedroom_type?: string | null;
          amount_kes?: number | null;
          payment_method?: string | null;
          notes?: string | null;
          created_at?: string;
        };
      };
      invoices: {
        Row: {
          id: string;
          booking_id: string;
          total_amount: number;
          pdf_url: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          booking_id: string;
          total_amount: number;
          pdf_url?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          booking_id?: string;
          total_amount?: number;
          pdf_url?: string | null;
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
      circles: {
        Row: {
          id: string;
          name: string;
          created_by: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          created_by?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          created_by?: string | null;
          created_at?: string;
        };
      };
      circle_members: {
        Row: {
          id: string;
          circle_id: string;
          profile_id: string;
          joined_at: string;
        };
        Insert: {
          id?: string;
          circle_id: string;
          profile_id: string;
          joined_at?: string;
        };
        Update: {
          id?: string;
          circle_id?: string;
          profile_id?: string;
          joined_at?: string;
        };
      };
      circle_invitations: {
        Row: {
          id: string;
          circle_id: string;
          sender_id: string;
          receiver_id: string;
          status: "pending" | "accepted" | "rejected";
          created_at: string;
        };
        Insert: {
          id?: string;
          circle_id: string;
          sender_id: string;
          receiver_id: string;
          status?: "pending" | "accepted" | "rejected";
          created_at?: string;
        };
        Update: {
          id?: string;
          circle_id?: string;
          sender_id?: string;
          receiver_id?: string;
          status?: "pending" | "accepted" | "rejected";
          created_at?: string;
        };
      };
      inventory: {
        Row: {
          id: string;
          property_id: string;
          name: string;
          category: "perishable" | "usable" | "non_perishable";
          quantity: number;
          alert_threshold: number;
          usage_per_guest: number;
          usable_status: "available" | "laundry" | "damaged" | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          property_id: string;
          name: string;
          category?: "perishable" | "usable" | "non_perishable";
          quantity?: number;
          alert_threshold?: number;
          usage_per_guest?: number;
          usable_status?: "available" | "laundry" | "damaged" | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          property_id?: string;
          name?: string;
          category?: "perishable" | "usable" | "non_perishable";
          quantity?: number;
          alert_threshold?: number;
          usage_per_guest?: number;
          usable_status?: "available" | "laundry" | "damaged" | null;
          created_at?: string;
        };
      };
      operational_tasks: {
        Row: {
          id: string;
          property_id: string;
          booking_id: string | null;
          title: string;
          status: "pending" | "in_progress" | "completed" | "cancelled";
          assigned_to: string | null;
          due_at: string | null;
          completed_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          property_id: string;
          booking_id?: string | null;
          title: string;
          status?: "pending" | "in_progress" | "completed" | "cancelled";
          assigned_to?: string | null;
          due_at?: string | null;
          completed_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          property_id?: string;
          booking_id?: string | null;
          title?: string;
          status?: "pending" | "in_progress" | "completed" | "cancelled";
          assigned_to?: string | null;
          due_at?: string | null;
          completed_at?: string | null;
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
export type Booking = Database["public"]["Tables"]["bookings"]["Row"];
export type Invoice = Database["public"]["Tables"]["invoices"]["Row"];
export type CircleNetwork = Database["public"]["Tables"]["circle_invitations"]["Row"];
export type InventoryItem = Database["public"]["Tables"]["inventory"]["Row"];
export type OperationalTask = Database["public"]["Tables"]["operational_tasks"]["Row"];
export type InventoryRule = Database["public"]["Tables"]["inventory_rules"]["Row"];
export type Expense = Database["public"]["Tables"]["expenses"]["Row"];

export type CircleMember = {
  id: string;
  status: "pending" | "accepted" | "rejected";
  peer: Pick<Profile, "id" | "full_name">;
};

export type AvailabilityProperty = Property & {
  owner_name: string | null;
  is_own: boolean;
  mock_availability: string[];
};
