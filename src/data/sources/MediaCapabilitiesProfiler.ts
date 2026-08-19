import type { ClientMediaCapabilities } from "@/domain/models/media-profile.model";

export class MediaCapabilitiesProfiler {
  private cachedCapabilities: ClientMediaCapabilities | null = null;

  async getCapabilities(): Promise<ClientMediaCapabilities> {
    if (this.cachedCapabilities) {
      return this.cachedCapabilities;
    }

    const supportsMediaCapabilities = 
      typeof navigator !== "undefined" && 
      "mediaCapabilities" in navigator && 
      navigator.mediaCapabilities &&
      typeof navigator.mediaCapabilities.decodingInfo === "function";

    if (supportsMediaCapabilities) {
      this.cachedCapabilities = await this.queryMediaCapabilities();
    } else {
      this.cachedCapabilities = this.queryCanPlayType();
    }

    return this.cachedCapabilities;
  }

  private async queryMediaCapabilities(): Promise<ClientMediaCapabilities> {
    const videoConfigs = [
      { key: "supportsH264", contentType: 'video/mp4; codecs="avc1.640028"' },
      { key: "supportsHevc", contentType: 'video/mp4; codecs="hvc1.1.6.L93.B0"' },
      { key: "supportsAv1", contentType: 'video/mp4; codecs="av01.0.08M.08"' },
      { key: "supportsVp9", contentType: 'video/webm; codecs="vp09.00.10.08"' },
    ];

    const audioConfigs = [
      { key: "supportsAac", contentType: 'audio/mp4; codecs="mp4a.40.2"' },
      { key: "supportsOpus", contentType: 'audio/webm; codecs="opus"' },
      { key: "supportsFlac", contentType: "audio/flac" },
      { key: "supportsAc3", contentType: 'audio/mp4; codecs="ac-3"' },
      { key: "supportsEac3", contentType: 'audio/mp4; codecs="ec-3"' },
    ];

    const caps: Partial<ClientMediaCapabilities> = {
      supportsHdr: false,
      maxVideoWidth: typeof window !== "undefined" && window.screen ? window.screen.width || 1920 : 1920,
      maxVideoHeight: typeof window !== "undefined" && window.screen ? window.screen.height || 1080 : 1080,
    };

    for (const item of videoConfigs) {
      try {
        const info = await navigator.mediaCapabilities.decodingInfo({
          type: "file",
          video: {
            contentType: item.contentType,
            width: caps.maxVideoWidth ?? 1920,
            height: caps.maxVideoHeight ?? 1080,
            bitrate: 10_000_000,
            framerate: 30,
          },
        });
        (caps as any)[item.key] = !!info.supported;
      } catch {
        (caps as any)[item.key] = false;
      }
    }

    for (const item of audioConfigs) {
      try {
        const info = await navigator.mediaCapabilities.decodingInfo({
          type: "file",
          audio: {
            contentType: item.contentType,
            bitrate: 192000,
            samplerate: 48000,
          },
        });
        (caps as any)[item.key] = !!info.supported;
      } catch {
        (caps as any)[item.key] = false;
      }
    }

    return caps as ClientMediaCapabilities;
  }

  private queryCanPlayType(): ClientMediaCapabilities {
    let video: HTMLVideoElement | null = null;
    if (typeof document !== "undefined" && typeof document.createElement === "function") {
      try {
        video = document.createElement("video");
      } catch {
        video = null;
      }
    }

    const test = (type: string) => {
      if (!video || !video.canPlayType) return false;
      const res = video.canPlayType(type);
      return res === "probably" || res === "maybe";
    };

    return {
      supportsH264: test('video/mp4; codecs="avc1.42E01E, mp4a.40.2"') || true,
      supportsHevc: test('video/mp4; codecs="hvc1.1.6.L93.B0"'),
      supportsAv1: test('video/mp4; codecs="av01.0.08M.08"'),
      supportsVp9: test('video/webm; codecs="vp9"'),
      supportsAac: test('audio/mp4; codecs="mp4a.40.2"') || true,
      supportsOpus: test('audio/webm; codecs="opus"'),
      supportsFlac: test("audio/flac"),
      supportsAc3: test('audio/mp4; codecs="ac-3"'),
      supportsEac3: test('audio/mp4; codecs="ec-3"'),
      maxVideoWidth: typeof window !== "undefined" && window.screen ? window.screen.width || 1920 : 1920,
      maxVideoHeight: typeof window !== "undefined" && window.screen ? window.screen.height || 1080 : 1080,
      supportsHdr: false,
    };
  }
}
