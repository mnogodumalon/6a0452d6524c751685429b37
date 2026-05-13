import '@/lib/sentry';
import { lazy, Suspense } from 'react';
import { HashRouter, Routes, Route } from 'react-router-dom';
import { ActionsProvider } from '@/context/ActionsContext';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { ErrorBusProvider } from '@/components/ErrorBus';
import { Layout } from '@/components/Layout';
import DashboardOverview from '@/pages/DashboardOverview';
import AdminPage from '@/pages/AdminPage';
import EintraegePage from '@/pages/EintraegePage';
import VerknuepfungenPage from '@/pages/VerknuepfungenPage';
import PublicFormEintraege from '@/pages/public/PublicForm_Eintraege';
import PublicFormVerknuepfungen from '@/pages/public/PublicForm_Verknuepfungen';
// <public:imports>
// </public:imports>
// <custom:imports>
// </custom:imports>

export default function App() {
  return (
    <ErrorBoundary>
      <ErrorBusProvider>
        <HashRouter>
          <ActionsProvider>
            <Routes>
              <Route path="public/6a0452bf70744be84f3f782c" element={<PublicFormEintraege />} />
              <Route path="public/6a0452c3153123bae8fd8592" element={<PublicFormVerknuepfungen />} />
              {/* <public:routes> */}
              {/* </public:routes> */}
              <Route element={<Layout />}>
                <Route index element={<DashboardOverview />} />
                <Route path="eintraege" element={<EintraegePage />} />
                <Route path="verknuepfungen" element={<VerknuepfungenPage />} />
                <Route path="admin" element={<AdminPage />} />
                {/* <custom:routes> */}
                {/* </custom:routes> */}
              </Route>
            </Routes>
          </ActionsProvider>
        </HashRouter>
      </ErrorBusProvider>
    </ErrorBoundary>
  );
}
