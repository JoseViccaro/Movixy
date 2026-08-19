import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ResumeChoiceDialog } from './ResumeChoiceDialog';
import type { ResumeEligibility } from '@/domain/models/resume-playback.model';

describe('ResumeChoiceDialog', () => {
  const eligibility: ResumeEligibility = {
    isResumable: true,
    savedPositionSeconds: 2720,
    runtimeSeconds: 6000,
    progressPercentage: 45.33,
    formattedPosition: '45:20',
    formattedRuntime: '1:40:00',
  };

  it('renders title, saved position, runtime, and progress bar', () => {
    render(
      <ResumeChoiceDialog
        isOpen={true}
        title="Interstellar"
        eligibility={eligibility}
        onResume={vi.fn()}
        onRestart={vi.fn()}
        onClose={vi.fn()}
      />
    );

    expect(screen.getByText('Continuar viendo')).toBeInTheDocument();
    expect(screen.getByText('Interstellar')).toBeInTheDocument();
    expect(screen.getByText('En 45:20')).toBeInTheDocument();
    expect(screen.getByText('de 1:40:00')).toBeInTheDocument();
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('fires onResume when clicking the primary resume button', () => {
    const handleResume = vi.fn();
    render(
      <ResumeChoiceDialog
        isOpen={true}
        title="Interstellar"
        eligibility={eligibility}
        onResume={handleResume}
        onRestart={vi.fn()}
        onClose={vi.fn()}
      />
    );

    const resumeBtn = screen.getByRole('button', { name: /Reanudar/i });
    fireEvent.click(resumeBtn);
    expect(handleResume).toHaveBeenCalledTimes(1);
  });

  it('fires onRestart when clicking restart button', () => {
    const handleRestart = vi.fn();
    render(
      <ResumeChoiceDialog
        isOpen={true}
        title="Interstellar"
        eligibility={eligibility}
        onResume={vi.fn()}
        onRestart={handleRestart}
        onClose={vi.fn()}
      />
    );

    const restartBtn = screen.getByRole('button', { name: /Comenzar desde el inicio/i });
    fireEvent.click(restartBtn);
    expect(handleRestart).toHaveBeenCalledTimes(1);
  });

  it('fires onClose on close button click and Escape key', () => {
    const handleClose = vi.fn();
    render(
      <ResumeChoiceDialog
        isOpen={true}
        title="Interstellar"
        eligibility={eligibility}
        onResume={vi.fn()}
        onRestart={vi.fn()}
        onClose={handleClose}
      />
    );

    const closeBtn = screen.getByRole('button', { name: /Cerrar/i });
    fireEvent.click(closeBtn);
    expect(handleClose).toHaveBeenCalledTimes(1);

    fireEvent.keyDown(window, { key: 'Escape' });
    expect(handleClose).toHaveBeenCalledTimes(2);
  });

  it('assigns data-focusable="true" to action buttons', () => {
    render(
      <ResumeChoiceDialog
        isOpen={true}
        title="Interstellar"
        eligibility={eligibility}
        onResume={vi.fn()}
        onRestart={vi.fn()}
        onClose={vi.fn()}
      />
    );

    const resumeBtn = screen.getByRole('button', { name: /Reanudar/i });
    const restartBtn = screen.getByRole('button', { name: /Comenzar desde el inicio/i });
    const closeBtn = screen.getByRole('button', { name: /Cerrar/i });

    expect(resumeBtn).toHaveAttribute('data-focusable', 'true');
    expect(restartBtn).toHaveAttribute('data-focusable', 'true');
    expect(closeBtn).toHaveAttribute('data-focusable', 'true');
    expect(resumeBtn).toHaveFocus();
  });

  it('does not render when isOpen is false', () => {
    const { container } = render(
      <ResumeChoiceDialog
        isOpen={false}
        title="Interstellar"
        eligibility={eligibility}
        onResume={vi.fn()}
        onRestart={vi.fn()}
        onClose={vi.fn()}
      />
    );

    expect(container.firstChild).toBeNull();
  });
});
