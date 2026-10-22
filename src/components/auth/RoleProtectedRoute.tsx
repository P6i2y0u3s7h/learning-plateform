import React from 'react';
import { Navigate, useLocation, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { AuthLoadingScreen } from './AuthLoadingScreen';
import type { UserRole } from '../../types';

export interface RoleProtectedRouteProps {
  allowedRoles: UserRole[];
  requireTeacherApproval?: boolean;
  children?: React.ReactNode;
}

export const RoleProtectedRoute: React.FC<RoleProtectedRouteProps> = ({
  allowedRoles,
  requireTeacherApproval = false,
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

  // 1. Wait until Firebase Auth and RTDB role verification finish
  if (loading || verificationStatus === 'verifying' || verificationStatus === 'idle') {
    return <AuthLoadingScreen status="verifying" />;
  }

  // 2. Redirect unauthenticated users to login
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

  // 4. Role Authorization: Block if role is not allowed
  if (allowedRoles && allowedRoles.length > 0 && !allowedRoles.includes(role)) {
    return (
      <Navigate
        to="/unauthorized"
        state={{ attemptedPath: location.pathname, requiredRoles: allowedRoles }}
        replace
      />
    );
  }

  // 5. Optional Teacher approval check
  if (role === 'teacher' && requireTeacherApproval && !isTeacherApproved) {
    return <Navigate to="/teacher-pending" replace />;
  }

  // 6. Authorized: Render content
  return children ? <>{children}</> : <Outlet />;
};

export default RoleProtectedRoute;
