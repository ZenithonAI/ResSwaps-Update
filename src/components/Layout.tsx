import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Navbar from './Navbar';
import { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

const Layout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  
  useEffect(() => {
    // Add a small delay to ensure smooth animations
    const timer = setTimeout(() => {
      setIsLoaded(true);
    }, 100);
    
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="flex h-screen bg-onyx-950 overflow-hidden">
      {/* Sidebar for larger screens */}
      <div className="hidden md:flex">
        <Sidebar />
      </div>

      {/* Mobile sidebar */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div 
            className="fixed inset-0 z-40 md:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <motion.div 
              className="fixed inset-0 bg-onyx-950/90 backdrop-blur-sm transition-opacity"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSidebarOpen(false)}
            ></motion.div>
            <motion.div 
              className="fixed inset-y-0 left-0 flex max-w-xs w-full"
              initial={{ x: -300 }}
              animate={{ x: 0 }}
              exit={{ x: -300 }}
              transition={{ duration: 0.3, type: "spring", damping: 30 }}
            >
              <Sidebar mobile={true} onClose={() => setSidebarOpen(false)} />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main content area */}
      <div className="flex flex-col flex-1 overflow-hidden">
        <Navbar onMenuClick={() => setSidebarOpen(true)} />
        
        <motion.main 
          className="flex-1 overflow-y-auto bg-onyx-950 p-4 md:p-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: isLoaded ? 1 : 0, y: isLoaded ? 0 : 20 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <Outlet />
        </motion.main>
      </div>
    </div>
  );
};

export default Layout;