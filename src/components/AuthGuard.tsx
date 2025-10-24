import { ReactNode } from 'react';
import { useAccount } from 'wagmi';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Wallet, ArrowRight, ShieldAlert, ShieldCheck, Zap, FileText, ExternalLink } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface AuthGuardProps {
  children: ReactNode;
  fallback?: ReactNode;
}

export const AuthGuard = ({ children, fallback }: AuthGuardProps) => {
  const { isConnected } = useAccount();
  const { isAuthenticated, authenticate, isAuthenticating } = useAuth();
  const navigate = useNavigate();

  // If not connected to wallet
  if (!isConnected) {
    return fallback || (
      <div className="w-full overflow-x-hidden">
        {/* Unified Info Card */}
        <div className="px-4 sm:px-8 py-8 lg:px-12 xl:px-20 max-w-6xl mx-auto w-full min-h-[calc(100vh-4rem)] flex items-center">
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-amber-50 via-orange-50 to-red-50 dark:from-amber-950/20 dark:via-orange-950/20 dark:to-red-950/20 p-8 sm:p-10 md:p-14 lg:p-16 border border-border/50 shadow-2xl w-full">
            <div className="relative z-10 text-center">
              {/* Icon */}
              <div className="mb-8">
                <div className="w-24 h-24 sm:w-28 sm:h-28 mx-auto rounded-full bg-gradient-to-br from-amber-500 via-orange-600 to-red-600 flex items-center justify-center shadow-2xl">
                  <Wallet className="h-12 w-12 sm:h-14 sm:w-14 text-white" />
                </div>
              </div>

              {/* Main Content */}
              <div className="space-y-5 mb-10">
                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground">
                  Connect Your Wallet
                </h1>
              </div>

              {/* Information Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-10 text-left">
                <div className="flex items-start gap-4 p-6 rounded-xl bg-background/50 border border-border/30">
                  <Wallet className="h-6 w-6 sm:h-7 sm:w-7 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-1" />
                  <div>
                    <p className="text-base sm:text-lg font-semibold text-foreground mb-2">Supported Wallets</p>
                    <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
                      MetaMask, WalletConnect, Coinbase Wallet, Rainbow, and more
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-4 p-6 rounded-xl bg-background/50 border border-border/30">
                  <ShieldCheck className="h-6 w-6 sm:h-7 sm:w-7 text-purple-600 dark:text-purple-400 flex-shrink-0 mt-1" />
                  <div>
                    <p className="text-base sm:text-lg font-semibold text-foreground mb-2">What You Can Do</p>
                    <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
                      Create posts, purchase content, and monetize your work on Web3
                    </p>
                  </div>
                </div>
              </div>

              {/* Help Text */}
              <div className="text-center space-y-3">
                <p className="text-base sm:text-lg text-muted-foreground">
                  New to Web3 or don't have a wallet yet?
                </p>
                <a 
                  href="https://decentralizedx.gitbook.io/dx/tutorials/getting-started" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-base sm:text-lg font-medium text-primary hover:underline"
                >
                  Learn how to set up your wallet
                  <ExternalLink className="h-4 w-4 sm:h-5 sm:w-5" />
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // If connected but not authenticated
  if (!isAuthenticated) {
    return fallback || (
      <div className="w-full overflow-x-hidden">
        {/* Unified Info Banner with Actions */}
        <div className="px-4 sm:px-8 py-8 lg:px-12 xl:px-20 max-w-6xl mx-auto w-full min-h-[calc(100vh-4rem)] flex items-center">
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-blue-950/20 dark:via-purple-950/20 dark:to-pink-950/20 p-8 sm:p-10 md:p-14 lg:p-16 border border-border/50 shadow-2xl w-full">
            <div className="relative z-10">
              {/* Title and Description Section */}
              <div className="flex items-start gap-5 sm:gap-6 mb-8">
                <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-blue-500 via-purple-600 to-pink-600 shadow-xl flex-shrink-0">
                  <ShieldAlert className="h-8 w-8 sm:h-10 sm:w-10 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="text-xl sm:text-2xl lg:text-3xl font-bold text-foreground mb-3">
                    Protected Content - Authentication Required
                  </h3>
                  <p className="text-base sm:text-lg lg:text-xl text-muted-foreground leading-relaxed font-medium">
                    You're accessing private content that requires identity verification. To continue, you'll need to sign a message with your wallet to prove ownership.
                  </p>
                </div>
              </div>
              
              {/* Detailed Information - Full Width */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-10">
                <div className="flex items-start gap-3">
                  <Zap className="h-6 w-6 sm:h-7 sm:w-7 text-green-600 dark:text-green-400 flex-shrink-0 mt-1" />
                  <div>
                    <p className="text-sm sm:text-base lg:text-lg font-semibold text-foreground mb-2">No Gas Fees</p>
                    <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
                      Signing is free and doesn't require any blockchain transaction fees
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <FileText className="h-6 w-6 sm:h-7 sm:w-7 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-1" />
                  <div>
                    <p className="text-sm sm:text-base lg:text-lg font-semibold text-foreground mb-2">EIP-4361 Standard</p>
                    <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
                      Uses Sign-In with Ethereum protocol for secure wallet authentication
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <ShieldCheck className="h-6 w-6 sm:h-7 sm:w-7 text-purple-600 dark:text-purple-400 flex-shrink-0 mt-1" />
                  <div>
                    <p className="text-sm sm:text-base lg:text-lg font-semibold text-foreground mb-2">Secure & Private</p>
                    <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
                      Off-chain signature verification protects your privacy and wallet security
                    </p>
                  </div>
                </div>
              </div>

              {/* Divider */}
              <div className="border-t border-border/50 my-10"></div>

              {/* Action Section */}
              <div className="flex flex-col items-center text-center">
                <div className="flex flex-row gap-4 sm:gap-5 w-full max-w-xl">
                  <Button 
                    onClick={authenticate}
                    disabled={isAuthenticating}
                    variant="default" 
                    size="lg"
                    className="flex-1 min-w-0 h-14 text-base sm:text-lg"
                  >
                    {isAuthenticating ? (
                      <>
                        <div className="w-5 h-5 mr-2 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span className="truncate">Signing In...</span>
                      </>
                    ) : (
                      <>
                        <span className="truncate">Sign In</span>
                      </>
                    )}
                  </Button>
                  <Button 
                    onClick={() => navigate('/app')} 
                    variant="outline" 
                    size="lg"
                    className="flex-1 min-w-0 h-14 text-base sm:text-lg"
                  >
                    <span className="truncate">Home</span>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // If authenticated, render children
  return <>{children}</>;
};