// Permission Guard Component for UI Elements

import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { UserRole } from '../../models';

interface PermissionGuardProps {
  children: React.ReactNode;
  resource?: string;
  action?: string;
  allowedRoles?: UserRole[];
  fallback?: React.ReactNode;
}

const PermissionGuard: React.FC<PermissionGuardProps> = ({
  children,
  resource,
  action,
  allowedRoles = [],
  fallback = null
}) => {
  const { user, hasPermission, hasRole } = useAuth();

  // If no user, don't render
  if (!user) return <>{fallback}</>;

  // Check role-based permission
  if (allowedRoles.length > 0) {
    const hasAllowedRole = allowedRoles.some(role => hasRole(role));
    if (!hasAllowedRole) return <>{fallback}</>;
  }

  // Check resource-based permission
  if (resource && action) {
    if (!hasPermission(resource, action)) return <>{fallback}</>;
  }

  // User has permission
  return <>{children}</>;
};

export default PermissionGuard;
