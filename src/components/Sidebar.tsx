import { Link, useLocation } from 'react-router-dom';
import { Home, BarChart3, Bell, User, CalendarDays, X, Glasses as GlassFull, PieChart, Clipboard, ArrowRight, Shield } from 'lucide-react';
import { useUser } from '../context/UserContext';
import { motion } from 'framer-motion';

interface SidebarProps {
  mobile?: boolean;
  onClose?: () => void;
}

interface NavItem {
  name: string;
  icon: any;
  href: string;
  requiresAuth?: boolean;
  requiredRole?: 'user' | 'admin';
}

const Sidebar = ({ mobile = false, onClose }: SidebarProps) => {
  const location = useLocation();
  const { user, isAuthenticated } = useUser();

  const navigation: NavItem[] = [
    { name: 'Home', icon: Home, href: '/' }, // All users
    { name: 'Reservations', icon: Clipboard, href: '/reservations' }, // All users
    { name: 'Dashboard', icon: CalendarDays, href: '/dashboard', requiresAuth: true }, // Authenticated users only
    { name: 'Alerts', icon: Bell, href: '/alerts', requiresAuth: true }, // Authenticated users only
    { name: 'Profile', icon: User, href: '/profile', requiresAuth: true }, // Authenticated users only
    { name: 'Admin', icon: Shield, href: '/admin', requiresAuth: true, requiredRole: 'admin' }, // Admin users only
  ];

  // Filter navigation items based on authentication status and role
  const filteredNavigation = navigation.filter(item => {
    // Always show non-auth required items
    if (!item.requiresAuth) return true;

    // Filter out admin items for non-admins
    if (item.requiredRole === 'admin' && (!isAuthenticated || user?.role !== 'admin')) {
      return false;
    }

    // Hide profile for non-authenticated users
    if (item.name === 'Profile' && !isAuthenticated) {
      return false;
    }

    // Show all other auth-required items regardless of auth status
    // (ProtectedRoute will handle displaying a banner for auth-required pages)
    return true;
  });

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  const sidebarVariants = {
    hidden: { x: mobile ? -300 : 0, opacity: mobile ? 0 : 1 },
    visible: { 
      x: 0, 
      opacity: 1, 
      transition: { 
        duration: 0.3, 
        type: "spring", 
        stiffness: 500, 
        damping: 40 
      } 
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: (i: number) => ({ 
      opacity: 1, 
      x: 0, 
      transition: { 
        delay: i * 0.1,
        duration: 0.5,
        ease: "easeOut"
      } 
    })
  };

  return (
    <motion.div 
      className="w-64 h-full bg-onyx-950 text-ivory-50 shadow-xl border-r border-ivory-900"
      variants={sidebarVariants}
      initial="hidden"
      animate="visible"
    >
      {mobile && (
        <div className="flex items-center justify-between px-4 pt-5 pb-2">
          <div className="flex-shrink-0 flex items-center">
            <GlassFull className="h-7 w-7 text-gold-600 mr-2" />
            <span className="text-ivory-50 text-2xl font-bold font-display">
              Res<span className="text-gold-600">Swaps</span>
            </span>
          </div>
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            type="button"
            className="ml-1 flex items-center justify-center h-10 w-10 rounded-full focus:outline-none focus:ring-2 focus:ring-gold-600"
            onClick={onClose}
          >
            <span className="sr-only">Close sidebar</span>
            <X className="h-6 w-6 text-ivory-300" aria-hidden="true" />
          </motion.button>
        </div>
      )}

      <div className={`${mobile ? 'px-2 pt-2' : 'px-4 pt-6'}`}>
        {!mobile && (
          <div className="flex flex-shrink-0 items-center px-4 mb-8 pt-6">
            <GlassFull className="h-7 w-7 text-gold-600 mr-2" />
            <span className="text-ivory-50 text-2xl font-bold font-display">
              Res<span className="text-gold-600">Swaps</span>
            </span>
          </div>
        )}

        <div className="mt-8 flex flex-col flex-1">
          <nav className="flex-1 space-y-2">
            {filteredNavigation.map((item, i) => (
              <motion.div 
                key={item.name}
                custom={i}
                variants={itemVariants}
                initial="hidden"
                animate="visible"
              >
                <Link
                  to={item.href}
                  className={`${
                    isActive(item.href)
                      ? 'bg-gold-900/20 text-gold-500 border-l-2 border-gold-600'
                      : 'text-ivory-300 hover:bg-ivory-900/30 hover:text-gold-400 border-l-2 border-transparent'
                  } group flex items-center px-4 py-3 text-sm font-medium transition-premium duration-300`}
                  onClick={mobile && onClose ? onClose : undefined}
                >
                  <item.icon
                    className={`mr-3 h-5 w-5 flex-shrink-0 ${
                      isActive(item.href) ? 'text-gold-600' : 'text-ivory-500 group-hover:text-gold-500'
                    }`}
                  />
                  {item.name}
                </Link>
              </motion.div>
            ))}
          </nav>
        </div>
      </div>

      <div className="m-4 mt-auto pb-6">
        {user ? (
          <div className="flex items-center p-4 bg-glass rounded-premium backdrop-blur-xs">
            <div className="flex-shrink-0">
              {user.avatar ? (
                <img
                  className="h-10 w-10 rounded-full object-cover border border-gold-700/50"
                  src={user.avatar}
                  alt={user.name}
                />
              ) : (
                <div className="h-10 w-10 rounded-full bg-onyx-800 flex items-center justify-center border border-gold-700/30">
                  <User className="h-6 w-6 text-gold-500" />
                </div>
              )}
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-ivory-100">{user.name}</p>
              <p className="text-xs font-medium text-ivory-400 capitalize">{user.role}</p>
            </div>
          </div>
        ) : (
          <Link
            to="/auth"
            className="flex items-center justify-center px-4 py-2 border border-transparent rounded-premium shadow-sm text-sm font-medium text-onyx-950 bg-gold-600 hover:bg-gold-500 transition-premium"
          >
            Sign in
          </Link>
        )}

        <div className="mt-6 px-2">
          <p className="text-xs text-ivory-500 mb-2">Trending Cities</p>
          <div className="space-y-1.5">
            {['Paris', 'London', 'New York', 'Tokyo'].map((city, i) => (
              <Link 
                key={city} 
                to={`/reservations?location=${city}`}
                className="flex items-center justify-between text-xs text-ivory-300 hover:text-gold-500 transition-colors duration-150 py-1"
              >
                <span>{city}</span>
                <ArrowRight className="h-3 w-3" />
              </Link>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default Sidebar;