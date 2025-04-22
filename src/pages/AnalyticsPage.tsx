import { useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { supabase } from '../lib/supabase'; 
import { useReservations, Reservation } from '../context/ReservationContext'; 
import { useUser } from '../context/UserContext'; 
import { Scale, TrendingUp } from 'lucide-react'; 
import { useQuery, QueryFunctionContext } from '@tanstack/react-query';

interface BidAnalytics {
  bidCount: number;
  highestBid: number | null;
}

const AnalyticsPage = () => {
  const { id } = useParams<{ id: string }>();
  const { getReservation } = useReservations(); 
  const { user } = useUser(); 

  const { 
    data: reservation,
    isLoading: isReservationLoading,
    isError: isReservationError,
    error: reservationError
  } = useQuery<Reservation | null, Error, Reservation | null, readonly [string, string | undefined, typeof getReservation]>({
    queryKey: ['reservation', id, getReservation] as const, 
    queryFn: async (context: QueryFunctionContext<readonly [string, string | undefined, typeof getReservation]>) => {
      const [_key, currentId, currentGetReservation] = context.queryKey;
      if (!currentId) return null; 
      try {
        const res = await currentGetReservation(currentId); 
        return res ?? null;
      } catch (err) { 
        console.error('Error fetching reservation details:', err);
        throw new Error('Failed to load reservation details.');
      }
    },
    enabled: !!id, 
    staleTime: 1000 * 60 * 5, 
    // cacheTime temporarily removed for diagnosis
  });

  const { 
    data: analytics,
    isLoading: isAnalyticsLoading,
    isError: isAnalyticsError,
    error: analyticsError
  } = useQuery<BidAnalytics, Error, BidAnalytics, readonly [string, string | undefined]>({
    queryKey: ['reservationAnalytics', id] as const,
    queryFn: async (context: QueryFunctionContext<readonly [string, string | undefined]>) => {
      const [_key, currentId] = context.queryKey;
      if (!currentId) throw new Error('Reservation ID missing for analytics fetch');
  
      const { count, error: countError } = await supabase
        .from('bids')
        .select('*', { count: 'exact', head: true})
        .eq('reservation_id', currentId);

      if (countError) throw countError;
      const bidCount = count ?? 0;

      let highestBid: number | null = null;
      if (bidCount > 0) {
        const { data: highestBidData, error: highestBidError } = await supabase
          .from('bids')
          .select('amount')
          .eq('reservation_id', currentId)
          .order('amount', { ascending: false})
          .limit(1)
          .single();
        
        if (highestBidError && highestBidError.code !== 'PGRST116') { 
           throw highestBidError;
        }
        highestBid = highestBidData?.amount ?? null;
      }
      
      return { bidCount, highestBid };
    },
    enabled: !!(reservation && user?.id === reservation.sellerId), 
    staleTime: 1000 * 60 * 2, 
    // cacheTime temporarily removed for diagnosis
  });

  if (isReservationLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gold-500"></div>
      </div>
    );
  }

  if (isReservationError) {
     return (
       <div className="text-center py-12 text-red-400">
         <h2 className="text-xl">Error Loading Reservation</h2>
         <p>{reservationError?.message || 'Could not fetch reservation details.'}</p>
       </div>
     );
  }

  if (!reservation) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl text-ivory-200">Reservation data not available.</h2>
      </div>
    );
  }
  
  if (reservation && user && user.id !== reservation.sellerId) { 
     return (
       <div className="text-center py-12">
         <h2 className="text-xl text-red-400">Access Denied</h2>
         <p className="text-ivory-400 mt-2">You cannot view analytics for reservations you do not own.</p>
       </div>
     );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-ivory-50 mb-2 font-display">
            Analytics: {reservation.restaurantName} ({new Date(reservation.date).toLocaleDateString()})
          </h1>
          <p className="text-ivory-400">
            Performance overview for your reservation listing.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-onyx-900 border border-onyx-800 p-6 rounded-lg shadow-glass flex items-center space-x-4">
            <Scale className="h-8 w-8 text-teal-500 flex-shrink-0" />
            <div>
              <h3 className="text-ivory-400 text-sm font-medium mb-1">Total Bids</h3>
              {isAnalyticsLoading ? (
                <div className="h-8 w-16 bg-onyx-700 rounded animate-pulse"></div>
              ) : isAnalyticsError ? (
                <p className="text-sm text-red-400">Error</p>
              ) : (
                analytics ? (
                  <p className="text-3xl font-bold text-ivory-50">{analytics.bidCount}</p>
                ) : (
                  <p className="text-3xl font-bold text-ivory-50">0</p>
                )
              )}
              <p className="text-xs text-ivory-500 mt-1">Number of offers received</p>
            </div>
          </div>
          <div className="bg-onyx-900 border border-onyx-800 p-6 rounded-lg shadow-glass flex items-center space-x-4">
            <TrendingUp className="h-8 w-8 text-gold-500 flex-shrink-0" />
            <div>
              <h3 className="text-ivory-400 text-sm font-medium mb-1">Highest Bid</h3>
              {isAnalyticsLoading ? (
                <div className="h-8 w-24 bg-onyx-700 rounded animate-pulse"></div>
              ) : isAnalyticsError ? (
                 <p className="text-sm text-red-400">Error</p>
              ) : analytics ? (
                analytics.highestBid != null ? (
                  <p className="text-3xl font-bold text-ivory-50">€{analytics.highestBid.toFixed(2)}</p>
                ) : (
                  <p className="text-xl font-medium text-ivory-300">No bids yet</p>
                )
              ) : (
                <p className="text-sm text-gray-400">...</p>
              )}
              <p className="text-xs text-ivory-500 mt-1">Top offer received so far</p>
            </div>
          </div>
        </div>
        
        {isAnalyticsError && (
           <div className="bg-red-900/30 border border-red-800 text-red-200 px-4 py-3 rounded relative mb-6" role="alert">
             <strong className="font-bold">Analytics Error:</strong>
             <span className="block sm:inline ml-2">{analyticsError?.message || 'Could not fetch bid data.'}</span>
           </div>
        )}

        <div className="mt-12 text-center">
          <p className="text-ivory-500 italic">More detailed charts coming soon.</p>
        </div>
      </motion.div>
    </div>
  );
};

export default AnalyticsPage;