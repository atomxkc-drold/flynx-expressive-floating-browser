import { TabSession } from '../types/browser';

export const INITIAL_ARTICLES: TabSession[] = [
  {
    id: 'tab-1',
    url: 'https://developer.android.com/design/material-3-expressive',
    title: 'Material 3 Expressive: The Physics of Tactile Floating Bubbles',
    domain: 'developer.android.com',
    favicon: '🎨',
    progress: 100,
    isLoaded: true,
    readingTimeMin: 4,
    wordCount: 840,
    publishedDate: 'October 16, 2026',
    author: 'Elena Rostova',
    summary: 'How Google Messages modernized Android chat heads with chained spring physics, dynamic surface elevation, and magnetic dismiss gestures.',
    sections: [
      {
        heading: 'The Return of Floating Window Overlays',
        paragraphs: [
          'In early Android builds, floating chat heads pioneered by apps like Facebook Messenger and Flynx offered users a radical proposition: load web articles and messages in the background without interrupting your current task.',
          'With the release of Material 3 Expressive, floating overlays graduated from crude coordinate translators to mathematically bounded spring physics systems. When a user presses down on a bubble, immediate haptic compression to 0.92x scale signals that the element is anchored in tactile space.'
        ]
      },
      {
        heading: 'Chained Springs and Low-Bounciness Damping',
        paragraphs: [
          'Rather than relying on linear ValueAnimators that feel mechanical and disjointed, modern bubble controllers leverage AndroidX DynamicAnimation. By configuring a SpringForce with DAMPING_RATIO_LOW_BOUNCY and STIFFNESS_LOW, the bubble snaps to display bezels with lifelike settling momentum.',
          'When multiple tabs are queued simultaneously, child bubbles trail the leader using velocity-lag chaining. This provides visual depth and clarity without cluttering the user’s viewport.'
        ]
      },
      {
        heading: 'Magnetic Gravity Fields at the Bottom Bezel',
        paragraphs: [
          'The defining hallmark of Google Messages bubbles is the bottom-center dismiss target. As the finger draws within a 200px Euclidean radius of the target, the dismiss card scales up to 1.35x and applies a simulated magnetic pull, transferring kinetic energy directly to the user\'s thumb with a crisp haptic detent.'
        ]
      }
    ]
  },
  {
    id: 'tab-2',
    url: 'https://flynx.app/blog/preventing-webview-memory-leaks',
    title: 'Leak-Free WebViews: Solving the Multi-Tab Android Dilemma',
    domain: 'flynx.app',
    favicon: '⚡',
    progress: 100,
    isLoaded: true,
    readingTimeMin: 5,
    wordCount: 1050,
    publishedDate: 'October 12, 2026',
    author: 'Marcus Vance',
    summary: 'A deep architectural post-mortem on how background-loading floating browsers prevent OutOfMemory crashes through aggressive LRU pooling.',
    sections: [
      {
        heading: 'Why Floating Browsers Crash If Left Unchecked',
        paragraphs: [
          'The fundamental appeal of Flynx has always been effortless multitasking: tap three links in your favorite newsreader, continue scrolling, and let the articles render quietly in background bubble threads.',
          'However, the Android WebView engine is notorious for retaining rendering pipelines, GPU surfaces, and static WindowManager contexts. If a user spawns seven concurrent tabs on a mid-range handset, the app will swiftly trigger an OutOfMemoryError (OOM) as Chrome renderer processes consume hundreds of megabytes.'
        ]
      },
      {
        heading: 'The 5-Tab LRU Recycling Strategy',
        paragraphs: [
          'The modern refactoring introduces an authoritative TabSession pool capped strictly at five concurrent allocations. When a sixth link is launched, the oldest inactive tab is recycled: loading blank about:blank, clearing historical DOM trees, explicitly removing all parent views, and invoking destroy().',
          'This guarantees a steady memory footprint beneath 85MB regardless of user browsing intensity.'
        ]
      },
      {
        heading: 'Strict Content Security in Offline Reader Mode',
        paragraphs: [
          'By parsing remote articles into sanitized semantic ASTs via Jsoup and enforcing script-src none, the distraction-free reader mode strips tracking trackers, heavy advertising scripts, and potential cross-site scripting attack vectors.'
        ]
      }
    ]
  },
  {
    id: 'tab-3',
    url: 'https://uxdesign.cc/why-distraction-free-reading-matters',
    title: 'The Lost Art of Reader Mode: Why Web Cleanliness Wins',
    domain: 'uxdesign.cc',
    favicon: '📖',
    progress: 100,
    isLoaded: true,
    readingTimeMin: 3,
    wordCount: 620,
    publishedDate: 'October 8, 2026',
    author: 'Sarah Chen',
    summary: 'Why modern mobile reading requires typographic tranquility: Sepia tones, editorial serifs, and high-legibility layout hierarchy.',
    sections: [
      {
        heading: 'The Modern Web Layout Crisis',
        paragraphs: [
          'Visiting a typical article today often feels like navigating an obstacle course of cookie consent banners, animated autoplay videos, sticky newsletter solicitations, and intrusive interstitials.',
          'Reader Mode strips away all decorative noise, presenting the prose in its purest, most respectful form. Text is granted proper line height (1.6 to 1.7), balanced measure (65 to 75 characters per line), and optical warmth through carefully balanced Sepia and AMOLED palettes.'
        ]
      },
      {
        heading: 'Text-to-Speech as an Ambient Companion',
        paragraphs: [
          'Pairing distraction-free text extraction with real-time text-to-speech unlocks hands-free absorption while commuting, cooking, or exercising. By tracking spoken words paragraph by paragraph, users maintain seamless context between auditory and visual modes.'
        ]
      }
    ]
  }
];

export const SAMPLE_FEED_POSTS = [
  {
    id: 'post-1',
    author: 'Android Police',
    handle: '@AndroidPolice',
    avatar: '🤖',
    time: '12m ago',
    title: 'Google Messages unveils new smooth spring bubble physics in latest update',
    summary: 'The chat head experience gets a major overhaul with low-bounciness damping and dynamic magnetic targets.',
    targetUrl: 'https://developer.android.com/design/material-3-expressive',
    badge: 'Design'
  },
  {
    id: 'post-2',
    author: 'Hacker News Frontpage',
    handle: '@news_ycombinator',
    avatar: '🟧',
    time: '45m ago',
    title: 'How we solved Android WebView memory leaks with LRU tab recycling',
    summary: 'An engineering dive into keeping floating browser overlays under 90MB of RAM on Android 15 and 16.',
    targetUrl: 'https://flynx.app/blog/preventing-webview-memory-leaks',
    badge: 'Engineering'
  },
  {
    id: 'post-3',
    author: 'Smashing Magazine',
    handle: '@smashingmag',
    avatar: '🔴',
    time: '2h ago',
    title: 'Designing distraction-free reader modes for mobile web browsers',
    summary: 'A look into typography hierarchy, warm sepia tones, and audio speech narration in modern web clients.',
    targetUrl: 'https://uxdesign.cc/why-distraction-free-reading-matters',
    badge: 'Typography'
  },
  {
    id: 'post-4',
    author: 'Chrome OS & Android Team',
    handle: '@AndroidDev',
    avatar: '⚡',
    time: '4h ago',
    title: 'Full edge-to-edge support & predictive back gestures in overlay windows',
    summary: 'How system alert windows interact with edge-to-edge display cutouts on modern Android devices.',
    targetUrl: 'https://developer.android.com/design/material-3-expressive',
    badge: 'Architecture'
  }
];
