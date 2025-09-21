import { ConnectButton } from "@rainbow-me/rainbowkit";
import { Wallet } from "lucide-react";
import { useTheme } from "@/context/ThemeContext";
import { cn } from "@/lib/utils";

interface CustomConnectButtonProps {
  isEditorPage?: boolean;
}

export const CustomConnectButton = ({ isEditorPage = false }: CustomConnectButtonProps) => {
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
                      "flex items-center gap-2 px-3 py-2 border shadow-md transition-all duration-200 transform",
                      isEditorPage 
                        ? "rounded-lg border-r border-gray-300 dark:border-gray-600"
                        : "rounded-l-lg rounded-r-none border-r-0",
                      chain?.unsupported 
                        ? "text-red-600 border-red-300 bg-red-50 hover:bg-red-100"
                        : theme === "dark"
                          ? "bg-white text-black border-gray-300 hover:bg-gray-100"
                          : "bg-black text-white border-gray-800 hover:bg-gray-900",
                      "hover:scale-105 focus:outline-none"
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
                      "flex items-center gap-2 px-3 py-2 border shadow-md transition-all duration-200 transform",
                      isEditorPage 
                        ? "rounded-lg border-r border-gray-300 dark:border-gray-600"
                        : "rounded-l-lg rounded-r-none border-r-0",
                      chain?.unsupported 
                        ? "text-red-600 border-red-300 bg-red-50 hover:bg-red-100"
                        : theme === "dark"
                          ? "bg-white text-black border-gray-300 hover:bg-gray-100"
                          : "bg-black text-white border-gray-800 hover:bg-gray-900",
                      "hover:scale-105 focus:outline-none"
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
                      "flex items-center gap-2 px-3 py-2 border shadow-md transition-all duration-200 transform",
                      isEditorPage 
                        ? "rounded-lg border-r border-gray-300 dark:border-gray-600"
                        : "rounded-l-lg rounded-r-none border-r-0",
                      chain?.unsupported 
                        ? "text-red-600 border-red-300 bg-red-50 hover:bg-red-100"
                        : theme === "dark"
                          ? "bg-white text-black border-gray-300 hover:bg-gray-100"
                          : "bg-black text-white border-gray-800 hover:bg-gray-900",
                      "hover:scale-105 focus:outline-none"
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