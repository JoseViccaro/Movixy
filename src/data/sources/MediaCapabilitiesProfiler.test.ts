import { describe, it, expect, vi, beforeEach } from "vitest";
import { MediaCapabilitiesProfiler } from "./MediaCapabilitiesProfiler";

describe("MediaCapabilitiesProfiler", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("should query navigator.mediaCapabilities when available", async () => {
    const profiler = new MediaCapabilitiesProfiler();
    
    // Mock navigator.mediaCapabilities
    const mockDecodingInfo = vi.fn().mockImplementation((config: any) => {
      if (config.video && config.video.contentType.includes("avc1")) {
        return Promise.resolve({ supported: true, smooth: true, powerEfficient: true });
      }
      if (config.video && config.video.contentType.includes("hvc1")) {
        return Promise.resolve({ supported: true, smooth: true, powerEfficient: true });
      }
      return Promise.resolve({ supported: false, smooth: false, powerEfficient: false });
    });

    vi.stubGlobal("navigator", {
      mediaCapabilities: {
        decodingInfo: mockDecodingInfo,
      },
    });

    const caps = await profiler.getCapabilities();

    expect(caps.supportsH264).toBe(true);
    expect(caps.supportsHevc).toBe(true);
    expect(caps.supportsAv1).toBe(false);
  });

  it("should cache capabilities after first query", async () => {
    const profiler = new MediaCapabilitiesProfiler();
    const mockDecodingInfo = vi.fn().mockResolvedValue({ supported: true });

    vi.stubGlobal("navigator", {
      mediaCapabilities: {
        decodingInfo: mockDecodingInfo,
      },
    });

    const caps1 = await profiler.getCapabilities();
    const caps2 = await profiler.getCapabilities();

    expect(caps1).toEqual(caps2);
    // Number of calls should not double because of caching
    const callCount = mockDecodingInfo.mock.calls.length;
    await profiler.getCapabilities();
    expect(mockDecodingInfo.mock.calls.length).toBe(callCount);
  });

  it("should fallback to HTMLMediaElement canPlayType if mediaCapabilities is missing", async () => {
    const profiler = new MediaCapabilitiesProfiler();
    
    vi.stubGlobal("navigator", {});

    const mockCanPlayType = vi.fn().mockImplementation((type: string) => {
      if (type.includes('mp4; codecs="avc1"')) return "probably";
      return "";
    });

    // Mock document.createElement
    const origCreateElement = document.createElement.bind(document);
    vi.spyOn(document, "createElement").mockImplementation((tag: string) => {
      if (tag === "video") {
        return { canPlayType: mockCanPlayType } as unknown as HTMLVideoElement;
      }
      return origCreateElement(tag);
    });

    const caps = await profiler.getCapabilities();
    expect(caps.supportsH264).toBe(true);
  });
});
