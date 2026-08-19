import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ThumbnailPreviewTooltip } from './ThumbnailPreviewTooltip';
import type { ScrubPreviewState } from '@/domain/models/trickplay.model';

describe('ThumbnailPreviewTooltip', () => {
  const defaultState: ScrubPreviewState = {
    visible: true,
    timestamp: 75,
    formattedTime: '1:15',
    percent: 25,
    pixelX: 200,
    tile: {
      url: 'https://example.com/sheet.jpg',
      x: -160,
      y: -90,
      width: 160,
      height: 90,
      sheetWidth: 1600,
      sheetHeight: 900,
    },
  };

  it('renders formatted time badge', () => {
    render(<ThumbnailPreviewTooltip state={defaultState} />);
    expect(screen.getByText('1:15')).toBeInTheDocument();
  });

  it('does not render when state is not visible', () => {
    const { container } = render(
      <ThumbnailPreviewTooltip state={{ ...defaultState, visible: false }} />
    );
    expect(container.firstChild).toBeNull();
  });

  it('applies sprite background coordinates when tile is provided', () => {
    const { container } = render(<ThumbnailPreviewTooltip state={defaultState} />);
    const previewBox = container.querySelector('[data-testid="thumbnail-image"]');
    expect(previewBox).toBeInTheDocument();
    expect(previewBox).toHaveStyle({
      backgroundImage: 'url(https://example.com/sheet.jpg)',
      backgroundPosition: '-160px -90px',
      backgroundSize: '1600px 900px',
    });
  });

  it('renders fallback snapshot image if provided without tile', () => {
    const stateWithoutTile: ScrubPreviewState = {
      ...defaultState,
      tile: undefined,
    };
    render(
      <ThumbnailPreviewTooltip
        state={stateWithoutTile}
        fallbackSnapshotUrl="data:image/jpeg;base64,snapshot123"
      />
    );
    const img = screen.getByRole('img');
    expect(img).toHaveAttribute('src', 'data:image/jpeg;base64,snapshot123');
  });
});
