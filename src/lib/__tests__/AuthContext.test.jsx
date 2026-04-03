import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, act } from '@testing-library/react';
import React from 'react';

// ─── Hoisted mocks (evaluated before vi.mock factories are executed) ──────────
const { mockMe, mockLogout, mockRedirectToLogin, mockAxiosGet, mockCreateAxiosClient } =
  vi.hoisted(() => {
    const mockMe = vi.fn();
    const mockLogout = vi.fn();
    const mockRedirectToLogin = vi.fn();
    const mockAxiosGet = vi.fn();
    const mockCreateAxiosClient = vi.fn(() => ({ get: mockAxiosGet }));
    return { mockMe, mockLogout, mockRedirectToLogin, mockAxiosGet, mockCreateAxiosClient };
  });

// ─── Mocks ────────────────────────────────────────────────────────────────────

vi.mock('@/api/base44Client', () => ({
  base44: {
    auth: {
      me: mockMe,
      logout: mockLogout,
      redirectToLogin: mockRedirectToLogin,
    },
  },
}));

vi.mock('@base44/sdk/dist/utils/axios-client', () => ({
  createAxiosClient: mockCreateAxiosClient,
}));

// app-params provides appId / token — keep them stable across tests.
vi.mock('@/lib/app-params', () => ({
  appParams: { appId: 'test-app-id', token: null },
}));

import { AuthProvider, useAuth } from '../AuthContext';
import { appParams } from '@/lib/app-params';

// ─── Helper component ─────────────────────────────────────────────────────────
// Renders the auth context values so tests can assert on them.
function AuthConsumer() {
  const auth = useAuth();
  return (
    <div>
      <span data-testid="isAuthenticated">{String(auth.isAuthenticated)}</span>
      <span data-testid="isLoadingAuth">{String(auth.isLoadingAuth)}</span>
      <span data-testid="isLoadingPublicSettings">{String(auth.isLoadingPublicSettings)}</span>
      <span data-testid="authErrorType">{auth.authError?.type ?? 'none'}</span>
      <span data-testid="userId">{auth.user?.id ?? 'none'}</span>
      <span data-testid="hasPublicSettings">{auth.appPublicSettings ? 'yes' : 'no'}</span>
      <button onClick={auth.logout}>logout</button>
      <button onClick={() => auth.logout(false)}>logout-no-redirect</button>
      <button onClick={auth.navigateToLogin}>navigateToLogin</button>
    </div>
  );
}

function renderWithProvider() {
  return render(
    <AuthProvider>
      <AuthConsumer />
    </AuthProvider>
  );
}

// ─── useAuth outside AuthProvider ────────────────────────────────────────────

describe('useAuth', () => {
  it('throws when used outside an AuthProvider', () => {
    // Suppress the console.error React would log for the thrown error.
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => render(<AuthConsumer />)).toThrow('useAuth must be used within an AuthProvider');
    consoleSpy.mockRestore();
  });
});

// ─── AuthProvider – no token (guest / unauthenticated) ───────────────────────

describe('AuthProvider (no token)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Ensure there is no token — default mock already sets token: null.
    appParams.token = null;
  });

  it('resolves to an unauthenticated state after public settings load', async () => {
    const publicSettings = { id: 'test-app-id', public_settings: {} };
    mockAxiosGet.mockResolvedValue(publicSettings);

    renderWithProvider();

    await waitFor(() => {
      expect(screen.getByTestId('isLoadingPublicSettings').textContent).toBe('false');
    });

    expect(screen.getByTestId('isAuthenticated').textContent).toBe('false');
    expect(screen.getByTestId('isLoadingAuth').textContent).toBe('false');
    expect(screen.getByTestId('authErrorType').textContent).toBe('none');
    expect(screen.getByTestId('hasPublicSettings').textContent).toBe('yes');
  });

  it('sets authError to auth_required when the server returns 403 with reason auth_required', async () => {
    const error = { status: 403, data: { extra_data: { reason: 'auth_required' } }, message: 'Auth required' };
    mockAxiosGet.mockRejectedValue(error);

    renderWithProvider();

    await waitFor(() => {
      expect(screen.getByTestId('authErrorType').textContent).toBe('auth_required');
    });

    expect(screen.getByTestId('isAuthenticated').textContent).toBe('false');
    expect(screen.getByTestId('isLoadingPublicSettings').textContent).toBe('false');
  });

  it('sets authError to user_not_registered when the server returns that reason', async () => {
    const error = { status: 403, data: { extra_data: { reason: 'user_not_registered' } }, message: 'Not registered' };
    mockAxiosGet.mockRejectedValue(error);

    renderWithProvider();

    await waitFor(() => {
      expect(screen.getByTestId('authErrorType').textContent).toBe('user_not_registered');
    });
  });

  it('sets authError with the raw reason for other 403 reasons', async () => {
    const error = { status: 403, data: { extra_data: { reason: 'app_suspended' } }, message: 'Suspended' };
    mockAxiosGet.mockRejectedValue(error);

    renderWithProvider();

    await waitFor(() => {
      expect(screen.getByTestId('authErrorType').textContent).toBe('app_suspended');
    });
  });

  it('sets authError to unknown for non-403 errors', async () => {
    const error = { status: 500, message: 'Internal Server Error' };
    mockAxiosGet.mockRejectedValue(error);

    renderWithProvider();

    await waitFor(() => {
      expect(screen.getByTestId('authErrorType').textContent).toBe('unknown');
    });
  });
});

