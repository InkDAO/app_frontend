import { createContext, useContext, ReactNode } from 'react';

interface SidebarContextType {
  sidebarOpen: boolean;
  showSidebar: boolean;
}

const SidebarContext = createContext<SidebarContextType | undefined>(undefined);

export const useSidebar = () => {
  const context = useContext(SidebarContext);
  if (context === undefined) {
    // Return default values if used outside provider (e.g., in routes without sidebar)
    return { sidebarOpen: false, showSidebar: false };
  }
  return context;
};

interface SidebarProviderProps {
  children: ReactNode;
  sidebarOpen: boolean;
  showSidebar: boolean;
}

export const SidebarProvider = ({ children, sidebarOpen, showSidebar }: SidebarProviderProps) => {
  return (
    <SidebarContext.Provider value={{ sidebarOpen, showSidebar }}>
      {children}
    </SidebarContext.Provider>
  );
};

