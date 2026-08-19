import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { UpdateAvailableModal } from './UpdateAvailableModal';
import { UpdateStatus, type ReleaseInfo } from '@domain/models/app-update.model';

describe('UpdateAvailableModal', () => {
  const mockRelease: ReleaseInfo = {
    version: '2.0.0',
    tagName: 'v2.0.0',
    name: 'Version 2.0.0 Special Edition',
    body: '### What changed\n* New features\n* Performance boosts',
    publishedAt: '2026-08-19T10:00:00Z',
    htmlUrl: 'https://github.com/JoseViccaro/Movixy/releases/tag/v2.0.0',
    assets: [],
  };

  it('renders nothing when isOpen is false', () => {
    const { container } = render(
      <UpdateAvailableModal
        isOpen={false}
        status={UpdateStatus.UPDATE_AVAILABLE}
        currentVersion="1.0.0"
        release={mockRelease}
        progress={null}
        error={null}
        onUpdate={vi.fn()}
        onDismiss={vi.fn()}
      />,
    );

    expect(container.firstChild).toBeNull();
  });

  it('renders version info, release notes, and action buttons when open with update available', () => {
    const onUpdate = vi.fn();
    const onDismiss = vi.fn();

    render(
      <UpdateAvailableModal
        isOpen={true}
        status={UpdateStatus.UPDATE_AVAILABLE}
        currentVersion="1.0.0"
        release={mockRelease}
        progress={null}
        error={null}
        onUpdate={onUpdate}
        onDismiss={onDismiss}
      />,
    );

    expect(screen.getByText(/Nueva versión disponible/i)).toBeInTheDocument();
    expect(screen.getByText(/v1.0.0/i)).toBeInTheDocument();
    expect(screen.getByText(/v2.0.0/i)).toBeInTheDocument();
    expect(screen.getByText(/What changed/i)).toBeInTheDocument();

    const updateBtn = screen.getByRole('button', { name: /Actualizar ahora/i });
    const dismissBtn = screen.getByRole('button', { name: /Más tarde/i });

    expect(updateBtn).toBeInTheDocument();
    expect(dismissBtn).toBeInTheDocument();

    fireEvent.click(updateBtn);
    expect(onUpdate).toHaveBeenCalledTimes(1);

    fireEvent.click(dismissBtn);
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  it('renders progress bar and percentage when downloading', () => {
    render(
      <UpdateAvailableModal
        isOpen={true}
        status={UpdateStatus.DOWNLOADING}
        currentVersion="1.0.0"
        release={mockRelease}
        progress={{ receivedBytes: 50, totalBytes: 100, percentage: 50 }}
        error={null}
        onUpdate={vi.fn()}
        onDismiss={vi.fn()}
      />,
    );

    expect(screen.getByText(/Descargando actualización/i)).toBeInTheDocument();
    expect(screen.getByText(/50%/i)).toBeInTheDocument();
  });

  it('renders error message and retry button when in ERROR status', () => {
    const onUpdate = vi.fn();

    render(
      <UpdateAvailableModal
        isOpen={true}
        status={UpdateStatus.ERROR}
        currentVersion="1.0.0"
        release={mockRelease}
        progress={null}
        error="Fallo en la conexión de descarga"
        onUpdate={onUpdate}
        onDismiss={vi.fn()}
      />,
    );

    expect(screen.getByText(/Error al actualizar/i)).toBeInTheDocument();
    expect(screen.getByText(/Fallo en la conexión de descarga/i)).toBeInTheDocument();

    const retryBtn = screen.getByRole('button', { name: /Reintentar/i });
    fireEvent.click(retryBtn);
    expect(onUpdate).toHaveBeenCalledTimes(1);
  });

  it('dismisses modal when Escape key is pressed', () => {
    const onDismiss = vi.fn();

    render(
      <UpdateAvailableModal
        isOpen={true}
        status={UpdateStatus.UPDATE_AVAILABLE}
        currentVersion="1.0.0"
        release={mockRelease}
        progress={null}
        error={null}
        onUpdate={vi.fn()}
        onDismiss={onDismiss}
      />,
    );

    fireEvent.keyDown(window, { key: 'Escape' });
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });
});
