import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import { ensureSettings } from './db/repo';
import './index.css';

// Ask the browser not to evict our IndexedDB data. Result is shown in Settings.
navigator.storage?.persist?.().catch(() => {});
ensureSettings().catch(console.error);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
