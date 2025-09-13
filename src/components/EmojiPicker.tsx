import { useState } from 'react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Smile } from 'lucide-react';
import { cn } from '@/lib/utils';

interface EmojiPickerProps {
  onEmojiSelect: (emoji: string) => void;
  className?: string;
}

// Simplified emoji list - just the most basic ones that should work everywhere
const allEmojis = [
  '😀', '😁', '😂', '😃', '😄', '😅', '😆', '😇', '😈', '😉',
  '😊', '😋', '😌', '😍', '😎', '😏', '😐', '😑', '😒', '😓',
  '👍', '👎', '👌', '👋', '👏', '🙏', '💯', '❤️', '💔', '💕',
  '🔥', '⭐', '✨', '🎉', '🎊', '🎈', '🍕', '🍔', '🍟', '☕'
];

export const EmojiPicker = ({ onEmojiSelect, className }: EmojiPickerProps) => {
  const [isOpen, setIsOpen] = useState(false);

  const handleEmojiClick = (emoji: string) => {
    onEmojiSelect(emoji);
    setIsOpen(false);
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <span
          className={cn(
            "cursor-pointer p-1 rounded-md hover:bg-accent hover:text-accent-foreground",
            className
          )}
          title="Insert Emoji"
        >
          <Smile className="h-4 w-4 md:h-5 md:w-5" />
        </span>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="start">
        <div className="h-64">
          {/* Emoji grid with scrolling */}
          <div className="h-full overflow-y-auto p-3">
            <div className="grid grid-cols-8 gap-1">
              {allEmojis.map((emoji, index) => (
                <button
                  key={index}
                  className="w-8 h-8 flex items-center justify-center text-lg hover:bg-accent rounded transition-colors emoji-picker-button"
                  onClick={() => handleEmojiClick(emoji)}
                  title={emoji}
                  style={{ 
                    fontSize: '18px',
                    lineHeight: '1'
                  }}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};
