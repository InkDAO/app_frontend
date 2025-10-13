import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { 
  ArrowRight, 
  Shield, 
  Users, 
  Lock, 
  Sparkles, 
  TrendingUp, 
  DollarSign, 
  FileText,
  Zap,
  Globe,
  Database,
  Cloud
} from "lucide-react";
import { useTheme } from "@/context/ThemeContext";
import { Sun, Moon } from "lucide-react";
import { usePlatformMetrics } from "@/hooks/usePlatformMetrics";
import { Skeleton } from "@/components/ui/skeleton";

const Landing = () => {
  const { theme, toggleTheme } = useTheme();
  const { totalPosts, totalValueTraded, totalWorthOfAssets, isLoading } = usePlatformMetrics();
  
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
          <div className="mb-16">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 px-4">
              {/* Total Posts */}
              <div className="text-center">
                <p className="text-xs sm:text-sm text-muted-foreground mb-3 uppercase tracking-wide">Total Posts</p>
                <h3 className="text-4xl sm:text-5xl md:text-6xl font-bold">
                  {isLoading ? <Skeleton className="h-12 sm:h-16 w-24 sm:w-32 mx-auto" /> : totalPosts.toLocaleString()}
                </h3>
              </div>

              {/* Total Users */}
              <div className="text-center">
                <p className="text-xs sm:text-sm text-muted-foreground mb-3 uppercase tracking-wide">Total Users</p>
                <h3 className="text-4xl sm:text-5xl md:text-6xl font-bold">
                  {isLoading ? <Skeleton className="h-12 sm:h-16 w-24 sm:w-32 mx-auto" /> : "0"}
                </h3>
              </div>

              {/* Total Value Traded */}
              <div className="text-center">
                <p className="text-xs sm:text-sm text-muted-foreground mb-3 uppercase tracking-wide">Total Value Traded</p>
                <h3 className="text-4xl sm:text-5xl md:text-6xl font-bold">
                  {isLoading ? <Skeleton className="h-12 sm:h-16 w-32 sm:w-40 mx-auto" /> : (
                    <span>{totalValueTraded} ETH</span>
                  )}
                </h3>
              </div>

              {/* Total Worth of Assets */}
              <div className="text-center">
                <p className="text-xs sm:text-sm text-muted-foreground mb-3 uppercase tracking-wide">Total Worth of Assets</p>
                <h3 className="text-4xl sm:text-5xl md:text-6xl font-bold">
                  {isLoading ? <Skeleton className="h-12 sm:h-16 w-32 sm:w-40 mx-auto" /> : (
                    <span>{totalWorthOfAssets} ETH</span>
                  )}
                </h3>
              </div>
            </div>
          </div>

          {/* Features Grid */}
          <div className="mb-16">
            {/* <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold mb-3">Why Choose decentralizedX?</h2>
              <p className="text-muted-foreground text-lg">Built with cutting-edge blockchain technology</p>
            </div> */}
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
              {/* Pseudonymity Card */}
              <div className="group relative p-8 rounded-3xl bg-gradient-to-br from-card via-card to-card/80 backdrop-blur-sm border border-border/50 hover:border-primary/30 transition-all duration-500 hover:shadow-2xl hover:shadow-primary/5 overflow-hidden">
                {/* Subtle background gradient on hover */}
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                
                <div className="relative">
                  <div className="hidden md:block bg-gradient-to-br from-primary/20 to-primary/5 p-5 rounded-2xl w-fit mb-6 mx-auto group-hover:scale-110 transition-transform duration-300">
                    <Shield className="h-10 w-10 text-primary" />
                  </div>
                  <h3 className="text-2xl font-bold mb-4 text-center">Pseudonymity</h3>
                  <p className="text-base text-muted-foreground text-center leading-relaxed">Your identity stays protected with wallet-based authentication. No personal data, no tracking.</p>
                </div>
              </div>

              {/* Community Driven Card */}
              <div className="group relative p-8 rounded-3xl bg-gradient-to-br from-card via-card to-card/80 backdrop-blur-sm border border-border/50 hover:border-purple-500/30 transition-all duration-500 hover:shadow-2xl hover:shadow-purple-500/5 overflow-hidden">
                {/* Subtle background gradient on hover */}
                <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                
                <div className="relative">
                  <div className="hidden md:block bg-gradient-to-br from-purple-500/20 to-purple-500/5 p-5 rounded-2xl w-fit mb-6 mx-auto group-hover:scale-110 transition-transform duration-300">
                    <Users className="h-10 w-10 text-purple-500" />
                  </div>
                  <h3 className="text-2xl font-bold mb-4 text-center">Community Driven</h3>
                  <p className="text-base text-muted-foreground text-center leading-relaxed">Join a global network of blockchain enthusiasts sharing knowledge and insights.</p>
                </div>
            </div>

              {/* On-Chain Security Card */}
              <div className="group relative p-8 rounded-3xl bg-gradient-to-br from-card via-card to-card/80 backdrop-blur-sm border border-border/50 hover:border-blue-500/30 transition-all duration-500 hover:shadow-2xl hover:shadow-blue-500/5 overflow-hidden">
                {/* Subtle background gradient on hover */}
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                
                <div className="relative">
                  <div className="hidden md:block bg-gradient-to-br from-blue-500/20 to-blue-500/5 p-5 rounded-2xl w-fit mb-6 mx-auto group-hover:scale-110 transition-transform duration-300">
                    <Lock className="h-10 w-10 text-blue-500" />
                  </div>
                  <h3 className="text-2xl font-bold mb-4 text-center">On-Chain Security</h3>
                  <p className="text-base text-muted-foreground text-center leading-relaxed">Every interaction is secured on the blockchain, ensuring transparency and immutability.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Technology Stack Section */}
          <div className="mb-16 overflow-hidden">
            {/* <div className="text-center mb-8">
              <h2 className="text-3xl md:text-4xl font-bold mb-3">Powered By</h2>
              <p className="text-muted-foreground text-lg">Built with industry-leading technologies</p>
            </div> */}
            
            <div className="relative py-12 px-4 rounded-3xl bg-gradient-to-r from-primary/5 via-purple-500/5 to-secondary/5 border border-border/30 backdrop-blur-sm">
              {/* Gradient overlays for smooth edges - blend with the subtle background */}
              <div className="absolute left-0 top-0 bottom-0 w-32 bg-gradient-to-r from-primary/5 via-primary/3 to-transparent z-10 pointer-events-none rounded-l-3xl" />
              <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-secondary/5 via-secondary/3 to-transparent z-10 pointer-events-none rounded-r-3xl" />
              
              {/* Sliding container with hardware acceleration */}
              <div className="inline-flex animate-slide-infinite will-change-transform">
                {/* First set of items */}
                <div className="inline-flex gap-6 md:gap-24 shrink-0 pr-6 md:pr-24">
                  {/* IPFS */}
                  <div className="group p-4 md:p-6 rounded-2xl bg-card/30 backdrop-blur-sm border border-border/50 hover:border-cyan-500/50 transition-all duration-300 flex flex-col items-center justify-center hover:shadow-lg hover:shadow-cyan-500/10 hover:-translate-y-1 w-32 md:w-48 shrink-0">
                    <div className="bg-gradient-to-br from-cyan-500/20 to-cyan-600/20 p-3 md:p-4 rounded-xl mb-2 md:mb-3 group-hover:scale-110 transition-transform">
                      <Database className="h-6 w-6 md:h-10 md:w-10 text-cyan-500" />
                    </div>
                    <h3 className="font-semibold text-sm md:text-lg">IPFS</h3>
                    <p className="text-xs text-muted-foreground text-center mt-1">Decentralized Storage</p>
                  </div>

                  {/* Pinata */}
                  <div className="group p-4 md:p-6 rounded-2xl bg-card/30 backdrop-blur-sm border border-border/50 hover:border-purple-500/50 transition-all duration-300 flex flex-col items-center justify-center hover:shadow-lg hover:shadow-purple-500/10 hover:-translate-y-1 w-32 md:w-48 shrink-0">
                    <div className="bg-gradient-to-br from-purple-500/20 to-purple-600/20 p-3 md:p-4 rounded-xl mb-2 md:mb-3 group-hover:scale-110 transition-transform">
                      <Cloud className="h-6 w-6 md:h-10 md:w-10 text-purple-500" />
                    </div>
                    <h3 className="font-semibold text-sm md:text-lg">Pinata</h3>
                    <p className="text-xs text-muted-foreground text-center mt-1">IPFS Gateway</p>
                  </div>

                  {/* Sepolia */}
                  <div className="group p-4 md:p-6 rounded-2xl bg-card/30 backdrop-blur-sm border border-border/50 hover:border-blue-500/50 transition-all duration-300 flex flex-col items-center justify-center hover:shadow-lg hover:shadow-blue-500/10 hover:-translate-y-1 w-32 md:w-48 shrink-0">
                    <div className="bg-gradient-to-br from-blue-500/20 to-blue-600/20 p-3 md:p-4 rounded-xl mb-2 md:mb-3 group-hover:scale-110 transition-transform">
                      <Zap className="h-6 w-6 md:h-10 md:w-10 text-blue-500" />
                    </div>
                    <h3 className="font-semibold text-sm md:text-lg">Sepolia</h3>
                    <p className="text-xs text-muted-foreground text-center mt-1">Ethereum Testnet</p>
                  </div>

                  {/* Wagmi */}
                  <div className="group p-4 md:p-6 rounded-2xl bg-card/30 backdrop-blur-sm border border-border/50 hover:border-orange-500/50 transition-all duration-300 flex flex-col items-center justify-center hover:shadow-lg hover:shadow-orange-500/10 hover:-translate-y-1 w-32 md:w-48 shrink-0">
                    <div className="bg-gradient-to-br from-orange-500/20 to-orange-600/20 p-3 md:p-4 rounded-xl mb-2 md:mb-3 group-hover:scale-110 transition-transform">
                      <Zap className="h-6 w-6 md:h-10 md:w-10 text-orange-500" />
                    </div>
                    <h3 className="font-semibold text-sm md:text-lg">Wagmi</h3>
                    <p className="text-xs text-muted-foreground text-center mt-1">React Hooks</p>
                  </div>

                  {/* Netlify */}
                  <div className="group p-4 md:p-6 rounded-2xl bg-card/30 backdrop-blur-sm border border-border/50 hover:border-teal-500/50 transition-all duration-300 flex flex-col items-center justify-center hover:shadow-lg hover:shadow-teal-500/10 hover:-translate-y-1 w-32 md:w-48 shrink-0">
                    <div className="bg-gradient-to-br from-teal-500/20 to-teal-600/20 p-3 md:p-4 rounded-xl mb-2 md:mb-3 group-hover:scale-110 transition-transform">
                      <Globe className="h-6 w-6 md:h-10 md:w-10 text-teal-500" />
                    </div>
                    <h3 className="font-semibold text-sm md:text-lg">Netlify</h3>
                    <p className="text-xs text-muted-foreground text-center mt-1">Hosting & Deploy</p>
                  </div>
                </div>

                {/* Second set - duplicate for seamless loop */}
                <div className="inline-flex gap-6 md:gap-24 shrink-0 pr-6 md:pr-24">
                  <div className="group p-4 md:p-6 rounded-2xl bg-card/30 backdrop-blur-sm border border-border/50 hover:border-cyan-500/50 transition-all duration-300 flex flex-col items-center justify-center hover:shadow-lg hover:shadow-cyan-500/10 hover:-translate-y-1 w-32 md:w-48 shrink-0">
                    <div className="bg-gradient-to-br from-cyan-500/20 to-cyan-600/20 p-3 md:p-4 rounded-xl mb-2 md:mb-3 group-hover:scale-110 transition-transform">
                      <Database className="h-6 w-6 md:h-10 md:w-10 text-cyan-500" />
                    </div>
                    <h3 className="font-semibold text-sm md:text-lg">IPFS</h3>
                    <p className="text-xs text-muted-foreground text-center mt-1">Decentralized Storage</p>
                  </div>

                  <div className="group p-4 md:p-6 rounded-2xl bg-card/30 backdrop-blur-sm border border-border/50 hover:border-purple-500/50 transition-all duration-300 flex flex-col items-center justify-center hover:shadow-lg hover:shadow-purple-500/10 hover:-translate-y-1 w-32 md:w-48 shrink-0">
                    <div className="bg-gradient-to-br from-purple-500/20 to-purple-600/20 p-3 md:p-4 rounded-xl mb-2 md:mb-3 group-hover:scale-110 transition-transform">
                      <Cloud className="h-6 w-6 md:h-10 md:w-10 text-purple-500" />
                    </div>
                    <h3 className="font-semibold text-sm md:text-lg">Pinata</h3>
                    <p className="text-xs text-muted-foreground text-center mt-1">IPFS Gateway</p>
                  </div>

                  <div className="group p-4 md:p-6 rounded-2xl bg-card/30 backdrop-blur-sm border border-border/50 hover:border-blue-500/50 transition-all duration-300 flex flex-col items-center justify-center hover:shadow-lg hover:shadow-blue-500/10 hover:-translate-y-1 w-32 md:w-48 shrink-0">
                    <div className="bg-gradient-to-br from-blue-500/20 to-blue-600/20 p-3 md:p-4 rounded-xl mb-2 md:mb-3 group-hover:scale-110 transition-transform">
                      <Zap className="h-6 w-6 md:h-10 md:w-10 text-blue-500" />
                    </div>
                    <h3 className="font-semibold text-sm md:text-lg">Sepolia</h3>
                    <p className="text-xs text-muted-foreground text-center mt-1">Ethereum Testnet</p>
                  </div>

                  <div className="group p-4 md:p-6 rounded-2xl bg-card/30 backdrop-blur-sm border border-border/50 hover:border-orange-500/50 transition-all duration-300 flex flex-col items-center justify-center hover:shadow-lg hover:shadow-orange-500/10 hover:-translate-y-1 w-32 md:w-48 shrink-0">
                    <div className="bg-gradient-to-br from-orange-500/20 to-orange-600/20 p-3 md:p-4 rounded-xl mb-2 md:mb-3 group-hover:scale-110 transition-transform">
                      <Zap className="h-6 w-6 md:h-10 md:w-10 text-orange-500" />
                    </div>
                    <h3 className="font-semibold text-sm md:text-lg">Wagmi</h3>
                    <p className="text-xs text-muted-foreground text-center mt-1">React Hooks</p>
                  </div>

                  <div className="group p-4 md:p-6 rounded-2xl bg-card/30 backdrop-blur-sm border border-border/50 hover:border-teal-500/50 transition-all duration-300 flex flex-col items-center justify-center hover:shadow-lg hover:shadow-teal-500/10 hover:-translate-y-1 w-32 md:w-48 shrink-0">
                    <div className="bg-gradient-to-br from-teal-500/20 to-teal-600/20 p-3 md:p-4 rounded-xl mb-2 md:mb-3 group-hover:scale-110 transition-transform">
                      <Globe className="h-6 w-6 md:h-10 md:w-10 text-teal-500" />
                    </div>
                    <h3 className="font-semibold text-sm md:text-lg">Netlify</h3>
                    <p className="text-xs text-muted-foreground text-center mt-1">Hosting & Deploy</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Call to Action */}
          {/* <div className="text-center p-8 rounded-3xl bg-gradient-to-r from-primary/10 via-purple-500/10 to-secondary/10 border border-primary/20">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Ready to Get Started?</h2>
            <p className="text-lg text-muted-foreground mb-6 max-w-2xl mx-auto">
              Join the revolution of decentralized content publishing. Your voice, your rules, forever on-chain.
            </p>
            <Link to="/app">
              <Button
                size="lg"
                className="px-8 py-6 text-lg font-semibold bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-700 transition-all transform hover:scale-105 shadow-lg hover:shadow-xl"
              >
                Launch App Now
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </div> */}
        </div>
      </div>
    </div>
  );
};

export default Landing;
