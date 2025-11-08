import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { 
  ArrowRight, 
  Shield, 
  Sparkles, 
  Zap,
  Globe,
  Database,
  Cloud,
  Webhook,
  Server,
  Edit,
  Wallet,
  Coins,
  Infinity,
  Network,
  MessageSquare,
  FileSignature,
  Lock,
  Layers
} from "lucide-react";
import { FaXTwitter, FaGithub, FaTelegram } from 'react-icons/fa6';
import { SiGitbook } from 'react-icons/si';
import { useTheme } from "@/context/ThemeContext";
import { Sun, Moon } from "lucide-react";
import { usePlatformMetrics } from "@/hooks/usePlatformMetrics";
import { Skeleton } from "@/components/ui/skeleton";
import { useEffect, useState, useRef } from "react";

// Counter animation component
const AnimatedCounter = ({ value, decimals = 0, suffix = "" }: { value: number; decimals?: number; suffix?: string }) => {
  const [count, setCount] = useState(0);
  const countRef = useRef<number | null>(null);

  useEffect(() => {
    const duration = 2000; // 2 seconds
    const steps = 60;
    const increment = value / steps;
    let currentStep = 0;

    const timer = setInterval(() => {
      currentStep++;
      if (currentStep <= steps) {
        setCount(Math.min(increment * currentStep, value));
      } else {
        setCount(value);
        clearInterval(timer);
      }
    }, duration / steps);

    return () => clearInterval(timer);
  }, [value]);

  const displayValue = decimals > 0 ? count.toFixed(decimals) : Math.floor(count).toLocaleString();

  return <span>{displayValue}{suffix}</span>;
};

