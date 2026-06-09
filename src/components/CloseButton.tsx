import React from 'react';
import { X } from 'lucide-react';
import { cn } from '../lib/utils';
import { motion } from 'motion/react';

interface CloseButtonProps {
  onClick: () => void;
  className?: string;
  isAbsolute?: boolean;
}

export const CloseButton: React.FC<CloseButtonProps> = ({ onClick, className, isAbsolute = true }) => {
  return (
    <motion.button
      whileHover={{ scale: 1.1, backgroundColor: 'rgba(255, 255, 255, 0.2)' }}
      whileTap={{ scale: 0.9 }}
      onClick={onClick}
      className={cn(
        "p-1.5 rounded-full",
        "bg-white/10 backdrop-blur-md border border-white/20",
        "text-white/70 hover:text-white",
        "transition-all duration-200 z-50",
        isAbsolute && "absolute top-2 right-2",
        className
      )}
      aria-label="Close"
    >
      <X size={16} />
    </motion.button>
  );
};
