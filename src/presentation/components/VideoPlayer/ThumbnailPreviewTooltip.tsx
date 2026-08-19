import type { ScrubPreviewState } from '@/domain/models/trickplay.model';
import styles from './ThumbnailPreviewTooltip.module.css';

interface ThumbnailPreviewTooltipProps {
  state: ScrubPreviewState;
  fallbackSnapshotUrl?: string | null;
}

export const ThumbnailPreviewTooltip = ({
  state,
  fallbackSnapshotUrl,
}: ThumbnailPreviewTooltipProps) => {
  if (!state.visible) return null;

  const { tile, pixelX, formattedTime } = state;

  const styleObj: React.CSSProperties = tile
    ? {
        backgroundImage: `url(${tile.url})`,
        backgroundPosition: `${tile.x}px ${tile.y}px`,
        backgroundSize: `${tile.sheetWidth}px ${tile.sheetHeight}px`,
      }
    : {};

  return (
    <div
      className={styles.tooltipContainer}
      style={{ left: `${pixelX}px` }}
      data-testid="thumbnail-tooltip"
    >
      <div
        className={styles.thumbnailCard}
        style={styleObj}
        data-testid="thumbnail-image"
      >
        {!tile && fallbackSnapshotUrl && (
          <img
            src={fallbackSnapshotUrl}
            alt="Preview thumbnail"
            className={styles.snapshotImg}
          />
        )}
      </div>
      <div className={styles.timeBadge}>{formattedTime}</div>
    </div>
  );
};
