import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { CheckCircle2, Loader2, Upload, FileText, Wallet, ExternalLink } from 'lucide-react';
import { Button } from "@/components/ui/button";

export type PublishStep = 'uploading' | 'signing' | 'confirming' | 'completed' | 'error';

interface PublishProgressModalProps {
  isOpen: boolean;
  currentStep: PublishStep;
  txHash?: string;
  error?: string;
  onClose?: () => void;
  assetAddress?: string;
}

const PublishProgressModal: React.FC<PublishProgressModalProps> = ({
  isOpen,
  currentStep,
  txHash,
  error,
  onClose,
  assetAddress
}) => {
  const navigate = useNavigate();
  
  const steps = [
    {
      key: 'uploading',
      label: 'Uploading Thumbnail',
      description: 'Uploading your thumbnail to IPFS...',
      icon: Upload,
    },
    {
      key: 'signing',
      label: 'Blockchain Transaction',
      description: 'Waiting for wallet signature...',
      icon: Wallet,
    },
    {
      key: 'confirming',
      label: 'Confirming Transaction',
      description: 'Waiting for blockchain confirmation...',
      icon: FileText,
    },
  ];

  const getStepStatus = (stepKey: string) => {
    const stepOrder = ['uploading', 'signing', 'confirming', 'completed'];
    const currentIndex = stepOrder.indexOf(currentStep);
    const stepIndex = stepOrder.indexOf(stepKey);

    if (currentStep === 'error') return 'error';
    if (stepIndex < currentIndex) return 'completed';
    if (stepIndex === currentIndex) return 'active';
    return 'pending';
  };

  return (
    <Dialog open={isOpen} onOpenChange={currentStep === 'completed' || currentStep === 'error' ? onClose : undefined}>
      <DialogContent 
        className="sm:max-w-md"
        onPointerDownOutside={(e) => {
          // Prevent closing during active publishing
          if (currentStep !== 'completed' && currentStep !== 'error') {
            e.preventDefault();
          }
        }}
      >
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-gray-900 dark:text-white">
            {currentStep === 'completed' ? 'Published Successfully!' : 
             currentStep === 'error' ? 'Publishing Failed' : 
             'Publishing Your Post'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Progress Steps */}
          {currentStep !== 'completed' && currentStep !== 'error' && (
            <div className="space-y-4">
              {steps.map((step, index) => {
                const status = getStepStatus(step.key);
                const Icon = step.icon;

                return (
                  <div key={step.key} className="flex items-start space-x-3">
                    <div className="flex-shrink-0 mt-1">
                      {status === 'completed' ? (
                        <CheckCircle2 className="w-5 h-5 text-green-500" />
                      ) : status === 'active' ? (
                        <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />
                      ) : (
                        <div className="w-5 h-5 rounded-full border-2 border-gray-300 dark:border-gray-600" />
                      )}
                    </div>
                    <div className="flex-1">
                      <p className={`font-medium ${
                        status === 'active' ? 'text-blue-600 dark:text-blue-400' :
                        status === 'completed' ? 'text-green-600 dark:text-green-400' :
                        'text-gray-500 dark:text-gray-400'
                      }`}>
                        {step.label}
                      </p>
                      {status === 'active' && (
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                          {step.description}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Completion Message */}
          {currentStep === 'completed' && (
            <div className="text-center space-y-4">
              <div className="flex justify-center">
                <div className="rounded-full bg-green-100 dark:bg-green-500/20 p-4">
                  <CheckCircle2 className="w-16 h-16 text-green-600 dark:text-green-400" />
                </div>
              </div>
              <div>
                <p className="text-xl font-semibold text-gray-900 dark:text-white">
                  Your post has been published!
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-300 mt-2">
                  Your content is now live on the blockchain and available to readers.
                </p>
              </div>
              {assetAddress && (
                <Button
                  className="w-full bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white font-medium"
                  onClick={() => {
                    navigate(`/app/post/${assetAddress}`);
                  }}
                >
                  View Your Post
                  <ExternalLink className="w-4 h-4 ml-2" />
                </Button>
              )}
            </div>
          )}

          {/* Error Message */}
          {currentStep === 'error' && (
            <div className="text-center space-y-4">
              <div className="flex justify-center">
                <div className="rounded-full bg-red-100 dark:bg-red-500/20 p-4">
                  <svg className="w-16 h-16 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </div>
              </div>
              <div>
                <p className="text-xl font-semibold text-gray-900 dark:text-white">
                  Publishing Failed
                </p>
                <p className="text-sm text-red-600 dark:text-red-300 mt-2">
                  {error || 'An error occurred while publishing your post. Please try again.'}
                </p>
              </div>
              {onClose && (
                <Button
                  variant="outline"
                  className="w-full border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800"
                  onClick={onClose}
                >
                  Close
                </Button>
              )}
            </div>
          )}

          {/* Transaction Hash Link */}
          {txHash && currentStep === 'confirming' && (
            <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
              <a
                href={`https://sepolia.etherscan.io/tx/${txHash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
              >
                View on Etherscan
                <ExternalLink className="w-3 h-3 ml-1" />
              </a>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PublishProgressModal;

