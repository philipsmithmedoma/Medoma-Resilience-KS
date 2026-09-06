import { HashRouter, Navigate, Route, Routes } from 'react-router-dom';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Toaster } from '@/components/ui/sonner';
import { Layout } from './Layout';
import { routes } from './routes';

export function App() {
  return (
    <HashRouter>
      <TooltipProvider delayDuration={200}>
        <Routes>
          <Route element={<Layout />}>
            <Route path="/" element={<Navigate to="/command-center" replace />} />
            {routes.map((r) => (
              <Route key={r.path} path={r.path} element={r.element} />
            ))}
            <Route path="*" element={<Navigate to="/command-center" replace />} />
          </Route>
        </Routes>
        <Toaster position="bottom-right" duration={3000} />
      </TooltipProvider>
    </HashRouter>
  );
}
