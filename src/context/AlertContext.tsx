import { createContext, useState, useContext, ReactNode, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useUser } from './UserContext';

type AlertFrequency = 'immediate' | 'daily' | 'weekly';
type AlertChannel = 'email' | 'sms' | 'push';

interface AlertPreference {
  id: string;
  type: string;
  location?: string;
  cuisine?: string;
  priceRange?: [number, number];
  frequency: AlertFrequency;
  channels: AlertChannel[];
  enabled: boolean;
}

interface Alert {
  id: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  read: boolean;
  createdAt: Date;
}

interface AlertContextType {
  alertPreferences: AlertPreference[];
  alerts: Alert[];
  isLoading: boolean;
  addAlertPreference: (preference: Omit<AlertPreference, 'id'>) => Promise<void>;
  updateAlertPreference: (id: string, updates: Partial<AlertPreference>) => Promise<void>;
  removeAlertPreference: (id: string) => Promise<void>;
  markAlertAsRead: (id: string) => Promise<void>;
  unreadAlertsCount: number;
}

const AlertContext = createContext<AlertContextType | undefined>(undefined);

export const AlertProvider = ({ children }: { children: ReactNode }) => {
  const { user, isAuthenticated } = useUser();
  const [alertPreferences, setAlertPreferences] = useState<AlertPreference[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch alerts and preferences when user is authenticated
  useEffect(() => {
    if (isAuthenticated && user) {
      fetchAlerts();
      fetchAlertPreferences();
    } else {
      setAlerts([]);
      setAlertPreferences([]);
    }
  }, [isAuthenticated, user]);

  const fetchAlerts = async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('alerts')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      
      if (error) {
        throw error;
      }
      
      if (data) {
        const formattedAlerts = data.map(alert => ({
          id: alert.id,
          message: alert.message,
          type: alert.type as 'info' | 'success' | 'warning' | 'error',
          read: alert.read,
          createdAt: new Date(alert.created_at)
        }));
        
        setAlerts(formattedAlerts);
      }
    } catch (error) {
      console.error('Error fetching alerts:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchAlertPreferences = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('alert_preferences')
        .select('*')
        .eq('user_id', user.id);
      
      if (error) {
        throw error;
      }
      
      if (data) {
        const formattedPreferences = data.map(pref => ({
          id: pref.id,
          type: pref.type,
          location: pref.location || undefined,
          cuisine: pref.cuisine || undefined,
          priceRange: pref.price_min && pref.price_max ? [pref.price_min, pref.price_max] as [number, number] : undefined,
          frequency: pref.frequency as AlertFrequency,
          channels: pref.channels as AlertChannel[],
          enabled: pref.enabled
        }));
        
        setAlertPreferences(formattedPreferences);
      }
    } catch (error) {
      console.error('Error fetching alert preferences:', error);
    }
  };

  const addAlertPreference = async (preference: Omit<AlertPreference, 'id'>) => {
    if (!user) throw new Error('You must be logged in to add alert preferences');
    
    try {
      const { error } = await supabase
        .from('alert_preferences')
        .insert([{
          user_id: user.id,
          type: preference.type,
          location: preference.location,
          cuisine: preference.cuisine,
          price_min: preference.priceRange ? preference.priceRange[0] : null,
          price_max: preference.priceRange ? preference.priceRange[1] : null,
          frequency: preference.frequency,
          channels: preference.channels,
          enabled: preference.enabled
        }]);
      
      if (error) {
        throw error;
      }
      
      await fetchAlertPreferences();
    } catch (error) {
      console.error('Error adding alert preference:', error);
      throw error;
    }
  };

  const updateAlertPreference = async (id: string, updates: Partial<AlertPreference>) => {
    try {
      const dbUpdates: any = {};
      
      if (updates.type !== undefined) dbUpdates.type = updates.type;
      if (updates.location !== undefined) dbUpdates.location = updates.location;
      if (updates.cuisine !== undefined) dbUpdates.cuisine = updates.cuisine;
      if (updates.priceRange !== undefined) {
        dbUpdates.price_min = updates.priceRange[0];
        dbUpdates.price_max = updates.priceRange[1];
      }
      if (updates.frequency !== undefined) dbUpdates.frequency = updates.frequency;
      if (updates.channels !== undefined) dbUpdates.channels = updates.channels;
      if (updates.enabled !== undefined) dbUpdates.enabled = updates.enabled;
      
      const { error } = await supabase
        .from('alert_preferences')
        .update(dbUpdates)
        .eq('id', id);
      
      if (error) {
        throw error;
      }
      
      await fetchAlertPreferences();
    } catch (error) {
      console.error('Error updating alert preference:', error);
      throw error;
    }
  };

  const removeAlertPreference = async (id: string) => {
    try {
      const { error } = await supabase
        .from('alert_preferences')
        .delete()
        .eq('id', id);
      
      if (error) {
        throw error;
      }
      
      setAlertPreferences(prev => prev.filter(pref => pref.id !== id));
    } catch (error) {
      console.error('Error removing alert preference:', error);
      throw error;
    }
  };

  const markAlertAsRead = async (id: string) => {
    try {
      const { error } = await supabase
        .from('alerts')
        .update({ read: true })
        .eq('id', id);
      
      if (error) {
        throw error;
      }
      
      setAlerts(alerts.map(alert => (alert.id === id ? { ...alert, read: true } : alert)));
    } catch (error) {
      console.error('Error marking alert as read:', error);
      throw error;
    }
  };

  const unreadAlertsCount = alerts.filter(alert => !alert.read).length;

  return (
    <AlertContext.Provider
      value={{
        alertPreferences,
        alerts,
        isLoading,
        addAlertPreference,
        updateAlertPreference,
        removeAlertPreference,
        markAlertAsRead,
        unreadAlertsCount,
      }}
    >
      {children}
    </AlertContext.Provider>
  );
};

export const useAlerts = () => {
  const context = useContext(AlertContext);
  if (context === undefined) {
    throw new Error('useAlerts must be used within an AlertProvider');
  }
  return context;
};