// ─── AuthProvider – with token (authenticated user) ──────────────────────────

describe('AuthProvider (with token)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    appParams.token = 'valid-jwt-token';
  });

  it('sets isAuthenticated to true when both public settings and user auth succeed', async () => {
    const publicSettings = { id: 'test-app-id', public_settings: {} };
    mockAxiosGet.mockResolvedValue(publicSettings);
    mockMe.mockResolvedValue({ id: 'u1', email: 'user@example.com' });

    renderWithProvider();

    await waitFor(() => {
      expect(screen.getByTestId('isAuthenticated').textContent).toBe('true');
    });

    expect(screen.getByTestId('userId').textContent).toBe('u1');
    expect(screen.getByTestId('authErrorType').textContent).toBe('none');
  });

  it('sets authError to auth_required when user auth returns 401', async () => {
    const publicSettings = { id: 'test-app-id', public_settings: {} };
    mockAxiosGet.mockResolvedValue(publicSettings);
    const authError = { status: 401, message: 'Unauthorized' };
    mockMe.mockRejectedValue(authError);

    renderWithProvider();

    await waitFor(() => {
      expect(screen.getByTestId('isLoadingAuth').textContent).toBe('false');
    });

    expect(screen.getByTestId('isAuthenticated').textContent).toBe('false');
    expect(screen.getByTestId('authErrorType').textContent).toBe('auth_required');
  });

  it('sets authError to auth_required when user auth returns 403', async () => {
    const publicSettings = { id: 'test-app-id', public_settings: {} };
    mockAxiosGet.mockResolvedValue(publicSettings);
    mockMe.mockRejectedValue({ status: 403, message: 'Forbidden' });

    renderWithProvider();

    await waitFor(() => {
      expect(screen.getByTestId('isLoadingAuth').textContent).toBe('false');
    });

    expect(screen.getByTestId('authErrorType').textContent).toBe('auth_required');
  });
});

// ─── logout / navigateToLogin ─────────────────────────────────────────────────

describe('AuthProvider actions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    appParams.token = null;
    const publicSettings = { id: 'test-app-id', public_settings: {} };
    mockAxiosGet.mockResolvedValue(publicSettings);
  });

  it('calls base44.auth.logout with current URL when logout() is invoked with redirect', async () => {
    renderWithProvider();
    await waitFor(() => {
      expect(screen.getByTestId('isLoadingPublicSettings').textContent).toBe('false');
    });

    act(() => {
      screen.getByText('logout').click();
    });

    expect(mockLogout).toHaveBeenCalledWith(window.location.href);
  });

  it('calls base44.auth.logout without a URL when logout(false) is invoked', async () => {
    renderWithProvider();
    await waitFor(() => {
      expect(screen.getByTestId('isLoadingPublicSettings').textContent).toBe('false');
    });

    act(() => {
      screen.getByText('logout-no-redirect').click();
    });

    expect(mockLogout).toHaveBeenCalledWith();
  });

  it('calls base44.auth.redirectToLogin when navigateToLogin() is invoked', async () => {
    renderWithProvider();
    await waitFor(() => {
      expect(screen.getByTestId('isLoadingPublicSettings').textContent).toBe('false');
    });

    act(() => {
      screen.getByText('navigateToLogin').click();
    });

    expect(mockRedirectToLogin).toHaveBeenCalledWith(window.location.href);
  });
});
