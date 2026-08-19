import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { CanvasThumbnailFallback } from './CanvasThumbnailFallback';

describe('CanvasThumbnailFallback', () => {
  let fallback: CanvasThumbnailFallback;

  beforeEach(() => {
    fallback = new CanvasThumbnailFallback();
  });

  afterEach(() => {
    fallback.dispose();
  });

  it('generates a cached data url for a requested video timestamp', async () => {
    const mockBlobUrl = 'blob:http://localhost/mock-frame-1';
    
    // Mock internal capture method
    vi.spyOn(fallback, 'captureFrameAtTime').mockResolvedValue(mockBlobUrl);

    const frameUrl = await fallback.getThumbnail('https://example.com/video.mp4', 45);
    expect(frameUrl).toBe(mockBlobUrl);

    // Cache hit
    const cachedUrl = await fallback.getThumbnail('https://example.com/video.mp4', 45);
    expect(cachedUrl).toBe(mockBlobUrl);
    expect(fallback.captureFrameAtTime).toHaveBeenCalledTimes(1);
  });

  it('handles dispose by clearing internal canvas and caches', () => {
    fallback.dispose();
    expect(fallback.getCacheSize()).toBe(0);
  });
});
