import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { authService, type AuthState } from '@/services/authService';
import { useToast } from '@/hooks/use-toast';

export const useAuth = () => {
  const { address, isConnected } = useAccount();
  const { toast } = useToast();
  const [authState, setAuthState] = useState<AuthState>({
    isAuthenticated: false,
    token: null,
    address: null,
  });
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  // Update auth state when component mounts or auth changes
  useEffect(() => {
    const updateAuthState = () => {
      const newState = authService.getAuthState();
      setAuthState(newState);
    };

    updateAuthState();
    
    // Listen for auth changes (you could implement an event system)
    const interval = setInterval(updateAuthState, 5000); // Check every 5 seconds
    
    return () => clearInterval(interval);
  }, []);

  // Auto-authenticate when wallet connects
  useEffect(() => {
    const handleWalletConnection = async () => {
      if (isConnected && address && !authState.isAuthenticated && !isAuthenticating) {
        try {
          setIsAuthenticating(true);
          console.log('🔗 Wallet connected, attempting authentication...');
          
          const success = await authService.autoAuthenticate(address);
          
          if (success) {
            const newState = authService.getAuthState();
            setAuthState(newState);
            
            toast({
              title: "Authentication Successful",
              description: "You are now logged in with your wallet.",
            });
          }
        } catch (error: any) {
          console.error('Auto-authentication failed:', error);
          toast({
            title: "Authentication Failed",
            description: error.message || "Failed to authenticate with wallet.",
            variant: "destructive",
          });
        } finally {
          setIsAuthenticating(false);
        }
      }
    };

    handleWalletConnection();
  }, [isConnected, address, authState.isAuthenticated, isAuthenticating, toast]);

  // Logout when wallet disconnects
  useEffect(() => {
    if (!isConnected && authState.isAuthenticated) {
      console.log('🔌 Wallet disconnected, logging out...');
      authService.logout();
      setAuthState({
        isAuthenticated: false,
        token: null,
        address: null,
      });
      
      toast({
        title: "Logged Out",
        description: "You have been logged out due to wallet disconnection.",
      });
    }
  }, [isConnected, authState.isAuthenticated, toast]);

  // Manual authentication function
  const authenticate = async (): Promise<boolean> => {
    if (!isConnected || !address) {
      toast({
        title: "Wallet Required",
        description: "Please connect your wallet first.",
        variant: "destructive",
      });
      return false;
    }

    if (authState.isAuthenticated) {
      console.log('Already authenticated');
      return true;
    }

    try {
      setIsAuthenticating(true);
      
      await authService.login(address);
      const newState = authService.getAuthState();
      setAuthState(newState);
      
      toast({
        title: "Authentication Successful",
        description: "You are now logged in with your wallet.",
      });
      
      return true;
    } catch (error: any) {
      console.error('Authentication failed:', error);
      toast({
        title: "Authentication Failed",
        description: error.message || "Failed to authenticate with wallet.",
        variant: "destructive",
      });
      return false;
    } finally {
      setIsAuthenticating(false);
    }
  };

  // Manual logout function
  const logout = () => {
    authService.logout();
    setAuthState({
      isAuthenticated: false,
      token: null,
      address: null,
    });
    
    toast({
      title: "Logged Out",
      description: "You have been successfully logged out.",
    });
  };

  // Check if current wallet address matches authenticated address
  const isCorrectWallet = () => {
    return isConnected && address && authState.address && 
           address.toLowerCase() === authState.address.toLowerCase();
  };

  return {
    // Auth state
    isAuthenticated: authState.isAuthenticated,
    authToken: authState.token,
    authAddress: authState.address,
    isAuthenticating,
    
    // Wallet state
    walletAddress: address,
    isWalletConnected: isConnected,
    isCorrectWallet: isCorrectWallet(),
    
    // Actions
    authenticate,
    logout,
    
    // Helper to ensure authentication before API calls
    ensureAuthenticated: async (): Promise<boolean> => {
      if (authState.isAuthenticated && isCorrectWallet()) {
        return true;
      }
      return await authenticate();
    }
  };
};
