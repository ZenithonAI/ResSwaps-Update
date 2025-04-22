import { createContext, useState, useContext, ReactNode, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useUser } from './UserContext';

export type ReservationStatus = 'available' | 'pending' | 'sold' | 'expired';

export interface ReservationHistory {
  date: Date;
  price: number;
  buyerName?: string;
}

export interface MarketData {
  averagePrice: number;
  priceRange: [number, number];
  recentSales: number;
  demandScore: number;
  priceHistory: { date: Date; price: number }[];
}

export interface Reservation {
  id: string;
  restaurantName: string;
  location: string;
  cuisine: string;
  date: Date;
  time: string;
  partySize: number;
  price: number;
  originalPrice: number;
  sellerId: string;
  sellerName: string;
  status: ReservationStatus;
  description?: string;
  imageUrl?: string;
  popularity: number; // 1-100 score based on demand
  currentBid?: number;
  minimumBid?: number;
  allowBidding?: boolean;
  bidEndTime?: Date;
  bidHistory?: { user: string; amount: number; time: Date }[];
  saleHistory?: ReservationHistory[];
  marketData?: MarketData;
  stockRemaining?: number;
  lastSalePrice?: number;
  lastSaleDate?: Date;
  latitude?: number;
  longitude?: number;
}

interface ReservationContextType {
  reservations: Reservation[];
  userReservations: Reservation[];
  featuredReservations: Reservation[];
  isLoading: boolean;
  addReservation: (reservation: Omit<Reservation, 'id' | 'sellerId' | 'sellerName' | 'status' | 'popularity'>) => Promise<void>;
  updateReservation: (id: string, updates: Partial<Reservation>) => Promise<void>;
  deleteReservation: (id: string) => Promise<void>;
  getReservationById: (id: string) => Reservation | undefined;
  getReservation: (id: string) => Promise<Reservation>;
  placeBid: (id: string, amount: number) => Promise<boolean>;
  buyNow: (id: string) => Promise<boolean>;
  getMarketData: (id: string) => MarketData | undefined;
  fetchReservations: () => Promise<void>;
}

const ReservationContext = createContext<ReservationContextType | undefined>(undefined);

