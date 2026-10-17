import React, { useRef, useState, useEffect } from 'react';
import { motion, useSpring, AnimatePresence } from 'motion/react';
import { Globe, X, ExternalLink, Sparkles, Layers } from 'lucide-react';
import { TabSession, BubblePhysicsConfig } from '../types/browser';

interface GoogleMessagesBubbleProps {
  tabs: TabSession[];
  activeTab: TabSession | null;
  containerBounds: { width: number; height: number };
  physicsConfig: BubblePhysicsConfig;
  onBubbleClick: () => void;
  onBubbleDismiss: () => void;
  onSelectTab: (tabId: string) => void;
  onCloseTab: (tabId: string) => void;
  isFannedOut?: boolean;
  onToggleFanOut?: (fanned: boolean) => void;
  onDragStateChange?: (isDragging: boolean, isMagnetized: boolean) => void;
}

export const GoogleMessagesBubble: React.FC<GoogleMessagesBubbleProps> = ({
  tabs,
  activeTab,
  containerBounds,
  physicsConfig,
  onBubbleClick,
  onBubbleDismiss,
  onSelectTab,
  onCloseTab,
  isFannedOut: externalIsFannedOut,
  onToggleFanOut,
  onDragStateChange
}) => {
  const bubbleRef = useRef<HTMLDivElement>(null);
  const fannedContainerRef = useRef<HTMLDivElement>(null);
  const bubbleSize = 60; // 60px diameter (60dp)
  const margin = physicsConfig.edgeMargin;

  // High-stiffness spring configuration for snapping back into main bubble
  const highStiffnessSnapBack = {
    type: 'spring' as const,
    stiffness: 720, // High-stiffness configuration for snappy physical snap
    damping: 36,    // Damped settling to prevent overshoot
    mass: 0.65
  };

  // Internal fan-out state if not controlled externally
  const [internalIsFannedOut, setInternalIsFannedOut] = useState<boolean>(false);
  const isFannedOut = externalIsFannedOut !== undefined ? externalIsFannedOut : internalIsFannedOut;

  const setFannedOut = (value: boolean) => {
    if (onToggleFanOut) {
      onToggleFanOut(value);
    } else {
      setInternalIsFannedOut(value);
    }
  };

  // Dedicated useEffect hook that triggers a collapse animation back to the main bubble
  // if the user taps outside the fanned-out area
  useEffect(() => {
    if (!isFannedOut) return;

    const handleOutsideInteraction = (event: PointerEvent) => {
      const target = event.target as Node;
      // If click/tap occurred outside the fanned-out tabs and outside the primary bubble
      if (
        fannedContainerRef.current &&
        !fannedContainerRef.current.contains(target) &&
        bubbleRef.current &&
        !bubbleRef.current.contains(target)
      ) {
        setFannedOut(false);
        if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
          try {
            navigator.vibrate(15);
          } catch (_) {}
        }
      }
    };

    window.addEventListener('pointerdown', handleOutsideInteraction, { capture: true });
    return () => {
      window.removeEventListener('pointerdown', handleOutsideInteraction, { capture: true });
    };
  }, [isFannedOut]);

  // Position coordinates
  const [currentX, setCurrentX] = useState<number>(margin);
  const [currentY, setCurrentY] = useState<number>(140);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [isPressed, setIsPressed] = useState<boolean>(false);
  const [isMagnetized, setIsMagnetized] = useState<boolean>(false);
  const [dismissing, setDismissing] = useState<boolean>(false);

  // Gesture timers: Long-press & Double-tap
  const longPressTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastTapTimeRef = useRef<number>(0);
  const longPressTriggeredRef = useRef<boolean>(false);

  // Velocity & move tracking
  const dragStartRef = useRef<{ x: number; y: number; touchX: number; touchY: number }>({
    x: 0,
    y: 0,
    touchX: 0,
    touchY: 0
  });
  const hasMovedRef = useRef<boolean>(false);

  // Spring animation values for smooth settling
  const springX = useSpring(currentX, {
    stiffness: physicsConfig.stiffness,
    damping: physicsConfig.damping,
    mass: physicsConfig.mass
  });
  const springY = useSpring(currentY, {
    stiffness: physicsConfig.stiffness,
    damping: physicsConfig.damping,
    mass: physicsConfig.mass
  });

  // Keep spring updated when state changes without drag
  useEffect(() => {
    if (!isDragging) {
      springX.set(currentX);
      springY.set(currentY);
    }
  }, [currentX, currentY, isDragging, springX, springY]);

  // Handle container resize
  useEffect(() => {
    if (!isDragging && containerBounds.width > 0) {
      if (currentX > containerBounds.width / 2) {
        setCurrentX(containerBounds.width - bubbleSize - margin);
      } else {
        setCurrentX(margin);
      }
    }
  }, [containerBounds.width, margin, bubbleSize]);

  // Clean up long press timer on unmount
  useEffect(() => {
    return () => {
      if (longPressTimerRef.current) {
        clearTimeout(longPressTimerRef.current);
      }
    };
  }, []);

  // Is docked on the left or right edge?
  const isLeftEdge = currentX < containerBounds.width / 2;

  // Handle pointer down (compress to 0.92x scale + start long-press detection)
  const handlePointerDown = (e: React.PointerEvent) => {
    if (dismissing) return;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);

    setIsPressed(true);
    hasMovedRef.current = false;
    longPressTriggeredRef.current = false;

    dragStartRef.current = {
      x: currentX,
      y: currentY,
      touchX: e.clientX,
      touchY: e.clientY
    };

    // Long press detection: 420ms hold without movement
    if (longPressTimerRef.current) clearTimeout(longPressTimerRef.current);
    longPressTimerRef.current = setTimeout(() => {
      if (!hasMovedRef.current && tabs.length > 1) {
        longPressTriggeredRef.current = true;
        setFannedOut(!isFannedOut);

        // Haptic feedback
        if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
          try {
            navigator.vibrate([30, 40, 40]);
          } catch (_) {}
        }
      }
    }, 420);
  };

  // Handle pointer move (dragging & magnetic detection)
  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isPressed || dismissing) return;

    const dx = e.clientX - dragStartRef.current.touchX;
    const dy = e.clientY - dragStartRef.current.touchY;

    // Movement threshold breaks long-press
    if (Math.hypot(dx, dy) > 8) {
      if (longPressTimerRef.current) {
        clearTimeout(longPressTimerRef.current);
        longPressTimerRef.current = null;
      }
    }

    if (!hasMovedRef.current && Math.hypot(dx, dy) > 8) {
      hasMovedRef.current = true;
      setIsDragging(true);
      // Collapse fan-out if dragging starts
      if (isFannedOut) setFannedOut(false);
    }

    if (hasMovedRef.current) {
      let nextX = dragStartRef.current.x + dx;
      let nextY = dragStartRef.current.y + dy;

      const minX = 0;
      const maxX = containerBounds.width - bubbleSize;
      const minY = 36;
      const maxY = containerBounds.height - bubbleSize - 16;

      nextX = Math.max(minX, Math.min(maxX, nextX));
      nextY = Math.max(minY, Math.min(maxY, nextY));

      // Magnetic detection towards bottom target
      const targetCenterX = containerBounds.width / 2;
      const targetCenterY = containerBounds.height - 80;
      const bubbleCenterX = nextX + bubbleSize / 2;
      const bubbleCenterY = nextY + bubbleSize / 2;
      const distToTarget = Math.hypot(bubbleCenterX - targetCenterX, bubbleCenterY - targetCenterY);

      const magnetized = distToTarget < physicsConfig.magneticThreshold;

      if (magnetized) {
        const pullFactor = 0.55;
        nextX = nextX + (targetCenterX - bubbleCenterX) * pullFactor;
        nextY = nextY + (targetCenterY - bubbleCenterY) * pullFactor;

        if (!isMagnetized) {
          setIsMagnetized(true);
          if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
            try {
              navigator.vibrate(20);
            } catch (_) {}
          }
        }
      } else {
        if (isMagnetized) setIsMagnetized(false);
      }

      setCurrentX(nextX);
      setCurrentY(nextY);
      springX.set(nextX);
      springY.set(nextY);

      onDragStateChange?.(true, magnetized);
    }
  };

  // Handle pointer up (snap to edge, tap, double-tap, or long-press finish)
  const handlePointerUp = (e: React.PointerEvent) => {
    if (!isPressed) return;
    setIsPressed(false);

    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }

    try {
      (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    } catch (_) {}

    onDragStateChange?.(false, false);

    // If long-press was already triggered, stop here
    if (longPressTriggeredRef.current) {
      return;
    }

    if (!hasMovedRef.current) {
      // Check for double-tap
      const now = Date.now();
      const timeDiff = now - lastTapTimeRef.current;
      lastTapTimeRef.current = now;

      if (timeDiff < 300 && tabs.length > 1) {
        // Double-tap detected: toggle stacking fan-out!
        setFannedOut(!isFannedOut);
        if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
          try {
            navigator.vibrate([25, 25]);
          } catch (_) {}
        }
      } else {
        // Single tap
        if (isFannedOut) {
          setFannedOut(false);
        } else {
          onBubbleClick();
        }
      }
    } else {
      setIsDragging(false);

      if (isMagnetized) {
        // Vaporize dismissal
        setDismissing(true);
        setTimeout(() => {
          onBubbleDismiss();
          setDismissing(false);
          setIsMagnetized(false);
        }, 180);
      } else {
        // Snap to nearest bezel
        const screenWidth = containerBounds.width;
        const midPoint = screenWidth / 2;
        const targetX =
          currentX + bubbleSize / 2 < midPoint
            ? margin
            : screenWidth - bubbleSize - margin;

        const targetY = Math.max(50, Math.min(containerBounds.height - bubbleSize - 50, currentY));

        setCurrentX(targetX);
        setCurrentY(targetY);
        springX.set(targetX);
        springY.set(targetY);
      }
    }
  };

  if (tabs.length === 0) return null;

  const totalTabs = tabs.length;
  const isLoading = activeTab ? !activeTab.isLoaded : false;
  const loadingProgress = activeTab ? activeTab.progress : 100;

  // Scale based on press & magnetic state
  let scale = 1.0;
  if (dismissing) {
    scale = 0;
  } else if (isMagnetized) {
    scale = 0.76;
  } else if (isPressed) {
    scale = physicsConfig.compressionScale;
  }

  const hasStack = totalTabs > 1 && !isFannedOut;

  // Fan-out vertical direction: if bubble is too low on screen, fan upward!
  const fanUpward = currentY > containerBounds.height - 240;

  // Handles clicking a tab preview to trigger snappy collapse and open the overlay
  const handleTabPreviewClick = (tabId: string) => {
    onSelectTab(tabId);
    // Triggers collapse animation back to main bubble
    setFannedOut(false);
    // Open floating overlay after snappy collapse starts
    setTimeout(() => {
      onBubbleClick();
    }, 120);
  };

  return (
    <div className="absolute inset-0 pointer-events-none z-40 overflow-hidden">
      {/* Dimmed backdrop when fanned out to focus multitasking tabs */}
      <AnimatePresence>
        {isFannedOut && (
          <motion.div
            key="fan-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: 0.12 } }}
            onClick={() => setFannedOut(false)}
            className="absolute inset-0 bg-black/40 backdrop-blur-[2px] pointer-events-auto z-30"
          />
        )}
      </AnimatePresence>

      {/* Main Draggable Lead Bubble */}
      <motion.div
        ref={bubbleRef}
        style={{
          x: springX,
          y: springY,
          width: bubbleSize,
          height: bubbleSize
        }}
        animate={{
          scale: scale,
          opacity: dismissing ? 0 : 1
        }}
        transition={{
          scale: { type: 'spring', stiffness: 450, damping: 25 },
          opacity: { duration: 0.16 }
        }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        className="absolute pointer-events-auto touch-none select-none cursor-grab active:cursor-grabbing z-40"
      >
        {/* Background stack layer 2 (if 3+ tabs and not fanned out) */}
        {totalTabs >= 3 && hasStack && (
          <div
            className="absolute inset-0 rounded-full bg-indigo-950/60 border border-indigo-400/20 shadow-md transform translate-x-2 -translate-y-1.5 scale-90 -z-20 transition-transform duration-200"
          />
        )}

        {/* Background stack layer 1 (if 2+ tabs and not fanned out) */}
        {hasStack && (
          <div
            className="absolute inset-0 rounded-full bg-indigo-900/80 border border-indigo-400/30 shadow-lg transform translate-x-1 -translate-y-1 scale-95 -z-10 transition-transform duration-200"
          />
        )}

        {/* Lead Bubble Card */}
        <div
          className={`relative w-full h-full rounded-full flex items-center justify-center transition-all duration-150 backdrop-blur-md ${
            isMagnetized
              ? 'bg-rose-500/90 text-white shadow-xl shadow-rose-600/40 border-2 border-rose-300'
              : isFannedOut
              ? 'bg-gradient-to-br from-blue-500 via-indigo-600 to-blue-700 text-white shadow-2xl ring-4 ring-blue-400/50 border-2 border-white'
              : 'bg-gradient-to-br from-indigo-600 via-blue-600 to-indigo-700 text-white shadow-2xl shadow-indigo-950/60 border-2 border-indigo-300/40 hover:border-indigo-200'
          }`}
        >
          {/* Circular SVG Loading Progress Ring */}
          {isLoading && (
            <svg
              className="absolute -inset-1 w-[68px] h-[68px] -rotate-90 pointer-events-none"
              viewBox="0 0 68 68"
            >
              <circle
                cx="34"
                cy="34"
                r="31"
                fill="none"
                stroke="rgba(255, 255, 255, 0.2)"
                strokeWidth="2.5"
              />
              <circle
                cx="34"
                cy="34"
                r="31"
                fill="none"
                stroke="#60A5FA"
                strokeWidth="2.5"
                strokeDasharray={195}
                strokeDashoffset={195 - (195 * loadingProgress) / 100}
                strokeLinecap="round"
                className="transition-all duration-150 ease-out"
              />
            </svg>
          )}

          {/* Favicon / Icon Display */}
          <div className="flex items-center justify-center text-xl select-none">
            {activeTab?.favicon ? (
              <span className="leading-none drop-shadow-sm">{activeTab.favicon}</span>
            ) : (
              <Globe className="w-6 h-6 text-white stroke-[2.2]" />
            )}
          </div>

          {/* Floating Bubble Ripple Highlight */}
          <div className="absolute top-1.5 left-2 w-4 h-2 rounded-full bg-white/30 rotate-[-25deg] pointer-events-none" />

          {/* Tab Counter / Notification Badge */}
          <AnimatePresence>
            {totalTabs > 0 && !isFannedOut && (
              <motion.div
                key={`badge-${totalTabs}`}
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.5, opacity: 0 }}
                transition={{ type: 'spring', stiffness: 500, damping: 25 }}
                className="absolute -bottom-1 -right-1 min-w-[22px] h-[22px] px-1 rounded-full bg-blue-500 text-white text-[11px] font-bold flex items-center justify-center border-2 border-slate-900 shadow-md shadow-black/40"
              >
                {totalTabs > 9 ? '9+' : totalTabs}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Fanned Out Close Toggle Icon */}
          {isFannedOut && (
            <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-slate-900 text-white border border-slate-700 flex items-center justify-center shadow-sm">
              <X className="w-3 h-3" />
            </div>
          )}
        </div>
      </motion.div>

      {/* FANNED-OUT STACK VIEW: Multi-window fan-out tabs */}
      <AnimatePresence>
        {isFannedOut && (
          <div ref={fannedContainerRef} className="absolute inset-0 pointer-events-none z-40">
            {tabs.map((tab, index) => {
              const isActive = tab.id === activeTab?.id;
              // Vertical spacing per fanned tab
              const spacing = 68;
              const yOffset = fanUpward ? -(index + 1) * spacing : (index + 1) * spacing;
              const targetBubbleY = currentY + yOffset;

              return (
                <motion.div
                  key={`fanned-tab-${tab.id}`}
                  initial={{
                    opacity: 0,
                    x: currentX,
                    y: currentY,
                    scale: 0.6
                  }}
                  animate={{
                    opacity: 1,
                    x: currentX,
                    y: targetBubbleY,
                    scale: 1,
                    transition: {
                      type: 'spring',
                      stiffness: 380,
                      damping: 26,
                      delay: index * 0.04
                    }
                  }}
                  exit={{
                    opacity: 0,
                    x: currentX,
                    y: currentY,
                    scale: 0.35,
                    transition: highStiffnessSnapBack
                  }}
                  className="absolute pointer-events-auto flex items-center select-none"
                  style={{
                    width: bubbleSize,
                    height: bubbleSize
                  }}
                >
                  {/* Fanned Bubble Circle */}
                  <div
                    onClick={() => handleTabPreviewClick(tab.id)}
                    className={`relative w-full h-full rounded-full flex items-center justify-center cursor-pointer transition-transform hover:scale-105 active:scale-95 shadow-xl ${
                      isActive
                        ? 'bg-gradient-to-br from-blue-600 via-indigo-600 to-blue-700 ring-4 ring-blue-400 border-2 border-white text-white'
                        : 'bg-slate-800/90 hover:bg-slate-700 border-2 border-slate-600/60 text-slate-200'
                    }`}
                  >
                    <span className="text-xl leading-none drop-shadow-sm">{tab.favicon}</span>

                    {/* Quick Close Button for this individual tab */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onCloseTab(tab.id);
                        if (tabs.length <= 1) setFannedOut(false);
                      }}
                      title="Close tab"
                      className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-slate-900 hover:bg-rose-600 text-slate-300 hover:text-white flex items-center justify-center border border-slate-700 shadow-md transition-colors"
                    >
                      <X className="w-2.5 h-2.5" />
                    </button>
                  </div>

                  {/* Multitasking Title & Domain Pill */}
                  <motion.div
                    initial={{ opacity: 0, x: isLeftEdge ? -12 : 12 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{
                      opacity: 0,
                      x: isLeftEdge ? -24 : 24,
                      scale: 0.7,
                      transition: highStiffnessSnapBack
                    }}
                    transition={{ delay: index * 0.04 + 0.08 }}
                    onClick={() => handleTabPreviewClick(tab.id)}
                    className={`absolute top-1/2 -translate-y-1/2 cursor-pointer transition-all hover:scale-[1.02] shadow-xl ${
                      isLeftEdge
                        ? 'left-full ml-3 origin-left'
                        : 'right-full mr-3 origin-right'
                    }`}
                  >
                    <div
                      className={`flex items-center gap-2.5 px-3.5 py-2 rounded-2xl border text-xs backdrop-blur-md whitespace-nowrap max-w-[210px] ${
                        isActive
                          ? 'bg-blue-950/90 border-blue-500/80 text-white shadow-blue-950/50'
                          : 'bg-slate-900/90 hover:bg-slate-800/95 border-slate-700/80 text-slate-200 shadow-black/40'
                      }`}
                    >
                      <div className="flex flex-col min-w-0">
                        <span className="font-semibold text-xs truncate max-w-[150px]">
                          {tab.title}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono truncate max-w-[150px]">
                          {tab.domain}
                        </span>
                      </div>
                      {isActive && (
                        <span className="w-2 h-2 rounded-full bg-blue-400 shrink-0 animate-pulse" />
                      )}
                    </div>
                  </motion.div>
                </motion.div>
              );
            })}
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
