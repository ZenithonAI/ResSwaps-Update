/// <reference types="vite/client" />

import { createClient } from '@supabase/supabase-js';
import type { Database } from '../types/supabase';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl) {
  throw new Error('Missing VITE_SUPABASE_URL environment variable. Please check your .env file.');
}

if (!supabaseAnonKey) {
  throw new Error('Missing VITE_SUPABASE_ANON_KEY environment variable. Please check your .env file.');
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  }
});

// Type-safe helper functions
export const tables = {
  users: () => supabase.from('users'),
  reservations: () => supabase.from('reservations'),
  bids: () => supabase.from('bids'),
  alerts: () => supabase.from('alerts'),
  alertPreferences: () => supabase.from('alert_preferences'),
  reservationHistory: () => supabase.from('reservation_history'),
} as const;