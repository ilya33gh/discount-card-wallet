import { CSSProperties, ChangeEvent, FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { IconCircleCheckFilled, IconCircleXFilled, IconLoader2 } from "@tabler/icons-react";
import { ScreenHeader } from "../components/common/ScreenHeader";
import { useI18n } from "../i18n/useI18n";
import {
  ACCENT_COLOR_OPTIONS,
  ACCENT_COLOR_SWATCH,
  AccentColor,
  LocaleMode,
  ThemeMode,
  useAppSettings
} from "../settings/AppSettingsContext";
import { accountService } from "../services/sync/accountService";
import { backupService } from "../services/cards/backupService";
import { syncApi } from "../services/sync/syncApi";
import { syncCoordinator } from "../services/sync/syncCoordinator";
import { syncStorage } from "../services/sync/syncStorage";
import { SyncSession } from "../services/sync/syncTypes";
import styles from "./SettingsPage.module.css";

type ServerStatus = "checking" | "online" | "offline";

const SettingsPage = () => {
  const { t, locale } = useI18n();
  const { localeMode, themeMode, accentColor, setLocaleMode, setThemeMode, setAccentColor } =
    useAppSettings();
  const [session, setSession] = useState<SyncSession | null>(() => accountService.getSession());
  const [serverUrl, setServerUrl] = useState(() => syncStorage.getServerUrl());
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [syncState, setSyncState] = useState(() => syncCoordinator.getState());
  const [serverStatus, setServerStatus] = useState<ServerStatus>("checking");
  const [cloudStats, setCloudStats] = useState<{ activeCards: number; totalCards: number } | null>(
    null
  );
  const [statusText, setStatusText] = useState<string>(() =>
    session
      ? t.settings.syncStatusSignedIn.replace("{email}", session.user.email)
      : t.settings.syncStatusSignedOut
  );
  const importInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => syncCoordinator.subscribe(setSyncState), []);

  const loadServerDiagnostics = async (nextSession?: SyncSession | null) => {
    setServerStatus("checking");
    setCloudStats(null);
    try {
      await syncApi.health();
      setServerStatus("online");
    } catch {
      setServerStatus("offline");
      return;
    }

    const effectiveSession = nextSession ?? accountService.getSession();
    if (!effectiveSession) {
      return;
    }

    try {
      const stats = await syncApi.stats(effectiveSession);
      setCloudStats(stats);
    } catch {
      setCloudStats(null);
    }
  };

  useEffect(() => {
    void (async () => {
      const nextSession = await accountService.validateSession();
      setSession(nextSession);
      setStatusText(
        nextSession
          ? t.settings.syncStatusSignedIn.replace("{email}", nextSession.user.email)
          : t.settings.syncStatusSignedOut
      );
      await loadServerDiagnostics(nextSession);
    })();
  }, [t.settings.syncStatusSignedIn, t.settings.syncStatusSignedOut]);

  const accountStatus = useMemo(
    () =>
      session
        ? t.settings.syncStatusSignedIn.replace("{email}", session.user.email)
        : t.settings.syncStatusSignedOut,
    [session, t.settings.syncStatusSignedIn, t.settings.syncStatusSignedOut]
  );

  const syncStateLabel = useMemo(() => {
    switch (syncState.phase) {
      case "idle":
        return t.settings.syncStateIdle;
      case "scheduled":
        return t.settings.syncStateScheduled;
      case "syncing":
        return t.settings.syncStateSyncing;
      case "restoring":
        return t.settings.syncStateRestoring;
      case "success":
        return t.settings.syncStateSuccess;
      case "error":
        return `${t.settings.syncStateError}${syncState.lastError ? `: ${syncState.lastError}` : ""}`;
      default:
        return t.settings.syncStateIdle;
    }
  }, [syncState, t.settings]);

  const saveServerUrl = () => {
    syncStorage.setServerUrl(serverUrl);
    setServerUrl(syncStorage.getServerUrl());
    void loadServerDiagnostics(session);
  };

  const onAuthAction = async (mode: "login" | "register") => {
    if (!email.trim() || !password.trim()) {
      return;
    }
    setIsSubmitting(true);
    try {
      const nextSession =
        mode === "login"
          ? await accountService.login(email, password)
          : await accountService.register(email, password);
      setSession(nextSession);
      if (mode === "login") {
        await syncCoordinator.restoreFromServer();
      } else {
        await syncCoordinator.syncNow();
      }
      await loadServerDiagnostics(nextSession);
      setStatusText(t.settings.syncStatusSuccess);
    } catch (error) {
      const message = error instanceof Error ? error.message : t.settings.syncStatusFailed;
      setStatusText(`${t.settings.syncStatusFailed}: ${message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const onLogout = () => {
    accountService.logout();
    setSession(null);
    setCloudStats(null);
    void loadServerDiagnostics(null);
    setStatusText(t.settings.syncStatusSignedOut);
  };

  const onSyncNow = async (event: FormEvent) => {
    event.preventDefault();
    if (!session) {
      return;
    }
    setIsSubmitting(true);
    try {
      await syncCoordinator.syncNow();
      await loadServerDiagnostics(session);
      setStatusText(t.settings.syncStatusSuccess);
    } catch (error) {
      const message = error instanceof Error ? error.message : t.settings.syncStatusFailed;
      setStatusText(`${t.settings.syncStatusFailed}: ${message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const onExportJson = async () => {
    setIsSubmitting(true);
    try {
      const json = await backupService.exportJson();
      const blob = new Blob([json], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `discount-cards-backup-${new Date().toISOString().slice(0, 10)}.json`;
      link.click();
      URL.revokeObjectURL(url);
      setStatusText(t.settings.exportSuccess);
    } catch (error) {
      const message = error instanceof Error ? error.message : t.settings.exportFailed;
      setStatusText(`${t.settings.exportFailed}: ${message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const onImportJson = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) {
      return;
    }

    setIsSubmitting(true);
    try {
      const text = await file.text();
      const result = await backupService.importJson(text, {
        offlineMode: !session
      });
      if (session) {
        syncCoordinator.requestAutoSync();
      }
      setStatusText(
        t.settings.importSuccess
          .replace("{imported}", String(result.imported))
          .replace("{skipped}", String(result.skipped))
      );
    } catch (error) {
      const rawMessage = error instanceof Error ? error.message : t.settings.importFailed;
      const normalizedMessage = rawMessage.includes("Invalid backup")
        ? t.settings.invalidBackup
        : rawMessage;
      setStatusText(`${t.settings.importFailed}: ${normalizedMessage}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const themeOptions: { value: ThemeMode; label: string }[] = [
    { value: "system", label: t.settings.themeSystem },
    { value: "light", label: t.settings.themeLight },
    { value: "dark", label: t.settings.themeDark },
    { value: "oled", label: t.settings.themeOled }
  ];

  const accentLabels: Record<AccentColor, string> = {
    blue: t.settings.accentBlue,
    cyan: t.settings.accentCyan,
    teal: t.settings.accentTeal,
    violet: t.settings.accentViolet,
    green: t.settings.accentGreen,
    lime: t.settings.accentLime,
    yellow: t.settings.accentYellow,
    orange: t.settings.accentOrange,
    red: t.settings.accentRed,
    pink: t.settings.accentPink
  };

  return (
    <section className={styles.page}>
      <ScreenHeader title={t.settings.title} backTo="/" backLabel={t.common.back} />

      <section className={styles.section}>
        <h2 className={styles.label}>{t.settings.language}</h2>
        <div className={styles.optionGrid}>
          {[
            { value: "system" as LocaleMode, label: t.settings.languageSystem },
            { value: "en" as LocaleMode, label: t.settings.languageEnglish },
            { value: "ru" as LocaleMode, label: t.settings.languageRussian },
            { value: "cv" as LocaleMode, label: t.settings.languageChuvash }
          ].map((item) => (
            <button
              key={item.value}
              type="button"
              className={`${styles.option} ${localeMode === item.value ? styles.optionActive : ""}`}
              onClick={() => setLocaleMode(item.value)}
            >
              {item.label}
            </button>
          ))}
        </div>
      </section>

      <section className={styles.section}>
        <h2 className={styles.label}>{t.settings.theme}</h2>
        <div className={styles.optionGrid}>
          {themeOptions.map((item) => (
            <button
              key={item.value}
              type="button"
              className={`${styles.option} ${themeMode === item.value ? styles.optionActive : ""}`}
              onClick={() => setThemeMode(item.value)}
            >
              {item.label}
            </button>
          ))}
        </div>

        <h3 className={styles.subLabel}>{t.settings.accent}</h3>
        <div className={`${styles.optionGrid} ${styles.accentGrid}`}>
          {ACCENT_COLOR_OPTIONS.map((item) => (
            <button
              key={item}
              type="button"
              className={`${styles.option} ${accentColor === item ? styles.optionActive : ""}`}
              onClick={() => setAccentColor(item)}
            >
              <span
                className={styles.accentDot}
                style={{ "--accent-dot": ACCENT_COLOR_SWATCH[item] } as CSSProperties}
                aria-hidden="true"
              />
              {accentLabels[item]}
            </button>
          ))}
        </div>
      </section>

      <section className={styles.section}>
        <h2 className={styles.label}>{t.settings.sync}</h2>
        <p className={styles.description}>{t.settings.accountHint}</p>

        <div className={styles.serverRow}>
          {serverStatus === "online" ? (
            <IconCircleCheckFilled size={20} className={styles.serverOnline} aria-hidden="true" />
          ) : serverStatus === "offline" ? (
            <IconCircleXFilled size={20} className={styles.serverOffline} aria-hidden="true" />
          ) : (
            <IconLoader2 size={20} className={styles.serverChecking} aria-hidden="true" />
          )}
          <p className={styles.statusText}>
            {t.settings.serverStatus}: {" "}
            {serverStatus === "online"
              ? t.settings.serverOnline
              : serverStatus === "offline"
                ? t.settings.serverOffline
                : t.settings.serverChecking}
          </p>
        </div>

        <label className={styles.fieldLabel} htmlFor="sync-server-url">
          {t.settings.syncServerUrl}
        </label>
        <div className={styles.inlineRow}>
          <input
            id="sync-server-url"
            className={styles.input}
            type="text"
            value={serverUrl}
            onChange={(event) => setServerUrl(event.target.value)}
            placeholder={t.settings.syncServerUrlPlaceholder}
          />
          <button type="button" className={styles.option} onClick={saveServerUrl}>
            {t.settings.saveServerUrl}
          </button>
        </div>

        {session && cloudStats ? (
          <p className={styles.statusText}>
            {t.settings.cloudCards}: {" "}
            {t.settings.cloudCardsValue
              .replace("{count}", String(cloudStats.activeCards))
              .replace("{total}", String(cloudStats.totalCards))}
          </p>
        ) : null}

        <p className={styles.statusText}>{accountStatus}</p>
        <p className={styles.statusText}>{syncStateLabel}</p>
        {syncState.lastSuccessAt ? (
          <p className={styles.statusText}>
            {t.settings.lastSync}: {" "}
            {new Date(syncState.lastSuccessAt).toLocaleString(
              locale === "ru" ? "ru-RU" : locale === "cv" ? "cv-RU" : "en-US"
            )}
          </p>
        ) : null}

        {!session ? (
          <>
            <label className={styles.fieldLabel} htmlFor="auth-email">
              {t.settings.email}
            </label>
            <input
              id="auth-email"
              className={styles.input}
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              autoComplete="email"
            />
            <label className={styles.fieldLabel} htmlFor="auth-password">
              {t.settings.password}
            </label>
            <input
              id="auth-password"
              className={styles.input}
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete="current-password"
            />
            <div className={styles.inlineRow}>
              <button
                type="button"
                className={styles.option}
                onClick={() => void onAuthAction("login")}
                disabled={isSubmitting}
              >
                {t.settings.login}
              </button>
              <button
                type="button"
                className={styles.option}
                onClick={() => void onAuthAction("register")}
                disabled={isSubmitting}
              >
                {t.settings.register}
              </button>
            </div>
          </>
        ) : (
          <form className={styles.inlineRow} onSubmit={onSyncNow}>
            <button type="submit" className={styles.option} disabled={isSubmitting}>
              {t.settings.syncNow}
            </button>
            <button
              type="button"
              className={`${styles.option} ${styles.optionDanger}`}
              onClick={onLogout}
              disabled={isSubmitting}
            >
              {t.settings.logout}
            </button>
          </form>
        )}

        <p className={styles.statusText} role="status" aria-live="polite">
          {statusText}
        </p>
      </section>

      <section className={styles.section}>
        <h2 className={styles.label}>{t.settings.backup}</h2>
        <div className={styles.inlineRow}>
          <button
            type="button"
            className={styles.option}
            onClick={() => void onExportJson()}
            disabled={isSubmitting}
          >
            {t.settings.exportJson}
          </button>
          <button
            type="button"
            className={styles.option}
            onClick={() => importInputRef.current?.click()}
            disabled={isSubmitting}
          >
            {t.settings.importJson}
          </button>
        </div>
        <input
          ref={importInputRef}
          className={styles.hiddenInput}
          type="file"
          accept="application/json,.json"
          onChange={(event) => {
            void onImportJson(event);
          }}
        />
      </section>
    </section>
  );
};

export default SettingsPage;
