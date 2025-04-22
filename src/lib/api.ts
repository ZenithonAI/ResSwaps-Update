import { supabase } from './supabase';
import type { Database } from '../types/supabase';
import { handleSupabaseError, handleAuthError, AppError } from '../utils/error';

type Tables = Database['public']['Tables'];
type UserRow = Tables['users']['Row'];
type ReservationRow = Tables['reservations']['Row'];
type BidRow = Tables['bids']['Row'];
type AlertRow = Tables['alerts']['Row'];
type AlertPreferenceRow = Tables['alert_preferences']['Row'];

export const api = {
  auth: {
    signUp: async (email: string, password: string, role: UserRow['role'] = 'buyer') => {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { role }
        }
      });
      if (error) handleAuthError(error);
      return data;
    },

    signIn: async (email: string, password: string) => {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      if (error) handleAuthError(error);
      return data;
    },

    signOut: async () => {
      const { error } = await supabase.auth.signOut();
      if (error) handleAuthError(error);
    }
  },

  users: {
    get: async (userId: string): Promise<UserRow> => {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();
      
      if (error) handleSupabaseError(error);
      if (!data) throw new AppError('User not found', undefined, 404);
      return data;
    },

    update: async (userId: string, updates: Partial<UserRow>) => {
      const { data, error } = await supabase
        .from('users')
        .update(updates)
        .eq('id', userId)
        .select()
        .single();
      
      if (error) handleSupabaseError(error);
      if (!data) throw new AppError('User not found', undefined, 404);
      return data;
    }
  },

  reservations: {
    list: async (filters?: {
      seller_id?: string;
      status?: string;
      cuisine?: string;
      location?: string;
      date_from?: string;
      date_to?: string;
      price_min?: number;
      price_max?: number;
    }): Promise<ReservationRow[]> => {
      let query = supabase.from('reservations').select('*');

      if (filters) {
        if (filters.seller_id) query = query.eq('seller_id', filters.seller_id);
        if (filters.status) query = query.eq('status', filters.status);
        if (filters.cuisine) query = query.eq('cuisine', filters.cuisine);
        if (filters.location) query = query.eq('location', filters.location);
        if (filters.date_from) query = query.gte('date', filters.date_from);
        if (filters.date_to) query = query.lte('date', filters.date_to);
        if (filters.price_min) query = query.gte('price', filters.price_min);
        if (filters.price_max) query = query.lte('price', filters.price_max);
      }

      const { data, error } = await query;
      if (error) handleSupabaseError(error);
      return data || [];
    },

    create: async (reservation: Omit<ReservationRow, 'id' | 'created_at'>): Promise<ReservationRow> => {
      const { data, error } = await supabase
        .from('reservations')
        .insert(reservation)
        .select()
        .single();
      
      if (error) handleSupabaseError(error);
      if (!data) throw new AppError('Failed to create reservation');
      return data;
    },

    update: async (id: string, updates: Partial<ReservationRow>): Promise<ReservationRow> => {
      const { data, error } = await supabase
        .from('reservations')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) handleSupabaseError(error);
      if (!data) throw new AppError('Reservation not found', undefined, 404);
      return data;
    }
  },

  bids: {
    create: async (bid: Omit<BidRow, 'id' | 'created_at'>): Promise<BidRow> => {
      // First check if user has active rate limit
      const { data: rateLimits, error: rateLimitError } = await supabase
        .from('rate_limits')
        .select('expires_at')
        .eq('user_id', bid.user_id)
        .eq('action_type', 'place_bid')
        .gt('expires_at', new Date().toISOString())
        .order('expires_at', { ascending: false })
        .limit(1);

      if (rateLimitError) handleSupabaseError(rateLimitError);

      if (rateLimits && rateLimits.length > 0) {
        const expiresAt = new Date(rateLimits[0].expires_at);
        const now = new Date();
        const retryAfter = Math.ceil((expiresAt.getTime() - now.getTime()) / 1000);

        throw new AppError(
          'Too many bids. Please wait before trying again.',
          'RATELIMIT',
          429,
          { retryAfter }
        );
      }

      // Proceed with bid creation
      const { data, error } = await supabase
        .from('bids')
        .insert(bid)
        .select()
        .single();
      
      if (error) handleSupabaseError(error);
      if (!data) throw new AppError('Failed to create bid');
      return data;
    },

    listForReservation: async (reservationId: string): Promise<BidRow[]> => {
      const { data, error } = await supabase
        .from('bids')
        .select('*')
        .eq('reservation_id', reservationId)
        .order('amount', { ascending: false });
      
      if (error) handleSupabaseError(error);
      return data || [];
    },

    getRateLimit: async (userId: string): Promise<number | null> => {
      const { data, error } = await supabase
        .from('rate_limits')
        .select('expires_at')
        .eq('user_id', userId)
        .eq('action_type', 'place_bid')
        .gt('expires_at', new Date().toISOString())
        .order('expires_at', { ascending: false })
        .limit(1);

      if (error) handleSupabaseError(error);

      if (data && data.length > 0) {
        const expiresAt = new Date(data[0].expires_at);
        const now = new Date();
        return Math.ceil((expiresAt.getTime() - now.getTime()) / 1000);
      }

      return null;
    }
  },

  alerts: {
    list: async (userId: string): Promise<AlertRow[]> => {
      const { data, error } = await supabase
        .from('alerts')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
      
      if (error) handleSupabaseError(error);
      return data || [];
    },

    markAsRead: async (alertId: string): Promise<void> => {
      const { error } = await supabase
        .from('alerts')
        .update({ read: true })
        .eq('id', alertId);
      
      if (error) handleSupabaseError(error);
    },

    getPreferences: async (userId: string): Promise<AlertPreferenceRow[]> => {
      const { data, error } = await supabase
        .from('alert_preferences')
        .select('*')
        .eq('user_id', userId);
      
      if (error) handleSupabaseError(error);
      return data || [];
    },

    updatePreferences: async (
      userId: string,
      preferences: Omit<AlertPreferenceRow, 'id' | 'created_at' | 'user_id'>
    ): Promise<AlertPreferenceRow> => {
      const { data, error } = await supabase
        .from('alert_preferences')
        .upsert({ user_id: userId, ...preferences })
        .select()
        .single();
      
      if (error) handleSupabaseError(error);
      if (!data) throw new AppError('Failed to update alert preferences');
      return data;
    }
  }
}; 