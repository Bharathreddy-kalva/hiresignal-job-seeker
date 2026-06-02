import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { ClerkProvider } from '@clerk/clerk-react';
import './index.css';
import App from './App.tsx';

const publishableKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY as string;

if (!publishableKey) {
  console.warn('Missing VITE_CLERK_PUBLISHABLE_KEY — auth features will not work');
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <ClerkProvider publishableKey={publishableKey ?? ''}>
        <App />
      </ClerkProvider>
    </BrowserRouter>
  </StrictMode>,
);
