import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { SkipMarkerButton } from './SkipMarkerButton';
import type { ActiveSkipMarkerState } from '@/domain/models/chapter-marker.model';

describe('SkipMarkerButton', () => {
  const activeState: ActiveSkipMarkerState = {
    isVisible: true,
    label: 'Skip Intro',
    targetTimeSeconds: 90,
    marker: {
      id: 'intro-1',
      name: 'Intro',
      type: 'intro',
      startPositionSeconds: 0,
      endPositionSeconds: 90,
    },
  };

  it('renders button with label when visible', () => {
    render(
      <SkipMarkerButton state={activeState} onSkip={() => {}} onDismiss={() => {}} />
    );

    expect(screen.getByRole('button', { name: /Skip Intro/i })).toBeInTheDocument();
  });

  it('triggers onSkip with targetTimeSeconds when clicked', () => {
    const handleSkip = vi.fn();
    render(
      <SkipMarkerButton state={activeState} onSkip={handleSkip} onDismiss={() => {}} />
    );

    fireEvent.click(screen.getByRole('button', { name: /Skip Intro/i }));
    expect(handleSkip).toHaveBeenCalledWith(90);
  });

  it('supports Enter key navigation for TV remote accessibility', () => {
    const handleSkip = vi.fn();
    render(
      <SkipMarkerButton state={activeState} onSkip={handleSkip} onDismiss={() => {}} />
    );

    const btn = screen.getByRole('button', { name: /Skip Intro/i });
    fireEvent.keyDown(btn, { key: 'Enter', code: 'Enter' });
    expect(handleSkip).toHaveBeenCalledWith(90);
  });

  it('does not render when isVisible is false', () => {
    const { container } = render(
      <SkipMarkerButton
        state={{ ...activeState, isVisible: false }}
        onSkip={() => {}}
        onDismiss={() => {}}
      />
    );

    expect(container.firstChild).toBeNull();
  });
});
