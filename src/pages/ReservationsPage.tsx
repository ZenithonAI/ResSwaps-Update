import { useState, useEffect } from 'react';
import { useReservations } from '../context/ReservationContext';
import ReservationCard from '../components/ReservationCard';
import Button from '../components/Button';
import { Filter as FilterIcon, Plus, Search, X, Info } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useUser } from '../context/UserContext';

const ReservationsPage = () => {
  const { reservations, isLoading } = useReservations();
  const { isAuthenticated } = useUser();
  const navigate = useNavigate();
  
  const [showFilters, setShowFilters] = useState(false);
  const [filteredReservations, setFilteredReservations] = useState(reservations);
  const [filters, setFilters] = useState({
    location: '',
    cuisine: '',
    minPrice: '',
    maxPrice: '',
    date: '',
  });
  
  const [showAuthBanner, setShowAuthBanner] = useState(!isAuthenticated);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    // Apply filters
    if (reservations) {
      let result = [...reservations];
      
      if (filters.location) {
        result = result.filter(res => 
          res.location.toLowerCase().includes(filters.location.toLowerCase())
        );
      }
      
      if (filters.cuisine) {
        result = result.filter(res => 
          res.cuisine.toLowerCase().includes(filters.cuisine.toLowerCase())
        );
      }
      
      if (filters.minPrice) {
        result = result.filter(res => res.price >= parseInt(filters.minPrice));
      }
      
      if (filters.maxPrice) {
        result = result.filter(res => res.price <= parseInt(filters.maxPrice));
      }
      
      if (filters.date) {
        result = result.filter(res => {
          const filterDate = new Date(filters.date);
          const resDate = new Date(res.date);
          return filterDate.toDateString() === resDate.toDateString();
        });
      }
      
      setFilteredReservations(result);
    }
  }, [reservations, filters]);
  
  const handleViewDetails = (id: string) => {
    navigate(`/reservations/${id}`);
  };
  
  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  const clearFilters = () => {
    setFilters({
      location: '',
      cuisine: '',
      minPrice: '',
      maxPrice: '',
      date: '',
    });
  };
  
  return (
    <div className="max-w-7xl mx-auto">
      {/* Auth Banner for non-authenticated users */}
      {showAuthBanner && (
        <div className="bg-glass mb-6 rounded-premium p-4 border border-gold-800/30 shadow-glass">
          <div className="flex items-center">
            <div className="flex-shrink-0 mr-4">
              <Info className="h-5 w-5 text-gold-500" />
            </div>
            <div className="flex-1">
              <p className="text-ivory-200">
                Create an account to place bids or buy reservations instantly.
              </p>
            </div>
            <div className="flex-shrink-0 flex space-x-2">
              <Button 
                variant="gold" 
                size="sm" 
                onClick={() => navigate('/auth')}
              >
                Sign Up
              </Button>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setShowAuthBanner(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      )}
      
      {/* Header & Create Button */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-ivory-50 mb-2 font-display">Reservations</h1>
          <p className="text-ivory-300">Browse premium restaurant reservations available for purchase</p>
        </div>
        
        {isAuthenticated && (
          <Button 
            variant="primary" 
            rightIcon={<Plus className="h-4 w-4" />} 
            className="mt-4 md:mt-0"
            onClick={() => navigate('/dashboard')}
          >
            Create Listing
          </Button>
        )}
      </div>
      
      {/* Filters */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <Button 
            variant="ghost" 
            leftIcon={<FilterIcon className="h-4 w-4" />}
            onClick={() => setShowFilters(!showFilters)}
          >
            {showFilters ? 'Hide Filters' : 'Show Filters'}
          </Button>
          
          {showFilters && (
            <Button 
              variant="ghost" 
              onClick={clearFilters}
              size="sm"
            >
              Clear All
            </Button>
          )}
        </div>
        
        <AnimatePresence>
          {showFilters && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="overflow-hidden"
            >
              <div className="bg-glass backdrop-blur-md rounded-premium p-6 border border-onyx-800/30 mb-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                  <div>
                    <label className="block text-ivory-300 text-sm mb-2" htmlFor="location">
                      Location
                    </label>
                    <input 
                      type="text" 
                      id="location"
                      name="location"
                      value={filters.location}
                      onChange={handleFilterChange}
                      className="w-full bg-onyx-900 border border-onyx-800 rounded-premium px-3 py-2 text-ivory-200 focus:outline-none focus:ring-1 focus:ring-gold-600 focus:border-transparent"
                      placeholder="City or Area"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-ivory-300 text-sm mb-2" htmlFor="cuisine">
                      Cuisine
                    </label>
                    <input 
                      type="text" 
                      id="cuisine"
                      name="cuisine"
                      value={filters.cuisine}
                      onChange={handleFilterChange}
                      className="w-full bg-onyx-900 border border-onyx-800 rounded-premium px-3 py-2 text-ivory-200 focus:outline-none focus:ring-1 focus:ring-gold-600 focus:border-transparent"
                      placeholder="Type of cuisine"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-ivory-300 text-sm mb-2" htmlFor="minPrice">
                      Min Price
                    </label>
                    <input 
                      type="number" 
                      id="minPrice"
                      name="minPrice"
                      value={filters.minPrice}
                      onChange={handleFilterChange}
                      className="w-full bg-onyx-900 border border-onyx-800 rounded-premium px-3 py-2 text-ivory-200 focus:outline-none focus:ring-1 focus:ring-gold-600 focus:border-transparent"
                      placeholder="€"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-ivory-300 text-sm mb-2" htmlFor="maxPrice">
                      Max Price
                    </label>
                    <input 
                      type="number" 
                      id="maxPrice"
                      name="maxPrice"
                      value={filters.maxPrice}
                      onChange={handleFilterChange}
                      className="w-full bg-onyx-900 border border-onyx-800 rounded-premium px-3 py-2 text-ivory-200 focus:outline-none focus:ring-1 focus:ring-gold-600 focus:border-transparent"
                      placeholder="€"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-ivory-300 text-sm mb-2" htmlFor="date">
                      Date
                    </label>
                    <input 
                      type="date" 
                      id="date"
                      name="date"
                      value={filters.date}
                      onChange={handleFilterChange}
                      className="w-full bg-onyx-900 border border-onyx-800 rounded-premium px-3 py-2 text-ivory-200 focus:outline-none focus:ring-1 focus:ring-gold-600 focus:border-transparent"
                    />
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      
      {/* Search Results */}
      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <div className="loader"></div>
        </div>
      ) : error ? (
        <div className="bg-red-900/20 text-red-300 p-4 rounded-premium border border-red-900/30">
          {error}
        </div>
      ) : (
        <>
          <div className="mb-6">
            <p className="text-ivory-300">
              {filteredReservations.length} reservations found
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
            {filteredReservations.map(reservation => (
              <ReservationCard 
                key={reservation.id}
                reservation={reservation}
                onViewDetails={() => handleViewDetails(reservation.id)}
                isAuthenticated={isAuthenticated}
              />
            ))}
          </div>
          
          {filteredReservations.length === 0 && (
            <div className="bg-glass backdrop-blur-md rounded-premium p-8 text-center border border-onyx-800/30">
              <h3 className="text-xl font-medium text-ivory-100 mb-2">No Reservations Found</h3>
              <p className="text-ivory-300 mb-6">
                Try adjusting your filters or check back later for new listings.
              </p>
              <Button variant="outline" onClick={clearFilters}>
                Clear Filters
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default ReservationsPage;