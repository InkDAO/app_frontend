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
          <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl bg-gradient-to-br from-amber-50 via-orange-50 to-red-50 dark:from-amber-950/40 dark:via-orange-950/40 dark:to-red-950/40 p-8 sm:p-10 md:p-14 lg:p-16 border-0 shadow-2xl dark:shadow-primary/10 w-full">
            {/* Animated Background Blobs */}
            <div className="absolute top-0 left-0 w-48 h-48 sm:w-72 sm:h-72 bg-gradient-to-br from-amber-400/30 to-orange-400/30 rounded-full blur-3xl animate-pulse" />
            <div className="absolute bottom-0 right-0 w-64 h-64 sm:w-96 sm:h-96 bg-gradient-to-br from-red-400/20 to-orange-400/20 rounded-full blur-3xl animate-pulse delay-1000" />
            {/* Background Pattern */}
            <div className="absolute inset-0 bg-grid-slate-100 [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.5))] dark:bg-grid-slate-400/5" />
            
            <div className="relative z-10 text-center">
              {/* Icon */}
              <div className="mb-8">
                <div className="w-24 h-24 sm:w-28 sm:h-28 mx-auto rounded-full bg-gradient-to-br from-amber-500 via-orange-600 to-red-600 flex items-center justify-center shadow-2xl shadow-amber-500/50 transform hover:scale-105 transition-transform duration-300">
                  <Wallet className="h-12 w-12 sm:h-14 sm:w-14 text-white" />
                </div>
              </div>

              {/* Main Content */}
              <div className="space-y-5 mb-10">
                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-foreground drop-shadow-sm">
                  Connect Your Wallet
                </h1>
              </div>

              {/* Information Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-10 text-left">
                <div className="flex items-start gap-4 p-6 rounded-xl bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm border border-border/30 shadow-md hover:shadow-lg transition-shadow">
                  <Wallet className="h-6 w-6 sm:h-7 sm:w-7 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-1" />
                  <div>
                    <p className="text-base sm:text-lg font-bold text-foreground mb-2">Supported Wallets</p>
                    <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
                      MetaMask, WalletConnect, Coinbase Wallet, Rainbow, and more
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-4 p-6 rounded-xl bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm border border-border/30 shadow-md hover:shadow-lg transition-shadow">
                  <ShieldCheck className="h-6 w-6 sm:h-7 sm:w-7 text-purple-600 dark:text-purple-400 flex-shrink-0 mt-1" />
                  <div>
                    <p className="text-base sm:text-lg font-bold text-foreground mb-2">What You Can Do</p>
                    <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
                      Create posts, purchase content, and monetize your work on Web3
                    </p>
                  </div>
                </div>
              </div>

              {/* Help Text */}
              <div className="text-center space-y-3">
                <p className="text-base sm:text-lg text-muted-foreground font-medium">
                  New to Web3 or don't have a wallet yet?
                </p>
                <a 
                  href="https://docs.inkdao.tech/tutorials/getting-started" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-base sm:text-lg font-semibold text-primary hover:underline"
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
          <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-blue-950/40 dark:via-purple-950/40 dark:to-pink-950/40 p-8 sm:p-10 md:p-14 lg:p-16 border-0 shadow-2xl dark:shadow-primary/10 w-full">
            {/* Animated Background Blobs */}
            <div className="absolute top-0 left-0 w-48 h-48 sm:w-72 sm:h-72 bg-gradient-to-br from-blue-400/30 to-purple-400/30 rounded-full blur-3xl animate-pulse" />
            <div className="absolute bottom-0 right-0 w-64 h-64 sm:w-96 sm:h-96 bg-gradient-to-br from-pink-400/20 to-purple-400/20 rounded-full blur-3xl animate-pulse delay-1000" />
            {/* Background Pattern */}
            <div className="absolute inset-0 bg-grid-slate-100 [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.5))] dark:bg-grid-slate-400/5" />
            
            <div className="relative z-10">
              {/* Title and Description Section */}
              <div className="flex items-start gap-5 sm:gap-6 mb-8">
                <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-blue-500 via-purple-600 to-pink-600 shadow-2xl shadow-blue-500/50 flex-shrink-0 transform hover:scale-105 transition-transform duration-300">
                  <ShieldAlert className="h-8 w-8 sm:h-10 sm:w-10 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-foreground mb-3 drop-shadow-sm">
                    Protected Content - Authentication Required
                  </h3>
                  <p className="text-base sm:text-lg lg:text-xl text-muted-foreground leading-relaxed font-semibold">
                    You're accessing private content that requires identity verification. To continue, you'll need to sign a message with your wallet to prove ownership.
                  </p>
                </div>
              </div>
              
              {/* Detailed Information - Full Width */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-10">
                <div className="flex items-start gap-3 p-4 rounded-xl bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm border border-border/30 shadow-md hover:shadow-lg transition-shadow">
                  <Zap className="h-6 w-6 sm:h-7 sm:w-7 text-green-600 dark:text-green-400 flex-shrink-0 mt-1" />
                  <div>
                    <p className="text-sm sm:text-base lg:text-lg font-bold text-foreground mb-2">No Gas Fees</p>
                    <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
                      Signing is free and doesn't require any blockchain transaction fees
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-4 rounded-xl bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm border border-border/30 shadow-md hover:shadow-lg transition-shadow">
                  <FileText className="h-6 w-6 sm:h-7 sm:w-7 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-1" />
                  <div>
                    <p className="text-sm sm:text-base lg:text-lg font-bold text-foreground mb-2">EIP-4361 Standard</p>
                    <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
                      Uses Sign-In with Ethereum (SIWE) protocol for secure, standardized wallet authentication
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-4 rounded-xl bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm border border-border/30 shadow-md hover:shadow-lg transition-shadow">
                  <ShieldCheck className="h-6 w-6 sm:h-7 sm:w-7 text-purple-600 dark:text-purple-400 flex-shrink-0 mt-1" />
                  <div>
                    <p className="text-sm sm:text-base lg:text-lg font-bold text-foreground mb-2">Secure & Private</p>
                    <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
                      Off-chain signature verification protects your privacy and wallet security
                    </p>
                  </div>
                </div>
              </div>

              {/* Divider */}
              <div className="border-t border-border/30 my-10"></div>

              {/* Action Section */}
              <div className="flex flex-col items-center text-center">
                <div className="flex flex-row gap-4 sm:gap-5 w-full max-w-xl">
                  <Button 
                    onClick={authenticate}
                    disabled={isAuthenticating}
                    variant="default" 
                    size="lg"
                    className="flex-1 min-w-0 h-14 text-base sm:text-lg font-semibold shadow-lg hover:shadow-xl transition-shadow"
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
                    className="flex-1 min-w-0 h-14 text-base sm:text-lg font-semibold bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm hover:bg-white/80 dark:hover:bg-gray-800/80 shadow-lg hover:shadow-xl transition-all"
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