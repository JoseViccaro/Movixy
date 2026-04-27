import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { Skeleton } from '@/presentation/components/Skeleton/Skeleton';

describe('Skeleton', () => {
  it('renders with base skeleton class', () => {
    const { container } = render(<Skeleton type="card" />);
    const skeleton = container.firstChild as HTMLElement;
    expect(skeleton.className).toContain('skeleton');
  });

  it('renders with card type class', () => {
    const { container } = render(<Skeleton type="card" />);
    const skeleton = container.firstChild as HTMLElement;
    expect(skeleton.className).toContain('card');
  });

  it('renders with hero type class', () => {
    const { container } = render(<Skeleton type="hero" />);
    const skeleton = container.firstChild as HTMLElement;
    expect(skeleton.className).toContain('hero');
  });
});