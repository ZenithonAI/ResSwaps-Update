import { useState, useMemo } from 'react';
import { useReservations, Reservation } from '../context/ReservationContext';
import ReservationCard from '../components/ReservationCard';
import Button from '../components/Button';
import { 
  ArrowRight,
  RefreshCw, 
  MapPin, 
  Search, 
  Calendar, 
  Users, 
  ChefHat, 
  GlassWater,
  Globe,
  Gavel
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useUser } from '../context/UserContext';
import { useUserLocation } from '../hooks/useUserLocation';
import { calculateDistance } from '../utils/distance';
import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';

// Extended Reservation type with distance
type ReservationWithDistance = Reservation & { 
  distance?: number;
  isFeatured?: boolean;
};

const HomePage = () => {
  const { featuredReservations, isLoading, fetchReservations } = useReservations();
  const { isAuthenticated } = useUser();
  const navigate = useNavigate();
  const {
    coordinates: userCoordinates,
    error: locationError,
    status: locationStatus,
    requestLocation
  } = useUserLocation();

  // Search filter states
  const [location, setLocation] = useState('');
  const [cuisine, setCuisine] = useState('');
  const [date, setDate] = useState('');
  const [tableSize, setTableSize] = useState('');
  const [maxDistance, setMaxDistance] = useState<number | null>(null);

  // Example data arrays
  const cities = ['New York', 'London', 'Madrid', 'Barcelona', 'Berlin', 'Amsterdam', 'Miami', 'Los Angeles', 'Dubai'];
  const cuisines = ['French', 'Italian', 'Spanish', 'British', 'German', 'Japanese', 'Chinese', 'Indian', 'Mexican', 'Thai', 'Mediterranean', 'American'];
  const partySizes = ['2', '3', '4', '5', '6', '7', '8', '10+'];
  const distanceOptions = [
    { label: 'Any distance', value: null },
    { label: 'Within 5 km', value: 5 },
    { label: 'Within 10 km', value: 10 },
    { label: 'Within 25 km', value: 25 }
  ];

  const handleSearch = () => {
    const params = new URLSearchParams();
    if (location) params.append('location', location);
    if (tableSize) params.append('partySize', tableSize);
    if (cuisine) params.append('cuisine', cuisine);
    if (date) params.append('date', date);
    if (maxDistance) params.append('maxDistance', maxDistance.toString());
    
    navigate(`/reservations?${params.toString()}`);
  };
  
  const handleViewDetails = (id: string) => {
    navigate(`/reservations/${id}`);
  };

  // Framer Motion variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.07, delayChildren: 0.2 }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { 
      y: 0, 
      opacity: 1, 
      transition: { 
        type: 'spring', 
        stiffness: 90, 
        damping: 15 
      } 
    }
  };

  const heroTextVariants = {
    hidden: { y: 30, opacity: 0 },
    visible: { 
      y: 0, 
      opacity: 1, 
      transition: { 
        duration: 0.7, 
        ease: "easeOut" 
      } 
    }
  };

  const searchBarVariants = {
    hidden: { y: 20, opacity: 0, scale: 0.95 },
    visible: { 
      y: 0, 
      opacity: 1, 
      scale: 1, 
      transition: { 
        duration: 0.6, 
        delay: 0.3, 
        ease: "easeOut" 
      } 
    }
  };

  // Filter and sort featured reservations by distance
  const sortedFeaturedReservations: ReservationWithDistance[] = useMemo(() => {
    // First handle the case where we don't have user coordinates
    if (!userCoordinates) {
      return [...featuredReservations].sort((a, b) => (b.popularity ?? 0) - (a.popularity ?? 0));
    }
    
    // Process reservations with coordinates
    let reservationsWithDistance = featuredReservations
      .filter(r => r.latitude && r.longitude)
      .map(r => ({
        ...r,
        distance: calculateDistance(
          userCoordinates.latitude,
          userCoordinates.longitude,
          r.latitude!,
          r.longitude!
        )
      }));
    
    // Filter by max distance if set
    if (maxDistance !== null) {
      reservationsWithDistance = reservationsWithDistance.filter(r => 
        r.distance !== undefined && r.distance <= maxDistance
      );
    }

    // Sort by distance
    reservationsWithDistance.sort((a, b) => (a.distance ?? Infinity) - (b.distance ?? Infinity));
    
    // Get reservations without coordinates, sorted by popularity
    const reservationsWithoutCoords = featuredReservations
      .filter(r => !r.latitude || !r.longitude)
      .sort((a, b) => (b.popularity ?? 0) - (a.popularity ?? 0));
    
    // Only include reservations without coordinates if we're not filtering by distance
    const finalReservations = maxDistance === null 
      ? [...reservationsWithDistance, ...reservationsWithoutCoords]
      : reservationsWithDistance;
      
    return finalReservations;
  }, [featuredReservations, userCoordinates, maxDistance]);

  // Generate skeleton cards for loading state
  const renderSkeletonCards = (count: number = 8) => (
    Array.from({ length: count }).map((_, index) => (
      <motion.div key={`skeleton-${index}`} variants={itemVariants} className="flex flex-col h-full">
        <div className="bg-onyx-900 border border-onyx-800/60 rounded-xl overflow-hidden shadow-lg h-full">
          <Skeleton height={224} className="bg-onyx-800" />
          <div className="p-4 flex flex-col flex-grow">
            <Skeleton height={24} width="70%" className="bg-onyx-800 mb-2" />
            <Skeleton height={16} width="50%" className="bg-onyx-800 mb-4" />
            <Skeleton height={16} width="60%" className="bg-onyx-800 mb-4" />
            <div className="mt-auto pt-4 border-t border-onyx-800/60">
              <div className="flex justify-between items-center">
                <Skeleton height={30} width={80} className="bg-onyx-800" />
                <Skeleton height={36} width={90} className="bg-onyx-800" />
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    ))
  );

  // Check if location status is still pending (user hasn't made a choice yet)
  const showLocationPrompt = locationStatus === 'idle';

  return (
    <div className="min-h-screen pb-12">
      {/* Hero Section */}
      <motion.section
        className="relative overflow-hidden mb-16"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
      >
        <div className="absolute inset-0 z-0">
          <img
            src="https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1770&q=80"
            alt="Elegant restaurant interior with mood lighting"
            className="w-full h-full object-cover"
          />
          {/* Sophisticated gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-br from-onyx-950/90 via-onyx-950/70 to-black/50"></div>
          
          {/* Subtle gold accent lighting */}
          <div className="absolute -top-1/4 -right-1/4 w-1/2 h-1/2 bg-gold-800/10 rounded-full blur-[100px] opacity-40"></div>
          <div className="absolute -bottom-1/4 -left-1/4 w-1/2 h-1/2 bg-indigo-900/10 rounded-full blur-[100px] opacity-30"></div>
        </div>
        
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 md:py-32 lg:py-40">
          <motion.div
            initial="hidden"
            animate="visible"
            variants={{ visible: { transition: { staggerChildren: 0.15 } } }}
            className="text-center"
          >
            <motion.h1
              variants={heroTextVariants}
              className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight text-ivory-50 mb-4 font-display leading-tight"
            >
              Experience <span className="text-gold-400">Extraordinary</span> Dining
            </motion.h1>
            
            <motion.p
              variants={heroTextVariants}
              className="text-lg md:text-xl text-ivory-300 mb-10 max-w-3xl mx-auto font-light"
            >
              Secure coveted reservations at top restaurants or monetize your premium bookings.
            </motion.p>

            {/* Enhanced Search Filters */}
            <motion.div
              variants={searchBarVariants}
              className="bg-onyx-950/60 backdrop-blur-lg border border-onyx-700/40 rounded-xl p-5 md:p-6 max-w-5xl mx-auto shadow-2xl"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3 md:gap-4">
                {/* Date Filter */}
                <div className="relative group">
                  <label className="absolute -top-2 left-2.5 text-[10px] font-medium text-ivory-400 bg-onyx-900/90 px-1.5 py-0.5 rounded z-10">
                    Date
                  </label>
                  <div className="flex items-center bg-onyx-800/80 border border-onyx-700 group-focus-within:border-gold-600 rounded-lg px-3 py-2 h-[46px] transition duration-200 ease-in-out">
                    <Calendar className="h-4 w-4 text-gold-500 mr-2.5 flex-shrink-0" />
                    <select
                      className="w-full bg-transparent text-ivory-50 text-sm appearance-none focus:outline-none"
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      aria-label="Select date"
                    >
                      <option value="">Any Date</option>
                      <option value="today">Today</option>
                      <option value="tomorrow">Tomorrow</option>
                      <option value="this-week">This Week</option>
                      <option value="next-week">Next Week</option>
                    </select>
                  </div>
                </div>

                {/* Party Size Filter */}
                <div className="relative group">
                  <label className="absolute -top-2 left-2.5 text-[10px] font-medium text-ivory-400 bg-onyx-900/90 px-1.5 py-0.5 rounded z-10">
                    Guests
                  </label>
                  <div className="flex items-center bg-onyx-800/80 border border-onyx-700 group-focus-within:border-gold-600 rounded-lg px-3 py-2 h-[46px] transition duration-200 ease-in-out">
                    <Users className="h-4 w-4 text-gold-500 mr-2.5 flex-shrink-0" />
                    <select
                      className="w-full bg-transparent text-ivory-50 text-sm appearance-none focus:outline-none"
                      value={tableSize}
                      onChange={(e) => setTableSize(e.target.value)}
                      aria-label="Select party size"
                    >
                      <option value="">Any Size</option>
                      {partySizes.map((size) => (
                        <option key={size} value={size}>
                          {size} {parseInt(size, 10) === 1 ? 'guest' : 'guests'}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Location Filter */}
                <div className="relative group">
                  <label className="absolute -top-2 left-2.5 text-[10px] font-medium text-ivory-400 bg-onyx-900/90 px-1.5 py-0.5 rounded z-10">
                    Location
                  </label>
                  <div className="flex items-center bg-onyx-800/80 border border-onyx-700 group-focus-within:border-gold-600 rounded-lg px-3 py-2 h-[46px] transition duration-200 ease-in-out">
                    <Globe className="h-4 w-4 text-gold-500 mr-2.5 flex-shrink-0" />
                    <select
                      className="w-full bg-transparent text-ivory-50 text-sm appearance-none focus:outline-none"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      aria-label="Select location"
                    >
                      <option value="">Any City</option>
                      {cities.map((city) => (
                        <option key={city} value={city}>{city}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Cuisine Filter */}
                <div className="relative group">
                  <label className="absolute -top-2 left-2.5 text-[10px] font-medium text-ivory-400 bg-onyx-900/90 px-1.5 py-0.5 rounded z-10">
                    Cuisine
                  </label>
                  <div className="flex items-center bg-onyx-800/80 border border-onyx-700 group-focus-within:border-gold-600 rounded-lg px-3 py-2 h-[46px] transition duration-200 ease-in-out">
                    <ChefHat className="h-4 w-4 text-gold-500 mr-2.5 flex-shrink-0" />
                    <select
                      className="w-full bg-transparent text-ivory-50 text-sm appearance-none focus:outline-none"
                      value={cuisine}
                      onChange={(e) => setCuisine(e.target.value)}
                      aria-label="Select cuisine"
                    >
                      <option value="">Any Cuisine</option>
                      {cuisines.map((cuisineType) => (
                        <option key={cuisineType} value={cuisineType}>{cuisineType}</option>
                      ))}
                    </select>
                  </div>
                </div>
                
                {/* Distance Filter - Only shown when user location is available */}
                {userCoordinates && (
                  <div className="relative group">
                    <label className="absolute -top-2 left-2.5 text-[10px] font-medium text-ivory-400 bg-onyx-900/90 px-1.5 py-0.5 rounded z-10">
                      Distance
                    </label>
                    <div className="flex items-center bg-onyx-800/80 border border-onyx-700 group-focus-within:border-gold-600 rounded-lg px-3 py-2 h-[46px] transition duration-200 ease-in-out">
                      <MapPin className="h-4 w-4 text-gold-500 mr-2.5 flex-shrink-0" />
                      <select
                        className="w-full bg-transparent text-ivory-50 text-sm appearance-none focus:outline-none"
                        value={maxDistance?.toString() || ''}
                        onChange={(e) => setMaxDistance(e.target.value ? parseInt(e.target.value, 10) : null)}
                        aria-label="Select maximum distance"
                      >
                        {distanceOptions.map((option) => (
                          <option 
                            key={option.label} 
                            value={option.value?.toString() || ''}
                          >
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                )}

                {/* Search Button */}
                <Button
                  variant="gold"
                  size="lg"
                  onClick={handleSearch}
                  className="w-full h-[46px] mt-2 sm:mt-0 lg:mt-0 flex items-center justify-center shadow-md hover:shadow-lg transition-shadow xl:col-span-1"
                  aria-label="Search reservations"
                >
                  <Search className="h-4 w-4 mr-2 flex-shrink-0" />
                  <span className="font-medium">Find Tables</span>
                </Button>
              </div>
            </motion.div>

            {/* Location Permission Prompt */}
            <AnimatePresence>
              {showLocationPrompt && !locationError && (
                <motion.div
                  className="mt-6 text-sm text-ivory-400 flex items-center justify-center gap-2"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ delay: 0.8 }}
                >
                  <MapPin className="h-4 w-4 text-gold-500" />
                  <span>Want to see restaurants near you?</span>
                  <button 
                    onClick={requestLocation} 
                    className="text-gold-500 hover:text-gold-400 font-medium underline focus:outline-none focus:ring-1 focus:ring-gold-500 rounded px-1"
                  >
                    Enable Location
                  </button>
                </motion.div>
              )}
              
              {locationError && (
                <motion.div
                  className="mt-6 text-sm text-red-400 flex items-center justify-center gap-2"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  <span>Error accessing location: {locationError}</span>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>
      </motion.section>

      {/* Main Content Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Action Banner for Authenticated Users */}
        {isAuthenticated && (
          <motion.section
            className="mb-12 p-6 bg-gradient-to-r from-onyx-800 to-onyx-900 rounded-xl shadow-lg border border-onyx-700/40 flex flex-col md:flex-row justify-between items-center gap-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
          >
            <div>
              <h2 className="text-xl font-semibold text-ivory-100 mb-1">Have a reservation you can't use?</h2>
              <p className="text-ivory-400 text-sm">List your booking and connect with eager diners.</p>
            </div>
            <Button
              variant="outline"
              onClick={() => navigate('/sell-reservation')}
              className="w-full md:w-auto text-gold-500 border-gold-500 hover:bg-gold-500/10"
            >
              List Your Reservation
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </motion.section>
        )}

        {/* Trending Reservations Section */}
        <section>
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center">
              <h2 className="text-2xl md:text-3xl font-bold text-ivory-100 font-display mr-3">
                Trending Tables
              </h2>
              {userCoordinates && maxDistance !== null && (
                <span className="text-sm text-ivory-400 py-1 px-2 bg-onyx-800 rounded-full">
                  Within {maxDistance} km
                </span>
              )}
            </div>
            <button
              onClick={() => fetchReservations()}
              className="text-gold-500 hover:text-gold-400 transition duration-150 flex items-center text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isLoading}
              aria-label="Refresh trending reservations"
            >
              <RefreshCw className={`h-4 w-4 mr-1.5 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>

          <motion.div
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            {isLoading ? (
              renderSkeletonCards(8)
            ) : (
              <AnimatePresence mode="wait">
                {sortedFeaturedReservations.length > 0 ? (
                  sortedFeaturedReservations.map((reservation) => (
                    <motion.div 
                      key={reservation.id} 
                      variants={itemVariants} 
                      layout
                      exit={{ opacity: 0, scale: 0.9 }}
                    >
                      <ReservationCard
                        reservation={reservation}
                        onViewDetails={handleViewDetails}
                        isFeatured={reservation.isFeatured}
                        distance={reservation.distance}
                      />
                    </motion.div>
                  ))
                ) : (
                  <motion.div
                    className="col-span-full text-center py-16 px-6 rounded-lg border border-onyx-800/60"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    <div className="flex flex-col items-center max-w-md mx-auto">
                      <GlassWater className="h-16 w-16 text-ivory-700 mb-4" />
                      <h3 className="text-xl font-semibold text-ivory-200 mb-2">No reservations found</h3>
                      <p className="text-ivory-400 mb-6 text-center">
                        {maxDistance !== null
                          ? `No trending reservations available within ${maxDistance} km of your location.`
                          : 'No trending reservations match your search criteria.'}
                      </p>
                      {maxDistance !== null && (
                        <button
                          onClick={() => setMaxDistance(null)}
                          className="text-gold-500 hover:text-gold-400 font-medium underline focus:outline-none"
                        >
                          View all locations
                        </button>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            )}
          </motion.div>
        </section>

        {/* How It Works Section */}
        <motion.section
          className="mt-20 mb-16"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="text-center mb-10">
            <h2 className="text-2xl md:text-3xl font-bold text-ivory-100 font-display mb-4">
              How ResSwaps Works
            </h2>
            <p className="text-ivory-400 max-w-2xl mx-auto">
              A premium marketplace connecting diners seeking exclusive reservations with those looking to swap or sell their bookings.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Step 1 */}
            <div className="bg-onyx-900/60 backdrop-blur-sm border border-onyx-800/60 rounded-xl p-6 shadow-lg flex flex-col items-center text-center">
              <div className="w-16 h-16 rounded-full bg-gold-900/30 mb-5 flex items-center justify-center">
                <Search className="h-8 w-8 text-gold-500" />
              </div>
              <h3 className="text-xl font-semibold text-ivory-100 mb-3">Find Reservations</h3>
              <p className="text-ivory-400 text-sm">
                Browse our curated selection of premium reservations at top restaurants, filter by date, location, party size, and cuisine.
              </p>
            </div>

            {/* Step 2 */}
            <div className="bg-onyx-900/60 backdrop-blur-sm border border-onyx-800/60 rounded-xl p-6 shadow-lg flex flex-col items-center text-center">
              <div className="w-16 h-16 rounded-full bg-gold-900/30 mb-5 flex items-center justify-center">
                <Gavel className="h-8 w-8 text-gold-500" />
              </div>
              <h3 className="text-xl font-semibold text-ivory-100 mb-3">Purchase or Bid</h3>
              <p className="text-ivory-400 text-sm">
                Secure your reservation instantly at the listed price, or place a bid on high-demand bookings and compete with other interested diners.
              </p>
            </div>

            {/* Step 3 */}
            <div className="bg-onyx-900/60 backdrop-blur-sm border border-onyx-800/60 rounded-xl p-6 shadow-lg flex flex-col items-center text-center">
              <div className="w-16 h-16 rounded-full bg-gold-900/30 mb-5 flex items-center justify-center">
                <ArrowRight className="h-8 w-8 text-gold-500" />
              </div>
              <h3 className="text-xl font-semibold text-ivory-100 mb-3">Dine with Confidence</h3>
              <p className="text-ivory-400 text-sm">
                Upon completion, reservation details are seamlessly transferred to your name. Simply arrive at the restaurant and enjoy your dining experience.
              </p>
            </div>
          </div>

          <div className="mt-12 text-center">
            <Button
              variant="outline"
              size="lg"
              onClick={() => navigate('/how-it-works')}
              className="text-gold-500 border-gold-500 hover:bg-gold-500/10"
            >
              Learn More About ResSwaps
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </motion.section>
      </div>
    </div>
  );
};

export default HomePage;
