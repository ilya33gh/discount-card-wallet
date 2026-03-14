import { lazy, Suspense, useEffect, useState } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { useI18n } from "../i18n/useI18n";
import { promptInstall, subscribeInstallPrompt } from "../pwa/installPrompt";
import { applyPwaUpdate, subscribePwaUpdate } from "../pwa/registerServiceWorker";
import { accountService } from "../services/sync/accountService";
import { syncCoordinator } from "../services/sync/syncCoordinator";
import styles from "./App.module.css";

const HomePage = lazy(() => import("../pages/HomePage"));
const AddCardPage = lazy(() => import("../pages/AddCardPage"));
const CardDetailPage = lazy(() => import("../pages/CardDetailPage"));
const EditCardPage = lazy(() => import("../pages/EditCardPage"));
const SettingsPage = lazy(() => import("../pages/SettingsPage"));
let bootSyncStarted = false;

export const App = () => {
  const { t } = useI18n();
  const [isPwaUpdateReady, setIsPwaUpdateReady] = useState(false);
  const [canInstall, setCanInstall] = useState(false);

  useEffect(() => {
    if (bootSyncStarted) {
      return;
    }
    bootSyncStarted = true;

    void (async () => {
      const session = await accountService.validateSession();
      if (!session) {
        return;
      }
      await syncCoordinator.syncNow();
    })();
  }, []);

  useEffect(() => subscribePwaUpdate(setIsPwaUpdateReady), []);
  useEffect(() => subscribeInstallPrompt(setCanInstall), []);
  useEffect(() => {
    const clearDiag = (window as Window & { __dcwDiagClear?: () => void }).__dcwDiagClear;
    if (clearDiag) {
      clearDiag();
    }
  }, []);

  return (
    <main className={styles.appShell}>
      {isPwaUpdateReady ? (
        <div className={styles.updateBanner}>
          <p className={styles.updateText}>{t.common.updateAvailable}</p>
          <button
            type="button"
            className={styles.updateButton}
            onClick={() => {
              applyPwaUpdate();
            }}
          >
            {t.common.updateNow}
          </button>
        </div>
      ) : null}
      {canInstall ? (
        <div className={styles.installBanner}>
          <p className={styles.updateText}>{t.common.installAvailable}</p>
          <button
            type="button"
            className={styles.installButton}
            onClick={() => {
              void promptInstall();
            }}
          >
            {t.common.installNow}
          </button>
        </div>
      ) : null}
      <Suspense fallback={<div className={styles.loading}>{t.common.loading}</div>}>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/cards/new" element={<AddCardPage />} />
          <Route path="/cards/:id" element={<CardDetailPage />} />
          <Route path="/cards/:id/edit" element={<EditCardPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </main>
  );
};
