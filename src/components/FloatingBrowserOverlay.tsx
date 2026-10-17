import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  Minus,
  BookOpen,
  Globe,
  Share2,
  Volume2,
  VolumeX,
  Play,
  Pause,
  RotateCcw,
  Plus,
  Lock,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Sliders,
  Type,
  Sparkles,
  Check
} from 'lucide-react';
import { TabSession, ReaderTheme, ReaderTypography } from '../types/browser';

interface FloatingBrowserOverlayProps {
  tabs: TabSession[];
  activeTabId: string;
  isOpen: boolean;
  onClose: () => void;
  onSelectTab: (tabId: string) => void;
  onCloseTab: (tabId: string) => void;
  onNewTab: (url?: string) => void;
  showListenToArticle?: boolean;
  onToggleShowListenToArticle?: (show: boolean) => void;
}

export const FloatingBrowserOverlay: React.FC<FloatingBrowserOverlayProps> = ({
  tabs,
  activeTabId,
  isOpen,
  onClose,
  onSelectTab,
  onCloseTab,
  onNewTab,
  showListenToArticle: externalShowListen,
  onToggleShowListenToArticle
}) => {
  const activeTab = tabs.find((t) => t.id === activeTabId) || tabs[0];
  const [viewMode, setViewMode] = useState<'reader' | 'web'>('reader');
  
  // Reader settings
  const [theme, setTheme] = useState<ReaderTheme>('sepia');
  const [typography, setTypography] = useState<ReaderTypography>('serif');
  const [fontSize, setFontSize] = useState<number>(17); // 14 to 22
  const [showAppearanceMenu, setShowAppearanceMenu] = useState<boolean>(false);

  // Setting to show/hide "Listen to Article" audio bar
  const [internalShowListen, setInternalShowListen] = useState<boolean>(true);
  const showListen = externalShowListen !== undefined ? externalShowListen : internalShowListen;
  const setShowListen = (val: boolean) => {
    if (!val && ttsPlaying && typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setTtsPlaying(false);
    }
    if (onToggleShowListenToArticle) {
      onToggleShowListenToArticle(val);
    } else {
      setInternalShowListen(val);
    }
  };

  // Text to Speech
  const [ttsPlaying, setTtsPlaying] = useState<boolean>(false);
  const [ttsRate, setTtsRate] = useState<number>(1.0);
  const [activeSpeechSection, setActiveSpeechSection] = useState<number>(0);
  const [copiedLink, setCopiedLink] = useState<boolean>(false);
  const speechRef = useRef<SpeechSynthesisUtterance | null>(null);

  // Address bar input
  const [urlInput, setUrlInput] = useState<string>('');
  const contentScrollRef = useRef<HTMLDivElement>(null);
  const [readProgress, setReadProgress] = useState<number>(0);

  useEffect(() => {
    if (activeTab) {
      setUrlInput(activeTab.url);
      setReadProgress(0);
      if (contentScrollRef.current) {
        contentScrollRef.current.scrollTop = 0;
      }
    }
  }, [activeTab]);

  // Clean up TTS when unmounting or tab changes
  useEffect(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setTtsPlaying(false);
    }
  }, [activeTabId, isOpen]);

  // Handle TTS Play/Pause
  const toggleTTS = () => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      alert('Speech Synthesis not supported in this browser environment.');
      return;
    }

    if (ttsPlaying) {
      window.speechSynthesis.pause();
      setTtsPlaying(false);
    } else {
      if (window.speechSynthesis.paused) {
        window.speechSynthesis.resume();
        setTtsPlaying(true);
      } else {
        window.speechSynthesis.cancel();
        if (!activeTab) return;

        // Compile article text
        const fullText = `${activeTab.title}. By ${activeTab.author}. ${activeTab.summary}. ${activeTab.sections
          .map((s) => `${s.heading || ''}. ${s.paragraphs.join(' ')}`)
          .join(' ')}`;

        const utterance = new SpeechSynthesisUtterance(fullText);
        utterance.rate = ttsRate;
        utterance.pitch = 1.0;

        utterance.onend = () => {
          setTtsPlaying(false);
        };
        utterance.onerror = () => {
          setTtsPlaying(false);
        };

        speechRef.current = utterance;
        window.speechSynthesis.speak(utterance);
        setTtsPlaying(true);
      }
    }
  };

  const handleTtsRateChange = (newRate: number) => {
    setTtsRate(newRate);
    if (ttsPlaying && typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setTtsPlaying(false);
      setTimeout(() => {
        toggleTTS();
      }, 50);
    }
  };

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const el = e.currentTarget;
    const total = el.scrollHeight - el.clientHeight;
    if (total > 0) {
      setReadProgress(Math.min(100, Math.round((el.scrollTop / total) * 100)));
    }
  };

  const handleShare = () => {
    if (!activeTab) return;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(activeTab.url);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  if (!isOpen || !activeTab) return null;

  // Theme-based class mapping
  const getThemeStyles = () => {
    switch (theme) {
      case 'sepia':
        return {
          bg: 'bg-[#FBF0D9]',
          text: 'text-[#3E2E1E]',
          muted: 'text-[#7D6B56]',
          card: 'bg-[#F4E6CA]',
          border: 'border-[#EAD7B5]',
          heading: 'text-[#2D2115]'
        };
      case 'dark':
        return {
          bg: 'bg-[#0E1117]',
          text: 'text-[#E2E8F0]',
          muted: 'text-[#94A3B8]',
          card: 'bg-[#181D26]',
          border: 'border-[#262E3D]',
          heading: 'text-white'
        };
      case 'light':
      default:
        return {
          bg: 'bg-[#FFFFFF]',
          text: 'text-slate-800',
          muted: 'text-slate-500',
          card: 'bg-slate-50',
          border: 'border-slate-200',
          heading: 'text-slate-900'
        };
    }
  };

  const currentTheme = getThemeStyles();

  // Typography font class
  const getFontFamilyClass = () => {
    if (typography === 'serif') return 'font-serif-reader';
    if (typography === 'mono') return 'font-mono-reader';
    return 'font-sans-reader';
  };

  return (
    <AnimatePresence>
      <div className="absolute inset-0 z-50 flex flex-col justify-end p-2.5 sm:p-3 pointer-events-none overflow-hidden">
        {/* Dimmed backdrop - clicking it collapses back to floating bubble */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/60 backdrop-blur-sm pointer-events-auto cursor-pointer"
        />

        {/* The Floating Browser Window Card */}
        <motion.div
          key="floating-browser-modal"
          initial={{ opacity: 0, scale: 0.92, y: 55 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 65 }}
          transition={{ type: 'spring', stiffness: 350, damping: 28 }}
          className="relative w-full h-[87%] max-h-[88%] flex flex-col bg-slate-950 text-slate-100 rounded-[34px] shadow-2xl shadow-black/95 border border-slate-700/80 ring-1 ring-white/10 pointer-events-auto"
        >
          {/* Perched Circular Bubble Tabs along the top edge */}
          <div className="absolute -top-7 left-3 right-3 z-30 flex items-center gap-2 pointer-events-auto overflow-x-auto no-scrollbar py-1">
            {tabs.map((tab) => {
              const isActive = tab.id === activeTab.id;
              return (
                <motion.div
                  key={tab.id}
                  whileHover={{ scale: 1.08 }}
                  whileTap={{ scale: 0.92 }}
                  onClick={() => onSelectTab(tab.id)}
                  className={`relative group w-12 h-12 rounded-full flex items-center justify-center cursor-pointer transition-all shrink-0 ${
                    isActive
                      ? 'bg-gradient-to-br from-blue-600 via-indigo-600 to-blue-700 text-white shadow-xl shadow-blue-900/60 ring-4 ring-blue-400/90 border-2 border-white -translate-y-1'
                      : 'bg-slate-900/95 hover:bg-slate-800 text-slate-300 border-2 border-slate-600/80 shadow-lg shadow-black/50'
                  }`}
                >
                  <span className="text-xl leading-none drop-shadow-sm select-none">{tab.favicon}</span>

                  {/* Close Tab Button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onCloseTab(tab.id);
                    }}
                    title="Close tab"
                    className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-slate-950 hover:bg-rose-600 text-slate-300 hover:text-white flex items-center justify-center border border-slate-700 opacity-80 group-hover:opacity-100 transition-all shadow-sm"
                  >
                    <X className="w-2.5 h-2.5" />
                  </button>

                  {/* Active Indicator Glow */}
                  {isActive && (
                    <div className="absolute -bottom-1.5 w-2 h-2 rounded-full bg-blue-400 ring-2 ring-slate-950 shadow-sm" />
                  )}
                </motion.div>
              );
            })}

            {/* Spawn / Add Tab Bubble */}
            {tabs.length < 5 && (
              <motion.button
                onClick={() => onNewTab()}
                whileHover={{ scale: 1.08 }}
                whileTap={{ scale: 0.92 }}
                title="Queue new tab"
                className="w-10 h-10 rounded-full bg-slate-900/90 hover:bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center border-2 border-dashed border-slate-600 hover:border-slate-400 shrink-0 shadow-md transition-colors"
              >
                <Plus className="w-4 h-4" />
              </motion.button>
            )}
          </div>

          {/* Floating URL Bar under the perched bubbles */}
          <div className="bg-slate-900 border-b border-slate-800/80 px-3.5 pt-7 pb-2.5 select-none rounded-t-[34px]">
            {/* Grab Handle */}
            <div
              onClick={onClose}
              className="w-10 h-1.5 rounded-full bg-slate-700/80 hover:bg-slate-500 mx-auto -mt-3 mb-2.5 cursor-pointer transition-colors"
              title="Tap to collapse down to floating bubble"
            />

            {/* The Floating URL Capsule */}
            <div className="flex items-center justify-between gap-2 p-1.5 pl-3 pr-1.5 rounded-full bg-slate-950/95 border border-slate-700/80 shadow-lg shadow-black/50 text-xs">
              {/* Security lock & collapse chevron */}
              <div className="flex items-center gap-1.5 shrink-0 text-slate-400">
                <button
                  onClick={onClose}
                  title="Collapse down to floating bubble"
                  className="w-6 h-6 rounded-full hover:bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center transition-colors"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <div className="w-px h-3.5 bg-slate-800 mx-0.5" />
                <Lock className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              </div>

              {/* Editable URL Input */}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                }}
                className="flex-1 min-w-0"
              >
                <input
                  type="text"
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  placeholder="Enter or paste web URL..."
                  className="w-full bg-transparent border-none outline-none text-slate-200 font-mono text-[11px] placeholder-slate-500 truncate select-all"
                />
              </form>

              {/* Floating Bar Actions */}
              <div className="flex items-center gap-1 shrink-0">
                {/* Refresh Button */}
                <button
                  onClick={() => {
                    const currentVal = urlInput;
                    setUrlInput('');
                    setTimeout(() => setUrlInput(currentVal), 80);
                  }}
                  title="Reload article"
                  className="w-7 h-7 rounded-full hover:bg-slate-800 text-slate-400 hover:text-slate-200 flex items-center justify-center transition-colors"
                >
                  <RotateCcw className="w-3 h-3" />
                </button>

                {/* Reader / Web Mode Switcher Pill */}
                <button
                  onClick={() => setViewMode(viewMode === 'reader' ? 'web' : 'reader')}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-semibold transition-all ${
                    viewMode === 'reader'
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  }`}
                  title={
                    viewMode === 'reader'
                      ? 'Switch to interactive Web View'
                      : 'Switch to Distraction-Free Reader'
                  }
                >
                  {viewMode === 'reader' ? (
                    <>
                      <BookOpen className="w-3 h-3" />
                      <span>Reader</span>
                    </>
                  ) : (
                    <>
                      <Globe className="w-3 h-3" />
                      <span>Web</span>
                    </>
                  )}
                </button>

                {/* Reader Appearance Button */}
                {viewMode === 'reader' && (
                  <button
                    onClick={() => setShowAppearanceMenu(!showAppearanceMenu)}
                    title="Typography & Appearance"
                    className={`w-7 h-7 rounded-full flex items-center justify-center transition-colors ${
                      showAppearanceMenu
                        ? 'bg-blue-600 text-white'
                        : 'hover:bg-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <Type className="w-3.5 h-3.5" />
                  </button>
                )}

                {/* Share Link */}
                <button
                  onClick={handleShare}
                  title="Copy Article Link"
                  className="w-7 h-7 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center transition-colors"
                >
                  {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Share2 className="w-3.5 h-3.5" />}
                </button>

                {/* Close Tab */}
                <button
                  onClick={() => onCloseTab(activeTab.id)}
                  title="Close active tab"
                  className="w-7 h-7 rounded-full bg-slate-800 hover:bg-rose-900/60 text-slate-300 hover:text-rose-200 flex items-center justify-center transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>

        {/* Reader Mode Toolbar Drawer (Themes & Font Controls) */}
        <AnimatePresence>
          {showAppearanceMenu && viewMode === 'reader' && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="bg-slate-900 border-b border-slate-800 px-4 py-3 text-xs flex flex-wrap items-center justify-between gap-4 overflow-hidden"
            >
              {/* Theme Selector */}
              <div className="flex items-center gap-2">
                <span className="text-slate-400 font-medium">Theme:</span>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setTheme('light')}
                    className={`px-3 py-1 rounded-md border text-xs font-semibold ${
                      theme === 'light'
                        ? 'bg-white text-slate-900 border-blue-500 ring-1 ring-blue-400'
                        : 'bg-white/90 text-slate-800 border-slate-300 hover:bg-white'
                    }`}
                  >
                    Light
                  </button>
                  <button
                    onClick={() => setTheme('sepia')}
                    className={`px-3 py-1 rounded-md border text-xs font-semibold ${
                      theme === 'sepia'
                        ? 'bg-[#FBF0D9] text-[#42331f] border-amber-600 ring-1 ring-amber-500'
                        : 'bg-[#F4E6CA] text-[#42331f] border-[#E2D0AF] hover:bg-[#FBF0D9]'
                    }`}
                  >
                    Sepia
                  </button>
                  <button
                    onClick={() => setTheme('dark')}
                    className={`px-3 py-1 rounded-md border text-xs font-semibold ${
                      theme === 'dark'
                        ? 'bg-slate-950 text-white border-blue-500 ring-1 ring-blue-400'
                        : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                    }`}
                  >
                    AMOLED
                  </button>
                </div>
              </div>

              {/* Typography & Size */}
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800">
                  <button
                    onClick={() => setTypography('serif')}
                    className={`px-2.5 py-1 rounded text-xs font-serif ${
                      typography === 'serif' ? 'bg-blue-600 text-white' : 'text-slate-400'
                    }`}
                  >
                    Serif
                  </button>
                  <button
                    onClick={() => setTypography('sans')}
                    className={`px-2.5 py-1 rounded text-xs font-sans ${
                      typography === 'sans' ? 'bg-blue-600 text-white' : 'text-slate-400'
                    }`}
                  >
                    Sans
                  </button>
                  <button
                    onClick={() => setTypography('mono')}
                    className={`px-2.5 py-1 rounded text-xs font-mono ${
                      typography === 'mono' ? 'bg-blue-600 text-white' : 'text-slate-400'
                    }`}
                  >
                    Mono
                  </button>
                </div>

                <div className="flex items-center gap-1 bg-slate-950 px-2 py-1 rounded-lg border border-slate-800">
                  <button
                    onClick={() => setFontSize(Math.max(13, fontSize - 1))}
                    className="w-5 h-5 flex items-center justify-center text-slate-300 hover:text-white"
                  >
                    A-
                  </button>
                  <span className="text-[11px] font-mono text-slate-400 px-1">{fontSize}px</span>
                  <button
                    onClick={() => setFontSize(Math.min(24, fontSize + 1))}
                    className="w-5 h-5 flex items-center justify-center text-slate-300 hover:text-white"
                  >
                    A+
                  </button>
                </div>
              </div>

              {/* Setting to show/hide "Listen to Article" Audio Player */}
              <div className="w-full pt-2.5 mt-1 border-t border-slate-800/80 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Volume2 className="w-3.5 h-3.5 text-blue-400" />
                  <span className="text-slate-300 font-medium">Show "Listen to Article" player</span>
                </div>
                <button
                  type="button"
                  onClick={() => setShowListen(!showListen)}
                  className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    showListen ? 'bg-blue-600' : 'bg-slate-800'
                  }`}
                  role="switch"
                  aria-checked={showListen}
                >
                  <span
                    className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                      showListen ? 'translate-x-4' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Audio Text-To-Speech (TTS) Bar */}
        {viewMode === 'reader' && showListen && (
          <div className="bg-slate-900/90 backdrop-blur-md border-b border-slate-800/80 px-4 py-2 flex items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <button
                onClick={toggleTTS}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-full font-semibold transition-all ${
                  ttsPlaying
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-500/30'
                    : 'bg-slate-800 text-slate-200 hover:bg-slate-700'
                }`}
              >
                {ttsPlaying ? (
                  <>
                    <Pause className="w-3.5 h-3.5 fill-current" />
                    <span>Pause Audio</span>
                  </>
                ) : (
                  <>
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>Listen to Article</span>
                  </>
                )}
              </button>

              {ttsPlaying && (
                <div className="flex items-center gap-1 pl-1">
                  <span className="w-1.5 h-3 rounded-full bg-blue-400 animate-pulse" />
                  <span className="w-1.5 h-4 rounded-full bg-blue-400 animate-pulse delay-75" />
                  <span className="w-1.5 h-2 rounded-full bg-blue-400 animate-pulse delay-150" />
                </div>
              )}
            </div>

            {/* Speech Rate Switcher */}
            <div className="flex items-center gap-1.5 text-slate-400">
              <span className="text-[11px]">Speed:</span>
              {[0.8, 1.0, 1.25, 1.5].map((rate) => (
                <button
                  key={rate}
                  onClick={() => handleTtsRateChange(rate)}
                  className={`px-1.5 py-0.5 rounded text-[11px] font-mono transition-colors ${
                    ttsRate === rate ? 'bg-blue-600 text-white font-bold' : 'hover:text-slate-200'
                  }`}
                >
                  {rate}x
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Web View Navigation Controls */}
        {viewMode === 'web' && (
          <div className="bg-slate-900 border-b border-slate-800 px-3.5 py-1.5 flex items-center justify-between text-xs text-slate-400">
            <div className="flex items-center gap-2">
              <button className="w-6 h-6 rounded hover:bg-slate-800 flex items-center justify-center text-slate-400 hover:text-white">
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button className="w-6 h-6 rounded hover:bg-slate-800 flex items-center justify-center text-slate-400 hover:text-white">
                <ChevronRight className="w-4 h-4" />
              </button>
              <span className="text-[11px] font-mono text-slate-300 flex items-center gap-1.5 pl-1">
                <Lock className="w-3 h-3 text-emerald-400" />
                <span>{activeTab.domain}</span>
              </span>
            </div>
            <span className="text-[10px] text-slate-500 font-sans uppercase tracking-wider">
              Chrome Web Engine
            </span>
          </div>
        )}

        {/* Reading Progress Indicator */}
        {viewMode === 'reader' && (
          <div className="w-full h-1 bg-slate-950">
            <div
              className="h-full bg-gradient-to-r from-blue-600 to-indigo-500 transition-all duration-100"
              style={{ width: `${readProgress}%` }}
            />
          </div>
        )}

        {/* Main Content Area */}
        <div
          ref={contentScrollRef}
          onScroll={handleScroll}
          className={`flex-1 overflow-y-auto ${
            viewMode === 'reader' ? currentTheme.bg : 'bg-slate-950'
          } transition-colors duration-200`}
        >
          {viewMode === 'reader' ? (
            /* Distraction-Free Reader View */
            <article
              className={`max-w-2xl mx-auto px-6 py-8 ${currentTheme.text} ${getFontFamilyClass()}`}
              style={{ fontSize: `${fontSize}px`, lineHeight: 1.7 }}
            >
              {/* Publication Metadata */}
              <div className={`mb-4 text-xs font-sans tracking-wide uppercase ${currentTheme.muted}`}>
                <span>{activeTab.domain}</span>
                <span className="mx-2">·</span>
                <span>{activeTab.publishedDate}</span>
                <span className="mx-2">·</span>
                <span>{activeTab.readingTimeMin} min read</span>
              </div>

              {/* Title */}
              <h1
                className={`text-2xl md:text-3xl font-bold mb-4 tracking-tight leading-snug ${currentTheme.heading}`}
              >
                {activeTab.title}
              </h1>

              {/* Author */}
              <div className={`flex items-center gap-3 pb-6 mb-6 border-b ${currentTheme.border}`}>
                <div className="w-10 h-10 rounded-full bg-blue-600/20 text-blue-500 font-bold flex items-center justify-center text-sm">
                  {activeTab.author.charAt(0)}
                </div>
                <div>
                  <div className={`text-sm font-semibold font-sans ${currentTheme.heading}`}>
                    {activeTab.author}
                  </div>
                  <div className={`text-xs ${currentTheme.muted}`}>
                    Senior Mobile Systems Architect
                  </div>
                </div>
              </div>

              {/* Executive Summary */}
              <div
                className={`p-4 rounded-xl mb-8 border italic ${currentTheme.card} ${currentTheme.border} ${currentTheme.muted}`}
              >
                "{activeTab.summary}"
              </div>

              {/* Article Sections */}
              <div className="space-y-6">
                {activeTab.sections.map((sec, idx) => (
                  <div key={idx} className="space-y-4">
                    {sec.heading && (
                      <h2
                        className={`text-lg md:text-xl font-bold pt-4 tracking-tight ${currentTheme.heading}`}
                      >
                        {sec.heading}
                      </h2>
                    )}
                    {sec.paragraphs.map((p, pIdx) => (
                      <p
                        key={pIdx}
                        className={`${
                          idx === 0 && pIdx === 0
                            ? 'first-letter:float-left first-letter:text-5xl first-letter:pr-3 first-letter:font-bold first-letter:text-blue-500'
                            : ''
                        }`}
                      >
                        {p}
                      </p>
                    ))}
                  </div>
                ))}
              </div>

              {/* Article Footer & Return to Feed */}
              <div
                className={`mt-12 pt-6 border-t ${currentTheme.border} flex items-center justify-between text-xs ${currentTheme.muted}`}
              >
                <span>End of article extraction</span>
                <button
                  onClick={onClose}
                  className="px-3 py-1.5 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 transition-colors"
                >
                  Return to Floating Bubble
                </button>
              </div>
            </article>
          ) : (
            /* Web View Simulation */
            <div className="p-4 md:p-6 max-w-4xl mx-auto space-y-6 text-slate-200">
              {/* Simulated Website Navigation */}
              <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{activeTab.favicon}</span>
                  <span className="font-bold text-lg text-white">{activeTab.domain}</span>
                </div>
                <div className="flex items-center gap-4 text-xs text-slate-400">
                  <span className="hover:text-white cursor-pointer">Articles</span>
                  <span className="hover:text-white cursor-pointer">About</span>
                  <span className="hover:text-white cursor-pointer">Subscribe</span>
                </div>
              </div>

              {/* Web Banner */}
              <div className="p-6 rounded-2xl bg-gradient-to-br from-indigo-950 via-slate-900 to-slate-900 border border-indigo-900/40 space-y-3">
                <div className="inline-block px-2.5 py-0.5 rounded-full bg-blue-600/30 text-blue-300 text-xs font-semibold">
                  Featured Web Preview
                </div>
                <h1 className="text-xl md:text-2xl font-bold text-white">{activeTab.title}</h1>
                <p className="text-sm text-slate-300">{activeTab.summary}</p>
                <div className="flex items-center gap-3 pt-2">
                  <button
                    onClick={() => setViewMode('reader')}
                    className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors"
                  >
                    <BookOpen className="w-3.5 h-3.5" />
                    <span>Switch to Distraction-Free Reader</span>
                  </button>
                  <a
                    href={activeTab.url}
                    target="_blank"
                    rel="noreferrer"
                    className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Open in Real Browser</span>
                  </a>
                </div>
              </div>

              {/* Web body */}
              <div className="space-y-4 text-sm text-slate-300 leading-relaxed">
                {activeTab.sections.map((s, idx) => (
                  <div key={idx} className="space-y-2">
                    <h3 className="text-base font-semibold text-white">{s.heading}</h3>
                    {s.paragraphs.map((p, pIdx) => (
                      <p key={pIdx}>{p}</p>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </motion.div>
      </div>
    </AnimatePresence>
  );
};