const Landing = () => {
  const { theme, toggleTheme } = useTheme();
  const { totalPosts, totalUsers, totalValueTraded, totalWorthOfAssets, isLoading } = usePlatformMetrics();
  
  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background/95 to-background/90 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-secondary/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-accent/5 rounded-full blur-3xl" />
      </div>

      {/* Theme toggle */}
      <div className="absolute top-4 right-4 z-50">
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleTheme}
          className="backdrop-blur-sm bg-background/50 hover:bg-background/80"
          title={theme === "light" ? "Switch to dark mode" : "Switch to light mode"}
        >
          {theme === "light" ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
        </Button>
      </div>

      <div className="container mx-auto px-4 py-12 md:py-24 relative z-10">
        <div className="max-w-6xl mx-auto">
          {/* Hero Section */}
          <div className="flex flex-col items-center mb-16 animate-fade-in">
            <div className="flex flex-col md:flex-row items-center justify-center gap-8 md:gap-16 lg:gap-24 mb-6 md:mb-8 w-full max-w-6xl">
              <div className="relative">
                <div className="relative aspect-square w-48 sm:w-56 md:w-48 lg:w-64 rounded-lg transition-all duration-300 flex items-center justify-center">
                  <img 
                    src={"/Inkdao_Circle_Logo.png"} 
                    alt="InkDAO" 
                    className="h-full w-full object-contain" 
                  />
                </div>
              </div>
              
              <div className="flex flex-col items-center text-center">
              <h1
                className="
                    text-4xl
                  sm:text-5xl
                  md:text-6xl
                  lg:text-7xl
                  font-extrabold
                  font-brand
                  tracking-tight
                    text-foreground
                    mb-4
                "
                style={{ lineHeight: 1.1 }}
              >
                InkDAO
              </h1>
                
                <div className="flex items-center justify-center gap-2 mb-6">
                  <Sparkles className="h-5 w-5 text-primary animate-pulse" />
                  <p className="text-xl md:text-2xl font-semibold text-primary">
                    Write. Share. Earn. Forever.
                  </p>
                  <Sparkles className="h-5 w-5 text-primary animate-pulse" />
            </div>
            
                <div className="flex flex-row gap-3 sm:gap-4 w-full justify-center">
                  <Link to="/app" className="flex-1 sm:flex-initial">
                    <Button
                      size="lg"
                      className="w-full px-4 sm:px-8 py-4 sm:py-6 text-base sm:text-lg font-semibold bg-primary hover:bg-primary/90 transition-all transform hover:scale-105 shadow-lg hover:shadow-xl"
                    >
                      Launch App
                      <ArrowRight className="ml-2 h-4 w-4 sm:h-5 sm:w-5" />
                    </Button>
                  </Link>
                  <Link to="https://docs.inkdao.tech/" className="flex-1 sm:flex-initial" target="_blank" rel="noopener noreferrer">
                    <Button
                      size="lg"
                      variant="outline"
                      className="w-full px-4 sm:px-8 py-4 sm:py-6 text-base sm:text-lg font-semibold hover:bg-primary/10 transition-all border-2 hover:border-primary"
                    >
                      Learn More
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
            
            <p className="text-lg md:text-2xl mb-12 text-muted-foreground max-w-3xl leading-relaxed text-center">
              Turn your ideas into <span className="text-primary font-semibold">tokenized assets</span>. 
              Publish once, <span className="text-primary font-semibold">earn forever</span>.
            </p>
          </div>

          {/* Platform Metrics Section */}
          <div className="mb-24 md:mb-32">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 px-4">
              {/* Published Content */}
              <div className="text-center">
                <p className="text-xs sm:text-sm text-muted-foreground mb-3 uppercase tracking-wide">Published Content</p>
                <h3 className="text-4xl sm:text-5xl md:text-6xl font-bold">
                  {isLoading ? <Skeleton className="h-12 sm:h-16 w-24 sm:w-32 mx-auto" /> : <AnimatedCounter value={totalPosts} />}
                </h3>
              </div>

              {/* Active Users */}
              <div className="text-center">
                <p className="text-xs sm:text-sm text-muted-foreground mb-3 uppercase tracking-wide">Active Users</p>
                <h3 className="text-4xl sm:text-5xl md:text-6xl font-bold">
                  {isLoading ? <Skeleton className="h-12 sm:h-16 w-24 sm:w-32 mx-auto" /> : <AnimatedCounter value={totalUsers} />}
                </h3>
              </div>

              {/* Total Sales */}
              <div className="text-center">
                <p className="text-xs sm:text-sm text-muted-foreground mb-3 uppercase tracking-wide">Total Sales</p>
                <h3 className="text-4xl sm:text-5xl md:text-6xl font-bold">
                  {isLoading ? <Skeleton className="h-12 sm:h-16 w-32 sm:w-40 mx-auto" /> : (
                    <span><AnimatedCounter value={parseFloat(totalValueTraded)} decimals={4} /> ETH</span>
                  )}
                </h3>
              </div>

              {/* Marketplace Value */}
              <div className="text-center">
                <p className="text-xs sm:text-sm text-muted-foreground mb-3 uppercase tracking-wide">Marketplace Value</p>
                <h3 className="text-4xl sm:text-5xl md:text-6xl font-bold">
                  {isLoading ? <Skeleton className="h-12 sm:h-16 w-32 sm:w-40 mx-auto" /> : (
                    <span><AnimatedCounter value={parseFloat(totalWorthOfAssets)} decimals={4} /> ETH</span>
                  )}
                </h3>
              </div>
            </div>
          </div>

          {/* Features Grid */}
          <div className="mb-24 md:mb-32">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold mb-3">Why Choose
                  <span className="font-brand">&nbsp;InkDAO</span>
                  ?
              </h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
              {/* Tokenized Content Card - Glassy */}
              <div className="group relative h-full">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-primary via-primary/80 to-primary/60 rounded-2xl blur opacity-20 group-hover:opacity-40 transition duration-500"></div>
                <div className="relative h-full p-8 md:p-10 rounded-2xl bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border-0 shadow-2xl dark:shadow-primary/10 transition-all duration-300 overflow-hidden flex flex-col">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-primary/20 to-primary/5 rounded-full blur-2xl animate-pulse"></div>
                  <div className="relative z-10 flex flex-col h-full">
                    <div className="bg-gradient-to-br from-primary/20 to-primary/10 p-4 rounded-xl w-fit mb-6 backdrop-blur-sm shadow-md">
                      <Coins className="h-8 w-8 text-primary" />
                    </div>
                    <h3 className="text-2xl font-extrabold mb-4">Tokenized Content</h3>
                    <p className="text-base text-muted-foreground leading-relaxed mb-6 font-medium flex-grow">Transform your posts into tradeable digital assets. Each piece of content becomes a token with real market value.</p>
                  </div>
                </div>
              </div>

              {/* Perpetual Earnings Card - Glassy */}
              <div className="group relative h-full">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-500 rounded-2xl blur opacity-20 group-hover:opacity-40 transition duration-500"></div>
                <div className="relative h-full p-8 md:p-10 rounded-2xl bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border-0 shadow-2xl dark:shadow-emerald-500/10 transition-all duration-300 overflow-hidden flex flex-col">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-emerald-500/20 to-emerald-500/5 rounded-full blur-2xl animate-pulse"></div>
                  <div className="relative z-10 flex flex-col h-full">
                    <div className="bg-gradient-to-br from-emerald-500/20 to-emerald-500/10 p-4 rounded-xl w-fit mb-6 backdrop-blur-sm shadow-md">
                      <Infinity className="h-8 w-8 text-emerald-500" />
                    </div>
                    <h3 className="text-2xl font-extrabold mb-4">Earn Forever</h3>
                    <p className="text-base text-muted-foreground leading-relaxed mb-6 font-medium flex-grow">Publish once and earn perpetually. Receive royalties every time your content is traded or accessed.</p>
                  </div>
                </div>
              </div>

              {/* No Censorship Card - Glassy */}
              <div className="group relative h-full">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-600 via-blue-500 to-cyan-500 rounded-2xl blur opacity-20 group-hover:opacity-40 transition duration-500"></div>
                <div className="relative h-full p-8 md:p-10 rounded-2xl bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border-0 shadow-2xl dark:shadow-blue-500/10 transition-all duration-300 overflow-hidden flex flex-col">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-500/20 to-blue-500/5 rounded-full blur-2xl animate-pulse"></div>
                  <div className="relative z-10 flex flex-col h-full">
                    <div className="bg-gradient-to-br from-blue-500/20 to-blue-500/10 p-4 rounded-xl w-fit mb-6 backdrop-blur-sm shadow-md">
                      <Shield className="h-8 w-8 text-blue-500" />
                    </div>
                    <h3 className="text-2xl font-extrabold mb-4">True Ownership</h3>
                    <p className="text-base text-muted-foreground leading-relaxed mb-6 font-medium flex-grow">Your content, your rules. Immutable on-chain publishing means no one can censor or remove your work.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Blockchain Standards Section */}
          <div className="mb-24 md:mb-32">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold mb-3">
                Built on Best-in-Class Standards
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Leveraging cutting-edge Ethereum standards for security, efficiency, and user experience
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
              {/* EIP-4361 SIWE Card */}
              <div className="group relative h-full">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-600 via-purple-500 to-violet-500 rounded-2xl blur opacity-20 group-hover:opacity-40 transition duration-500"></div>
                <div className="relative h-full p-8 md:p-10 rounded-2xl bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border-0 shadow-2xl dark:shadow-purple-500/10 transition-all duration-300 overflow-hidden flex flex-col">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-purple-500/20 to-purple-500/5 rounded-full blur-2xl animate-pulse"></div>
                  <div className="relative z-10 flex flex-col h-full">
                    <div className="bg-gradient-to-br from-purple-500/20 to-purple-500/10 p-4 rounded-xl w-fit mb-6 backdrop-blur-sm shadow-md">
                      <Lock className="h-8 w-8 text-purple-500" />
                    </div>
                    <div className="mb-3">
                      <span className="text-xs font-semibold text-purple-500 tracking-wider uppercase">EIP-4361</span>
                      <h3 className="text-2xl font-extrabold mt-1">Sign-In with Ethereum</h3>
                    </div>
                    <p className="text-base text-muted-foreground leading-relaxed font-medium flex-grow">
                      Passwordless authentication using your Ethereum wallet. Secure, self-sovereign identity that eliminates credential theft and provides seamless access across Web3 applications.
                    </p>
                  </div>
                </div>
              </div>

              {/* EIP-712 Card */}
              <div className="group relative h-full">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-orange-600 via-orange-500 to-amber-500 rounded-2xl blur opacity-20 group-hover:opacity-40 transition duration-500"></div>
                <div className="relative h-full p-8 md:p-10 rounded-2xl bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border-0 shadow-2xl dark:shadow-orange-500/10 transition-all duration-300 overflow-hidden flex flex-col">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-orange-500/20 to-orange-500/5 rounded-full blur-2xl animate-pulse"></div>
                  <div className="relative z-10 flex flex-col h-full">
                    <div className="bg-gradient-to-br from-orange-500/20 to-orange-500/10 p-4 rounded-xl w-fit mb-6 backdrop-blur-sm shadow-md">
                      <FileSignature className="h-8 w-8 text-orange-500" />
                    </div>
                    <div className="mb-3">
                      <span className="text-xs font-semibold text-orange-500 tracking-wider uppercase">EIP-712</span>
                      <h3 className="text-2xl font-extrabold mt-1">Typed Structured Data</h3>
                    </div>
                    <p className="text-base text-muted-foreground leading-relaxed font-medium flex-grow">
                      Human-readable message signing that lets you see exactly what you're approving. Enhanced security and transparency for transactions, preventing phishing and unauthorized actions.
                    </p>
                  </div>
                </div>
              </div>

              {/* ERC-6909 Card */}
              <div className="group relative h-full">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-pink-600 via-pink-500 to-rose-500 rounded-2xl blur opacity-20 group-hover:opacity-40 transition duration-500"></div>
                <div className="relative h-full p-8 md:p-10 rounded-2xl bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border-0 shadow-2xl dark:shadow-pink-500/10 transition-all duration-300 overflow-hidden flex flex-col">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-pink-500/20 to-pink-500/5 rounded-full blur-2xl animate-pulse"></div>
                  <div className="relative z-10 flex flex-col h-full">
                    <div className="bg-gradient-to-br from-pink-500/20 to-pink-500/10 p-4 rounded-xl w-fit mb-6 backdrop-blur-sm shadow-md">
                      <Layers className="h-8 w-8 text-pink-500" />
                    </div>
                    <div className="mb-3">
                      <span className="text-xs font-semibold text-pink-500 tracking-wider uppercase">ERC-6909</span>
                      <h3 className="text-2xl font-extrabold mt-1">Multi-Token Standard</h3>
                    </div>
                    <p className="text-base text-muted-foreground leading-relaxed font-medium flex-grow">
                      Manage unlimited tokens within a single contract using unique IDs. Massive gas savings with no per-token contract deployment, plus flexible permission controls for efficient asset management.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Technology Stack Section */}
          <div className="mb-16">
            <div className="text-center mb-12">
              <h2 className="text-2xl md:text-3xl font-bold">
                Built with industry-leading technologies
              </h2>
            </div>
            
            {/* Grid Layout */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-6 md:gap-8 lg:gap-10 px-4 md:px-0">
              {/* IPFS - Glassy */}
              <div className="group relative">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-slate-600 to-slate-400 rounded-xl blur opacity-10 group-hover:opacity-30 transition duration-500"></div>
                <div className="relative flex items-center justify-center p-4 md:p-5 lg:p-6 rounded-xl bg-white/60 dark:bg-gray-900/60 backdrop-blur-sm border-0 shadow-lg hover:shadow-2xl transition-all duration-300">
                  <div className="flex items-center gap-2">
                    <Database className="h-6 w-6 sm:h-7 sm:w-7 md:h-8 md:w-8 lg:h-8 lg:w-8 flex-shrink-0 text-muted-foreground/70" />
                    <span className="font-bold text-xs sm:text-sm md:text-base lg:text-base text-muted-foreground break-words text-center">IPFS</span>
                  </div>
                </div>
              </div>

              {/* Pinata - Glassy */}
              <div className="group relative">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-slate-600 to-slate-400 rounded-xl blur opacity-10 group-hover:opacity-30 transition duration-500"></div>
                <div className="relative flex items-center justify-center p-4 md:p-5 lg:p-6 rounded-xl bg-white/60 dark:bg-gray-900/60 backdrop-blur-sm border-0 shadow-lg hover:shadow-2xl transition-all duration-300">
                  <div className="flex items-center gap-2">
                    <Cloud className="h-6 w-6 sm:h-7 sm:w-7 md:h-8 md:w-8 lg:h-8 lg:w-8 flex-shrink-0 text-muted-foreground/70" />
                    <span className="font-bold text-xs sm:text-sm md:text-base lg:text-base text-muted-foreground break-words text-center">Pinata</span>
                  </div>
                </div>
              </div>

              {/* Sepolia - Glassy */}
              <div className="group relative">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-slate-600 to-slate-400 rounded-xl blur opacity-10 group-hover:opacity-30 transition duration-500"></div>
                <div className="relative flex items-center justify-center p-4 md:p-5 lg:p-6 rounded-xl bg-white/60 dark:bg-gray-900/60 backdrop-blur-sm border-0 shadow-lg hover:shadow-2xl transition-all duration-300">
                  <div className="flex items-center gap-2">
                    <Zap className="h-6 w-6 sm:h-7 sm:w-7 md:h-8 md:w-8 lg:h-8 lg:w-8 flex-shrink-0 text-muted-foreground/70" />
                    <span className="font-bold text-xs sm:text-sm md:text-base lg:text-base text-muted-foreground break-words text-center">Sepolia</span>
                  </div>
                </div>
              </div>

              {/* Netlify - Glassy */}
              <div className="group relative">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-slate-600 to-slate-400 rounded-xl blur opacity-10 group-hover:opacity-30 transition duration-500"></div>
                <div className="relative flex items-center justify-center p-4 md:p-5 lg:p-6 rounded-xl bg-white/60 dark:bg-gray-900/60 backdrop-blur-sm border-0 shadow-lg hover:shadow-2xl transition-all duration-300">
                  <div className="flex items-center gap-2">
                    <Globe className="h-6 w-6 sm:h-7 sm:w-7 md:h-8 md:w-8 lg:h-8 lg:w-8 flex-shrink-0 text-muted-foreground/70" />
                    <span className="font-bold text-xs sm:text-sm md:text-base lg:text-base text-muted-foreground break-words text-center">Netlify</span>
                  </div>
                </div>
              </div>

              {/* Alchemy - Glassy */}
              <div className="group relative">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-slate-600 to-slate-400 rounded-xl blur opacity-10 group-hover:opacity-30 transition duration-500"></div>
                <div className="relative flex items-center justify-center p-4 md:p-5 lg:p-6 rounded-xl bg-white/60 dark:bg-gray-900/60 backdrop-blur-sm border-0 shadow-lg hover:shadow-2xl transition-all duration-300">
                  <div className="flex items-center gap-2">
                    <Webhook className="h-6 w-6 sm:h-7 sm:w-7 md:h-8 md:w-8 lg:h-8 lg:w-8 flex-shrink-0 text-muted-foreground/70" />
                    <span className="font-bold text-xs sm:text-sm md:text-base lg:text-base text-muted-foreground break-words text-center">Alchemy</span>
                  </div>
                </div>
              </div>

              {/* QuickNode - Glassy */}
              <div className="group relative">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-slate-600 to-slate-400 rounded-xl blur opacity-10 group-hover:opacity-30 transition duration-500"></div>
                <div className="relative flex items-center justify-center p-4 md:p-5 lg:p-6 rounded-xl bg-white/60 dark:bg-gray-900/60 backdrop-blur-sm border-0 shadow-lg hover:shadow-2xl transition-all duration-300">
                  <div className="flex items-center gap-2">
                    <Webhook className="h-6 w-6 sm:h-7 sm:w-7 md:h-8 md:w-8 lg:h-8 lg:w-8 flex-shrink-0 text-muted-foreground/70" />
                    <span className="font-bold text-xs sm:text-sm md:text-base lg:text-base text-muted-foreground break-words text-center">QuickNode</span>
                  </div>
                </div>
              </div>

              {/* Chainstack - Glassy */}
              <div className="group relative">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-slate-600 to-slate-400 rounded-xl blur opacity-10 group-hover:opacity-30 transition duration-500"></div>
                <div className="relative flex items-center justify-center p-4 md:p-5 lg:p-6 rounded-xl bg-white/60 dark:bg-gray-900/60 backdrop-blur-sm border-0 shadow-lg hover:shadow-2xl transition-all duration-300">
                  <div className="flex items-center gap-2">
                    <Server className="h-6 w-6 sm:h-7 sm:w-7 md:h-8 md:w-8 lg:h-8 lg:w-8 flex-shrink-0 text-muted-foreground/70" />
                    <span className="font-bold text-xs sm:text-sm md:text-base lg:text-base text-muted-foreground break-words text-center">Chainstack</span>
                  </div>
                </div>
              </div>

              {/* Goldsky - Glassy */}
              <div className="group relative">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-slate-600 to-slate-400 rounded-xl blur opacity-10 group-hover:opacity-30 transition duration-500"></div>
                <div className="relative flex items-center justify-center p-4 md:p-5 lg:p-6 rounded-xl bg-white/60 dark:bg-gray-900/60 backdrop-blur-sm border-0 shadow-lg hover:shadow-2xl transition-all duration-300">
                  <div className="flex items-center gap-2">
                    <Network className="h-6 w-6 sm:h-7 sm:w-7 md:h-8 md:w-8 lg:h-8 lg:w-8 flex-shrink-0 text-muted-foreground/70" />
                    <span className="font-bold text-xs sm:text-sm md:text-base lg:text-base text-muted-foreground break-words text-center">Goldsky</span>
                  </div>
                </div>
              </div>

              {/* Chatbase - Glassy */}
              <div className="group relative">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-slate-600 to-slate-400 rounded-xl blur opacity-10 group-hover:opacity-30 transition duration-500"></div>
                <div className="relative flex items-center justify-center p-4 md:p-5 lg:p-6 rounded-xl bg-white/60 dark:bg-gray-900/60 backdrop-blur-sm border-0 shadow-lg hover:shadow-2xl transition-all duration-300">
                  <div className="flex items-center gap-2">
                    <MessageSquare className="h-6 w-6 sm:h-7 sm:w-7 md:h-8 md:w-8 lg:h-8 lg:w-8 flex-shrink-0 text-muted-foreground/70" />
                    <span className="font-bold text-xs sm:text-sm md:text-base lg:text-base text-muted-foreground break-words text-center">Chatbase</span>
                  </div>
                </div>
              </div>

              {/* Wagmi - Glassy */}
              <div className="group relative">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-slate-600 to-slate-400 rounded-xl blur opacity-10 group-hover:opacity-30 transition duration-500"></div>
                <div className="relative flex items-center justify-center p-4 md:p-5 lg:p-6 rounded-xl bg-white/60 dark:bg-gray-900/60 backdrop-blur-sm border-0 shadow-lg hover:shadow-2xl transition-all duration-300">
                  <div className="flex items-center gap-2">
                    <Zap className="h-6 w-6 sm:h-7 sm:w-7 md:h-8 md:w-8 lg:h-8 lg:w-8 flex-shrink-0 text-muted-foreground/70" />
                    <span className="font-bold text-xs sm:text-sm md:text-base lg:text-base text-muted-foreground break-words text-center">Wagmi</span>
                  </div>
                </div>
              </div>

              {/* EditorJS - Glassy */}
              <div className="group relative">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-slate-600 to-slate-400 rounded-xl blur opacity-10 group-hover:opacity-30 transition duration-500"></div>
                <div className="relative flex items-center justify-center p-4 md:p-5 lg:p-6 rounded-xl bg-white/60 dark:bg-gray-900/60 backdrop-blur-sm border-0 shadow-lg hover:shadow-2xl transition-all duration-300">
                  <div className="flex items-center gap-2">
                    <Edit className="h-6 w-6 sm:h-7 sm:w-7 md:h-8 md:w-8 lg:h-8 lg:w-8 flex-shrink-0 text-muted-foreground/70" />
                    <span className="font-bold text-xs sm:text-sm md:text-base lg:text-base text-muted-foreground break-words text-center">EditorJS</span>
                  </div>
                </div>
              </div>

              {/* RainbowKit - Glassy */}
              <div className="group relative">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-slate-600 to-slate-400 rounded-xl blur opacity-10 group-hover:opacity-30 transition duration-500"></div>
                <div className="relative flex items-center justify-center p-4 md:p-5 lg:p-6 rounded-xl bg-white/60 dark:bg-gray-900/60 backdrop-blur-sm border-0 shadow-lg hover:shadow-2xl transition-all duration-300">
                  <div className="flex items-center gap-2">
                    <Wallet className="h-6 w-6 sm:h-7 sm:w-7 md:h-8 md:w-8 lg:h-8 lg:w-8 flex-shrink-0 text-muted-foreground/70" />
                    <span className="font-bold text-xs sm:text-sm md:text-base lg:text-base text-muted-foreground break-words text-center">RainbowKit</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <footer className="mt-24 md:mt-32 pt-12 pb-0 border-t border-border">
            <div className="flex flex-col items-center gap-6">
              {/* Social Icons */}
              <div className="flex gap-6 md:gap-8">
                <a 
                  href="https://docs.inkdao.tech/" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="p-3 rounded-lg bg-muted/50 text-muted-foreground hover:text-primary hover:bg-muted transition-all"
                  aria-label="Documentation"
                >
                  <SiGitbook className="h-6 w-6" />
                </a>
                <a 
                  href="https://t.me/ink_dao" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="p-3 rounded-lg bg-muted/50 text-muted-foreground hover:text-primary hover:bg-muted transition-all"
                  aria-label="Telegram Community"
                >
                  <FaTelegram className="h-6 w-6" />
                </a>
                <a 
                  href="https://github.com/InkDAO" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="p-3 rounded-lg bg-muted/50 text-muted-foreground hover:text-primary hover:bg-muted transition-all"
                  aria-label="GitHub Repository"
                >
                  <FaGithub className="h-6 w-6" />
                </a>
                <a 
                  href="https://x.com/inkdao_tech" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="p-3 rounded-lg bg-muted/50 text-muted-foreground hover:text-primary hover:bg-muted transition-all"
                  aria-label="X (Twitter) Profile"
                >
                  <FaXTwitter className="h-6 w-6" />
                </a>
              </div>

              {/* Copyright */}
              <p className="text-sm text-muted-foreground font-brand">
                © {new Date().getFullYear()} InkDAO. All rights reserved.
              </p>
            </div>
          </footer>
        </div>
      </div>
    </div>
  );
};

export default Landing;
