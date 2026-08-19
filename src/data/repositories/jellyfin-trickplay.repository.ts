import type {
  ITrickplayRepository,
  TrickplayManifest,
  TrickplayTile,
} from '@/domain/models/trickplay.model';
import type { JellyfinApiClient } from '@/data/sources/jellyfin-api.client';

export class JellyfinTrickplayRepositoryImpl implements ITrickplayRepository {
  private apiClient: JellyfinApiClient;
  private manifestCache = new Map<string, TrickplayManifest>();

  constructor(apiClient: JellyfinApiClient) {
    this.apiClient = apiClient;
  }

  async getTrickplayManifest(
    itemId: string,
    _mediaSourceId?: string
  ): Promise<TrickplayManifest | null> {
    if (this.manifestCache.has(itemId)) {
      return this.manifestCache.get(itemId)!;
    }

    try {
      const tileWidth = 160;
      const tileHeight = 90;
      const columns = 10;
      const rows = 10;
      const intervalSeconds = 10;
      const tilesPerSheet = columns * rows;

      // Jellyfin 10.9+ standard trickplay endpoint
      const baseUrl = this.apiClient.baseUrl.replace(/\/$/, '');
      const sheets = [
        `${baseUrl}/Videos/${itemId}/Trickplay/${tileWidth}/0.jpg`,
      ];

      const manifest: TrickplayManifest = {
        itemId,
        intervalSeconds,
        tileWidth,
        tileHeight,
        tilesPerSheet,
        columns,
        rows,
        sheets,
        totalDurationSeconds: 7200, // Default fallback duration
      };

      this.manifestCache.set(itemId, manifest);
      return manifest;
    } catch {
      return null;
    }
  }

  getFrameForTime(
    manifest: TrickplayManifest,
    timeSeconds: number
  ): TrickplayTile | null {
    if (!manifest || manifest.intervalSeconds <= 0 || manifest.sheets.length === 0) {
      return null;
    }

    // Clamp time to valid boundaries [0, totalDurationSeconds]
    const clampedTime = Math.max(
      0,
      Math.min(timeSeconds, Math.max(0, manifest.totalDurationSeconds - 1))
    );

    const frameIndex = Math.floor(clampedTime / manifest.intervalSeconds);
    const tilesPerSheet = manifest.tilesPerSheet || manifest.columns * manifest.rows;

    let sheetIndex = Math.floor(frameIndex / tilesPerSheet);
    let tileInSheet = frameIndex % tilesPerSheet;

    // Boundary clamp sheetIndex
    if (sheetIndex >= manifest.sheets.length) {
      sheetIndex = manifest.sheets.length - 1;
      tileInSheet = tilesPerSheet - 1;
    }

    const col = tileInSheet % manifest.columns;
    const row = Math.floor(tileInSheet / manifest.columns);

    const x = col === 0 ? 0 : -(col * manifest.tileWidth);
    const y = row === 0 ? 0 : -(row * manifest.tileHeight);

    return {
      url: manifest.sheets[sheetIndex],
      x,
      y,
      width: manifest.tileWidth,
      height: manifest.tileHeight,
      sheetWidth: manifest.columns * manifest.tileWidth,
      sheetHeight: manifest.rows * manifest.tileHeight,
    };
  }

  /**
   * Parse binary Roku BIF format if delivered directly as ArrayBuffer
   */
  parseBifBuffer(itemId: string, buffer: ArrayBuffer): TrickplayManifest | null {
    if (buffer.byteLength < 64) return null;

    const bytes = new Uint8Array(buffer);
    // Magic: 0x89 0x42 0x49 0x46 0x0d 0x0a 0x1a 0x0a
    const magic = [0x89, 0x42, 0x49, 0x46, 0x0d, 0x0a, 0x1a, 0x0a];
    for (let i = 0; i < magic.length; i++) {
      if (bytes[i] !== magic[i]) {
        return null;
      }
    }

    const view = new DataView(buffer);
    const frameCount = view.getUint32(12, true);
    const intervalMs = view.getUint32(16, true);
    const intervalSeconds = intervalMs > 0 ? Math.round(intervalMs / 1000) : 10;

    return {
      itemId,
      intervalSeconds,
      tileWidth: 160,
      tileHeight: 90,
      tilesPerSheet: frameCount,
      columns: 1,
      rows: frameCount,
      sheets: [`bif://${itemId}`],
      totalDurationSeconds: frameCount * intervalSeconds,
    };
  }
}
