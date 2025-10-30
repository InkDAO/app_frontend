import { Link, useLocation } from "react-router-dom";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Home,
  User2,
  Edit3,
  Sun,
  Moon,
  X,
  PanelLeftClose,
  BarChart3
} from "lucide-react";
import { FaXTwitter, FaGithub, FaTelegram } from 'react-icons/fa6';
import { SiGitbook } from 'react-icons/si';
import { useTheme } from "@/context/ThemeContext";
import { useSearch } from "@/context/SearchContext";
import { TagSearch } from "@/components/TagSearch";
import { cn } from "@/lib/utils";
import { useAccount } from "wagmi";

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const Sidebar = ({ isOpen, onClose }: SidebarProps) => {
  const location = useLocation();
  const { theme, toggleTheme } = useTheme();
  const { selectedTags, setSelectedTags } = useSearch();
  const [isTagSearchLoading, setIsTagSearchLoading] = useState(false);
  const { address } = useAccount();

  const handleTagSearch = (tags: string[]) => {
    setSelectedTags(tags);
  };

  const navigationItems = [
    {
      name: "Home",
      href: "/app",
      icon: Home,
      current: location.pathname === "/app"
    },
    {
      name: "Write",
      href: "/app/editor",
      icon: Edit3,
      current: location.pathname === "/app/editor" || location.pathname.startsWith("/app/editor/")
    },
    {
      name: "Me",
      href: "/app/me",
      icon: User2,
      current: location.pathname === "/app/me"
    },
    {
      name: "Dashboard",
      href: address ? `/dashboard/${address}` : "#",
      icon: BarChart3,
      current: location.pathname.startsWith("/dashboard")
    },
  ];

  const socialLinks = [
    {
      icon: <SiGitbook className="h-4 w-4" />,
      text: "Docs",
      href: "https://docs.inkdao.tech/",
      label: "Documentation"
    },
    {
      icon: <FaTelegram className="h-4 w-4" />,
      text: "Telegram",
      href: "https://t.me/ink_dao",
      label: "Telegram Community"
    },
    {
      icon: <FaGithub className="h-4 w-4" />,
      text: "GitHub",
      href: "https://github.com/InkDAO",
      label: "GitHub Repository"
    },
    {
      icon: <FaXTwitter className="h-4 w-4" />,
      text: "Twitter",
      href: "https://x.com/0xAakibAlam",
      label: "X (Twitter) Profile"
    }
  ];

  return (
    <>
      {/* Overlay for mobile/tablet */}
      {isOpen && (
        <div 
          className="fixed left-0 top-[calc(4rem+1px)] right-0 bottom-0 bg-black/50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}
      
      {/* Sidebar */}
        <div className={cn(
          "h-[calc(100vh-4rem)] w-64 sm:w-70 lg:w-72 bg-background border-r border-gray-100 dark:border-gray-900 transform transition-transform duration-300 ease-in-out flex flex-col overflow-hidden fixed left-0 z-50",
          isOpen ? "translate-x-0 top-[calc(4rem+2px)]" : "-translate-x-full top-16"
        )}>
          {/* Top border line */}
          <div className="w-full h-px bg-gray-100 dark:bg-gray-900"></div>
        {/* Header with Close Button */}
        <div className="p-4 flex-shrink-0 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Menu</h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-8 w-8 p-0 hover:bg-gray-100 dark:hover:bg-gray-900 lg:hidden"
            aria-label="Close sidebar"
          >
            <X className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="hidden lg:flex h-8 w-8 p-0 hover:bg-gray-100 dark:hover:bg-gray-900"
            aria-label="Close sidebar"
            title="Close sidebar"
          >
            <PanelLeftClose className="h-4 w-4" />
          </Button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 space-y-2 overflow-y-auto">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link key={item.name} to={item.href}>
                     <Button
                       variant="ghost"
                       className={cn(
                         "w-full justify-start gap-3 h-10",
                         item.current
                           ? "bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100 font-medium"
                           : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-900 hover:text-gray-900 dark:hover:text-gray-200"
                       )}
                     >
                       <Icon className={cn(
                         "h-5 w-5",
                         item.current ? "fill-current" : ""
                       )} />
                       <span>{item.name}</span>
                     </Button>
              </Link>
            );
          })}
        </nav>

        {/* Tag Filter Section */}
        <div className="p-4 border-t border-gray-100 dark:border-gray-900 flex-shrink-0">
          <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            Filter by Tags
          </div>
          <TagSearch
            onTagSearch={handleTagSearch}
            isLoading={isTagSearchLoading}
            placeholder="Add tags..."
            className="w-full"
            showAddButton={false}
          />
        </div>

        {/* Theme Toggle */}
        <div className="p-4 border-t border-gray-100 dark:border-gray-900 flex-shrink-0">
          <Button
            variant="ghost"
            onClick={toggleTheme}
            className="w-full justify-start gap-3 h-10"
          >
            {theme === "light" ? (
              <>
                <Moon className="h-5 w-5" />
                <span>Dark Mode</span>
              </>
            ) : (
              <>
                <Sun className="h-5 w-5" />
                <span>Light Mode</span>
              </>
            )}
          </Button>
        </div>

        {/* Footer Section */}
        <div className="p-4 border-t border-gray-100 dark:border-gray-900 flex-shrink-0">
          
          {/* Social Links */}
          <div className="flex items-center justify-between w-full">
            {socialLinks.map((link, index) => (
              <a
                key={index}
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center text-xs hover:opacity-80 transition-opacity flex-1"
                style={{ color: theme === "light" ? "#6B7280" : "#9CA3AF" }}
                aria-label={link.label}
              >
                {link.icon}
              </a>
            ))}
          </div>
        </div>

      </div>
    </>
  );
};

export default Sidebar;
