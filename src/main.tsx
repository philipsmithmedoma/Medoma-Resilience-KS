import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '@fontsource-variable/inter';
import './index.css';
import { App } from './app/App';
import { initTheme } from './lib/theme';
import { initLocale } from './lib/i18n';

initTheme();
initLocale();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
