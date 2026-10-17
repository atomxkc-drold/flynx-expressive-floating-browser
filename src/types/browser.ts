export interface TabSession {
  id: string;
  url: string;
  title: string;
  domain: string;
  favicon: string;
  progress: number; // 0 - 100
  isLoaded: boolean;
  readingTimeMin: number;
  wordCount: number;
  publishedDate: string;
  author: string;
  heroImage?: string;
  summary: string;
  sections: {
    heading?: string;
    paragraphs: string[];
  }[];
}

export type ReaderTheme = 'light' | 'sepia' | 'dark';
export type ReaderTypography = 'serif' | 'sans' | 'mono';

export interface BubblePhysicsConfig {
  stiffness: number;
  damping: number;
  mass: number;
  compressionScale: number;
  magneticThreshold: number;
  edgeMargin: number;
}
