import React from 'react';
import { Navigate, useLocation, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { AuthLoadingScreen } from '../components/auth/AuthLoadingScreen';
import type { UserRole } from '../types';

export interface ProtectedRouteProps {
  allowedRoles?: UserRole[];
  requireTeacherApproval?: boolean;
  requireVerifiedEmail?: boolean;
  children?: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  allowedRoles,
  requireTeacherApproval = false,
  requireVerifiedEmail = false,
  children,
}) => {
  const {
    user,
    role,
    loading,
    verificationStatus,
    verificationError,
    retryVerification,
    logout,
    isTeacherApproved,
  } = useAuth();
  const location = useLocation();

  // 1. Show verified loading state while Firebase Auth initializes session and checks RTDB
  if (loading || verificationStatus === 'verifying') {
    return <AuthLoadingScreen status="verifying" />;
  }

  // 2. Not logged in -> Redirect to Login with return path
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // 3. Handle non-verified RTDB states (Cases D, E, F, G)
  if (verificationStatus !== 'verified') {
    return (
      <AuthLoadingScreen
        status={verificationStatus}
        error={verificationError}
        onRetry={retryVerification}
        onLogout={logout}
      />
    );
  }

  // 4. Role permission check (Realtime Database verified role)
  if (allowedRoles && allowedRoles.length > 0 && !allowedRoles.includes(role)) {
    return (
      <Navigate
        to="/unauthorized"
        state={{ attemptedPath: location.pathname, requiredRoles: allowedRoles }}
        replace
      />
    );
  }

  // 5. Teacher approval check: Teachers must be verified by Admin
  if (role === 'teacher' && requireTeacherApproval && !isTeacherApproved) {
    return <Navigate to="/teacher-pending" replace />;
  }

  // 6. Render protected content
  return children ? <>{children}</> : <Outlet />;
};

export default ProtectedRoute;
