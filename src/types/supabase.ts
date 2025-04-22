export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          created_at: string | null
          email: string
          name: string | null
          avatar_url: string | null
          role: string | null
          phone: string | null
          address: string | null
          city: string | null
          country: string | null
          postal_code: string | null
        }
        Insert: {
          id: string
          created_at?: string | null
          email: string
          name?: string | null
          avatar_url?: string | null
          role?: string | null
          phone?: string | null
          address?: string | null
          city?: string | null
          country?: string | null
          postal_code?: string | null
        }
        Update: {
          id?: string
          created_at?: string | null
          email?: string
          name?: string | null
          avatar_url?: string | null
          role?: string | null
          phone?: string | null
          address?: string | null
          city?: string | null
          country?: string | null
          postal_code?: string | null
        }
      }
      reservations: {
        Row: {
          id: string
          created_at: string | null
          restaurant_name: string
          location: string
          cuisine: string
          date: string
          time: string
          party_size: number
          price: number
          original_price: number
          seller_id: string
          status: string | null
          description: string | null
          image_url: string | null
          popularity: number | null
          allow_bidding: boolean | null
          minimum_bid: number | null
          current_bid: number | null
          bid_end_time: string | null
          stock_remaining: number | null
          last_sale_price: number | null
          last_sale_date: string | null
        }
        Insert: {
          id?: string
          created_at?: string | null
          restaurant_name: string
          location: string
          cuisine: string
          date: string
          time: string
          party_size: number
          price: number
          original_price: number
          seller_id: string
          status?: string | null
          description?: string | null
          image_url?: string | null
          popularity?: number | null
          allow_bidding?: boolean | null
          minimum_bid?: number | null
          current_bid?: number | null
          bid_end_time?: string | null
          stock_remaining?: number | null
          last_sale_price?: number | null
          last_sale_date?: string | null
        }
        Update: {
          id?: string
          created_at?: string | null
          restaurant_name?: string
          location?: string
          cuisine?: string
          date?: string
          time?: string
          party_size?: number
          price?: number
          original_price?: number
          seller_id?: string
          status?: string | null
          description?: string | null
          image_url?: string | null
          popularity?: number | null
          allow_bidding?: boolean | null
          minimum_bid?: number | null
          current_bid?: number | null
          bid_end_time?: string | null
          stock_remaining?: number | null
          last_sale_price?: number | null
          last_sale_date?: string | null
        }
      }
      bids: {
        Row: {
          id: string
          created_at: string | null
          reservation_id: string
          user_id: string
          amount: number
        }
        Insert: {
          id?: string
          created_at?: string | null
          reservation_id: string
          user_id: string
          amount: number
        }
        Update: {
          id?: string
          created_at?: string | null
          reservation_id?: string
          user_id?: string
          amount?: number
        }
      }
      alerts: {
        Row: {
          id: string
          created_at: string | null
          user_id: string
          message: string
          type: string | null
          read: boolean | null
        }
        Insert: {
          id?: string
          created_at?: string | null
          user_id: string
          message: string
          type?: string | null
          read?: boolean | null
        }
        Update: {
          id?: string
          created_at?: string | null
          user_id?: string
          message?: string
          type?: string | null
          read?: boolean | null
        }
      }
      alert_preferences: {
        Row: {
          id: string
          created_at: string | null
          user_id: string
          type: string
          location: string | null
          cuisine: string | null
          price_min: number | null
          price_max: number | null
          frequency: string | null
          channels: string[] | null
          enabled: boolean | null
        }
        Insert: {
          id?: string
          created_at?: string | null
          user_id: string
          type: string
          location?: string | null
          cuisine?: string | null
          price_min?: number | null
          price_max?: number | null
          frequency?: string | null
          channels?: string[] | null
          enabled?: boolean | null
        }
        Update: {
          id?: string
          created_at?: string | null
          user_id?: string
          type?: string
          location?: string | null
          cuisine?: string | null
          price_min?: number | null
          price_max?: number | null
          frequency?: string | null
          channels?: string[] | null
          enabled?: boolean | null
        }
      }
      reservation_history: {
        Row: {
          id: string
          created_at: string | null
          reservation_id: string
          buyer_id: string | null
          buyer_name: string | null
          price: number
        }
        Insert: {
          id?: string
          created_at?: string | null
          reservation_id: string
          buyer_id?: string | null
          buyer_name?: string | null
          price: number
        }
        Update: {
          id?: string
          created_at?: string | null
          reservation_id?: string
          buyer_id?: string | null
          buyer_name?: string | null
          price?: number
        }
      }
    }
  }
}