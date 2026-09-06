import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Nav } from './Nav';
import { IncidentBanner } from './IncidentBanner';
import { CloseIncidentDialog } from '@/modules/incident/CloseIncidentDialog';

/** App shell: nav, incident banner, content area (DESIGN.md § 3). */
export function Layout() {
  const [closeOpen, setCloseOpen] = useState(false);
  return (
    <div className="flex min-h-screen flex-col">
      <Nav />
      <IncidentBanner onClose={() => setCloseOpen(true)} />
      <main className="flex-1 px-6 pt-4 pb-8">
        <Outlet />
      </main>
      <CloseIncidentDialog open={closeOpen} onOpenChange={setCloseOpen} />
    </div>
  );
}
