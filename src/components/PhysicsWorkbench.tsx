import React, { useState } from 'react';
import {
  Sliders,
  Sparkles,
  Layers,
  Code2,
  Trash2,
  RotateCcw,
  Check,
  Copy,
  Zap,
  Activity,
  Cpu,
  ShieldCheck,
  Volume2
} from 'lucide-react';
import { BubblePhysicsConfig, TabSession } from '../types/browser';
import { INITIAL_ARTICLES } from '../data/mockArticles';

interface PhysicsWorkbenchProps {
  physicsConfig: BubblePhysicsConfig;
  onUpdatePhysics: (config: BubblePhysicsConfig) => void;
  activeTabs: TabSession[];
  onSpawnTab: (article: TabSession) => void;
  onClearTabs: () => void;
  isDragging: boolean;
  isMagnetized: boolean;
  isBrowserOpen: boolean;
  isFannedOut?: boolean;
  onToggleFanOut?: () => void;
  showListenToArticle?: boolean;
  onToggleShowListenToArticle?: (show: boolean) => void;
}

export const PhysicsWorkbench: React.FC<PhysicsWorkbenchProps> = ({
  physicsConfig,
  onUpdatePhysics,
  activeTabs,
  onSpawnTab,
  onClearTabs,
  isDragging,
  isMagnetized,
  isBrowserOpen,
  isFannedOut = false,
  onToggleFanOut,
  showListenToArticle = true,
  onToggleShowListenToArticle
}) => {
  const [activeCodeTab, setActiveCodeTab] = useState<'controller' | 'overlay' | 'tabmgr' | 'sanitizer'>('controller');
  const [showCodeModal, setShowCodeModal] = useState<boolean>(false);
  const [copiedCode, setCopiedCode] = useState<boolean>(false);

  // Presets
  const applyPreset = (presetName: string) => {
    switch (presetName) {
      case 'messages':
        onUpdatePhysics({
          stiffness: 360,
          damping: 24,
          mass: 1.0,
          compressionScale: 0.92,
          magneticThreshold: 190,
          edgeMargin: 20
        });
        break;
      case 'flynx':
        onUpdatePhysics({
          stiffness: 240,
          damping: 18,
          mass: 1.1,
          compressionScale: 0.95,
          magneticThreshold: 150,
          edgeMargin: 16
        });
        break;
      case 'bouncy':
        onUpdatePhysics({
          stiffness: 520,
          damping: 14,
          mass: 0.9,
          compressionScale: 0.88,
          magneticThreshold: 220,
          edgeMargin: 24
        });
        break;
      case 'inertial':
        onUpdatePhysics({
          stiffness: 180,
          damping: 38,
          mass: 1.4,
          compressionScale: 0.94,
          magneticThreshold: 160,
          edgeMargin: 20
        });
        break;
    }
  };

  const handleSpawnMultiple = (count: number) => {
    INITIAL_ARTICLES.slice(0, count).forEach((art, index) => {
      setTimeout(() => {
        onSpawnTab({
          ...art,
          id: `tab-${Date.now()}-${index}`
        });
      }, index * 200);
    });
  };

  const kotlinSnippets = {
    controller: `// GoogleMessagesBubbleController.kt
// Handles touch scale compression, spring snapping, magnetic dismiss, and fan-out stacking
class GoogleMessagesBubbleController(
    private val context: Context,
    private val onBubbleClick: () -> Unit,
    private val onToggleFanOut: () -> Unit,
    private val onBubbleDismissed: () -> Unit
) {
    private val windowManager = context.getSystemService(Context.WINDOW_SERVICE) as WindowManager
    private val dismissTarget = MagneticDismissTarget(context)
    private var isMagnetized = false

    // Double-tap or long-press gestures fan out background tabs in multi-window stack
    private val gestureDetector = GestureDetector(context, object : GestureDetector.SimpleOnGestureListener() {
        override fun onDoubleTap(e: MotionEvent): Boolean {
            vibrator.vibrate(VibrationEffect.createOneShot(25, VibrationEffect.DEFAULT_AMPLITUDE))
            onToggleFanOut()
            return true
        }

        override fun onLongPress(e: MotionEvent) {
            vibrator.vibrate(VibrationEffect.createWaveform(longArrayOf(0, 30, 40, 30), -1))
            onToggleFanOut()
        }
    })

    fun onTouch(v: View, event: MotionEvent): Boolean {
        gestureDetector.onTouchEvent(event)
        when (event.actionMasked) {
            MotionEvent.ACTION_DOWN -> {
                // Tactile 0.92x Google Messages scale compression
                v.animate().scaleX(0.92f).scaleY(0.92f).setDuration(120).start()
                v.performHapticFeedback(HapticFeedbackConstants.VIRTUAL_KEY)
            }
            MotionEvent.ACTION_MOVE -> {
                val overTarget = dismissTarget.isOverTarget(event.rawX, event.rawY)
                if (overTarget && !isMagnetized) {
                    isMagnetized = true
                    v.animate().scaleX(0.75f).scaleY(0.75f).setDuration(100).start()
                    v.performHapticFeedback(HapticFeedbackConstants.CONTEXT_CLICK)
                }
            }
            MotionEvent.ACTION_UP -> {
                v.animate().scaleX(1.0f).scaleY(1.0f).setDuration(150).start()
                if (isMagnetized) performDismissAnimation() else snapToScreenEdge()
            }
        }
        return true
    }
}`,
    overlay: `// BubbleOverlayManager.kt
// AndroidX SpringAnimation edge snapping using DAMPING_RATIO_LOW_BOUNCY
class BubbleOverlayManager(private val context: Context) {
    fun snapToNearestEdge(view: View, layoutParams: WindowManager.LayoutParams) {
        val screenWidth = windowManager.currentWindowMetrics.bounds.width()
        val targetX = if (layoutParams.x + view.width / 2 < screenWidth / 2) 24 else screenWidth - view.width - 24

        val spring = SpringAnimation(FloatValueHolder(layoutParams.x.toFloat()))
        spring.spring = SpringForce(targetX.toFloat()).apply {
            dampingRatio = SpringForce.DAMPING_RATIO_LOW_BOUNCY
            stiffness = SpringForce.STIFFNESS_LOW
        }
        spring.addUpdateListener { _, value, _ ->
            layoutParams.x = value.toInt()
            windowManager.updateViewLayout(view, layoutParams)
        }
        spring.start()
    }
}`,
    tabmgr: `// WebViewTabManager.kt
// Leak-free LRU pool limited to 5 concurrent tabs
class WebViewTabManager(private val context: Context) {
    private val tabs = mutableListOf<TabSession>()
    private val maxConcurrentTabs = 5

    fun createTab(url: String): TabSession {
        // Recycle oldest tab if memory cap exceeded
        if (tabs.size >= maxConcurrentTabs) {
            destroyTab(tabs.first().id)
        }
        val webView = WebView(context).apply {
            settings.javaScriptEnabled = true
            settings.domStorageEnabled = true
            settings.mixedContentMode = WebSettings.MIXED_CONTENT_NEVER_ALLOW
        }
        return TabSession(id = System.currentTimeMillis().toString(), url = url, webView = webView)
    }

    fun destroyTab(tabId: String) {
        tabs.find { it.id == tabId }?.webView?.apply {
            stopLoading()
            loadUrl("about:blank")
            clearHistory()
            (parent as? ViewGroup)?.removeView(this)
            removeAllViews()
            destroy()
        }
    }
}`,
    sanitizer: `// ReaderContentSanitizer.kt
// Jsoup sanitization & strict CSP preventing XSS
object ReaderContentSanitizer {
    private val safeList = Safelist.relaxed()
        .addTags("article", "section", "figure", "mark")
        .removeTags("script", "iframe", "object", "embed", "style")

    fun sanitizeHtml(rawHtml: String): String {
        val clean = Jsoup.clean(rawHtml, safeList)
        val csp = "<meta http-equiv='Content-Security-Policy' content='default-src \\'none\\'; script-src \\'none\\';'>"
        return "<!DOCTYPE html><html><head>\${csp}</head><body>\${clean}</body></html>"
    }
}`
  };

  const copyCode = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(kotlinSnippets[activeCodeTab]);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-950 text-slate-100 p-5 overflow-y-auto space-y-6 custom-scrollbar border-r border-slate-800/80">
      {/* Brand & Title */}
      <div className="space-y-1 pb-4 border-b border-slate-800/80">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-tight">Flynx Expressive</h2>
              <p className="text-xs text-slate-400">Google Messages Bubble Physics</p>
            </div>
          </div>
          <button
            onClick={() => setShowCodeModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-blue-400 border border-slate-800 text-xs font-semibold transition-colors shadow-sm"
          >
            <Code2 className="w-3.5 h-3.5" />
            <span>Architecture</span>
          </button>
        </div>
      </div>

      {/* Real-time Diagnostics Box */}
      <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-3">
        <div className="flex items-center justify-between text-xs font-semibold text-slate-300">
          <span className="flex items-center gap-1.5 text-blue-400">
            <Activity className="w-3.5 h-3.5 animate-pulse" />
            <span>Live Bubble Telemetry</span>
          </span>
          <span
            className={`px-2 py-0.5 rounded-full text-[10px] font-mono uppercase tracking-wider ${
              isMagnetized
                ? 'bg-rose-950 text-rose-300 border border-rose-800'
                : isDragging
                ? 'bg-amber-950 text-amber-300 border border-amber-800'
                : isFannedOut
                ? 'bg-indigo-950 text-indigo-300 border border-indigo-700 ring-2 ring-indigo-500/30'
                : isBrowserOpen
                ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                : 'bg-slate-800 text-slate-400'
            }`}
          >
            {isMagnetized
              ? 'Magnetized'
              : isDragging
              ? 'Dragging'
              : isFannedOut
              ? 'Fanned Out (Multi-Window)'
              : isBrowserOpen
              ? 'Expanded'
              : 'Snapping Idle'}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-2 text-xs font-mono">
          <div className="p-2 rounded-xl bg-slate-950/60 border border-slate-800/60">
            <div className="text-[10px] text-slate-500 uppercase">Active Tabs</div>
            <div className="text-white font-bold text-sm flex items-center justify-between mt-0.5">
              <span>{activeTabs.length} / 5</span>
              <span className="text-[10px] text-emerald-400 font-sans">LRU Safe</span>
            </div>
          </div>
          <div className="p-2 rounded-xl bg-slate-950/60 border border-slate-800/60">
            <div className="text-[10px] text-slate-500 uppercase">Damping Ratio</div>
            <div className="text-white font-bold text-sm mt-0.5">
              {physicsConfig.damping} <span className="text-[10px] text-slate-500 font-sans">Low Bouncy</span>
            </div>
          </div>
        </div>
      </div>

      {/* Physics Tuning Presets */}
      <div className="space-y-2.5">
        <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
          <Sliders className="w-3.5 h-3.5 text-blue-400" />
          <span>Physics Presets</span>
        </label>
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => applyPreset('messages')}
            className="px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-blue-500/40 hover:border-blue-500 text-left text-xs transition-all"
          >
            <div className="font-semibold text-white">Google Messages</div>
            <div className="text-[10px] text-slate-400 mt-0.5">Tactile 0.92x + Low Damping</div>
          </button>
          <button
            onClick={() => applyPreset('flynx')}
            className="px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-left text-xs transition-all"
          >
            <div className="font-semibold text-white">Flynx Classic</div>
            <div className="text-[10px] text-slate-400 mt-0.5">Light edge float</div>
          </button>
          <button
            onClick={() => applyPreset('bouncy')}
            className="px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-left text-xs transition-all"
          >
            <div className="font-semibold text-white">Super Bouncy</div>
            <div className="text-[10px] text-slate-400 mt-0.5">High spring oscillation</div>
          </button>
          <button
            onClick={() => applyPreset('inertial')}
            className="px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-left text-xs transition-all"
          >
            <div className="font-semibold text-white">Heavy Inertial</div>
            <div className="text-[10px] text-slate-400 mt-0.5">High mass & settling</div>
          </button>
        </div>
      </div>

      {/* Interactive Physics Sliders */}
      <div className="space-y-4">
        <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center justify-between">
          <span>Spring & Motion Parameters</span>
          <button
            onClick={() => applyPreset('messages')}
            className="text-[11px] text-blue-400 hover:underline font-normal flex items-center gap-1"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Reset</span>
          </button>
        </label>

        {/* Stiffness */}
        <div className="space-y-1.5 p-3 rounded-xl bg-slate-900/60 border border-slate-800/80">
          <div className="flex justify-between text-xs">
            <span className="text-slate-300 font-medium">Spring Stiffness</span>
            <span className="font-mono text-blue-400 font-bold">{physicsConfig.stiffness}</span>
          </div>
          <input
            type="range"
            min="120"
            max="600"
            step="10"
            value={physicsConfig.stiffness}
            onChange={(e) =>
              onUpdatePhysics({ ...physicsConfig, stiffness: Number(e.target.value) })
            }
            className="w-full accent-blue-500 cursor-pointer"
          />
          <div className="flex justify-between text-[10px] text-slate-500 font-mono">
            <span>Soft (120)</span>
            <span>Rigid (600)</span>
          </div>
        </div>

        {/* Damping */}
        <div className="space-y-1.5 p-3 rounded-xl bg-slate-900/60 border border-slate-800/80">
          <div className="flex justify-between text-xs">
            <span className="text-slate-300 font-medium">Damping (Bounciness)</span>
            <span className="font-mono text-blue-400 font-bold">{physicsConfig.damping}</span>
          </div>
          <input
            type="range"
            min="10"
            max="50"
            step="1"
            value={physicsConfig.damping}
            onChange={(e) =>
              onUpdatePhysics({ ...physicsConfig, damping: Number(e.target.value) })
            }
            className="w-full accent-blue-500 cursor-pointer"
          />
          <div className="flex justify-between text-[10px] text-slate-500 font-mono">
            <span>Bouncy (10)</span>
            <span>Over-damped (50)</span>
          </div>
        </div>

        {/* Compression Scale on Press */}
        <div className="space-y-1.5 p-3 rounded-xl bg-slate-900/60 border border-slate-800/80">
          <div className="flex justify-between text-xs">
            <span className="text-slate-300 font-medium">Press Down Tactile Scale</span>
            <span className="font-mono text-blue-400 font-bold">
              {physicsConfig.compressionScale.toFixed(2)}x
            </span>
          </div>
          <input
            type="range"
            min="0.80"
            max="0.98"
            step="0.01"
            value={physicsConfig.compressionScale}
            onChange={(e) =>
              onUpdatePhysics({ ...physicsConfig, compressionScale: Number(e.target.value) })
            }
            className="w-full accent-blue-500 cursor-pointer"
          />
          <div className="flex justify-between text-[10px] text-slate-500 font-mono">
            <span>Deep 0.80x</span>
            <span>Google Messages 0.92x</span>
          </div>
        </div>

        {/* Magnetic Threshold */}
        <div className="space-y-1.5 p-3 rounded-xl bg-slate-900/60 border border-slate-800/80">
          <div className="flex justify-between text-xs">
            <span className="text-slate-300 font-medium">Magnetic Dismiss Radius</span>
            <span className="font-mono text-blue-400 font-bold">
              {physicsConfig.magneticThreshold}px
            </span>
          </div>
          <input
            type="range"
            min="100"
            max="260"
            step="10"
            value={physicsConfig.magneticThreshold}
            onChange={(e) =>
              onUpdatePhysics({ ...physicsConfig, magneticThreshold: Number(e.target.value) })
            }
            className="w-full accent-blue-500 cursor-pointer"
          />
          <div className="flex justify-between text-[10px] text-slate-500 font-mono">
            <span>Near (100px)</span>
            <span>Strong Pull (260px)</span>
          </div>
        </div>
      </div>

      {/* Tab Queue Controls */}
      <div className="space-y-3 pt-2">
        <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center justify-between">
          <span>Tab Queue Simulator</span>
          <span className="text-[11px] text-slate-500 font-mono">{activeTabs.length} / 5</span>
        </label>
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleSpawnMultiple(1)}
            disabled={activeTabs.length >= 5}
            className="flex-1 px-3 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors shadow-md shadow-blue-600/30"
          >
            <Zap className="w-3.5 h-3.5" />
            <span>Spawn 1 Tab</span>
          </button>
          <button
            onClick={() => handleSpawnMultiple(3)}
            disabled={activeTabs.length >= 5}
            className="flex-1 px-3 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors shadow-md shadow-indigo-600/30"
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Spawn Stack (3)</span>
          </button>
        </div>

        {/* Fan Out Stacking Multi-Window Animation Toggle */}
        {activeTabs.length > 1 && onToggleFanOut && (
          <button
            onClick={onToggleFanOut}
            className={`w-full px-3.5 py-2.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
              isFannedOut
                ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/30 ring-2 ring-blue-400'
                : 'bg-slate-900 hover:bg-slate-800 text-blue-300 hover:text-white border border-blue-500/30 hover:border-blue-400/60 shadow-sm'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>{isFannedOut ? 'Collapse Fanned Tabs' : 'Fan Out Tabs (Multi-Window Animation)'}</span>
          </button>
        )}

        {activeTabs.length > 0 && (
          <button
            onClick={onClearTabs}
            className="w-full px-3 py-2 rounded-xl bg-slate-900 hover:bg-rose-950/60 border border-slate-800 hover:border-rose-800 text-slate-300 hover:text-rose-200 text-xs font-medium flex items-center justify-center gap-1.5 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear All Floating Tabs</span>
          </button>
        )}
      </div>

      {/* Reader & Overlay Preferences */}
      <div className="space-y-3 pt-2">
        <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center justify-between">
          <span>Reader Preferences</span>
        </label>
        <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800/80 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Volume2 className="w-4 h-4 text-blue-400 shrink-0" />
            <div>
              <div className="text-xs font-medium text-white">"Listen to Article" Audio</div>
              <div className="text-[10px] text-slate-400">Show or hide speech player in reader mode</div>
            </div>
          </div>
          {onToggleShowListenToArticle && (
            <button
              type="button"
              onClick={() => onToggleShowListenToArticle(!showListenToArticle)}
              className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                showListenToArticle ? 'bg-blue-600' : 'bg-slate-800'
              }`}
              role="switch"
              aria-checked={showListenToArticle}
            >
              <span
                className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                  showListenToArticle ? 'translate-x-4' : 'translate-x-0'
                }`}
              />
            </button>
          )}
        </div>
      </div>

      {/* Code Architecture Modal */}
      {showCodeModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-3xl bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[85vh]">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950">
              <div className="flex items-center gap-3">
                <Code2 className="w-5 h-5 text-blue-400" />
                <div>
                  <h3 className="text-sm font-bold text-white">Modernized Flynx Architecture</h3>
                  <p className="text-xs text-slate-400">Android 14/15/16 Production Kotlin Implementations</p>
                </div>
              </div>
              <button
                onClick={() => setShowCodeModal(false)}
                className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center"
              >
                ✕
              </button>
            </div>

            {/* Modal Code Tabs */}
            <div className="flex items-center px-6 pt-3 gap-2 bg-slate-950/80 border-b border-slate-800 text-xs font-medium overflow-x-auto">
              <button
                onClick={() => setActiveCodeTab('controller')}
                className={`px-3 py-2 border-b-2 transition-all ${
                  activeCodeTab === 'controller'
                    ? 'border-blue-500 text-white font-semibold'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                GoogleMessagesBubbleController.kt
              </button>
              <button
                onClick={() => setActiveCodeTab('overlay')}
                className={`px-3 py-2 border-b-2 transition-all ${
                  activeCodeTab === 'overlay'
                    ? 'border-blue-500 text-white font-semibold'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                BubbleOverlayManager.kt
              </button>
              <button
                onClick={() => setActiveCodeTab('tabmgr')}
                className={`px-3 py-2 border-b-2 transition-all ${
                  activeCodeTab === 'tabmgr'
                    ? 'border-blue-500 text-white font-semibold'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                WebViewTabManager.kt
              </button>
              <button
                onClick={() => setActiveCodeTab('sanitizer')}
                className={`px-3 py-2 border-b-2 transition-all ${
                  activeCodeTab === 'sanitizer'
                    ? 'border-blue-500 text-white font-semibold'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                ReaderContentSanitizer.kt
              </button>
            </div>

            {/* Code Body */}
            <div className="flex-1 p-6 overflow-y-auto bg-slate-950/90 font-mono text-xs text-slate-300 leading-relaxed custom-scrollbar">
              <pre className="whitespace-pre-wrap">{kotlinSnippets[activeCodeTab]}</pre>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-3.5 border-t border-slate-800 bg-slate-950 flex items-center justify-between">
              <span className="text-xs text-slate-400 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>Enforces OOM safety, Jsoup XSS prevention, and Android 14+ specialUse foreground service</span>
              </span>
              <button
                onClick={copyCode}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold transition-colors"
              >
                {copiedCode ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedCode ? 'Copied' : 'Copy Kotlin Code'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
