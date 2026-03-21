import { lazy, Suspense, useEffect, useState } from "react";
import { IconX } from "@tabler/icons-react";
import { Navigate, Route, Routes } from "react-router-dom";
import { useI18n } from "../i18n/useI18n";
import { promptInstall, subscribeInstallPrompt } from "../pwa/installPrompt";
import { applyPwaUpdate, subscribePwaUpdate } from "../pwa/registerServiceWorker";
import { accountService } from "../services/sync/accountService";
import { syncCoordinator } from "../services/sync/syncCoordinator";
import { safeStorage } from "../utils/safeStorage";
import styles from "./App.module.css";

const HomePage = lazy(() => import("../pages/HomePage"));
const AddCardPage = lazy(() => import("../pages/AddCardPage"));
const CardDetailPage = lazy(() => import("../pages/CardDetailPage"));
const EditCardPage = lazy(() => import("../pages/EditCardPage"));
const SettingsPage = lazy(() => import("../pages/SettingsPage"));
let bootSyncStarted = false;
const INSTALL_BANNER_DISMISSED_KEY = "dcw.install_banner.dismissed";

export const App = () => {
  const { t } = useI18n();
  const [isPwaUpdateReady, setIsPwaUpdateReady] = useState(false);
  const [canInstall, setCanInstall] = useState(false);
  const [isInstallDismissed, setIsInstallDismissed] = useState(
    () => safeStorage.getItem(INSTALL_BANNER_DISMISSED_KEY) === "1"
  );

  const isAndroid =
    typeof navigator !== "undefined" && /android/i.test(navigator.userAgent);

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
    if (canInstall) {
      return;
    }
    setIsInstallDismissed(false);
    safeStorage.removeItem(INSTALL_BANNER_DISMISSED_KEY);
  }, [canInstall]);
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
      {canInstall && isAndroid && !isInstallDismissed ? (
        <div className={styles.installBanner}>
          <p className={styles.updateText}>{t.common.installAvailable}</p>
          <div className={styles.installActions}>
            <button
              type="button"
              className={styles.installButton}
              onClick={() => {
                void (async () => {
                  const installed = await promptInstall();
                  if (installed) {
                    setIsInstallDismissed(false);
                    safeStorage.removeItem(INSTALL_BANNER_DISMISSED_KEY);
                  }
                })();
              }}
            >
              {t.common.installNow}
            </button>
            <button
              type="button"
              className={styles.dismissButton}
              onClick={() => {
                setIsInstallDismissed(true);
                safeStorage.setItem(INSTALL_BANNER_DISMISSED_KEY, "1");
              }}
              aria-label={t.common.close}
            >
              <IconX size={20} stroke={2} aria-hidden="true" />
            </button>
          </div>
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