export const ReservationProvider = ({ children }: { children: ReactNode }) => {
  const { user, isAuthenticated } = useUser();
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [userReservations, setUserReservations] = useState<Reservation[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch all reservations on mount and when auth state changes
  useEffect(() => {
    fetchReservations();
  }, [isAuthenticated]);

  // Fetch user's reservations when authenticated
  useEffect(() => {
    if (isAuthenticated && user) {
      fetchUserReservations();
    } else {
      setUserReservations([]);
    }
  }, [isAuthenticated, user, reservations]);

  const fetchReservations = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('reservations')
        .select(`
          *,
          users:seller_id (name)
        `)
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      if (data) {
        const formattedReservations = data.map(formatReservationFromDB);
        setReservations(formattedReservations);
      }
    } catch (error) {
      console.error('Error fetching reservations:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchUserReservations = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('reservations')
        .select(`
          *,
          users:seller_id (name)
        `)
        .eq('seller_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      if (data) {
        const formattedReservations = data.map(formatReservationFromDB);
        setUserReservations(formattedReservations);
      }
    } catch (error) {
      console.error('Error fetching user reservations:', error);
    }
  };

  const formatReservationFromDB = (dbReservation: any): Reservation => {
    return {
      id: dbReservation.id,
      restaurantName: dbReservation.restaurant_name,
      location: dbReservation.location,
      cuisine: dbReservation.cuisine,
      date: new Date(dbReservation.date),
      time: dbReservation.time,
      partySize: dbReservation.party_size,
      price: dbReservation.price,
      originalPrice: dbReservation.original_price,
      sellerId: dbReservation.seller_id,
      sellerName: dbReservation.users?.name || 'Unknown Seller',
      status: dbReservation.status as ReservationStatus,
      description: dbReservation.description,
      imageUrl: dbReservation.image_url,
      popularity: dbReservation.popularity,
      allowBidding: dbReservation.allow_bidding,
      minimumBid: dbReservation.minimum_bid,
      currentBid: dbReservation.current_bid,
      bidEndTime: dbReservation.bid_end_time ? new Date(dbReservation.bid_end_time) : undefined,
      stockRemaining: dbReservation.stock_remaining,
      lastSalePrice: dbReservation.last_sale_price,
      lastSaleDate: dbReservation.last_sale_date ? new Date(dbReservation.last_sale_date) : undefined,
      latitude: dbReservation.latitude,
      longitude: dbReservation.longitude,
      // Mock market data for now, could be implemented as a real feature later
      marketData: {
        averagePrice: dbReservation.price * 0.9,
        priceRange: [dbReservation.price * 0.85, dbReservation.price * 1.1],
        recentSales: Math.floor(Math.random() * 10) + 1,
        demandScore: dbReservation.popularity,
        priceHistory: [
          { date: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000), price: dbReservation.price * 0.95 },
          { date: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000), price: dbReservation.price * 0.97 },
          { date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), price: dbReservation.price * 1.02 }
        ]
      }
    };
  };

  const formatReservationToDB = (reservation: Partial<Reservation>): any => {
    const dbReservation: any = {};
    
    if (reservation.restaurantName !== undefined) dbReservation.restaurant_name = reservation.restaurantName;
    if (reservation.location !== undefined) dbReservation.location = reservation.location;
    if (reservation.cuisine !== undefined) dbReservation.cuisine = reservation.cuisine;
    if (reservation.date !== undefined) dbReservation.date = reservation.date.toISOString();
    if (reservation.time !== undefined) dbReservation.time = reservation.time;
    if (reservation.partySize !== undefined) dbReservation.party_size = reservation.partySize;
    if (reservation.price !== undefined) dbReservation.price = reservation.price;
    if (reservation.originalPrice !== undefined) dbReservation.original_price = reservation.originalPrice;
    if (reservation.sellerId !== undefined) dbReservation.seller_id = reservation.sellerId;
    if (reservation.status !== undefined) dbReservation.status = reservation.status;
    if (reservation.description !== undefined) dbReservation.description = reservation.description;
    if (reservation.imageUrl !== undefined) dbReservation.image_url = reservation.imageUrl;
    if (reservation.popularity !== undefined) dbReservation.popularity = reservation.popularity;
    if (reservation.allowBidding !== undefined) dbReservation.allow_bidding = reservation.allowBidding;
    if (reservation.minimumBid !== undefined) dbReservation.minimum_bid = reservation.minimumBid;
    if (reservation.currentBid !== undefined) dbReservation.current_bid = reservation.currentBid;
    if (reservation.bidEndTime !== undefined) dbReservation.bid_end_time = reservation.bidEndTime.toISOString();
    if (reservation.stockRemaining !== undefined) dbReservation.stock_remaining = reservation.stockRemaining;
    if (reservation.lastSalePrice !== undefined) dbReservation.last_sale_price = reservation.lastSalePrice;
    if (reservation.lastSaleDate !== undefined) dbReservation.last_sale_date = reservation.lastSaleDate.toISOString();
    if (reservation.latitude !== undefined) dbReservation.latitude = reservation.latitude;
    if (reservation.longitude !== undefined) dbReservation.longitude = reservation.longitude;
    
    return dbReservation;
  };

  const addReservation = async (newReservation: Omit<Reservation, 'id' | 'sellerId' | 'sellerName' | 'status' | 'popularity'>) => {
    if (!user) throw new Error('You must be logged in to add a reservation');
    
    try {
      const dbReservation = formatReservationToDB({
        ...newReservation,
        sellerId: user.id,
        status: 'available',
        popularity: Math.floor(Math.random() * 40) + 60, // Random popularity between 60-100
        stockRemaining: 1,
      });
      
      console.log('Attempting to insert reservation:', dbReservation);
      
      const { data, error } = await supabase
        .from('reservations')
        .insert([dbReservation])
        .select()
        .single();
      
      if (error) {
        throw error;
      }
      
      if (data) {
        const formattedReservation = formatReservationFromDB({
          ...data,
          users: { name: user.name }
        });
        
        setReservations(prev => [formattedReservation, ...prev]);
        setUserReservations(prev => [formattedReservation, ...prev]);
      }
    } catch (error) {
      console.error('Error adding reservation:', error);
      throw error;
    }
  };

  const updateReservation = async (id: string, updates: Partial<Reservation>) => {
    try {
      const dbUpdates = formatReservationToDB(updates);
      
      const { error } = await supabase
        .from('reservations')
        .update(dbUpdates)
        .eq('id', id);
      
      if (error) {
        throw error;
      }
      
      // Update local state
      await fetchReservations();
    } catch (error) {
      console.error('Error updating reservation:', error);
      throw error;
    }
  };

  const deleteReservation = async (id: string) => {
    try {
      const { error } = await supabase
        .from('reservations')
        .delete()
        .eq('id', id);
      
      if (error) {
        throw error;
      }
      
      // Update local state
      setReservations(prev => prev.filter(r => r.id !== id));
      setUserReservations(prev => prev.filter(r => r.id !== id));
    } catch (error) {
      console.error('Error deleting reservation:', error);
      throw error;
    }
  };

  const getReservationById = (id: string) => {
    return reservations.find(r => r.id === id);
  };

  const getReservation = async (id: string) => {
    try {
      const { data, error } = await supabase
        .from('reservations')
        .select(`
          *,
          users:seller_id (name)
        `)
        .eq('id', id)
        .single();
      
      if (error) {
        throw error;
      }
      
      if (!data) {
        throw new Error('Reservation not found');
      }
      
      return formatReservationFromDB({
        ...data,
        users: { name: data.users?.name || 'Unknown Seller' }
      });
    } catch (error) {
      console.error('Error fetching reservation:', error);
      throw error;
    }
  };

  const placeBid = async (id: string, amount: number) => {
    if (!user) throw new Error('You must be logged in to place a bid');
    
    const reservation = getReservationById(id);
    if (!reservation || !reservation.allowBidding) return false;
    
    if (amount < (reservation.minimumBid || 0) || amount <= (reservation.currentBid || 0)) {
      return false;
    }
    
    try {
      // Add bid to the bids table
      const { error: bidError } = await supabase
        .from('bids')
        .insert([{
          reservation_id: id,
          user_id: user.id,
          amount: amount
        }]);
      
      if (bidError) {
        throw bidError;
      }
      
      // Update the reservation with the new current bid
      const { error: updateError } = await supabase
        .from('reservations')
        .update({ current_bid: amount })
        .eq('id', id);
      
      if (updateError) {
        throw updateError;
      }
      
      // Update local state
      await fetchReservations();
      
      return true;
    } catch (error) {
      console.error('Error placing bid:', error);
      return false;
    }
  };

  const buyNow = async (id: string) => {
    if (!user) throw new Error('You must be logged in to buy a reservation');
    
    const reservation = getReservationById(id);
    if (!reservation) return false;
    
    // Update stock
    const newStock = (reservation.stockRemaining || 0) - 1;
    if (newStock < 0) return false;
    
    // Update status if out of stock
    const newStatus = newStock === 0 ? 'sold' : 'available';
    
    try {
      // Begin transaction
      // 1. Update the reservation
      const { error: updateError } = await supabase
        .from('reservations')
        .update({
          stock_remaining: newStock,
          status: newStatus,
          last_sale_price: reservation.price,
          last_sale_date: new Date().toISOString()
        })
        .eq('id', id);
      
      if (updateError) {
        throw updateError;
      }
      
      // 2. Add to reservation history
      const { error: historyError } = await supabase
        .from('reservation_history')
        .insert([{
          reservation_id: id,
          buyer_id: user.id,
          buyer_name: user.name,
          price: reservation.price
        }]);
      
      if (historyError) {
        throw historyError;
      }
      
      // Update local state
      await fetchReservations();
      
      return true;
    } catch (error) {
      console.error('Error buying reservation:', error);
      return false;
    }
  };

  const getMarketData = (id: string) => {
    const reservation = getReservationById(id);
    return reservation?.marketData;
  };

  // Featured reservations are the most popular ones
  const featuredReservations = [...reservations]
    .sort((a, b) => b.popularity - a.popularity)
    .slice(0, 3);

  return (
    <ReservationContext.Provider
      value={{
        reservations,
        userReservations,
        featuredReservations,
        isLoading,
        addReservation,
        updateReservation,
        deleteReservation,
        getReservationById,
        getReservation,
        placeBid,
        buyNow,
        getMarketData,
        fetchReservations
      }}
    >
      {children}
    </ReservationContext.Provider>
  );
};

export const useReservations = () => {
  const context = useContext(ReservationContext);
  if (context === undefined) {
    throw new Error('useReservations must be used within a ReservationProvider');
  }
  return context;
};