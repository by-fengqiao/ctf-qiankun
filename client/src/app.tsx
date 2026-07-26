import { lazy, Suspense } from 'react';
import { Route, Routes } from 'react-router-dom';

const NotFound = lazy(() => import('./pages/NotFound/NotFound'));
const WorkbenchPage = lazy(() => import('./pages/WorkbenchPage/WorkbenchPage'));
const ApiDocsPage = lazy(() => import('./pages/ApiDocsPage/ApiDocsPage'));

const PageFallback = () => (
  <div className="flex h-screen items-center justify-center bg-background text-muted-foreground">
    Loading...
  </div>
);

const RoutesComponent = () => (
  <Suspense fallback={<PageFallback />}>
    <Routes>
      <Route index element={<WorkbenchPage />} />
      <Route path="api-docs/*" element={<ApiDocsPage />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  </Suspense>
);

export default RoutesComponent;
