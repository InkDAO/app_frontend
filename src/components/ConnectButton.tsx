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
          <div>
            {(() => {
              if (!connected) {
                return (
                  <button
                    onClick={openConnectModal}
                    className={cn(
                      "flex items-center gap-2 px-3 py-2 rounded-lg border shadow-md transition-all duration-200 transform",
                      theme === "dark"
                        ? "bg-white text-black border-gray-300 hover:bg-gray-100"
                        : "bg-black text-white border-gray-800 hover:bg-gray-900",
                      "hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-400"
                    )}
                  >
                    <Wallet className="w-5 h-5" />
                    <span>Connect Wallet</span>
                  </button>
                );
              }

              if (chain.unsupported) {
                return (
                  <button
                    onClick={openChainModal}
                    className={cn(
                      "flex items-center gap-2 px-3 py-2 rounded-lg border shadow-md transition-all duration-200 transform text-red-600 border-red-300 bg-red-50 hover:bg-red-100 hover:shadow-lg hover:scale-105 focus:outline-none focus:ring-2 focus:ring-red-400"
                    )}
                  >
                    <span>Wrong network</span>
                  </button>
                );
              }

              return (
                <div className="flex items-center gap-3">
                  <button
                    onClick={openAccountModal}
                    className={cn(
                      "flex items-center gap-2 px-3 py-2 rounded-lg border shadow-md transition-all duration-200 transform",
                      theme === "dark"
                        ? "bg-white text-black border-gray-300 hover:bg-gray-100"
                        : "bg-black text-white border-gray-800 hover:bg-gray-900",
                      "hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-400"
                    )}
                  >
                    <Wallet className="w-5 h-5" />
                    {account.displayName}
                  </button>
                </div>
              );
            })()}
          </div>
        );
      }}
    </ConnectButton.Custom>
  );
};