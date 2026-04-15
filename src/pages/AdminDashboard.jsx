import AdminShell from '@/components/admin/AdminShell';

/**
 * AdminDashboard is now a thin wrapper that mounts the tabbed AdminShell.
 * All tab content (Overview, Share Events, Magnet Events, Leads, Users)
 * is rendered via nested routes into AdminShell's <Outlet />.
 * See App.jsx for the full /admin/* route tree.
 */
export default function AdminDashboard() {
  return <AdminShell />;
}
