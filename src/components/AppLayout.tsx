import { ReactNode } from "react";
import { ThemeProvider } from "@/context/ThemeContext";
import Footer from "@/components/Footer";

interface AppLayoutProps {
  children: ReactNode;
}

const AppLayout = ({ children }: AppLayoutProps) => {
  return (
    <ThemeProvider>
        <div className="min-h-screen flex flex-col">
          <main className="flex-1 w-full max-w-[100vw] overflow-x-hidden">
            {children}
          </main>
          <Footer />
        </div>
    </ThemeProvider>
  );
};

export default AppLayout;
