import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { ErrorBoundary } from 'react-error-boundary';
import { createPortal } from 'react-dom';
import RoutesComponent from './app';
import './index.css';
import { Toaster } from '@/components/ui/sonner';

const MainApp = () => (
  <BrowserRouter>
    <ErrorBoundary fallbackRender={({ error }) => <div className="p-8 text-destructive">应用发生错误：{String(error)}</div>}>
      <RoutesComponent />
      {createPortal(<Toaster />, document.body)}
    </ErrorBoundary>
  </BrowserRouter>
);

createRoot(document.getElementById('root')!).render(<MainApp />);
