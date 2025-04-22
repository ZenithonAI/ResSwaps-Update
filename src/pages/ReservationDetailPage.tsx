import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useUser } from '../context/UserContext';
import { supabase } from '../lib/supabase';
import { motion } from 'framer-motion';
import Button from '../components/Button';
import { ArrowDown, ArrowUp, Clock, Users, MapPin, Calendar, Utensils, Info, AlertCircle, ChevronRight, ChevronLeft, Package, Truck, BarChart2 } from 'lucide-react';
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js';
import { format } from 'date-fns';
import { LoadingSpinner } from '../components/LoadingSpinner';

// Register ChartJS components
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

// Define types
interface Reservation {
  id: string;
  restaurant_name: string;
  location: string;
  cuisine: string;
  date: string;
  time: string;
  party_size: number;
  price: number;
  original_price: number;
  seller_id: string;
  status: string;
  description?: string;
  image_url?: string;
  popularity?: number;
  allow_bidding: boolean;
  minimum_bid?: number;
  current_bid?: number;
  bid_end_time?: string;
  last_sale_price?: number;
  last_sale_date?: string;
  currentPrice?: number;
  lastSalePrice?: number;
  partySize: number;
}

interface Bid {
  id: string;
  reservation_id: string;
  user_id: string;
  amount: number;
  created_at: string;
  expires_at?: string;
  status: 'open' | 'accepted' | 'rejected' | 'expired';
}

interface Sale {
  id: string;
  reservation_id: string;
  price: number;
  executed_at: string;
}

interface MarketStats {
  lastSalePrice: number | null;
  thirtyDayAvg: number | null;
  highPrice: number | null;
  lowPrice: number | null;
  salesCount: number;
}

const ReservationDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const { isAuthenticated, user } = useUser();
  const navigate = useNavigate();
  
  const [reservation, setReservation] = useState<Reservation | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [bids, setBids] = useState<Bid[]>([]);
  const [asks, setAsks] = useState<{ id: string; price: number; seller_id: string }[]>([]);
  const [salesHistory, setSalesHistory] = useState<Sale[]>([]);
  const [marketStats, setMarketStats] = useState<MarketStats>({
    lastSalePrice: null,
    thirtyDayAvg: null,
    highPrice: null,
    lowPrice: null,
    salesCount: 0
  });
  
  // Modals state
  const [showBidModal, setShowBidModal] = useState(false);
  const [showAskModal, setShowAskModal] = useState(false);
  const [bidAmount, setBidAmount] = useState('');
  const [askAmount, setAskAmount] = useState('');
  const [bidExpiry, setBidExpiry] = useState('7'); // Default 7 days
  const [askExpiry, setAskExpiry] = useState('7'); // Default 7 days

  // State for auth prompt modal
  const [showAuthPrompt, setShowAuthPrompt] = useState(false);
  const [authAction, setAuthAction] = useState<'bid' | 'buy' | 'sell' | null>(null);

  useEffect(() => {
    const fetchReservation = async () => {
      try {
        setIsLoading(true);
        setError(null);

        if (!id) {
          throw new Error('Reservation ID is required');
        }

        // Fetch reservation details
        const { data: reservationData, error: reservationError } = await supabase
          .from('reservations')
          .select('*')
          .eq('id', id)
          .single();

        if (reservationError) throw reservationError;
        if (!reservationData) throw new Error('Reservation not found');

        setReservation(reservationData);

        // Fetch bids
        const { data: bidsData, error: bidsError } = await supabase
          .from('bids')
          .select('*')
          .eq('reservation_id', id)
          .eq('status', 'open')
          .order('amount', { ascending: false });

        if (bidsError) throw bidsError;
        setBids(bidsData || []);

        // Fetch asks (current listing and any other listings for the same reservation)
        // For simplicity, we're using a single "asks" price from the reservation itself
        const currentAsk = {
          id: reservationData.id,
          price: reservationData.price,
          seller_id: reservationData.seller_id
        };
        setAsks([currentAsk]);

        // Fetch sales history
        const { data: salesData, error: salesError } = await supabase
          .from('reservation_history')
          .select('id, reservation_id, created_at, reservation:reservation_id(price)')
          .eq('reservation_id', id)
          .order('created_at', { ascending: false });

        if (salesError) throw salesError;
        
        // Format sales data
        const formattedSales = salesData?.map(sale => ({
          id: sale.id,
          reservation_id: sale.reservation_id,
          price: sale.reservation.price,
          executed_at: sale.created_at
        })) || [];
        
        setSalesHistory(formattedSales);

        // Calculate market stats
        if (formattedSales.length > 0) {
          const prices = formattedSales.map(sale => sale.price);
          const thirtyDaysAgo = new Date();
          thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
          
          const thirtyDaySales = formattedSales.filter(
            sale => new Date(sale.executed_at) >= thirtyDaysAgo
          );
          
          const thirtyDayPrices = thirtyDaySales.map(sale => sale.price);
          
          setMarketStats({
            lastSalePrice: prices[0],
            thirtyDayAvg: thirtyDayPrices.length 
              ? thirtyDayPrices.reduce((sum, price) => sum + price, 0) / thirtyDayPrices.length 
              : null,
            highPrice: Math.max(...prices),
            lowPrice: Math.min(...prices),
            salesCount: formattedSales.length
          });
        }

      } catch (err: any) {
        console.error('Error fetching reservation data:', err);
        setError(err.message || 'Failed to load reservation details');
      } finally {
        setIsLoading(false);
      }
    };

    fetchReservation();

    // Set up real-time listeners
    const bidsSubscription = supabase
      .channel('bids-changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'bids',
        filter: `reservation_id=eq.${id}`
      }, (payload) => {
        // Refresh bids when changes occur
        fetchReservation();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(bidsSubscription);
    };
  }, [id]);

  // Handle bid submission
  const handlePlaceBid = async () => {
    if (!isAuthenticated) {
      setAuthAction('bid');
      setShowAuthPrompt(true);
      return;
    }

    try {
      const bidValue = parseFloat(bidAmount);
      if (isNaN(bidValue) || bidValue <= 0) {
        throw new Error('Please enter a valid bid amount');
      }

      // Check if bid is greater than current highest bid
      const highestBid = bids.length > 0 ? bids[0].amount : 0;
      if (bidValue <= highestBid) {
        throw new Error(`Bid must be greater than the current highest bid (${highestBid})`);
      }

      // Calculate expiry date
      const expiryDays = parseInt(bidExpiry);
      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + expiryDays);

      const { error } = await supabase
        .from('bids')
        .insert([{
          reservation_id: id,
          user_id: user?.id,
          amount: bidValue,
          expires_at: expiryDate.toISOString(),
          status: 'open'
        }]);

      if (error) throw error;

      setShowBidModal(false);
      setBidAmount('');
      // Refresh will happen via real-time subscription
    } catch (err: any) {
      setError(err.message || 'Failed to place bid');
    }
  };

  // Handle ask submission (listing a reservation)
  const handlePlaceAsk = async () => {
    if (!isAuthenticated) {
      setAuthAction('sell');
      setShowAuthPrompt(true);
      return;
    }

    try {
      const askValue = parseFloat(askAmount);
      if (isNaN(askValue) || askValue <= 0) {
        throw new Error('Please enter a valid asking price');
      }

      // Update the reservation price
      const { error } = await supabase
        .from('reservations')
        .update({ price: askValue })
        .eq('id', id)
        .eq('seller_id', user?.id); // Ensure the user is the seller

      if (error) {
        // If they're not the seller
        if (error.code === 'PGRST116') {
          throw new Error('You can only update reservations you own');
        }
        throw error;
      }

      setShowAskModal(false);
      setAskAmount('');
      // Refresh the reservation data
      window.location.reload();
    } catch (err: any) {
      setError(err.message || 'Failed to update asking price');
    }
  };

  // Handle Buy Now (accepting the lowest ask)
  const handleBuyNow = async () => {
    if (!isAuthenticated) {
      setAuthAction('buy');
      setShowAuthPrompt(true);
      return;
    }

    if (!reservation) return;

    try {
      // Create a reservation history entry
      const { error } = await supabase
        .from('reservation_history')
        .insert([{
          reservation_id: id,
          buyer_id: user?.id,
          buyer_name: user?.name
        }]);

      if (error) throw error;

      // Update the reservation status
      const { error: updateError } = await supabase
        .from('reservations')
        .update({ 
          status: 'sold',
          // In a real app, you'd also transfer ownership here
        })
        .eq('id', id);

      if (updateError) throw updateError;

      // Redirect to success page or dashboard
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Failed to complete purchase');
    }
  };

  // Handle Sell Now (accepting the highest bid)
  const handleSellNow = async () => {
    if (!isAuthenticated) {
      setAuthAction('sell');
      setShowAuthPrompt(true);
      return;
    }

    if (!reservation || bids.length === 0) return;

    try {
      const highestBid = bids[0];

      // Create a reservation history entry
      const { error } = await supabase
        .from('reservation_history')
        .insert([{
          reservation_id: id,
          buyer_id: highestBid.user_id,
          // You'd need to fetch the buyer's name here in a real app
          buyer_name: 'Bid Accepted'
        }]);

      if (error) throw error;

      // Update the reservation status
      const { error: updateError } = await supabase
        .from('reservations')
        .update({ 
          status: 'sold',
          price: highestBid.amount,
          // In a real app, you'd also transfer ownership here
        })
        .eq('id', id)
        .eq('seller_id', user?.id); // Ensure the user is the seller

      if (updateError) {
        if (updateError.code === 'PGRST116') {
          throw new Error('You can only sell reservations you own');
        }
        throw updateError;
      }

      // Update the bid status
      const { error: bidError } = await supabase
        .from('bids')
        .update({ status: 'accepted' })
        .eq('id', highestBid.id);

      if (bidError) throw bidError;

      // Redirect to success page or dashboard
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Failed to accept bid');
    }
  };

  // Chart data preparation
  const chartData = {
    labels: salesHistory.map(sale => format(new Date(sale.executed_at), 'MMM d')).reverse(),
    datasets: [
      {
        label: 'Sale Price',
        data: salesHistory.map(sale => sale.price).reverse(),
        borderColor: 'rgb(132, 204, 22)',
        backgroundColor: 'rgba(132, 204, 22, 0.5)',
        tension: 0.1
      }
    ]
  };

  // Chart options
  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        callbacks: {
          label: function(context: any) {
            return `Price: £${context.raw}`;
          }
        }
      }
    },
    scales: {
      y: {
        ticks: {
          callback: function(value: any) {
            return '£' + value;
          }
        }
      }
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-gold-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <div className="bg-red-900/20 border border-red-700/50 rounded-lg p-6 text-red-500 flex items-center">
          <AlertCircle className="h-6 w-6 mr-3" />
          <p>{error}</p>
        </div>
      </div>
    );
  }

  if (!reservation) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <div className="bg-gold-900/20 border border-gold-700/50 rounded-lg p-6 text-gold-500 flex items-center">
          <Info className="h-6 w-6 mr-3" />
          <p>Reservation not found. It may have been removed or sold.</p>
        </div>
      </div>
    );
  }

  const highestBid = bids.length > 0 ? bids[0].amount : null;
  const lowestAsk = reservation.price;
  const isOwner = user?.id === reservation.seller_id;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Column - Image */}
        <div className="bg-onyx-900 border border-onyx-800 rounded-premium p-6 shadow-glass">
          <div className="aspect-square rounded-lg overflow-hidden">
            <img
              src={reservation.image_url || 'https://images.pexels.com/photos/67468/pexels-photo-67468.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1'}
              alt={reservation.restaurant_name}
              className="w-full h-full object-cover"
            />
          </div>
        </div>

        {/* Right Column - Details */}
        <div className="space-y-6">
          {/* Header */}
          <div>
            <h1 className="text-3xl font-bold text-ivory-50 mb-2 font-display">{reservation.restaurant_name}</h1>
            <p className="text-ivory-400">{reservation.location}</p>
            <div className="mt-4">
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-900/30 text-blue-400 border border-blue-700/30">
                {reservation.cuisine}
              </span>
            </div>
          </div>

          {/* Price Section */}
          <div className="bg-onyx-900 border border-onyx-800 rounded-premium p-6 shadow-glass">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm text-ivory-400">Current Price</p>
                <p className="text-3xl font-bold text-ivory-50">£{reservation.price}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-ivory-400">Last Sale</p>
                <p className="text-lg font-medium text-ivory-200">£{reservation.last_sale_price}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Button
                variant="outline"
                fullWidth
                onClick={handlePlaceAsk}
                isLoading={isLoading}
              >
                Place Ask
              </Button>
              <Button
                variant="gold"
                fullWidth
                onClick={handleBuyNow}
                isLoading={isLoading}
              >
                Buy Now
              </Button>
            </div>
          </div>

          {/* Details Section */}
          <div className="bg-onyx-900 border border-onyx-800 rounded-premium p-6 shadow-glass">
            <h2 className="text-lg font-medium text-ivory-100 mb-4 font-display">Reservation Details</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-ivory-400">Date</p>
                <p className="text-base font-medium text-ivory-200">{reservation.date}</p>
              </div>
              <div>
                <p className="text-sm text-ivory-400">Time</p>
                <p className="text-base font-medium text-ivory-200">{reservation.time}</p>
              </div>
              <div>
                <p className="text-sm text-ivory-400">Party Size</p>
                <p className="text-base font-medium text-ivory-200">{reservation.party_size} people</p>
              </div>
              <div>
                <p className="text-sm text-ivory-400">Status</p>
                <p className="text-base font-medium text-ivory-200 capitalize">{reservation.status}</p>
              </div>
            </div>
          </div>

          {/* Shipping & Return Policy */}
          <div className="bg-onyx-900 border border-onyx-800 rounded-premium p-6 shadow-glass">
            <h2 className="text-lg font-medium text-ivory-100 mb-4 font-display">Important Information</h2>
            <div className="space-y-4">
              <div className="flex items-start">
                <Clock className="h-5 w-5 text-gold-500 mt-0.5 mr-3" />
                <div>
                  <p className="text-sm font-medium text-ivory-200">Instant Transfer</p>
                  <p className="text-sm text-ivory-400">Reservation details transferred immediately after purchase</p>
                </div>
              </div>
              <div className="flex items-start">
                <Package className="h-5 w-5 text-gold-500 mt-0.5 mr-3" />
                <div>
                  <p className="text-sm font-medium text-ivory-200">Secure Transaction</p>
                  <p className="text-sm text-ivory-400">Payment held in escrow until successful transfer</p>
                </div>
              </div>
              <div className="flex items-start">
                <Info className="h-5 w-5 text-gold-500 mt-0.5 mr-3" />
                <div>
                  <p className="text-sm font-medium text-ivory-200">14 Day Return Policy</p>
                  <p className="text-sm text-ivory-400">Full refund if reservation cannot be honored</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Description Section */}
      <div className="mt-8">
        <div className="bg-onyx-900 border border-onyx-800 rounded-premium p-6 shadow-glass">
          <h2 className="text-lg font-medium text-ivory-100 mb-4 font-display">Description</h2>
          <p className="text-ivory-300">{reservation.description}</p>
        </div>
      </div>

      {/* Price History Chart */}
      <div className="mt-8">
        <div className="bg-onyx-900 border border-onyx-800 rounded-premium p-6 shadow-glass">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-medium text-ivory-100 font-display">Price History</h2>
            <div className="flex items-center space-x-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate(`/reservations/${id}/analytics`)}
                leftIcon={<BarChart2 className="h-4 w-4" />}
              >
                View Full Analytics
              </Button>
              <div className="text-right">
                <p className="text-sm text-ivory-400">30 Day Avg</p>
                <p className="text-lg font-medium text-ivory-200">
                  {marketStats.thirtyDayAvg ? `£${marketStats.thirtyDayAvg.toFixed(2)}` : 'N/A'}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm text-ivory-400">All Time High</p>
                <p className="text-lg font-medium text-ivory-200">
                  {marketStats.highPrice ? `£${marketStats.highPrice}` : 'N/A'}
                </p>
              </div>
            </div>
          </div>
          
          <div className="h-80">
            {salesHistory.length > 0 ? (
              <Line data={chartData} options={chartOptions} />
            ) : (
              <div className="h-full flex items-center justify-center text-ivory-500">
                No sales history available
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Bids and Asks Section */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Bids */}
        <div className="bg-onyx-900 border border-onyx-800 rounded-premium shadow-glass overflow-hidden">
          <div className="px-6 py-4 border-b border-onyx-800">
            <h2 className="text-lg font-medium text-ivory-100 font-display">
              Bids <span className="text-ivory-500 text-sm">({bids.length})</span>
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-ivory-500 text-sm">
                  <th className="px-6 py-3 border-b border-onyx-800">Price</th>
                  <th className="px-6 py-3 border-b border-onyx-800">Date</th>
                  <th className="px-6 py-3 border-b border-onyx-800">vs Original</th>
                </tr>
              </thead>
              <tbody>
                {bids.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="px-6 py-4 text-center text-ivory-500">
                      No bids yet
                    </td>
                  </tr>
                ) : (
                  bids.map((bid) => (
                    <tr key={bid.id} className="text-ivory-200">
                      <td className="px-6 py-4 font-medium">£{bid.amount}</td>
                      <td className="px-6 py-4 text-ivory-400 text-sm">
                        {format(new Date(bid.created_at), 'MMM d, yyyy')}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`text-sm ${
                          bid.amount >= reservation.original_price 
                            ? 'text-green-500' 
                            : 'text-red-500'
                        }`}>
                          {bid.amount >= reservation.original_price
                            ? `+${((bid.amount / reservation.original_price - 1) * 100).toFixed(1)}%`
                            : `-${((1 - bid.amount / reservation.original_price) * 100).toFixed(1)}%`}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Asks */}
        <div className="bg-onyx-900 border border-onyx-800 rounded-premium shadow-glass overflow-hidden">
          <div className="px-6 py-4 border-b border-onyx-800">
            <h2 className="text-lg font-medium text-ivory-100 font-display">
              Asks <span className="text-ivory-500 text-sm">({asks.length})</span>
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-ivory-500 text-sm">
                  <th className="px-6 py-3 border-b border-onyx-800">Price</th>
                  <th className="px-6 py-3 border-b border-onyx-800">Seller</th>
                  <th className="px-6 py-3 border-b border-onyx-800">vs Original</th>
                </tr>
              </thead>
              <tbody>
                {asks.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="px-6 py-4 text-center text-ivory-500">
                      No asks available
                    </td>
                  </tr>
                ) : (
                  asks.map((ask) => (
                    <tr key={ask.id} className="text-ivory-200">
                      <td className="px-6 py-4 font-medium">£{ask.price}</td>
                      <td className="px-6 py-4 text-ivory-400 text-sm">
                        {ask.seller_id === user?.id ? 'You' : 'Seller'}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`text-sm ${
                          ask.price >= reservation.original_price 
                            ? 'text-green-500' 
                            : 'text-red-500'
                        }`}>
                          {ask.price >= reservation.original_price
                            ? `+${((ask.price / reservation.original_price - 1) * 100).toFixed(1)}%`
                            : `-${((1 - ask.price / reservation.original_price) * 100).toFixed(1)}%`}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Bid Modal */}
      {showBidModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-screen items-end justify-center p-4 text-center sm:items-center sm:p-0">
            <div className="fixed inset-0 bg-onyx-950/80 transition-opacity" onClick={() => setShowBidModal(false)}></div>
            
            <motion.div 
              className="relative transform overflow-hidden rounded-lg bg-onyx-900 border border-onyx-800 px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:p-6"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
            >
              <div>
                <h3 className="text-xl font-semibold mb-4 text-ivory-100 font-display">Place a Bid</h3>
                
                <div className="mb-4">
                  <div className="flex justify-between mb-1">
                    <label className="block text-sm font-medium text-ivory-300">Your Bid (£)</label>
                    {highestBid && (
                      <span className="text-ivory-500 text-sm">Current highest: £{highestBid}</span>
                    )}
                  </div>
                  <input
                    type="number"
                    value={bidAmount}
                    onChange={(e) => setBidAmount(e.target.value)}
                    className="w-full bg-onyx-800 border border-onyx-700 rounded-md px-4 py-2 text-ivory-100 focus:outline-none focus:ring-2 focus:ring-gold-600 focus:border-transparent"
                    placeholder="Enter your bid amount"
                    min={highestBid ? highestBid + 1 : 1}
                    step="1"
                  />
                </div>
                
                <div className="mb-4">
                  <label className="block text-sm font-medium text-ivory-300 mb-1">Bid Expiration</label>
                  <select
                    value={bidExpiry}
                    onChange={(e) => setBidExpiry(e.target.value)}
                    className="w-full bg-onyx-800 border border-onyx-700 rounded-md px-4 py-2 text-ivory-100 focus:outline-none focus:ring-2 focus:ring-gold-600 focus:border-transparent"
                  >
                    <option value="1">1 day</option>
                    <option value="3">3 days</option>
                    <option value="7">7 days</option>
                    <option value="14">14 days</option>
                    <option value="30">30 days</option>
                  </select>
                </div>
                
                <div className="mb-6 p-3 bg-onyx-800/50 rounded-md text-ivory-400 text-sm">
                  <p>You are placing a bid for: <span className="text-ivory-200">{reservation.restaurant_name}</span></p>
                  <p className="mt-1">
                    {reservation.date} at {reservation.time} • {reservation.party_size} {reservation.party_size === 1 ? 'person' : 'people'}
                  </p>
                </div>
                
                <div className="flex justify-end space-x-3">
                  <Button
                    variant="ghost"
                    onClick={() => setShowBidModal(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="primary"
                    onClick={handlePlaceBid}
                    isLoading={isLoading}
                  >
                    Place Bid
                  </Button>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      )}

      {/* Ask Modal */}
      {showAskModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-screen items-end justify-center p-4 text-center sm:items-center sm:p-0">
            <div className="fixed inset-0 bg-onyx-950/80 transition-opacity" onClick={() => setShowAskModal(false)}></div>
            
            <motion.div 
              className="relative transform overflow-hidden rounded-lg bg-onyx-900 border border-onyx-800 px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:p-6"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
            >
              <div>
                <h3 className="text-xl font-semibold mb-4 text-ivory-100 font-display">
                  {isOwner ? 'Update Your Asking Price' : 'List Your Reservation'}
                </h3>
                
                <div className="mb-4">
                  <div className="flex justify-between mb-1">
                    <label className="block text-sm font-medium text-ivory-300">Your Ask Price (£)</label>
                    <span className="text-ivory-500 text-sm">Original price: £{reservation.original_price}</span>
                  </div>
                  <input
                    type="number"
                    value={askAmount}
                    onChange={(e) => setAskAmount(e.target.value)}
                    className="w-full bg-onyx-800 border border-onyx-700 rounded-md px-4 py-2 text-ivory-100 focus:outline-none focus:ring-2 focus:ring-gold-600 focus:border-transparent"
                    placeholder={`Current ask: £${reservation.price}`}
                    min="1"
                    step="1"
                  />
                </div>
                
                <div className="mb-6 p-3 bg-onyx-800/50 rounded-md text-ivory-400 text-sm">
                  <p>You are updating the ask price for: <span className="text-ivory-200">{reservation.restaurant_name}</span></p>
                  <p className="mt-1">
                    {reservation.date} at {reservation.time} • {reservation.party_size} {reservation.party_size === 1 ? 'person' : 'people'}
                  </p>
                  {!isOwner && (
                    <p className="mt-2 text-red-500">You must own this reservation to update its price.</p>
                  )}
                </div>
                
                <div className="flex justify-end space-x-3">
                  <Button
                    variant="ghost"
                    onClick={() => setShowAskModal(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="primary"
                    onClick={handlePlaceAsk}
                    isLoading={isLoading}
                    disabled={!isOwner}
                  >
                    {isOwner ? 'Update Price' : 'List Reservation'}
                  </Button>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      )}

      {/* Auth Prompt Modal */}
      {showAuthPrompt && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-screen items-end justify-center p-4 text-center sm:items-center sm:p-0">
            <div className="fixed inset-0 bg-onyx-950/80 transition-opacity" onClick={() => setShowAuthPrompt(false)}></div>
            
            <motion.div 
              className="relative transform overflow-hidden rounded-lg bg-onyx-900 border border-onyx-800 px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-md sm:p-6"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
            >
              <div className="text-center sm:mt-5">
                <h3 className="text-xl font-semibold mb-2 text-ivory-100 font-display">
                  {authAction === 'bid' ? 'Ready to place a bid?' : 
                   authAction === 'buy' ? 'Ready to purchase this reservation?' : 
                   'Ready to sell your reservation?'}
                </h3>
                
                <div className="mt-2">
                  <p className="text-ivory-300">
                    You need to sign in or create an account to {
                      authAction === 'bid' ? 'place bids' : 
                      authAction === 'buy' ? 'purchase reservations' : 
                      'sell reservations'
                    } on ResSwaps.
                  </p>
                </div>

                <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
                  <Button
                    variant="gold"
                    onClick={() => navigate('/auth')}
                  >
                    Sign In
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setShowAuthPrompt(false)}
                  >
                    Continue Browsing
                  </Button>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReservationDetailPage; 