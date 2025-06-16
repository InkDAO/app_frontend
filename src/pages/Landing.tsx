import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { MessageSquare, ArrowRight, Shield, Users, Lock } from "lucide-react";
import { useTheme } from "@/context/ThemeContext";
import { Sun, Moon } from "lucide-react";

const Landing = () => {
  const { theme, toggleTheme } = useTheme();
  
  return (
    <div className="bg-gradient-to-b from-background via-background/95 to-background/90 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-secondary/20 rounded-full blur-3xl" />
      </div>

      {/* Theme toggle */}
      <div className="absolute top-4 right-4 z-50">
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleTheme}
          className="backdrop-blur-sm bg-background/50"
          title={theme === "light" ? "Switch to dark mode" : "Switch to light mode"}
        >
          {theme === "light" ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
        </Button>
      </div>

      <div className="container mx-auto px-4 py-24 relative z-10">
        <div className="max-w-5xl mx-auto text-center animate-fade-in">
          {/* Hero Section */}
          <div className="flex flex-col items-center mb-8">
            <div className="flex items-center justify-center gap-4 md:gap-12 mb-4 sm:mb-6 md:mb-8 w-full">
              <div className="relative group">
                <div className="absolute inset-0 bg-primary/20 rounded-lg blur-xl group-hover:scale-110 transition-transform duration-300" />
                <div className="relative aspect-square w-24 sm:w-28 md:w-32 lg:w-36 rounded-lg bg-primary/10 transition-all duration-300 flex items-center justify-center">
                  <img 
                    src="/dxLogo.png" 
                    alt="dx" 
                    className="h-full w-full object-contain" 
                  />
                </div>
              </div>
              <h1
                className="
                  text-3xl
                  sm:text-5xl
                  md:text-6xl
                  lg:text-7xl
                  font-extrabold
                  tracking-tight
                  bg-clip-text
                  text-transparent
                  bg-gradient-to-r
                  from-black
                  to-gray-700
                  drop-shadow-lg
                  flex items-center
                "
                style={{ lineHeight: 1.1 }}
              >
                decentralizedX
              </h1>
            </div>
            
            <p className="text-2xl mb-8 text-muted-foreground max-w-2xl">
              A decentralized space where your thoughts are permanent, your identity is yours, and your voice is unstoppable.
            </p>

            <div className="flex gap-2 sm:gap-4 w-full sm:w-1/2 max-w-xs sm:max-w-none mx-auto">
              <Link to="/app" className="w-1/2">
                <Button
                  size="lg"
                  className="w-full px-2 py-3 text-sm font-medium bg-primary hover:bg-primary/90 transition-colors sm:px-8 sm:py-6 sm:text-lg"
                >
                  Launch App
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Button
                size="lg"
                variant="outline"
                className="w-1/2 px-2 py-3 text-sm font-medium hover:bg-primary/10 transition-colors sm:px-8 sm:py-6 sm:text-lg"
              >
                Learn More
              </Button>
            </div>
          </div>

          {/* Features Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-8 mt-10 sm:mt-14">
            <div className="p-5 sm:p-8 rounded-2xl bg-card/50 backdrop-blur-sm border border-border/50 hover:border-primary/50 hover:-translate-y-1 transition-all duration-300">
              <div className="bg-primary/10 p-3 sm:p-4 rounded-xl w-fit mb-3 sm:mb-4 mx-auto">
                <Shield className="h-7 w-7 sm:h-8 sm:w-8 text-primary" />
              </div>
              <h3 className="text-lg sm:text-xl font-semibold mb-2 sm:mb-3">Pseudonymity</h3>
              <p className="text-sm sm:text-base text-muted-foreground">Your identity stays protected with wallet-based authentication. No personal data, no tracking.</p>
            </div>

            <div className="p-5 sm:p-8 rounded-2xl bg-card/50 backdrop-blur-sm border border-border/50 hover:border-primary/50 hover:-translate-y-1 transition-all duration-300">
              <div className="bg-primary/10 p-3 sm:p-4 rounded-xl w-fit mb-3 sm:mb-4 mx-auto">
                <Users className="h-7 w-7 sm:h-8 sm:w-8 text-primary" />
              </div>
              <h3 className="text-lg sm:text-xl font-semibold mb-2 sm:mb-3">Community Driven</h3>
              <p className="text-sm sm:text-base text-muted-foreground">Join a global network of blockchain enthusiasts sharing knowledge and insights.</p>
            </div>

            <div className="p-5 sm:p-8 rounded-2xl bg-card/50 backdrop-blur-sm border border-border/50 hover:border-primary/50 hover:-translate-y-1 transition-all duration-300">
              <div className="bg-primary/10 p-3 sm:p-4 rounded-xl w-fit mb-3 sm:mb-4 mx-auto">
                <Lock className="h-7 w-7 sm:h-8 sm:w-8 text-primary" />
              </div>
              <h3 className="text-lg sm:text-xl font-semibold mb-2 sm:mb-3">On-Chain Security</h3>
              <p className="text-sm sm:text-base text-muted-foreground">Every interaction is secured on the blockchain, ensuring transparency and immutability.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Landing;
