import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import ProtectedRoute from '../ProtectedRoute';
import { useAuth } from '../../context/AuthContext';

vi.mock('../../context/AuthContext');

describe('ProtectedRoute', () => {
  const TestComponent = () => <div>Protected Content</div>;

  it('should render children when logged in and not loading', () => {
    vi.mocked(useAuth).mockReturnValue({
      user: { email: 'test@example.com' },
      isLoggedIn: true,
      login: vi.fn(),
      logout: vi.fn(),
      loading: false,
    } as any);

    render(
      <BrowserRouter>
        <ProtectedRoute>
          <TestComponent />
        </ProtectedRoute>
      </BrowserRouter>
    );

    expect(screen.queryByText('Protected Content')).toBeTruthy();
  });

  it('should show loading when auth context is loading', () => {
    vi.mocked(useAuth).mockReturnValue({
      user: null,
      isLoggedIn: false,
      login: vi.fn(),
      logout: vi.fn(),
      loading: true,
    } as any);

    render(
      <BrowserRouter>
        <ProtectedRoute>
          <TestComponent />
        </ProtectedRoute>
      </BrowserRouter>
    );

    expect(screen.queryByText('Loading...')).toBeTruthy();
    expect(screen.queryByText('Protected Content')).toBeNull();
  });

  it('should redirect to login when not logged in', () => {
    vi.mocked(useAuth).mockReturnValue({
      user: null,
      isLoggedIn: false,
      login: vi.fn(),
      logout: vi.fn(),
      loading: false,
    } as any);

    const { container } = render(
      <BrowserRouter>
        <ProtectedRoute>
          <TestComponent />
        </ProtectedRoute>
      </BrowserRouter>
    );

    expect(container.innerHTML).not.toContain('Protected Content');
  });
});
