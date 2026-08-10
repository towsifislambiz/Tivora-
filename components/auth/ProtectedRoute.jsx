import React from 'react';
import { useAuth } from '../../hooks/useAuth';
import AuthLoading from './AuthLoading';

export default function ProtectedRoute({ children }) {
  const { currentUser, isDemoUser, loading } = useAuth();

  if (loading) {
    return <AuthLoading />;
  }

  if (!currentUser) {
    // Unauthenticated -> Show Login Page
    return children('login');
  }

  // Dedicated demo user account bypasses email verification requirement
  if (isDemoUser) {
    return children('protected_app');
  }

  // Normal users must verify their email address
  if (!currentUser.emailVerified) {
    return children('verify_email');
  }

  // Verified normal users access the Tivora application directly (Facebook style)
  return children('protected_app');
}
