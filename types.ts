export interface SpriteConfig {
  rows: number;
  cols: number;
  totalFrames: number;
  fps: number;
  scale: number;
  transparent: string | null; // Hex color to treat as transparent (optional future feature, kept simple for now)
}

export interface Dimensions {
  width: number;
  height: number;
}

// Global definition for GIF.js which is loaded via CDN
declare global {
  class GIF {
    constructor(options: any);
    addFrame(element: HTMLCanvasElement | HTMLImageElement | ImageData, options?: any): void;
    on(event: 'progress', callback: (progress: number) => void): void;
    on(event: 'finished', callback: (blob: Blob) => void): void;
    on(event: string, callback: (...args: any[]) => void): void;
    render(): void;
  }

  // Global definition for UPNG.js
  var UPNG: {
    encode(imgs: ArrayBuffer[], w: number, h: number, cnum: number, dels: number[]): ArrayBuffer;
  }
}