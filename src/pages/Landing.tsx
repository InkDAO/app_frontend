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
  Infinity
} from "lucide-react";
import { FaXTwitter, FaLinkedinIn, FaGithub, FaTelegram } from 'react-icons/fa6';
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
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-pulse delay-1000" />
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
              <div className="relative group">
                <div className="absolute inset-0 bg-primary/20 rounded-lg blur-xl group-hover:scale-110 transition-transform duration-300" />
                <div className="relative aspect-square w-48 sm:w-56 md:w-48 lg:w-64 rounded-lg transition-all duration-300 flex items-center justify-center">
                  <img 
                    src="/dxLogo.png" 
                    alt="dx" 
                    className="h-full w-full object-contain drop-shadow-2xl" 
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
                  tracking-tight
                    text-foreground
                    mb-4
                "
                style={{ lineHeight: 1.1 }}
              >
                decentralizedX
              </h1>
                
                <div className="flex items-center justify-center gap-2 mb-6">
                  <Sparkles className="h-5 w-5 text-primary animate-pulse" />
                  <p className="text-xl md:text-2xl font-semibold text-primary">
                    The Future of Content Publishing
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
                  <Link to="https://decentralizedx.gitbook.io/dx" className="flex-1 sm:flex-initial" target="_blank" rel="noopener noreferrer">
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
              {/* Total Posts */}
              <div className="text-center">
                <p className="text-xs sm:text-sm text-muted-foreground mb-3 uppercase tracking-wide">Total Posts</p>
                <h3 className="text-4xl sm:text-5xl md:text-6xl font-bold">
                  {isLoading ? <Skeleton className="h-12 sm:h-16 w-24 sm:w-32 mx-auto" /> : <AnimatedCounter value={totalPosts} />}
                </h3>
              </div>

              {/* Total Users */}
              <div className="text-center">
                <p className="text-xs sm:text-sm text-muted-foreground mb-3 uppercase tracking-wide">Total Users</p>
                <h3 className="text-4xl sm:text-5xl md:text-6xl font-bold">
                  {isLoading ? <Skeleton className="h-12 sm:h-16 w-24 sm:w-32 mx-auto" /> : <AnimatedCounter value={totalUsers} />}
                </h3>
              </div>

              {/* Total Value Traded */}
              <div className="text-center">
                <p className="text-xs sm:text-sm text-muted-foreground mb-3 uppercase tracking-wide">Total Value Traded</p>
                <h3 className="text-4xl sm:text-5xl md:text-6xl font-bold">
                  {isLoading ? <Skeleton className="h-12 sm:h-16 w-32 sm:w-40 mx-auto" /> : (
                    <span><AnimatedCounter value={parseFloat(totalValueTraded)} decimals={4} /> ETH</span>
                  )}
                </h3>
              </div>

              {/* Total Worth of Assets */}
              <div className="text-center">
                <p className="text-xs sm:text-sm text-muted-foreground mb-3 uppercase tracking-wide">Total Worth of Assets</p>
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
              <h2 className="text-3xl md:text-4xl font-bold mb-3">Why Choose decentralizedX?</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
              {/* Tokenized Content Card */}
              <div className="group p-8 md:p-10 rounded-2xl bg-card border-2 border-border shadow-md hover:shadow-xl transition-all duration-300 hover:border-primary/30">
                <div className="bg-gradient-to-br from-primary/10 to-primary/5 p-4 rounded-xl w-fit mb-6">
                  <Coins className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-2xl font-bold mb-4">Tokenized Content</h3>
                <p className="text-base text-muted-foreground leading-relaxed mb-6">Transform your posts into tradeable digital assets. Each piece of content becomes a token with real market value.</p>
              </div>

              {/* Perpetual Earnings Card */}
              <div className="group p-8 md:p-10 rounded-2xl bg-card border-2 border-border shadow-md hover:shadow-xl transition-all duration-300 hover:border-emerald-500/30">
                <div className="bg-gradient-to-br from-emerald-500/10 to-emerald-500/5 p-4 rounded-xl w-fit mb-6">
                  <Infinity className="h-8 w-8 text-emerald-500" />
                </div>
                <h3 className="text-2xl font-bold mb-4">Earn Forever</h3>
                <p className="text-base text-muted-foreground leading-relaxed mb-6">Publish once and earn perpetually. Receive royalties every time your content is traded or accessed.</p>
              </div>

              {/* No Censorship Card */}
              <div className="group p-8 md:p-10 rounded-2xl bg-card border-2 border-border shadow-md hover:shadow-xl transition-all duration-300 hover:border-blue-500/30">
                <div className="bg-gradient-to-br from-blue-500/10 to-blue-500/5 p-4 rounded-xl w-fit mb-6">
                  <Shield className="h-8 w-8 text-blue-500" />
                </div>
                <h3 className="text-2xl font-bold mb-4">True Ownership</h3>
                <p className="text-base text-muted-foreground leading-relaxed mb-6">Your content, your rules. Immutable on-chain publishing means no one can censor or remove your work.</p>
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
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6 md:gap-8 lg:gap-10 px-4 md:px-0">
              {/* IPFS */}
              <div className="flex items-center justify-center p-8 md:p-10 rounded-xl bg-card border-2 border-border shadow-md hover:shadow-xl transition-all duration-300">
                <div className="flex items-center gap-3">
                  <Database className="h-10 w-10 md:h-12 md:w-12 text-muted-foreground/60" />
                  <span className="font-medium text-lg md:text-xl text-muted-foreground/80">IPFS</span>
                </div>
              </div>

              {/* Pinata */}
              <div className="flex items-center justify-center p-8 md:p-10 rounded-xl bg-card border-2 border-border shadow-md hover:shadow-xl transition-all duration-300">
                <div className="flex items-center gap-3">
                  <Cloud className="h-10 w-10 md:h-12 md:w-12 text-muted-foreground/60" />
                  <span className="font-medium text-lg md:text-xl text-muted-foreground/80">Pinata</span>
                </div>
              </div>

              {/* Sepolia */}
              <div className="flex items-center justify-center p-8 md:p-10 rounded-xl bg-card border-2 border-border shadow-md hover:shadow-xl transition-all duration-300">
                <div className="flex items-center gap-3">
                  <Zap className="h-10 w-10 md:h-12 md:w-12 text-muted-foreground/60" />
                  <span className="font-medium text-lg md:text-xl text-muted-foreground/80">Sepolia</span>
                </div>
              </div>

              {/* Netlify */}
              <div className="flex items-center justify-center p-8 md:p-10 rounded-xl bg-card border-2 border-border shadow-md hover:shadow-xl transition-all duration-300">
                <div className="flex items-center gap-3">
                  <Globe className="h-10 w-10 md:h-12 md:w-12 text-muted-foreground/60" />
                  <span className="font-medium text-lg md:text-xl text-muted-foreground/80">Netlify</span>
                </div>
              </div>

              {/* Alchemy */}
              <div className="flex items-center justify-center p-8 md:p-10 rounded-xl bg-card border-2 border-border shadow-md hover:shadow-xl transition-all duration-300">
                <div className="flex items-center gap-3">
                  <Webhook className="h-10 w-10 md:h-12 md:w-12 text-muted-foreground/60" />
                  <span className="font-medium text-lg md:text-xl text-muted-foreground/80">Alchemy</span>
                </div>
              </div>

              {/* QuickNode */}
              <div className="flex items-center justify-center p-8 md:p-10 rounded-xl bg-card border-2 border-border shadow-md hover:shadow-xl transition-all duration-300">
                <div className="flex items-center gap-3">
                  <Webhook className="h-10 w-10 md:h-12 md:w-12 text-muted-foreground/60" />
                  <span className="font-medium text-lg md:text-xl text-muted-foreground/80">QuickNode</span>
                </div>
              </div>

              {/* Chainstack */}
              <div className="flex items-center justify-center p-8 md:p-10 rounded-xl bg-card border-2 border-border shadow-md hover:shadow-xl transition-all duration-300">
                <div className="flex items-center gap-3">
                  <Server className="h-10 w-10 md:h-12 md:w-12 text-muted-foreground/60" />
                  <span className="font-medium text-lg md:text-xl text-muted-foreground/80">Chainstack</span>
                </div>
              </div>

              {/* Wagmi */}
              <div className="flex items-center justify-center p-8 md:p-10 rounded-xl bg-card border-2 border-border shadow-md hover:shadow-xl transition-all duration-300">
                <div className="flex items-center gap-3">
                  <Zap className="h-10 w-10 md:h-12 md:w-12 text-muted-foreground/60" />
                  <span className="font-medium text-lg md:text-xl text-muted-foreground/80">Wagmi</span>
                </div>
              </div>

              {/* EditorJS */}
              <div className="flex items-center justify-center p-8 md:p-10 rounded-xl bg-card border-2 border-border shadow-md hover:shadow-xl transition-all duration-300">
                <div className="flex items-center gap-3">
                  <Edit className="h-10 w-10 md:h-12 md:w-12 text-muted-foreground/60" />
                  <span className="font-medium text-lg md:text-xl text-muted-foreground/80">EditorJS</span>
                </div>
              </div>

              {/* RainbowKit */}
              <div className="flex items-center justify-center p-8 md:p-10 rounded-xl bg-card border-2 border-border shadow-md hover:shadow-xl transition-all duration-300">
                <div className="flex items-center gap-3">
                  <Wallet className="h-10 w-10 md:h-12 md:w-12 text-muted-foreground/60" />
                  <span className="font-medium text-lg md:text-xl text-muted-foreground/80">RainbowKit</span>
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
                  href="https://decentralizedx.gitbook.io/dx" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="p-3 rounded-lg bg-muted/50 text-muted-foreground hover:text-primary hover:bg-muted transition-all"
                  aria-label="Documentation"
                >
                  <SiGitbook className="h-6 w-6" />
                </a>
                <a 
                  href="https://t.me/decentralizedX0" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="p-3 rounded-lg bg-muted/50 text-muted-foreground hover:text-primary hover:bg-muted transition-all"
                  aria-label="Telegram Community"
                >
                  <FaTelegram className="h-6 w-6" />
                </a>
                <a 
                  href="https://github.com/0xAakibAlam" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="p-3 rounded-lg bg-muted/50 text-muted-foreground hover:text-primary hover:bg-muted transition-all"
                  aria-label="GitHub Repository"
                >
                  <FaGithub className="h-6 w-6" />
                </a>
                <a 
                  href="https://x.com/0xAakibAlam" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="p-3 rounded-lg bg-muted/50 text-muted-foreground hover:text-primary hover:bg-muted transition-all"
                  aria-label="X (Twitter) Profile"
                >
                  <FaXTwitter className="h-6 w-6" />
                </a>
                <a 
                  href="https://www.linkedin.com/in/0xaakibalam/" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="p-3 rounded-lg bg-muted/50 text-muted-foreground hover:text-primary hover:bg-muted transition-all"
                  aria-label="LinkedIn Profile"
                >
                  <FaLinkedinIn className="h-6 w-6" />
                </a>
              </div>

              {/* Copyright */}
              <p className="text-sm text-muted-foreground">
                © {new Date().getFullYear()} decentralizedX. All rights reserved.
              </p>
            </div>
          </footer>
        </div>
      </div>
    </div>
  );
};

export default Landing;
