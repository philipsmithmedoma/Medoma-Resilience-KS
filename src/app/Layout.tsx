import { useEffect, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { useStore } from '@/data/store';
import { TICK_WALL_MS } from '@/lib/time';
import { Nav } from './Nav';
import { IncidentBanner } from './IncidentBanner';
import { CloseIncidentDialog } from '@/modules/incident/CloseIncidentDialog';

/** Runs the scenario clock: one tick per 2 s of wall time while running and not held by a dialog (SPEC.md § 7.2). */
function useClockTicker() {
  const running = useStore((s) => s.clockRunning);
  const hold = useStore((s) => s.clockHold);
  const stepClock = useStore((s) => s.stepClock);
  useEffect(() => {
    if (!running || hold > 0) return;
    const id = window.setInterval(() => stepClock(), TICK_WALL_MS);
    return () => window.clearInterval(id);
  }, [running, hold, stepClock]);
}

/** App shell: nav, incident banner, content area (DESIGN.md § 3). */
export function Layout() {
  const [closeOpen, setCloseOpen] = useState(false);
  const location = useLocation();
  useClockTicker();
  useEffect(() => {
    if (!location.hash) window.scrollTo({ top: 0 });
  }, [location.pathname, location.hash]);
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
