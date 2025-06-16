import { Link, useLocation } from "react-router-dom";
import { CustomConnectButton } from './ConnectButton';
import { useTheme } from "@/context/ThemeContext";
import { Button } from "@/components/ui/button";
import { Moon, Sun, ArchiveIcon, MessageSquare, Menu, HomeIcon, MessageCircle, Megaphone } from "lucide-react";
import { FaXTwitter, FaLinkedinIn, FaGithub, FaTelegram, FaGlobe } from 'react-icons/fa6';
import { SiGitbook } from 'react-icons/si';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";
import {
  NavigationMenu,
  NavigationMenuList,
  NavigationMenuItem,
  NavigationMenuLink,
  navigationMenuTriggerStyle
} from "@/components/ui/navigation-menu";

const Navbar = () => {
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();
  
  const socialLinks = [
    {
      icon: <SiGitbook className="h-4 w-4" />,
      text: "Docs",
      href: "https://decentralizedx.gitbook.io/dx",
      label: "Documentation"
    },
    {
      icon: <FaTelegram className="h-4 w-4" />,
      text: "Telegram",
      href: "https://t.me/decentralizedX0",
      label: "Telegram Community"
    },
    {
      icon: <FaGithub className="h-4 w-4" />,
      text: "GitHub",
      href: "https://github.com/0xAakibAlam",
      label: "GitHub Repository"
    },
    {
      icon: <FaXTwitter className="h-4 w-4" />,
      text: "Twitter",
      href: "https://x.com/0xAakibAlam",
      label: "X (Twitter) Profile"
    },
    {
      icon: <FaLinkedinIn className="h-4 w-4" />,
      text: "LinkedIn",
      href: "https://www.linkedin.com/in/0xaakibalam/",
      label: "LinkedIn Profile"
    },
  ];

  return (
    <nav>
      <div className="container px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Link to="/" className="text-xl font-bold flex items-center gap-2">
              <img 
                src={theme === "light" ? "/exDark.png" : "/exLight.png"} 
                alt="ex" 
                className="h-10 w-10 object-contain" 
              /> 
            </Link>
            <DropdownMenu>
              <DropdownMenuTrigger asChild className="lg:hidden p-2 rounded-lg"
                style={{
                  backgroundColor: theme === "light" ? "#F0F0F0" : "#222222",
                }}
              >
                  <Menu className="h-10 w-10" />
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-screen px-4">
                <DropdownMenuItem asChild>
                  <Link to="/app" className="cursor-pointer w-full">
                    <HomeIcon className="mr-2 h-4 w-4" />
                    Home
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/app/my-posts" className="cursor-pointer w-full">
                    <MessageSquare className="mr-2 h-4 w-4" />
                    My Posts
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/app/my-comments" className="cursor-pointer w-full">
                    <MessageCircle className="mr-2 h-4 w-4" />
                    My Comments
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link to="/app/announcements" className="cursor-pointer w-full">
                    <Megaphone className="mr-2 h-4 w-4" />
                    Announcements
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/app/archives" className="cursor-pointer w-full">
                    <ArchiveIcon className="mr-2 h-4 w-4" />
                    Archives
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                {socialLinks.map((link, index) => (
                  <DropdownMenuItem key={index} asChild>
                    <a
                      href={link.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="cursor-pointer w-full flex items-center"
                    >
                      {link.icon}
                      <span className="ml-2">{link.text}</span>
                    </a>
                  </DropdownMenuItem>
                ))}
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  onClick={toggleTheme}
                >
                  {theme === "light" ? (
                    <>
                      <Moon className="mr-2 h-4 w-4" />
                      Dark Mode
                    </>
                  ) : (
                    <>
                      <Sun className="mr-2 h-4 w-4" />
                      Light Mode
                    </>
                  )}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <div className="hidden lg:block flex-1 mx-4">
            <NavigationMenu className="float-left">
              <NavigationMenuList className="p-1 rounded-lg shadow-md flex gap-1"
                style={{
                  backgroundColor: theme === "light" ? "#FFFFFF" : "#1A1A1A",
                  borderRadius: "8px",
                  boxShadow: theme === "light" ? "0 6px 20px rgba(0, 0, 0, 0.2)" : "0 6px 20px rgba(0, 0, 0, 0.7)",
                }}
              >
                <NavigationMenuItem>
                  <Link to="/app">
                    <NavigationMenuLink className={navigationMenuTriggerStyle()} style={{
                      backgroundColor: location.pathname === "/app" ? (theme === "light" ? "#E0E0E0" : "#3A3A3A") : "",
                      color: theme === "light" ? "#1A1A1A" : "#E0E0E0",
                      borderRadius: "6px",
                      padding: "6px 12px",
                      height: "auto",
                      transition: "all 0.3s ease",
                    }}>
                      <HomeIcon className="mr-2 h-6 w-6" />
                      Home
                    </NavigationMenuLink>
                  </Link>
                </NavigationMenuItem>
                  <NavigationMenuItem>
                    <Link to="/app/my-posts">
                      <NavigationMenuLink className={navigationMenuTriggerStyle()} style={{
                        backgroundColor: location.pathname === "/app/my-posts" ? (theme === "light" ? "#E0E0E0" : "#3A3A3A") : "",
                        color: theme === "light" ? "#1A1A1A" : "#E0E0E0",
                        borderRadius: "6px",
                        padding: "6px 12px",
                        height: "auto",
                        transition: "all 0.3s ease",
                      }}>
                        <MessageSquare className="mr-2 h-6 w-6" />
                        My Posts
                      </NavigationMenuLink>
                    </Link>
                  </NavigationMenuItem>
                  <NavigationMenuItem>
                    <Link to="/app/my-comments">
                      <NavigationMenuLink className={navigationMenuTriggerStyle()} style={{
                        backgroundColor: location.pathname === "/app/my-comments" ? (theme === "light" ? "#E0E0E0" : "#3A3A3A") : "",
                        color: theme === "light" ? "#1A1A1A" : "#E0E0E0",
                        borderRadius: "6px",
                        padding: "6px 12px",
                        height: "auto",
                        transition: "all 0.3s ease",
                      }}>
                        <MessageCircle className="mr-2 h-6 w-6" />
                        My Comments
                      </NavigationMenuLink>
                    </Link>
                  </NavigationMenuItem>
                  <NavigationMenuItem>
                  <Link to="/app/announcements">
                      <NavigationMenuLink className={navigationMenuTriggerStyle()} style={{
                        backgroundColor: location.pathname === "/app/announcements" ? (theme === "light" ? "#E0E0E0" : "#3A3A3A") : "",
                        color: theme === "light" ? "#1A1A1A" : "#E0E0E0",
                        borderRadius: "6px",
                        padding: "6px 12px",
                        height: "auto",
                        transition: "all 0.3s ease",
                      }}>
                        <Megaphone className="mr-2 h-6 w-6" />
                        Announcements
                      </NavigationMenuLink>
                    </Link>
                  </NavigationMenuItem>
                <NavigationMenuItem>
                  <Link to="/app/archives">
                    <NavigationMenuLink className={navigationMenuTriggerStyle()} style={{
                      backgroundColor: location.pathname === "/app/archives" ? (theme === "light" ? "#E0E0E0" : "#3A3A3A") : "",
                      color: theme === "light" ? "#1A1A1A" : "#E0E0E0",
                      borderRadius: "6px",
                      padding: "6px 12px",
                      height: "auto",
                      transition: "all 0.3s ease",
                    }}>
                      <ArchiveIcon className="mr-2 h-6 w-6" />
                      Archives
                    </NavigationMenuLink>
                  </Link>
                </NavigationMenuItem>
                <NavigationMenuItem>
                  <NavigationMenuLink 
                    className={navigationMenuTriggerStyle()} 
                    onClick={toggleTheme}
                    style={{
                      backgroundColor: "transparent",
                      color: theme === "light" ? "#1A1A1A" : "#E0E0E0",
                      borderRadius: "6px",
                      padding: "6px 12px",
                      height: "auto",
                      transition: "all 0.3s ease",
                      cursor: "pointer"
                    }}
                  >
                    {theme === "light" ? (
                      <>
                        <Moon className="mr-2 h-6 w-6" />
                        Dark Mode
                      </>
                    ) : (
                      <>
                        <Sun className="mr-2 h-6 w-6" />
                        Light Mode
                      </>
                    )}
                  </NavigationMenuLink>
                </NavigationMenuItem>
              </NavigationMenuList>
            </NavigationMenu>
          </div>

          <div className="flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="rounded-lg hidden lg:flex"
                  style={{
                    backgroundColor: theme === "light" ? "#F0F0F0" : "#222222",
                  }}
                >
                  <FaGlobe className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {socialLinks.map((link, index) => (
                  <DropdownMenuItem key={index} asChild>
                    <a
                      href={link.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="cursor-pointer w-full flex items-center"
                    >
                      {link.icon}
                      <span className="ml-2">{link.text}</span>
                    </a>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
            <div className="flex-shrink-0">
              <CustomConnectButton />
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
