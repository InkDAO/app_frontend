import React from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Wallet, Shield, Loader2 } from 'lucide-react';

interface AuthGuardProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  requireAuth?: boolean;
}

export const AuthGuard: React.FC<AuthGuardProps> = ({ 
  children, 
  fallback, 
  requireAuth = true 
}) => {
  const { 
    isAuthenticated, 
    isAuthenticating, 
    isWalletConnected, 
    isCorrectWallet,
    authenticate 
  } = useAuth();

  // If authentication is not required, always show children
  if (!requireAuth) {
    return <>{children}</>;
  }

  // Show loading state while authenticating
  if (isAuthenticating) {
    return (
      <div className="flex flex-col items-center justify-center p-8 space-y-4">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        <p className="text-gray-600 dark:text-gray-400">Authenticating with your wallet...</p>
      </div>
    );
  }

  // Show wallet connection required
  if (!isWalletConnected) {
    return fallback || (
      <div className="flex flex-col items-center justify-center p-8 space-y-4">
        <Wallet className="w-12 h-12 text-gray-400" />
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          Wallet Required
        </h3>
        <p className="text-gray-600 dark:text-gray-400 text-center max-w-md">
          Please connect your wallet to access this feature.
        </p>
      </div>
    );
  }

  // Show authentication required
  if (!isAuthenticated || !isCorrectWallet) {
    return fallback || (
      <div className="flex flex-col items-center justify-center p-8 space-y-4">
        <Shield className="w-12 h-12 text-amber-500" />
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          Authentication Required
        </h3>
        <p className="text-gray-600 dark:text-gray-400 text-center max-w-md">
          Please authenticate with your wallet to access this feature.
        </p>
        <Button 
          onClick={authenticate}
          className="flex items-center space-x-2"
          disabled={isAuthenticating}
        >
          {isAuthenticating ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Shield className="w-4 h-4" />
          )}
          <span>Authenticate with Wallet</span>
        </Button>
      </div>
    );
  }

  // User is authenticated, show protected content
  return <>{children}</>;
};
