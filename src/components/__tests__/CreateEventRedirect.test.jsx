import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';

const { mockUseAuth } = vi.hoisted(() => ({ mockUseAuth: vi.fn() }));
vi.mock('@/lib/AuthContext', () => ({ useAuth: mockUseAuth }));
vi.mock('@/components/ui/LoadingState', () => ({ LoadingState: () => <div>loading</div> }));

import CreateEventRedirect from '@/components/CreateEventRedirect';

function renderAt(path) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/host/events/create" element={<CreateEventRedirect />} />
        <Route path="/admin/events/magnet/create" element={<div>magnet-wizard</div>} />
        <Route path="/magnet/lead" element={<div>lead-wizard</div>} />
      </Routes>
    </MemoryRouter>
  );
}

const ready = (user) => ({ user, isLoadingAuth: false, profileReady: true });

describe('CreateEventRedirect (/host/events/create)', () => {
  beforeEach(() => vi.clearAllMocks());

  it('sends an admin to the magnet event wizard', () => {
    mockUseAuth.mockReturnValue(ready({ id: 'a', role: 'admin', isAnonymous: false }));
    renderAt('/host/events/create');
    expect(screen.getByText('magnet-wizard')).toBeInTheDocument();
  });

  it('sends a signed-in non-admin (former Share host) to the lead wizard', () => {
    mockUseAuth.mockReturnValue(ready({ id: 'h', role: 'user', isAnonymous: false }));
    renderAt('/host/events/create');
    expect(screen.getByText('lead-wizard')).toBeInTheDocument();
  });

  it('sends an anonymous session (guest / lead visitor) to the lead wizard', () => {
    mockUseAuth.mockReturnValue(ready({ id: 'g', role: 'user', isAnonymous: true }));
    renderAt('/host/events/create');
    expect(screen.getByText('lead-wizard')).toBeInTheDocument();
  });

  it('sends a signed-out visitor to the lead wizard', () => {
    mockUseAuth.mockReturnValue(ready(null));
    renderAt('/host/events/create');
    expect(screen.getByText('lead-wizard')).toBeInTheDocument();
  });

  it('waits for the profile instead of routing an admin as a plain user', () => {
    // Before enrichment every user has the base role 'user'.
    mockUseAuth.mockReturnValue({ user: { id: 'a', role: 'user', isAnonymous: false }, isLoadingAuth: false, profileReady: false });
    renderAt('/host/events/create');
    expect(screen.getByText('loading')).toBeInTheDocument();
    expect(screen.queryByText('lead-wizard')).not.toBeInTheDocument();
  });
});
