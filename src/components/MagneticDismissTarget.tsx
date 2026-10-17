import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X } from 'lucide-react';

interface MagneticDismissTargetProps {
  isVisible: boolean;
  isMagnetized: boolean;
  containerWidth: number;
  bottomOffset?: number;
}

export const MagneticDismissTarget: React.FC<MagneticDismissTargetProps> = ({
  isVisible,
  isMagnetized,
  containerWidth,
  bottomOffset = 48
}) => {
  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          key="dismiss-target"
          initial={{ opacity: 0, scale: 0.4, y: 30 }}
          animate={{
            opacity: 1,
            scale: isMagnetized ? 1.35 : 1.0,
            y: 0
          }}
          exit={{ opacity: 0, scale: 0.3, y: 30 }}
          transition={{ type: 'spring', stiffness: 400, damping: 25 }}
          style={{
            left: `${containerWidth / 2 - 32}px`,
            bottom: `${bottomOffset}px`
          }}
          className={`absolute z-30 pointer-events-none flex flex-col items-center justify-center`}
        >
          {/* Outer magnetic pulse ring */}
          <div
            className={`w-16 h-16 rounded-full flex items-center justify-center transition-colors duration-150 shadow-2xl backdrop-blur-md ${
              isMagnetized
                ? 'bg-rose-600/90 text-white shadow-rose-500/50 ring-4 ring-rose-400/50'
                : 'bg-slate-900/80 text-slate-300 border border-slate-700/60 shadow-black/40'
            }`}
          >
            <X
              className={`w-7 h-7 transition-transform duration-150 ${
                isMagnetized ? 'scale-110 stroke-[2.5]' : 'scale-95'
              }`}
            />
          </div>
          
          <motion.span
            initial={{ opacity: 0 }}
            animate={{ opacity: isMagnetized ? 1 : 0.7 }}
            className={`mt-1.5 text-[10px] font-semibold tracking-wider uppercase px-2 py-0.5 rounded-full ${
              isMagnetized
                ? 'bg-rose-950/80 text-rose-200 border border-rose-800/40'
                : 'text-slate-400 bg-slate-900/60'
            }`}
          >
            {isMagnetized ? 'Release to close' : 'Drag here'}
          </motion.span>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
