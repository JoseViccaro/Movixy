import { describe, it, expect, beforeEach } from 'vitest';
import { JellyfinTrickplayRepositoryImpl } from './jellyfin-trickplay.repository';
import type { TrickplayManifest } from '@/domain/models/trickplay.model';

describe('JellyfinTrickplayRepositoryImpl', () => {
  let repository: JellyfinTrickplayRepositoryImpl;

  const mockApiClient = {
    baseUrl: 'https://jellyfin.example.com',
    token: 'test-token',
  };

  beforeEach(() => {
    repository = new JellyfinTrickplayRepositoryImpl(mockApiClient as any);
  });

  describe('coordinate and frame lookup (getFrameForTime)', () => {
    const manifest: TrickplayManifest = {
      itemId: 'item-123',
      intervalSeconds: 10,
      tileWidth: 160,
      tileHeight: 90,
      tilesPerSheet: 100, // 10 x 10
      columns: 10,
      rows: 10,
      sheets: [
        'https://jellyfin.example.com/Videos/item-123/Trickplay/160/0.jpg',
        'https://jellyfin.example.com/Videos/item-123/Trickplay/160/1.jpg',
      ],
      totalDurationSeconds: 1200,
    };

    it('returns first frame for timestamp 0s', () => {
      const frame = repository.getFrameForTime(manifest, 0);
      expect(frame).toEqual({
        url: 'https://jellyfin.example.com/Videos/item-123/Trickplay/160/0.jpg',
        x: 0,
        y: 0,
        width: 160,
        height: 90,
        sheetWidth: 1600,
        sheetHeight: 900,
      });
    });

    it('calculates correct column and row on the first sheet', () => {
      // 25 seconds -> index 2 (at 10s interval) -> col 2, row 0 -> x = -320, y = 0
      const frame = repository.getFrameForTime(manifest, 25);
      expect(frame).toEqual({
        url: 'https://jellyfin.example.com/Videos/item-123/Trickplay/160/0.jpg',
        x: -320,
        y: 0,
        width: 160,
        height: 90,
        sheetWidth: 1600,
        sheetHeight: 900,
      });
    });

    it('calculates correct multi-row tile coordinates', () => {
      // 150 seconds -> index 15 (col 5, row 1) -> x = -800, y = -90
      const frame = repository.getFrameForTime(manifest, 150);
      expect(frame).toEqual({
        url: 'https://jellyfin.example.com/Videos/item-123/Trickplay/160/0.jpg',
        x: -800,
        y: -90,
        width: 160,
        height: 90,
        sheetWidth: 1600,
        sheetHeight: 900,
      });
    });

    it('indexes into subsequent spritesheets correctly', () => {
      // 1050 seconds -> index 105 -> sheetIndex 1, tileInSheet 5 (col 5, row 0)
      const frame = repository.getFrameForTime(manifest, 1050);
      expect(frame).toEqual({
        url: 'https://jellyfin.example.com/Videos/item-123/Trickplay/160/1.jpg',
        x: -800,
        y: 0,
        width: 160,
        height: 90,
        sheetWidth: 1600,
        sheetHeight: 900,
      });
    });

    it('clamps negative timestamps to 0s', () => {
      const frame = repository.getFrameForTime(manifest, -10);
      expect(frame?.x).toBe(0);
      expect(frame?.y).toBe(0);
      expect(frame?.url).toBe('https://jellyfin.example.com/Videos/item-123/Trickplay/160/0.jpg');
    });

    it('clamps timestamps exceeding total duration to the final frame', () => {
      const frame = repository.getFrameForTime(manifest, 2000);
      // Index for duration 1200 at 10s is 119 (since 0..119 is 1200s total duration)
      // 119 -> sheet 1, tileInSheet 19 -> col 9, row 1 -> x = -1440, y = -90
      expect(frame?.url).toBe('https://jellyfin.example.com/Videos/item-123/Trickplay/160/1.jpg');
      expect(frame?.x).toBe(-1440);
      expect(frame?.y).toBe(-90);
    });
  });

  describe('BIF binary parser support (parseBifBuffer)', () => {
    it('parses standard Roku BIF binary format (magic 0x89 0x42 0x49 0x46)', () => {
      // 64-byte BIF header + index entries + image payloads
      const buffer = new ArrayBuffer(64 + 16 + 10);
      const view = new DataView(buffer);
      const bytes = new Uint8Array(buffer);

      // Magic \x89BIF
      bytes[0] = 0x89;
      bytes[1] = 0x42;
      bytes[2] = 0x49;
      bytes[3] = 0x46;
      bytes[4] = 0x0d;
      bytes[5] = 0x0a;
      bytes[6] = 0x1a;
      bytes[7] = 0x0a;

      // Version = 0
      view.setUint32(8, 0, true);
      // Frame count = 1
      view.setUint32(12, 1, true);
      // Frame interval = 10000 ms (10s)
      view.setUint32(16, 10000, true);

      // Index entry 0: timestamp index = 0, offset = 80
      view.setUint32(64, 0, true);
      view.setUint32(68, 80, true);

      // End index entry (required by BIF spec): index = 0xFFFFFFFF, offset = 90
      view.setUint32(72, 0xffffffff, true);
      view.setUint32(76, 90, true);

      const parsed = repository.parseBifBuffer('item-bif', buffer);
      expect(parsed).not.toBeNull();
      expect(parsed?.intervalSeconds).toBe(10);
      expect(parsed?.sheets.length).toBe(1);
    });

    it('returns null if magic bytes do not match BIF specification', () => {
      const buffer = new ArrayBuffer(64);
      const parsed = repository.parseBifBuffer('item-invalid', buffer);
      expect(parsed).toBeNull();
    });
  });

  describe('manifest fetching (getTrickplayManifest)', () => {
    it('constructs manifest with HLS/Jellyfin storyboard conventions', async () => {
      const manifest = await repository.getTrickplayManifest('item-456');
      expect(manifest).not.toBeNull();
      expect(manifest?.itemId).toBe('item-456');
      expect(manifest?.tileWidth).toBe(160);
      expect(manifest?.tileHeight).toBe(90);
    });
  });
});
