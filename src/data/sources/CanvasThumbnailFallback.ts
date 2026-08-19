export class CanvasThumbnailFallback {
  private cache = new Map<string, string>();
  private canvas: HTMLCanvasElement | null = null;
  private ctx: CanvasRenderingContext2D | null = null;

  constructor() {
    if (typeof document !== 'undefined') {
      this.canvas = document.createElement('canvas');
      this.canvas.width = 160;
      this.canvas.height = 90;
      this.ctx = this.canvas.getContext('2d');
    }
  }

  async getThumbnail(videoUrl: string, timeSeconds: number): Promise<string | null> {
    const key = `${videoUrl}#t=${Math.floor(timeSeconds)}`;
    if (this.cache.has(key)) {
      return this.cache.get(key)!;
    }

    const frameUrl = await this.captureFrameAtTime(videoUrl, timeSeconds);
    if (frameUrl) {
      this.cache.set(key, frameUrl);
    }
    return frameUrl;
  }

  async captureFrameAtTime(videoUrl: string, timeSeconds: number): Promise<string | null> {
    if (typeof document === 'undefined') return null;

    return new Promise((resolve) => {
      const video = document.createElement('video');
      video.crossOrigin = 'anonymous';
      video.muted = true;
      video.preload = 'metadata';

      const cleanup = () => {
        video.onloadeddata = null;
        video.onseeked = null;
        video.onerror = null;
        video.src = '';
        video.remove();
      };

      const timer = setTimeout(() => {
        cleanup();
        resolve(null);
      }, 3000);

      video.onloadeddata = () => {
        video.currentTime = Math.max(0, timeSeconds);
      };

      video.onseeked = () => {
        clearTimeout(timer);
        try {
          if (!this.canvas) {
            this.canvas = document.createElement('canvas');
            this.canvas.width = 160;
            this.canvas.height = 90;
            this.ctx = this.canvas.getContext('2d');
          }
          if (this.ctx && this.canvas) {
            this.ctx.drawImage(video, 0, 0, this.canvas.width, this.canvas.height);
            const dataUrl = this.canvas.toDataURL('image/jpeg', 0.7);
            cleanup();
            resolve(dataUrl);
            return;
          }
        } catch {
          // Canvas tainted or extraction error
        }
        cleanup();
        resolve(null);
      };

      video.onerror = () => {
        clearTimeout(timer);
        cleanup();
        resolve(null);
      };

      video.src = videoUrl;
    });
  }

  getCacheSize(): number {
    return this.cache.size;
  }

  dispose(): void {
    this.cache.clear();
    this.canvas = null;
    this.ctx = null;
  }
}
