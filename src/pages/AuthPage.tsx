import { useState, useEffect } from 'react';
import { useUser } from '../context/UserContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, AlertCircle } from 'lucide-react';

const AuthPage = () => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  // Get authentication methods from UserContext
  const { login, register, isAuthenticated } = useUser(); 
  const navigate = useNavigate();
  const location = useLocation();
  
  // For animated background particles
  const [particles, setParticles] = useState<Array<{x: number, y: number, size: number, speed: number, opacity: number}>>([]);
  
  useEffect(() => {
    // Generate random particles
    const newParticles = Array.from({ length: 25 }, () => ({
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 4 + 1,
      speed: Math.random() * 0.2 + 0.1,
      opacity: Math.random() * 0.5 + 0.1
    }));
    
    setParticles(newParticles);
  }, []);

  // Redirect if user becomes authenticated
  useEffect(() => {
    if (isAuthenticated) {
      console.log('User is authenticated, redirecting to home page');
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const from = location.state?.from?.pathname || '/';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setIsLoading(true);

    if (isSignUp && password !== confirmPassword) {
      setError('Passwords do not match');
      setIsLoading(false);
      return;
    }

    try {
      console.log(`Attempting to ${isSignUp ? 'register' : 'login'} with email: ${email}`);
      
      if (isSignUp) {
        await register(email, password);
        console.log('Registration successful');
        setSuccess('Account created successfully! You can now sign in.');
        setIsSignUp(false);
      } else {
        console.log('Starting login process...');
        await login(email, password);
        console.log('Login successful');
        // Navigate happens in the useEffect when isAuthenticated changes
      }
    } catch (err) {
      console.error('Authentication error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Authentication failed';
      setError(errorMessage);
      
      // More specific error messages based on common Supabase errors
      if (errorMessage.includes('Invalid login credentials')) {
        setError('Invalid email or password. Please try again.');
      } else if (errorMessage.includes('Email not confirmed')) {
        setError('Please confirm your email address before logging in.');
      } else if (errorMessage.includes('rate limit')) {
        setError('Too many login attempts. Please try again later.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const fadeIn = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.6 }
    }
  };

  const staggerContainer = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  return (
    <motion.div 
      className="min-h-screen flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden"
      initial="hidden"
      animate="visible"
      variants={fadeIn}
    >
      {/* Premium restaurant background image with overlay */}
      <div className="absolute inset-0 z-0">
        <img
          src="https://images.unsplash.com/photo-1414235077428-338989a2e8c0?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80"
          alt="Luxury restaurant interior"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-onyx-950/95 via-onyx-900/90 to-onyx-950/95"></div>
      </div>
      
      {/* Animated background particles */}
      {particles.map((particle, index) => (
        <motion.div
          key={index}
          className="absolute rounded-full bg-gold-500"
          style={{
            left: `${particle.x}%`,
            top: `${particle.y}%`,
            width: `${particle.size}px`,
            height: `${particle.size}px`,
            opacity: particle.opacity,
          }}
          animate={{
            y: [`${particle.y}%`, `${particle.y + 10}%`, `${particle.y}%`],
            opacity: [particle.opacity, particle.opacity + 0.1, particle.opacity],
          }}
          transition={{
            duration: 5 / particle.speed,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      ))}
      
      {/* Animated light effects */}
      <div className="absolute top-0 right-0 w-full h-full overflow-hidden z-0 opacity-40">
        <motion.div
          className="absolute -top-20 -right-20 w-96 h-96 bg-gold-500/10 rounded-full blur-3xl"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.2, 0.3, 0.2],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
        <motion.div
          className="absolute -bottom-20 -left-20 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl"
          animate={{
            scale: [1, 1.1, 1],
            opacity: [0.2, 0.3, 0.2],
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 1,
          }}
        />
      </div>
      
      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <motion.h1 
          className="text-center text-3xl font-extrabold mb-6 font-display"
          variants={fadeIn}
        >
          <span className="text-blue-600">Res</span>
          <span className="text-teal-600">Swaps</span>
        </motion.h1>
        
        <motion.h2 
          className="mt-6 text-center text-3xl font-extrabold text-ivory-100 font-display"
          variants={fadeIn}
        >
          {isSignUp ? 'Create your account' : 'Sign in to your account'}
        </motion.h2>
        
        <motion.p 
          className="mt-2 text-center text-sm text-ivory-400"
          variants={fadeIn}
        >
          {isSignUp ? 'Already have an account? ' : 'Don\'t have an account? '}
          <button
            onClick={() => {
              setIsSignUp(!isSignUp);
              setError(null);
              setSuccess(null);
            }}
            className="font-medium text-gold-500 hover:text-gold-400 transition-colors"
          >
            {isSignUp ? 'Sign in' : 'Sign up'}
          </button>
        </motion.p>
      </div>

      <motion.div 
        className="mt-8 sm:mx-auto sm:w-full sm:max-w-md relative z-10"
        variants={fadeIn}
      >
        <div className="bg-onyx-900/60 backdrop-blur-xl border border-onyx-800/80 py-8 px-4 shadow-2xl sm:rounded-2xl sm:px-10 relative">
          {/* Premium gold accent line with glowing animation */}
          <div className="absolute inset-0 rounded-2xl overflow-hidden">
            <motion.div 
              className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-gold-500/60 to-transparent"
              animate={{
                backgroundPosition: ['0% 0%', '100% 0%', '0% 0%'],
              }}
              transition={{ 
                duration: 8, 
                ease: "easeInOut", 
                repeat: Infinity 
              }}
            ></motion.div>
          </div>
          
          <AnimatePresence>
            {error && (
              <motion.div 
                className="mb-4 p-3 bg-red-900/50 border border-red-800 rounded-lg flex items-center text-sm text-red-200"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, height: 0 }}
              >
                <AlertCircle className="h-5 w-5 text-red-400 mr-2 flex-shrink-0" />
                {error}
              </motion.div>
            )}
            
            {success && (
              <motion.div 
                className="mb-4 p-3 bg-green-900/50 border border-green-800 rounded-lg flex items-center text-sm text-green-200"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, height: 0 }}
              >
                <CheckCircle className="h-5 w-5 text-green-400 mr-2 flex-shrink-0" />
                {success}
              </motion.div>
            )}
          </AnimatePresence>
          
          <motion.form 
            className="space-y-6"
            onSubmit={handleSubmit}
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
          >
            <motion.div variants={fadeIn}>
              <label htmlFor="email" className="block text-sm font-medium text-ivory-300">
                Email address
              </label>
              <div className="mt-1 relative group">
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="appearance-none block w-full px-3 py-2.5 bg-onyx-950/60 border border-onyx-700 rounded-lg shadow-sm placeholder-ivory-500 focus:outline-none focus:ring-1 focus:ring-gold-600 focus:border-gold-600 text-ivory-100 sm:text-sm transition-all duration-200 group-hover:border-onyx-600"
                />
                <motion.div 
                  className="absolute bottom-0 left-0 h-0.5 bg-gradient-to-r from-gold-600 to-gold-400 rounded-full"
                  initial={{ width: 0 }}
                  whileFocus={{ width: '100%' }}
                  transition={{ duration: 0.3 }}
                />
              </div>
            </motion.div>

            <motion.div variants={fadeIn}>
              <label htmlFor="password" className="block text-sm font-medium text-ivory-300">
                Password
              </label>
              <div className="mt-1 relative group">
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="appearance-none block w-full px-3 py-2.5 bg-onyx-950/60 border border-onyx-700 rounded-lg shadow-sm placeholder-ivory-500 focus:outline-none focus:ring-1 focus:ring-gold-600 focus:border-gold-600 text-ivory-100 sm:text-sm transition-all duration-200 group-hover:border-onyx-600"
                />
                <motion.div 
                  className="absolute bottom-0 left-0 h-0.5 bg-gradient-to-r from-gold-600 to-gold-400 rounded-full"
                  initial={{ width: 0 }}
                  whileFocus={{ width: '100%' }}
                  transition={{ duration: 0.3 }}
                />
              </div>
            </motion.div>

            {isSignUp && (
              <motion.div variants={fadeIn}>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-ivory-300">
                  Confirm Password
                </label>
                <div className="mt-1 relative group">
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    autoComplete="new-password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="appearance-none block w-full px-3 py-2.5 bg-onyx-950/60 border border-onyx-700 rounded-lg shadow-sm placeholder-ivory-500 focus:outline-none focus:ring-1 focus:ring-gold-600 focus:border-gold-600 text-ivory-100 sm:text-sm transition-all duration-200 group-hover:border-onyx-600"
                  />
                  <motion.div 
                    className="absolute bottom-0 left-0 h-0.5 bg-gradient-to-r from-gold-600 to-gold-400 rounded-full"
                    initial={{ width: 0 }}
                    whileFocus={{ width: '100%' }}
                    transition={{ duration: 0.3 }}
                  />
                </div>
              </motion.div>
            )}

            <div className="flex items-center justify-end">
              <div className="text-sm">
                <a href="#" className="font-medium text-gold-500 hover:text-gold-400 transition-colors">
                  Forgot your password?
                </a>
              </div>
            </div>

            <motion.div variants={fadeIn}>
              <motion.button
                type="submit"
                disabled={isLoading}
                className={`w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-lg text-sm font-medium text-onyx-900 bg-gradient-to-r from-gold-500 to-gold-600 hover:from-gold-600 hover:to-gold-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gold-500 focus:ring-offset-onyx-900 transition-all duration-200 ${
                  isLoading ? 'opacity-70 cursor-not-allowed' : ''
                }`}
                whileHover={{ scale: 1.02, boxShadow: "0 5px 15px rgba(184, 134, 11, 0.3)" }}
                whileTap={{ scale: 0.98 }}
              >
                {isLoading ? 'Processing...' : isSignUp ? 'Create Account' : 'Sign in'}
              </motion.button>
            </motion.div>
          </motion.form>
          
          {/* Debug information - only visible during development */}
          {import.meta.env.DEV && (
            <div className="mt-4 p-2 text-xs text-ivory-500 border border-dashed border-onyx-700 rounded">
              <p>Auth State: {isAuthenticated ? 'Authenticated' : 'Not Authenticated'}</p>
              <p>Loading: {isLoading ? 'Yes' : 'No'}</p>
            </div>
          )}
        </div>
        
        {/* Premium badge */}
        <div className="mt-8 text-center">
          <motion.div 
            className="inline-flex items-center space-x-1 text-xs text-ivory-300"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            <motion.span 
              className="w-1.5 h-1.5 rounded-full bg-gold-500 inline-block"
              animate={{ 
                scale: [1, 1.5, 1],
                opacity: [0.7, 1, 0.7]
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            />
            <span>Premium dining experiences await</span>
          </motion.div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default AuthPage;