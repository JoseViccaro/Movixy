export interface TrickplayTile {
  url: string;
  x: number;
  y: number;
  width: number;
  height: number;
  sheetWidth: number;
  sheetHeight: number;
}

export interface TrickplayManifest {
  itemId: string;
  intervalSeconds: number;
  tileWidth: number;
  tileHeight: number;
  tilesPerSheet: number;
  columns: number;
  rows: number;
  sheets: string[]; // URLs of spritesheets
  totalDurationSeconds: number;
}

export interface ScrubPreviewState {
  visible: boolean;
  timestamp: number;
  formattedTime: string;
  percent: number;
  pixelX: number;
  tile?: TrickplayTile;
}

export interface ITrickplayRepository {
  getTrickplayManifest(itemId: string, mediaSourceId?: string): Promise<TrickplayManifest | null>;
  getFrameForTime(manifest: TrickplayManifest, timeSeconds: number): TrickplayTile | null;
}
