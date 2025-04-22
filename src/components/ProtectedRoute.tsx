import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useUser } from '../context/UserContext';
import { LoadingSpinner } from './LoadingSpinner';
import { Shield } from 'lucide-react';
import { Link } from 'react-router-dom';

interface ProtectedRouteProps {
  requireAuth?: boolean; // If true, shows auth banner for non-authenticated users
  authOnly?: boolean;    // If true, redirects to / if authenticated
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  requireAuth = true, 
  authOnly = false
}) => {
  const { isAuthenticated, isLoading } = useUser();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-onyx-950">
        <LoadingSpinner size={48} />
      </div>
    );
  }

  // Handle auth-only routes (like /auth)
  if (authOnly && isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  // For regular routes, we now allow access but will show banners within the route
  // instead of redirecting
  return (
    <>
      {!isAuthenticated && requireAuth && (
        <div className="mb-6 p-4 bg-gold-900/20 border border-gold-700/50 rounded-lg text-gold-500 flex items-center justify-between max-w-7xl mx-auto mt-6">
          <div className="flex items-center space-x-3">
            <Shield className="h-5 w-5" />
            <p>
              <span className="font-semibold">Create an account</span> or{' '}
              <span className="font-semibold">sign in</span> to access this feature.
            </p>
          </div>
          <Link
            to="/auth"
            className="px-4 py-2 bg-gold-600 text-onyx-950 rounded-md hover:bg-gold-500 transition-colors font-medium"
          >
            Sign In
          </Link>
        </div>
      )}

      <Outlet />
    </>
  );
};

export default ProtectedRoute; 