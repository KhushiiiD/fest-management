// protected route component to guard routes based on authentication and role

import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const ProtectedRoute = ({ children, roles, allowedRoles }) => {
  const { user, isAuthenticated, loading } = useAuth();
  const permitted = roles || allowedRoles;

  // wait until auth state is resolved from localStorage
  if (loading) return null;

  // redirect to login if not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // check if user role is allowed
  if (permitted && !permitted.includes(user.role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return children;
};

export default ProtectedRoute;
