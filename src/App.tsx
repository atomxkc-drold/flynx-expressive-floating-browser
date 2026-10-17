/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import { GoogleMessagesBubble } from './components/GoogleMessagesBubble';
import { MagneticDismissTarget } from './components/MagneticDismissTarget';
import { FloatingBrowserOverlay } from './components/FloatingBrowserOverlay';
import { HostAppFeed } from './components/HostAppFeed';
import { PhysicsWorkbench } from './components/PhysicsWorkbench';
import { TabSession, BubblePhysicsConfig } from './types/browser';
import { INITIAL_ARTICLES } from './data/mockArticles';
import {
  Smartphone,
  Maximize2,
  Minimize2,
  Info,
  Sparkles,
  Layers,
  HelpCircle,
  ExternalLink
} from 'lucide-react';

export default function App() {
  // Tabs state - seed with initial 2 tabs so bubble is immediately interactive
  const [tabs, setTabs] = useState<TabSession[]>(() => INITIAL_ARTICLES.slice(0, 2));
  const [activeTabId, setActiveTabId] = useState<string>(() => INITIAL_ARTICLES[0].id);
  const [isBrowserOpen, setIsBrowserOpen] = useState<boolean>(false);

  // Physics config
  const [physicsConfig, setPhysicsConfig] = useState<BubblePhysicsConfig>({
    stiffness: 360,
    damping: 24, // Google Messages low-bounciness
    mass: 1.0,
    compressionScale: 0.92, // Google Messages tactility
    magneticThreshold: 180,
    edgeMargin: 18
  });

  // Dragging and magnetic state
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [isMagnetized, setIsMagnetized] = useState<boolean>(false);

  // Device display mode: phone frame vs full canvas
  const [isFullScreen, setIsFullScreen] = useState<boolean>(false);

  // Measure phone container dimensions for bubble boundary & magnetic coordinates
  const phoneContainerRef = useRef<HTMLDivElement>(null);
  const [containerBounds, setContainerBounds] = useState<{ width: number; height: number }>({
    width: 380,
    height: 740
  });

  useEffect(() => {
    const updateBounds = () => {
      if (phoneContainerRef.current) {
        const rect = phoneContainerRef.current.getBoundingClientRect();
        setContainerBounds({
          width: rect.width,
          height: rect.height
        });
      }
    };

    updateBounds();
    window.addEventListener('resize', updateBounds);
    return () => window.removeEventListener('resize', updateBounds);
  }, [isFullScreen]);

  // Simulate tab loading progress when new tabs are spawned
  const handleSpawnTab = (article: TabSession) => {
    // LRU Cap at 5 tabs
    setTabs((prev) => {
      let nextTabs = [...prev];
      if (nextTabs.length >= 5) {
        // Recycle oldest tab
        nextTabs = nextTabs.slice(1);
      }
      return [...nextTabs, { ...article, progress: 15, isLoaded: false }];
    });
    setActiveTabId(article.id);

    // Simulate background loading progression
    let step = 15;
    const interval = setInterval(() => {
      step += Math.floor(Math.random() * 25) + 15;
      if (step >= 100) {
        step = 100;
        clearInterval(interval);
        setTabs((prev) =>
          prev.map((t) => (t.id === article.id ? { ...t, progress: 100, isLoaded: true } : t))
        );
      } else {
        setTabs((prev) =>
          prev.map((t) => (t.id === article.id ? { ...t, progress: step } : t))
        );
      }
    }, 140);
  };

  const handleCloseTab = (tabId: string) => {
    setTabs((prev) => {
      const remaining = prev.filter((t) => t.id !== tabId);
      if (remaining.length === 0) {
        setIsBrowserOpen(false);
      } else if (activeTabId === tabId) {
        setActiveTabId(remaining[remaining.length - 1].id);
      }
      return remaining;
    });
  };

  const handleClearAllTabs = () => {
    setTabs([]);
    setIsBrowserOpen(false);
  };

  const activeTab = tabs.find((t) => t.id === activeTabId) || tabs[0] || null;

  // Stacking fan-out state
  const [isFannedOut, setIsFannedOut] = useState<boolean>(false);

  // Reader setting: show / hide "Listen to Article" player
  const [showListenToArticle, setShowListenToArticle] = useState<boolean>(true);

  return (
    <div className="flex h-screen w-screen bg-slate-950 text-slate-100 overflow-hidden font-sans">
      {/* Left Physics & Tuning Workbench (collapsible or split on desktop) */}
      {!isFullScreen && (
        <aside className="hidden lg:block w-[380px] xl:w-[420px] h-full shrink-0">
          <PhysicsWorkbench
            physicsConfig={physicsConfig}
            onUpdatePhysics={setPhysicsConfig}
            activeTabs={tabs}
            onSpawnTab={handleSpawnTab}
            onClearTabs={handleClearAllTabs}
            isDragging={isDragging}
            isMagnetized={isMagnetized}
            isBrowserOpen={isBrowserOpen}
            isFannedOut={isFannedOut}
            onToggleFanOut={() => setIsFannedOut(!isFannedOut)}
            showListenToArticle={showListenToArticle}
            onToggleShowListenToArticle={setShowListenToArticle}
          />
        </aside>
      )}

      {/* Main Interactive Stage */}
      <main className="flex-1 h-full flex flex-col items-center justify-center p-2 sm:p-4 md:p-6 bg-gradient-to-b from-slate-950 via-slate-900/60 to-slate-950 relative overflow-hidden">
        {/* Subtle background ambient mesh */}
        <div className="absolute top-1/4 left-1/3 w-96 h-96 rounded-full bg-blue-600/10 blur-3xl pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full bg-indigo-600/10 blur-3xl pointer-events-none" />

        {/* Top Control Bar for Viewport & Instructions */}
        <header className="w-full max-w-4xl flex items-center justify-between px-4 py-2 mb-2 z-10">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-400">
              Interactive Google Messages Bubble Physics & Stacking Animation
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsFullScreen(!isFullScreen)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-900/90 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 text-xs font-medium transition-all shadow-sm"
              title={isFullScreen ? 'Exit Full Screen' : 'Toggle Full Screen Mode'}
            >
              {isFullScreen ? (
                <>
                  <Minimize2 className="w-3.5 h-3.5" />
                  <span>Exit Fullscreen</span>
                </>
              ) : (
                <>
                  <Maximize2 className="w-3.5 h-3.5" />
                  <span>Fullscreen Canvas</span>
                </>
              )}
            </button>
          </div>
        </header>

        {/* Phone Mockup Container */}
        <div
          ref={phoneContainerRef}
          style={{
            width: isFullScreen ? '100%' : '100%',
            maxWidth: isFullScreen ? '100%' : '410px',
            height: isFullScreen ? 'calc(100% - 50px)' : 'calc(100% - 60px)',
            maxHeight: isFullScreen ? '100%' : '780px'
          }}
          className={`relative transition-all duration-300 flex flex-col ${
            isFullScreen
              ? 'rounded-none border-none shadow-none bg-slate-950'
              : 'rounded-[46px] border-[10px] border-slate-800/90 shadow-2xl shadow-black/80 ring-1 ring-slate-700/40 bg-slate-900 overflow-hidden'
          }`}
        >
          {/* Smartphone Camera Punchhole (Only shown in framed mode) */}
          {!isFullScreen && (
            <div className="absolute top-2.5 left-1/2 -translate-x-1/2 w-28 h-5 rounded-full bg-black z-50 flex items-center justify-center pointer-events-none">
              <div className="w-2.5 h-2.5 rounded-full bg-slate-900 ring-1 ring-slate-800 mr-4" />
              <div className="w-2 h-2 rounded-full bg-blue-950 ring-1 ring-blue-900" />
            </div>
          )}

          {/* Background Host App (The phone screen behind the bubble) */}
          <HostAppFeed
            onSpawnTab={handleSpawnTab}
            tabCount={tabs.length}
            onOpenBubble={() => setIsBrowserOpen(true)}
          />

          {/* Floating Google Messages Bubble Layer */}
          <GoogleMessagesBubble
            tabs={tabs}
            activeTab={activeTab}
            containerBounds={containerBounds}
            physicsConfig={physicsConfig}
            onBubbleClick={() => setIsBrowserOpen(true)}
            onBubbleDismiss={handleClearAllTabs}
            onSelectTab={(id) => {
              setActiveTabId(id);
              setIsBrowserOpen(true);
            }}
            onCloseTab={handleCloseTab}
            isFannedOut={isFannedOut}
            onToggleFanOut={setIsFannedOut}
            onDragStateChange={(dragging, magnetized) => {
              setIsDragging(dragging);
              setIsMagnetized(magnetized);
            }}
          />

          {/* Bottom Magnetic Dismiss Target */}
          <MagneticDismissTarget
            isVisible={isDragging}
            isMagnetized={isMagnetized}
            containerWidth={containerBounds.width}
            bottomOffset={isFullScreen ? 60 : 36}
          />

          {/* Floating Browser Drawer / Overlay */}
          <FloatingBrowserOverlay
            tabs={tabs}
            activeTabId={activeTabId}
            isOpen={isBrowserOpen}
            onClose={() => setIsBrowserOpen(false)}
            onSelectTab={(id) => setActiveTabId(id)}
            onCloseTab={handleCloseTab}
            showListenToArticle={showListenToArticle}
            onToggleShowListenToArticle={setShowListenToArticle}
            onNewTab={() => {
              const unused = INITIAL_ARTICLES.find(
                (art) => !tabs.some((t) => t.url === art.url)
              );
              if (unused) {
                handleSpawnTab({ ...unused, id: `tab-${Date.now()}` });
              } else {
                handleSpawnTab({
                  ...INITIAL_ARTICLES[0],
                  id: `tab-${Date.now()}`,
                  title: `Queued Article #${tabs.length + 1}`
                });
              }
            }}
          />
        </div>

        {/* Tactile Gestures Legend / Hint */}
        <div className="mt-3 flex items-center gap-4 text-[11px] text-slate-500 font-medium select-none">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-blue-400" />
            <span>Double-tap or long-press to fan out tabs</span>
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-rose-400" />
            <span>Drag to bottom ✕ to dismiss</span>
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-indigo-400" />
            <span>Tap to open Reader mode</span>
          </span>
        </div>
      </main>
    </div>
  );
}
