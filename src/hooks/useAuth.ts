import { useState, useEffect } from 'react';
import { useAccount, useSignMessage, useChainId } from 'wagmi';
import { authService, type AuthState } from '@/services/authService';
import { toast } from 'sonner';
import { SiweMessage } from 'siwe';

export const useAuth = () => {
  const { address, isConnected } = useAccount();
  const { signMessageAsync, isPending: isSigning } = useSignMessage();
  const chainId = useChainId();
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
    
    // Listen for immediate auth state changes via custom event
    const handleAuthStateChange = () => {
      updateAuthState();
    };
    
    window.addEventListener('authStateChanged', handleAuthStateChange);
    
    // Also check periodically for other auth changes
    const interval = setInterval(updateAuthState, 5000); // Check every 5 seconds for other changes
    
    return () => {
      window.removeEventListener('authStateChanged', handleAuthStateChange);
      clearInterval(interval);
    };
  }, []);
  // Auto-authentication removed - users must manually authenticate

  // Logout when wallet disconnects
  useEffect(() => {
    if (!isConnected && authState.isAuthenticated) {
      authService.logout();
      setAuthState({
        isAuthenticated: false,
        token: null,
        address: null,
      });
      
      toast.info("You have been logged out due to wallet disconnection.", {
        description: "Logged Out"
      });
    }
  }, [isConnected, authState.isAuthenticated]);

  // Monitor wallet address changes and logout if address changes
  useEffect(() => {
    if (isConnected && address && authState.isAuthenticated && authState.address) {
      // Check if the current wallet address is different from authenticated address
      if (address.toLowerCase() !== authState.address.toLowerCase()) {
        // Wallet address changed, force logout
        authService.logout();
        setAuthState({
          isAuthenticated: false,
          token: null,
          address: null,
        });
        
        toast.warning("You have been logged out because your wallet address changed.", {
          description: "Wallet Address Changed"
        });
      }
    }
  }, [address, isConnected, authState.isAuthenticated, authState.address]);

  // Manual authentication function
  const authenticate = async (): Promise<boolean> => {
    if (!isConnected || !address) {
      toast.error("Please connect your wallet first.", {
        description: "Wallet Required"
      });
      return false;
    }

    if (authState.isAuthenticated) {
      return true;
    }

    // Check if wallet is accessible (not locked)
    try {
      // Try to get account info to check if wallet is accessible
    } catch (error) {
      toast.error("Your MetaMask wallet appears to be locked. Please unlock it and try again.", {
        description: "Wallet Not Accessible",
        duration: 6000,
      });
      return false;
    }

    try {
      setIsAuthenticating(true);
      
      // Get domain and origin from window
      const domain = window.location.host;
      const origin = window.location.origin;
      
      // Generate nonce (unique identifier for this session)
      const nonce = Math.random().toString(36).substring(2, 15);
      
      // Create SIWE message according to EIP-4361 standard
      const siweMessage = new SiweMessage({
        domain,
        address,
        statement: 'Sign in with Ethereum to DecentralizedX',
        uri: origin,
        version: '1',
        chainId,
        nonce,
        issuedAt: new Date().toISOString(),
      });
      
      // Generate the properly formatted message string
      const message = siweMessage.prepareMessage();
      
       // Create a timeout promise to handle locked/unresponsive wallets
       const timeoutPromise = new Promise<never>((_, reject) => {
         setTimeout(() => {
           reject(new Error('Wallet is locked or unresponsive. Please unlock your wallet and try again.'));
         }, 15000); // 15 second timeout
       });
      
      // Race between signature and timeout
      const signature = await Promise.race([
        signMessageAsync({ 
          message,
          account: address as `0x${string}`
        }),
        timeoutPromise
      ]);
      
      if (!signature) {
        throw new Error('User cancelled signature or signature failed');
      }
            
      // Continue with the authentication process with SIWE message
      await authService.login(address, message, signature);
      
      // Small delay to ensure state is properly updated
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const newState = authService.getAuthState();
      setAuthState(newState);
      
      toast.success("You are now logged in with your wallet.", {
        description: "Authentication Successful"
      });
      
      return true;
    } catch (error: any) {
      console.error('Authentication failed:', error);
      
      // Provide more specific error messages and toast notifications
      let errorMessage = "Failed to authenticate with wallet.";
      let toastTitle = "Authentication Failed";
      let toastDuration = 5000;
      
      if (error.message) {
        if (error.message.includes('locked') || error.message.includes('unresponsive')) {
          errorMessage = "Wallet is locked or unresponsive. Please unlock your wallet and try again.";
          toastTitle = "Wallet Locked";
          toastDuration = 8000; // Show longer for wallet errors
        } else if (error.message.includes('cancelled') || error.message.includes('rejected')) {
          errorMessage = "Signature request was cancelled or rejected. Please try again.";
          toastTitle = "Signature Cancelled";
        } else if (error.message.includes('User rejected')) {
          errorMessage = "You rejected the signature request. Please try again.";
          toastTitle = "Signature Rejected";
        } else if (error.message.includes('timeout')) {
          errorMessage = "Request timed out. Please check your wallet and try again.";
          toastTitle = "Request Timeout";
          toastDuration = 6000;
        } else {
          errorMessage = error.message;
        }
      }
      
      toast.error(errorMessage, {
        description: toastTitle,
        duration: toastDuration,
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
    
    toast.info("You have been successfully logged out.", {
      description: "Logged Out"
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
    isAuthenticating: isAuthenticating, // Only use our own state, not wagmi's isSigning
    
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
