import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import { configureApiClient } from '@lovebook/api';

// LoveFeed fonts — self-hosted via @fontsource. The serif is the human voice,
// Inter is chrome, JetBrains Mono is the record, Fraunces is ceremony.
import '@fontsource/source-serif-4/400.css';
import '@fontsource/source-serif-4/500.css';
import '@fontsource/source-serif-4/600.css';
import '@fontsource/source-serif-4/400-italic.css';
import '@fontsource/source-serif-4/500-italic.css';
import '@fontsource/inter/400.css';
import '@fontsource/inter/500.css';
import '@fontsource/inter/600.css';
import '@fontsource/jetbrains-mono/400.css';
import '@fontsource/jetbrains-mono/500.css';
import '@fontsource/jetbrains-mono/400-italic.css';
import '@fontsource/fraunces/400.css';
import '@fontsource/fraunces/500.css';
import '@fontsource/fraunces/400-italic.css';

// Design tokens (:root + .lamplight) from the shared UI package.
import '@lovebook/ui/styles.css';

import { App } from './app.tsx';
import './styles.css';

const baseUrl = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8081';
configureApiClient(baseUrl);

const rootEl = document.getElementById('root');
if (!rootEl) throw new Error('Missing #root element in index.html');

createRoot(rootEl).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
