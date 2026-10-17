import React, { useState } from 'react';
import {
  Wifi,
  Battery,
  Signal,
  ExternalLink,
  Send,
  Sparkles,
  Bookmark,
  Share2,
  Clock,
  Layers,
  ArrowUpRight
} from 'lucide-react';
import { SAMPLE_FEED_POSTS, INITIAL_ARTICLES } from '../data/mockArticles';
import { TabSession } from '../types/browser';

interface HostAppFeedProps {
  onSpawnTab: (article: TabSession) => void;
  tabCount: number;
  onOpenBubble: () => void;
}

export const HostAppFeed: React.FC<HostAppFeedProps> = ({
  onSpawnTab,
  tabCount,
  onOpenBubble
}) => {
  const [customUrl, setCustomUrl] = useState<string>('');
  const [recentlyQueuedId, setRecentlyQueuedId] = useState<string | null>(null);

  const currentTime = new Date().toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit'
  });

  const handlePostClick = (post: typeof SAMPLE_FEED_POSTS[0]) => {
    // Find matching article or generate one
    const matching = INITIAL_ARTICLES.find((a) => a.url === post.targetUrl) || {
      id: `tab-${Date.now()}`,
      url: post.targetUrl,
      title: post.title,
      domain: new URL(post.targetUrl).hostname,
      favicon: post.avatar,
      progress: 0,
      isLoaded: false,
      readingTimeMin: 3,
      wordCount: 650,
      publishedDate: 'Just now',
      author: post.author,
      summary: post.summary,
      sections: [
        {
          heading: post.title,
          paragraphs: [
            post.summary,
            'This link was queued into your Flynx floating bubble from the host application feed. On Android, Flynx runs as a foreground service using WindowManager.LayoutParams.TYPE_APPLICATION_OVERLAY, allowing articles to load silently in the background while you remain in your favorite apps.'
          ]
        }
      ]
    };

    setRecentlyQueuedId(post.id);
    onSpawnTab({
      ...matching,
      id: `tab-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`
    });

    setTimeout(() => {
      setRecentlyQueuedId(null);
    }, 2000);
  };

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customUrl.trim()) return;

    let validUrl = customUrl.trim();
    if (!validUrl.startsWith('http://') && !validUrl.startsWith('https://')) {
      validUrl = 'https://' + validUrl;
    }

    try {
      const hostname = new URL(validUrl).hostname;
      const newArticle: TabSession = {
        id: `tab-${Date.now()}`,
        url: validUrl,
        title: `Article from ${hostname}`,
        domain: hostname,
        favicon: '🌐',
        progress: 0,
        isLoaded: false,
        readingTimeMin: 4,
        wordCount: 780,
        publishedDate: 'Just now',
        author: 'Web Author',
        summary: `Custom article loaded via Flynx floating overlay from ${hostname}.`,
        sections: [
          {
            heading: `Web Content from ${hostname}`,
            paragraphs: [
              `Flynx has loaded this page in a background WebView thread. You can switch to Distraction-Free Reader Mode to sanitize typography and remove advertising scripts, or explore it via the interactive Web View.`,
              `The bubble controller applies Google Messages-style spring dynamics with low-bounciness damping and magnetic edge dismissal.`
            ]
          }
        ]
      };

      onSpawnTab(newArticle);
      setCustomUrl('');
    } catch (_) {
      alert('Please enter a valid URL.');
    }
  };

  return (
    <div className="relative w-full h-full flex flex-col bg-slate-900 text-slate-100 select-none overflow-hidden">
      {/* Phone Status Bar */}
      <div className="flex items-center justify-between px-6 pt-3 pb-2 text-[11px] font-semibold text-slate-400 border-b border-slate-800/60 bg-slate-950/40 backdrop-blur-md shrink-0">
        <span className="font-mono">{currentTime}</span>
        <div className="flex items-center gap-2">
          <Signal className="w-3.5 h-3.5 text-slate-400" />
          <Wifi className="w-3.5 h-3.5 text-slate-400" />
          <div className="flex items-center gap-1 font-mono text-[10px]">
            <span>98%</span>
            <Battery className="w-4 h-4 text-emerald-400 fill-emerald-400" />
          </div>
        </div>
      </div>

      {/* Host App Navigation Bar */}
      <div className="px-5 py-3 border-b border-slate-800 flex items-center justify-between bg-slate-900/90 shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center text-white font-bold text-xs shadow-sm shadow-blue-500/20">
            TP
          </div>
          <div>
            <h1 className="text-sm font-bold text-white tracking-tight">TechPulse Daily</h1>
            <p className="text-[10px] text-slate-400">Host Application Environment</p>
          </div>
        </div>

        {tabCount > 0 && (
          <button
            onClick={onOpenBubble}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/30 text-xs font-medium transition-all"
          >
            <Layers className="w-3.5 h-3.5" />
            <span>{tabCount} Floating {tabCount === 1 ? 'Tab' : 'Tabs'}</span>
          </button>
        )}
      </div>

      {/* Feed Scroll Container */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3.5 custom-scrollbar">
        {/* Banner explaining the simulation */}
        <div className="p-3.5 rounded-2xl bg-indigo-950/40 border border-indigo-800/40 text-xs text-indigo-200 flex items-start gap-3">
          <Sparkles className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <span className="font-semibold text-white">How Flynx Background Loading Works:</span>
            <p className="text-[11px] text-indigo-200/90 leading-relaxed">
              Tap any link below. Instead of switching apps, Flynx creates a floating bubble at the screen edge that loads quietly in the background! Drag it, snap it, or tap to read.
            </p>
          </div>
        </div>

        {/* Feed Posts */}
        <div className="space-y-3">
          {SAMPLE_FEED_POSTS.map((post) => {
            const isQueued = recentlyQueuedId === post.id;
            return (
              <div
                key={post.id}
                onClick={() => handlePostClick(post)}
                className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                  isQueued
                    ? 'bg-blue-950/60 border-blue-500 ring-2 ring-blue-500/30 scale-[0.99]'
                    : 'bg-slate-800/60 hover:bg-slate-800 border-slate-700/60 hover:border-slate-600'
                }`}
              >
                <div className="flex items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-base">{post.avatar}</span>
                    <span className="text-xs font-semibold text-slate-300">{post.author}</span>
                    <span className="text-[10px] text-slate-500 font-mono">{post.time}</span>
                  </div>
                  <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">
                    {post.badge}
                  </span>
                </div>

                <h3 className="text-sm font-semibold text-white leading-snug mb-1.5 hover:text-blue-300 transition-colors">
                  {post.title}
                </h3>
                <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed mb-3">
                  {post.summary}
                </p>

                <div className="flex items-center justify-between pt-2 border-t border-slate-700/40 text-xs">
                  <span className="text-blue-400 flex items-center gap-1 font-medium text-[11px]">
                    <ArrowUpRight className="w-3.5 h-3.5" />
                    <span>{isQueued ? 'Queued in Floating Bubble!' : 'Tap to open in bubble'}</span>
                  </span>
                  <div className="flex items-center gap-3 text-slate-400">
                    <Bookmark className="w-3.5 h-3.5 hover:text-white" />
                    <Share2 className="w-3.5 h-3.5 hover:text-white" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Quick Link Input at the Bottom */}
      <form
        onSubmit={handleCustomSubmit}
        className="p-3 bg-slate-950/90 border-t border-slate-800 flex items-center gap-2 shrink-0"
      >
        <input
          type="text"
          value={customUrl}
          onChange={(e) => setCustomUrl(e.target.value)}
          placeholder="Type or paste any URL..."
          className="flex-1 bg-slate-900 border border-slate-700/70 rounded-full px-4 py-2 text-xs text-white placeholder-slate-500 outline-none focus:border-blue-500 transition-colors"
        />
        <button
          type="submit"
          className="px-3.5 py-2 rounded-full bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-md shadow-blue-600/30 shrink-0"
        >
          <Send className="w-3 h-3" />
          <span>Send</span>
        </button>
      </form>
    </div>
  );
};
