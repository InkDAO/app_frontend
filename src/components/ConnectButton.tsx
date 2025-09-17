import { ConnectButton } from "@rainbow-me/rainbowkit";
import { Wallet } from "lucide-react";
import { useTheme } from "@/context/ThemeContext";
import { cn } from "@/lib/utils";

export const CustomConnectButton = () => {
  const { theme } = useTheme();

  return (
    <ConnectButton.Custom>
      {({
        account,
        chain,
        openAccountModal,
        openChainModal,
        openConnectModal,
        mounted,
      }) => {
        const ready = mounted;
        const connected = ready && account && chain;

        return (
          <button
            onClick={connected ? (chain?.unsupported ? openChainModal : openAccountModal) : openConnectModal}
            className={cn(
              "flex items-center gap-2 px-3 py-2 rounded-lg border shadow-md transition-all duration-200 transform",
              chain?.unsupported 
                ? "text-red-600 border-red-300 bg-red-50 hover:bg-red-100"
                : theme === "dark"
                  ? "bg-white text-black border-gray-300 hover:bg-gray-100"
                  : "bg-black text-white border-gray-800 hover:bg-gray-900",
              "hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-400"
            )}
          >
            <Wallet className="w-5 h-5" />
            {!connected && (
              <span className="hidden lg:inline">Connect Wallet</span>
            )}
            {connected && !chain?.unsupported && (
              <span className="hidden lg:inline">{account.displayName}</span>
            )}
            {chain?.unsupported && (
              <span className="hidden lg:inline">Wrong network</span>
            )}
          </button>
        );
      }}
    </ConnectButton.Custom>
  );
};