import { Route, Routes } from 'react-router-dom';

import { ROUTES } from '@lovebook/core';

import { HomeScreen } from '@features/health/home-screen.tsx';
import { PreviewScreen } from '@features/preview/preview-screen.tsx';

export function AppRoutes() {
  return (
    <Routes>
      <Route path={ROUTES.HOME} element={<HomeScreen />} />
      <Route path={ROUTES.PREVIEW} element={<PreviewScreen />} />
      <Route path="*" element={<HomeScreen />} />
    </Routes>
  );
}
