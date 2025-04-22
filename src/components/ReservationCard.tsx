import { formatDistance as formatDateDistance } from '../utils/dateUtils'; // Renamed to avoid conflict
import { Reservation } from '../context/ReservationContext';
import Button from './Button';
import { Clock, Users, Star, MapPin, TrendingUp, Gavel } from 'lucide-react'; // Removed unused imports
import { motion } from 'framer-motion';
import { formatDistanceToNow } from '../utils/dateUtils';
import { twMerge } from 'tailwind-merge'; // For merging classes

// Define type for reservation including distance
type ReservationWithDistance = Reservation & { distance?: number }; // Distance is optional

interface ReservationCardProps {
  reservation: ReservationWithDistance; // Use the extended type
  onViewDetails?: (id: string) => void;
  isFeatured?: boolean;
  // Removed unused isAuthenticated prop
  distance?: number; // Explicitly accept distance prop
  className?: string; // Allow passing additional classes
}

const ReservationCard = ({
  reservation,
  onViewDetails,
  isFeatured = false,
  // Removed unused isAuthenticated
  distance,
  className
}: ReservationCardProps) => {
  const {
    id,
    restaurantName,
    location, // City/Area Name
    cuisine,
    date,
    time,
    partySize,
    price,
    originalPrice,
    imageUrl,
    popularity,
    allowBidding,
    currentBid,
    stockRemaining,
    lastSalePrice,
    lastSaleDate
  } = reservation;

  const discountPercentage = originalPrice && originalPrice > 0 ? Math.round((1 - price / originalPrice) * 100) : 0;
  const isDiscounted = originalPrice && price < originalPrice;
  const timeUntil = formatDateDistance(date);
  const lastSaleTime = lastSaleDate ? formatDistanceToNow(lastSaleDate) : null;

  // Format distance
  const formattedDistance = distance !== undefined
    ? `${distance.toFixed(1)} km away`
    : null;

  // Card hover animation
  const cardVariants = {
    rest: { scale: 1, y: 0, boxShadow: '0 4px 15px rgba(0, 0, 0, 0.1)' },
    hover: {
      scale: 1.03,
      y: -6,
      boxShadow: '0 10px 25px rgba(184, 134, 11, 0.2)' // Subtle gold shadow on hover
    }
  };

  const tagVariants = {
    hidden: { opacity: 0, scale: 0.8 },
    visible: { opacity: 1, scale: 1, transition: { duration: 0.3 } }
  };

  return (
    <motion.div
      className={twMerge(
        "bg-onyx-900 border border-onyx-800/60 rounded-xl overflow-hidden cursor-pointer group",
        "flex flex-col h-full shadow-md transition-shadow duration-300 ease-in-out", // Added transition
        className
      )}
      variants={cardVariants}
      initial="rest"
      whileHover="hover"
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      onClick={() => onViewDetails && onViewDetails(id)}
      layout // Add layout prop for smooth animations when list reorders
    >
      {/* Image section */}
      <div className="relative overflow-hidden h-56"> {/* Fixed height */}
        <motion.img
          src={imageUrl || 'https://images.pexels.com/photos/260922/pexels-photo-260922.jpeg'}
          alt={`Dining experience at ${restaurantName}`}
          className="absolute inset-0 w-full h-full object-cover transition-transform duration-300 ease-in-out group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent pointer-events-none"></div>

        {/* Top Badges Overlay */}
        <div className="absolute top-3 left-3 right-3 flex justify-between items-start z-10 pointer-events-none">
          {/* Left Badges */}
          <div className="flex flex-col gap-1.5 items-start">
            {isFeatured && (
              <motion.span
                variants={tagVariants} initial="hidden" animate="visible"
                className="bg-gradient-to-r from-gold-600 to-gold-400 text-onyx-950 text-[11px] font-bold px-2.5 py-1 rounded-full shadow-sm flex items-center pointer-events-auto"
              >
                <Star className="h-3 w-3 mr-1 fill-current" />
                Premium
              </motion.span>
            )}
             {allowBidding && (
              <motion.span
                variants={tagVariants} initial="hidden" animate="visible" transition={{ delay: 0.1 }}
                className="bg-indigo-600/80 backdrop-blur-sm text-indigo-100 text-[11px] font-medium px-2.5 py-1 rounded-full shadow-sm border border-indigo-500/50 flex items-center pointer-events-auto"
                >
                 <Gavel className="h-3 w-3 mr-1.5" /> Bidding Open
               </motion.span>
             )}
          </div>

          {/* Right Badges */}
          <div className="flex flex-col gap-1.5 items-end">
            {isDiscounted && (
              <motion.span
                variants={tagVariants} initial="hidden" animate="visible"
                className="bg-red-700/80 backdrop-blur-sm text-red-100 text-xs font-bold px-2.5 py-1 rounded-full shadow-sm border border-red-600/50 pointer-events-auto"
              >
                {discountPercentage}% OFF
              </motion.span>
            )}
             {stockRemaining !== undefined && stockRemaining <= 5 && (
              <motion.span
                variants={tagVariants} initial="hidden" animate="visible" transition={{ delay: 0.1 }}
                className="bg-onyx-800/70 backdrop-blur-sm text-ivory-300 text-[11px] font-medium px-2.5 py-1 rounded-full shadow-sm border border-onyx-700/50 mt-1 pointer-events-auto"
                >
                 Only {stockRemaining} left!
               </motion.span>
             )}
          </div>
        </div>

        {/* Bottom Overlays */}
        <div className="absolute bottom-3 left-3 right-3 flex justify-between items-end z-10 text-ivory-100 pointer-events-none">
           {formattedDistance && (
             <motion.span
              variants={tagVariants} initial="hidden" animate="visible" transition={{ delay: 0.2 }}
              className="bg-onyx-900/70 backdrop-blur-sm text-xs font-medium px-2.5 py-1 rounded-full shadow-sm border border-onyx-700/50 flex items-center pointer-events-auto"
              >
               <MapPin className="h-3.5 w-3.5 mr-1 text-gold-500" /> {formattedDistance}
             </motion.span>
           )}
          <motion.span
            variants={tagVariants} initial="hidden" animate="visible" transition={{ delay: 0.3 }}
            className="bg-onyx-900/70 backdrop-blur-sm text-xs font-medium px-2.5 py-1 rounded-full shadow-sm border border-onyx-700/50 flex items-center pointer-events-auto"
            >
             <Clock className="h-3.5 w-3.5 mr-1.5" /> {timeUntil}
           </motion.span>
        </div>
      </div>

      {/* Content section */}
      <div className="p-4 flex flex-col flex-grow"> {/* Flex grow pushes button down */}
        <div className="flex justify-between items-start mb-1.5">
          <h3 className="text-lg font-semibold text-ivory-50 leading-tight group-hover:text-gold-400 transition-colors duration-200">
            {restaurantName}
          </h3>
          {popularity !== undefined && (
             <div className="text-xs font-medium px-2 py-0.5 rounded-full bg-onyx-800 text-gold-500 border border-gold-800/50 flex items-center flex-shrink-0 ml-2">
               <TrendingUp className="h-3 w-3 mr-1"/> {popularity}%
             </div>
           )}
        </div>
        <p className="text-sm text-ivory-400 mb-3 font-light flex items-center">
          <MapPin className="h-3.5 w-3.5 mr-1.5 text-ivory-500 flex-shrink-0"/> {location} • {cuisine}
        </p>
        <div className="text-sm text-ivory-300 mb-4 font-light flex items-center">
            <Users className="h-3.5 w-3.5 mr-1.5 text-ivory-500 flex-shrink-0"/> Table for {partySize} @ {time}
        </div>

        {/* Price/Bid Section */}
        <div className="mt-auto pt-4 border-t border-onyx-800/60">
           {allowBidding ? (
             <div className="flex justify-between items-center">
               <div>
                 <p className="text-xs text-ivory-500 mb-0.5">Current Bid</p>
                 <p className="text-xl font-bold text-gold-400">${currentBid?.toFixed(2) ?? price.toFixed(2)}</p>
               </div>
               <Button
                 variant="outline" // Fixed variant type to match Button component
                 size="sm"
                 onClick={(e) => { e.stopPropagation(); onViewDetails && onViewDetails(id); }}
                 className="flex items-center text-gold-500 border-gold-500 hover:bg-gold-500/10"
                 aria-label={`View details and bid for ${restaurantName}`}
               >
                 <Gavel className="h-4 w-4 mr-1.5" /> Bid Now
               </Button>
             </div>
           ) : (
             <div className="flex justify-between items-center">
                <div>
                  <p className="text-xs text-ivory-500 mb-0.5">Price</p>
                  <p className="text-xl font-bold text-gold-400">${price.toFixed(2)}</p>
                  {isDiscounted && originalPrice && (
                    <p className="text-xs text-ivory-500 line-through">${originalPrice.toFixed(2)}</p>
                  )}
                </div>
                <Button
                  variant="gold"
                  size="sm"
                  onClick={(e) => { e.stopPropagation(); onViewDetails && onViewDetails(id); }}
                  aria-label={`View details for ${restaurantName}`}
                >
                  View Details
                </Button>
              </div>
           )}
            {lastSalePrice && lastSaleTime && (
              <p className="text-[11px] text-ivory-500 mt-2 text-right">
                Last sold for ${lastSalePrice.toFixed(2)} ({lastSaleTime})
              </p>
            )}
        </div>
      </div>
    </motion.div>
  );
};

export default ReservationCard;