import { describe, it, expect, beforeEach, vi } from 'vitest';
import { JellyfinChapterRepositoryImpl } from './jellyfin-chapter.repository';

describe('JellyfinChapterRepositoryImpl', () => {
  let repository: JellyfinChapterRepositoryImpl;
  let mockApiClient: any;

  beforeEach(() => {
    mockApiClient = {
      getItemById: vi.fn(),
    };
    repository = new JellyfinChapterRepositoryImpl(mockApiClient, 'user-123');
  });

  it('categorizes intro markers based on name regex (intro, opening, op)', async () => {
    mockApiClient.getItemById.mockResolvedValue({
      Id: 'item-1',
      RunTimeTicks: 1400 * 10000000,
      Chapters: [
        { Name: 'Prologue', StartPositionTicks: 0 },
        { Name: 'Intro Opening', StartPositionTicks: 90 * 10000000 },
        { Name: 'Episode Part 1', StartPositionTicks: 180 * 10000000 },
      ],
    });

    const markers = await repository.getChapterMarkers('item-1');
    expect(markers).toHaveLength(3);
    expect(markers[0].type).toBe('chapter');
    expect(markers[1].type).toBe('intro');
    expect(markers[1].startPositionSeconds).toBe(90);
    expect(markers[1].endPositionSeconds).toBe(180);
  });

  it('categorizes credits markers based on name regex (credit, ending, outro, ed)', async () => {
    mockApiClient.getItemById.mockResolvedValue({
      Id: 'item-2',
      RunTimeTicks: 1200 * 10000000,
      Chapters: [
        { Name: 'Main Story', StartPositionTicks: 0 },
        { Name: 'Ending Credits', StartPositionTicks: 1100 * 10000000 },
      ],
    });

    const markers = await repository.getChapterMarkers('item-2');
    expect(markers).toHaveLength(2);
    expect(markers[1].type).toBe('credits');
    expect(markers[1].startPositionSeconds).toBe(1100);
    expect(markers[1].endPositionSeconds).toBe(1200);
  });

  it('categorizes recap markers based on name regex (recap, previously)', async () => {
    mockApiClient.getItemById.mockResolvedValue({
      Id: 'item-3',
      RunTimeTicks: 1200 * 10000000,
      Chapters: [
        { Name: 'Previously on Movixy', StartPositionTicks: 0 },
        { Name: 'Main', StartPositionTicks: 60 * 10000000 },
      ],
    });

    const markers = await repository.getChapterMarkers('item-3');
    expect(markers[0].type).toBe('recap');
    expect(markers[0].startPositionSeconds).toBe(0);
    expect(markers[0].endPositionSeconds).toBe(60);
  });

  it('prioritizes Jellyfin 10.9+ MarkerType property if present', async () => {
    mockApiClient.getItemById.mockResolvedValue({
      Id: 'item-4',
      RunTimeTicks: 1200 * 10000000,
      Chapters: [
        { Name: 'Segment A', StartPositionTicks: 0, MarkerType: 'IntroStart' },
        { Name: 'Segment B', StartPositionTicks: 90 * 10000000, MarkerType: 'IntroEnd' },
      ],
    });

    const markers = await repository.getChapterMarkers('item-4');
    expect(markers[0].type).toBe('intro');
    expect(markers[0].endPositionSeconds).toBe(90);
  });

  it('returns empty array if item has no chapters', async () => {
    mockApiClient.getItemById.mockResolvedValue({
      Id: 'item-5',
      RunTimeTicks: 1000 * 10000000,
    });

    const markers = await repository.getChapterMarkers('item-5');
    expect(markers).toEqual([]);
  });
});
