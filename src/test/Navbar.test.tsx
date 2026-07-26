import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ToastProvider } from '@/presentation/components/Toast/Toast';
import { Navbar } from '@/presentation/components/Navbar/Navbar';

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false } }
});

describe('Navbar Component', () => {
  it('renders all main navigation items', () => {
    render(
      <QueryClientProvider client={queryClient}>
        <ToastProvider>
          <MemoryRouter>
            <Navbar />
          </MemoryRouter>
        </ToastProvider>
      </QueryClientProvider>
    );

    expect(screen.getByText('Inicio')).toBeInTheDocument();
    expect(screen.getByText('Series')).toBeInTheDocument();
    expect(screen.getByText('Películas')).toBeInTheDocument();
    expect(screen.getByText('Novedades')).toBeInTheDocument();
    expect(screen.getByText('Mi lista')).toBeInTheDocument();
  });

  it('toggles search input visibility on search icon click', () => {
    render(
      <QueryClientProvider client={queryClient}>
        <ToastProvider>
          <MemoryRouter>
            <Navbar />
          </MemoryRouter>
        </ToastProvider>
      </QueryClientProvider>
    );

    // Initial state: search input should not be visible
    expect(screen.queryByPlaceholderText('Títulos, personas, géneros')).not.toBeInTheDocument();

    // Click search button
    const searchIcon = screen.getByRole('button', { name: 'Abrir búsqueda' });
    fireEvent.click(searchIcon);

    // After click: search input should be visible
    expect(screen.getByPlaceholderText('Títulos, personas, géneros')).toBeInTheDocument();
  });

  it('updates style class on scroll', () => {
    // We mock window.scrollY
    Object.defineProperty(window, 'scrollY', { value: 0, writable: true });

    const { container } = render(
      <QueryClientProvider client={queryClient}>
        <ToastProvider>
          <MemoryRouter>
            <Navbar />
          </MemoryRouter>
        </ToastProvider>
      </QueryClientProvider>
    );

    const navElement = container.querySelector('nav');
    expect(navElement).toBeInTheDocument();
    const initialClasses = navElement?.className;

    // Simulate scroll down
    window.scrollY = 100;
    fireEvent.scroll(window);

    // The classes should change to indicate scrolled state
    const scrolledClasses = navElement?.className;
    expect(scrolledClasses).not.toBe(initialClasses);
  });
});
