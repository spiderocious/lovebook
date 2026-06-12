import { BannerHost, ModalHost, ToastHost } from '@lovebook/ui';

import { AppProviders } from './app.provider.tsx';
import { AppRoutes } from './app.routes.tsx';

export function App() {
  return (
    <AppProviders>
      <AppRoutes />
      {/* The imperative overlay layer — mounted once, driven by DrawerService. */}
      <ToastHost />
      <BannerHost />
      <ModalHost />
    </AppProviders>
  );
}
