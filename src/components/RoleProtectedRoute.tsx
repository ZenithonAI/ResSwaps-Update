import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useUser } from '../context/UserContext';
import { LoadingSpinner } from './LoadingSpinner';
import { ShieldAlert } from 'lucide-react';

type UserRole = 'user' | 'admin';

interface RoleProtectedRouteProps {
  requiredRole: UserRole;
}

const RoleProtectedRoute: React.FC<RoleProtectedRouteProps> = ({ 
  requiredRole
}) => {
  const { user, isAuthenticated, isLoading } = useUser();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-onyx-950">
        <LoadingSpinner size={48} />
      </div>
    );
  }

  // Redirect to auth if not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  // If authenticated but wrong role, show access denied
  if (user?.role !== requiredRole) {
    return (
      <div className="flex flex-col justify-center items-center min-h-[60vh]">
        <ShieldAlert className="h-16 w-16 text-gold-500 mb-4" />
        <h1 className="text-2xl font-bold text-ivory-50 mb-2">Access Denied</h1>
        <p className="text-ivory-400 mb-6">
          You don't have the required permissions to access this page.
        </p>
        <Navigate to="/" replace />
      </div>
    );
  }

  return <Outlet />;
};

export default RoleProtectedRoute; 