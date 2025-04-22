import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // Default stale time: 5 minutes
      // cacheTime removed again due to TS error - version issue likely
      refetchOnWindowFocus: true, // Default is true, explicitly set for clarity
    },
  },
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}> 
      <App />
    </QueryClientProvider>
  </StrictMode>
);