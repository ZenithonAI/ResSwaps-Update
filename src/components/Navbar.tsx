import { Link } from 'react-router-dom';
import { Menu, Bell, User, Search, Glasses as GlassFull } from 'lucide-react';
import { useUser } from '../context/UserContext';
import { useAlerts } from '../context/AlertContext';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../utils/tailwindUtils';

interface NavbarProps {
  onMenuClick: () => void;
}

const Navbar = ({ onMenuClick }: NavbarProps) => {
  const { user, logout, isLoading } = useUser();
  const { alerts, unreadAlertsCount, markAlertAsRead } = useAlerts();
  const [alertsOpen, setAlertsOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  const toggleAlerts = () => {
    setAlertsOpen(!alertsOpen);
    setProfileOpen(false);
    setSearchOpen(false);
  };

  const toggleProfile = () => {
    setProfileOpen(!profileOpen);
    setAlertsOpen(false);
    setSearchOpen(false);
  };

  const toggleSearch = () => {
    setSearchOpen(!searchOpen);
    setAlertsOpen(false);
    setProfileOpen(false);
  };

  const dropdownVariants = {
    hidden: { opacity: 0, y: -10, scale: 0.95 },
    visible: { 
      opacity: 1, 
      y: 0, 
      scale: 1,
      transition: { 
        duration: 0.2, 
        ease: 'easeOut' 
      } 
    },
    exit: { 
      opacity: 0, 
      y: -10, 
      scale: 0.95,
      transition: { 
        duration: 0.15, 
        ease: 'easeIn' 
      } 
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  return (
    <header className="sticky top-0 z-10 backdrop-blur-md bg-onyx-950/5">
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-20">
          <div className="flex items-center">
            <button
              type="button"
              className="px-4 text-gold-400 hover:text-gold-500 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-gold-600 md:hidden"
              onClick={onMenuClick}
            >
              <span className="sr-only">Open sidebar</span>
              <Menu className="h-6 w-6" aria-hidden="true" />
            </button>
            
            {/* Logo has been removed */}
          </div>

          {/* Removed navigation links div here */}

          <div className="flex items-center space-x-3">
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={toggleSearch}
              className="relative p-2 rounded-full text-ivory-300 hover:text-gold-500 focus:outline-none focus:ring-2 focus:ring-gold-600 transition-premium"
              aria-label="Search"
            >
              <Search className="h-5 w-5" />
            </motion.button>

            <AnimatePresence>
              {searchOpen && (
                <motion.div 
                  className="absolute top-full left-0 right-0 p-4 bg-glass backdrop-blur-md backdrop-filter shadow-glass border-t border-ivory-800"
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.2 }}
                >
                  <div className="max-w-3xl mx-auto relative">
                    <input 
                      type="text" 
                      placeholder="Search for restaurants or cities..." 
                      className="w-full bg-onyx-900 border border-onyx-700 text-ivory-100 py-3 px-4 pr-10 rounded-premium focus:outline-none focus:ring-2 focus:ring-gold-600"
                      autoFocus
                    />
                    <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gold-600" />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={toggleAlerts}
              className="relative p-2 rounded-full text-ivory-300 hover:text-gold-500 focus:outline-none focus:ring-2 focus:ring-gold-600 transition-premium"
            >
              <span className="sr-only">View notifications</span>
              <Bell className="h-5 w-5" />
              {unreadAlertsCount > 0 && (
                <span className="absolute top-0 right-0 block h-2.5 w-2.5 rounded-full bg-gold-600 ring-2 ring-onyx-950"></span>
              )}
            </motion.button>

            <AnimatePresence>
              {alertsOpen && (
                <motion.div 
                  className="origin-top-right absolute right-4 top-16 w-80 rounded-premium bg-glass backdrop-blur-md border border-ivory-800/30 shadow-glass focus:outline-none z-20"
                  variants={dropdownVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                >
                  <div className="py-1 divide-y divide-ivory-800/30 max-h-96 overflow-y-auto">
                    <div className="px-4 py-3">
                      <h3 className="text-sm font-semibold text-ivory-100">Notifications</h3>
                    </div>
                    {alerts.length === 0 ? (
                      <div className="px-4 py-3 text-sm text-ivory-400">No notifications</div>
                    ) : (
                      <>
                        {alerts.map((alert) => (
                          <motion.div
                            key={alert.id}
                            whileHover={{ backgroundColor: 'rgba(255, 255, 255, 0.05)' }}
                            className={`px-4 py-3 cursor-pointer ${
                              !alert.read ? 'bg-gold-900/20' : ''
                            }`}
                            onClick={() => markAlertAsRead(alert.id)}
                          >
                            <div className="flex items-start">
                              <div className="flex-shrink-0">
                                <div
                                  className={`h-2.5 w-2.5 rounded-full mt-1 ${
                                    alert.type === 'info'
                                      ? 'bg-ivory-400'
                                      : alert.type === 'success'
                                      ? 'bg-green-500'
                                      : alert.type === 'warning'
                                      ? 'bg-gold-500'
                                      : 'bg-red-500'
                                  }`}
                                ></div>
                              </div>
                              <div className="ml-3 w-0 flex-1">
                                <p className="text-sm text-ivory-100">{alert.message}</p>
                                <p className="mt-1 text-xs text-ivory-400">
                                  {new Date(alert.createdAt).toLocaleDateString()} at{' '}
                                  {new Date(alert.createdAt).toLocaleTimeString()}
                                </p>
                              </div>
                            </div>
                          </motion.div>
                        ))}
                        <div className="px-4 py-2">
                          <Link
                            to="/alerts"
                            className="text-sm font-medium text-gold-500 hover:text-gold-400"
                            onClick={() => setAlertsOpen(false)}
                          >
                            View all notifications
                          </Link>
                        </div>
                      </>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="relative">
              {isLoading ? (
                <div className="h-8 w-8 rounded-full bg-onyx-800 flex items-center justify-center border border-gold-800">
                  <div className="animate-spin h-5 w-5 border-t-2 border-b-2 border-gold-500 rounded-full"></div>
                </div>
              ) : (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={user ? toggleProfile : () => {}}
                  className="rounded-full flex text-sm focus:outline-none focus:ring-2 focus:ring-gold-600 p-1"
                  id="user-menu"
                  aria-expanded="false"
                  aria-haspopup="true"
                >
                  <span className="sr-only">Open user menu</span>
                  {user ? (
                    user.avatar ? (
                      <img
                        className="h-8 w-8 rounded-full object-cover border border-gold-800"
                        src={user.avatar}
                        alt={user.name}
                      />
                    ) : (
                      <div className="h-8 w-8 rounded-full bg-glass flex items-center justify-center border border-gold-800">
                        <User className="h-5 w-5 text-gold-500" />
                      </div>
                    )
                  ) : (
                    <Link to="/auth" className="h-8 w-8 rounded-full bg-gold-600 flex items-center justify-center border border-gold-700">
                      <User className="h-5 w-5 text-onyx-950" />
                    </Link>
                  )}
                </motion.button>
              )}

              <AnimatePresence>
                {profileOpen && user && (
                  <motion.div
                    className="origin-top-right absolute right-0 mt-2 w-48 rounded-premium bg-glass backdrop-blur-md border border-ivory-800/30 shadow-glass focus:outline-none overflow-hidden z-20"
                    role="menu"
                    aria-orientation="vertical"
                    aria-labelledby="user-menu"
                    variants={dropdownVariants}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                  >
                    <div className="py-1" role="none">
                      <Link
                        to="/profile"
                        className="block px-4 py-2 text-sm text-ivory-200 hover:bg-ivory-800/10 transition-colors duration-150"
                        role="menuitem"
                        onClick={() => setProfileOpen(false)}
                      >
                        Your Profile
                      </Link>
                      <Link
                        to="/dashboard"
                        className="block px-4 py-2 text-sm text-ivory-200 hover:bg-ivory-800/10 transition-colors duration-150"
                        role="menuitem"
                        onClick={() => setProfileOpen(false)}
                      >
                        Dashboard
                      </Link>
                      <Link
                        to="/settings"
                        className="block px-4 py-2 text-sm text-ivory-200 hover:bg-ivory-800/10 transition-colors duration-150"
                        role="menuitem"
                        onClick={() => setProfileOpen(false)}
                      >
                        Settings
                      </Link>
                      <button
                        onClick={() => {
                          handleLogout();
                          setProfileOpen(false);
                        }}
                        className="block w-full text-left px-4 py-2 text-sm text-ivory-200 hover:bg-ivory-800/10 transition-colors duration-150"
                        role="menuitem"
                      >
                        Sign out
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Navbar;