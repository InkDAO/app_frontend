import { TooltipProvider } from "@/components/ui/tooltip";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import AppLayout from "@/components/AppLayout";
import Landing from "@/pages/Landing";
import HomePage from "@/pages/HomePage";
import { PostPreviewPage } from "@/pages/PostPreviewPage";
import { MePage } from "@/pages/MePage";
import NotFound from "@/pages/NotFound";
import EditorPage from "@/pages/EditorPage";
import { ThemeProvider } from "@/context/ThemeContext";

import '@rainbow-me/rainbowkit/styles.css';

import {
  getDefaultConfig,
  RainbowKitProvider,
} from '@rainbow-me/rainbowkit';

import { sepolia } from "wagmi/chains"
import { WagmiProvider } from 'wagmi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const config = getDefaultConfig({
  appName: 'dX',
  projectId: import.meta.env.VITE_WAGMI_PROJECT_ID,
  chains: [sepolia],
  ssr: false, // If your dApp uses server side rendering (SSR)
});

const queryClient = new QueryClient();

const App = () => (
  <ThemeProvider>
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider>
          <TooltipProvider>
            <BrowserRouter>
              <Routes>
                <Route path="/" element={<Landing />} />
                <Route path="/app" element={
                  <AppLayout>
                    <HomePage />
                  </AppLayout>
                } />
                <Route path="/app/post/:assetAddress" element={
                  <AppLayout>
                    <PostPreviewPage />
                  </AppLayout>
                } />
                <Route path="/app/me" element={
                  <AppLayout>
                    <MePage />
                  </AppLayout>
                } />
                <Route path="/app/editor/:cid?" element={
                  <AppLayout>
                    <EditorPage />
                  </AppLayout>
                } />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
          </TooltipProvider>
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  </ThemeProvider>
);

export default App;