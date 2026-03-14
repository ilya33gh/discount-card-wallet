type InstallPromptListener = (canInstall: boolean) => void;

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
}

let deferredPrompt: BeforeInstallPromptEvent | null = null;
let canInstall = false;
const listeners = new Set<InstallPromptListener>();

const notify = (): void => {
  for (const listener of listeners) {
    listener(canInstall);
  }
};

const setCanInstall = (value: boolean): void => {
  canInstall = value;
  notify();
};

const isStandaloneMode = (): boolean =>
  window.matchMedia("(display-mode: standalone)").matches ||
  (window.navigator as Navigator & { standalone?: boolean }).standalone === true;

export const initInstallPrompt = (): void => {
  if (typeof window === "undefined") {
    return;
  }

  if (isStandaloneMode()) {
    setCanInstall(false);
    return;
  }

  window.addEventListener("beforeinstallprompt", (event: Event) => {
    event.preventDefault();
    deferredPrompt = event as BeforeInstallPromptEvent;
    setCanInstall(true);
  });

  window.addEventListener("appinstalled", () => {
    deferredPrompt = null;
    setCanInstall(false);
  });
};

export const subscribeInstallPrompt = (listener: InstallPromptListener): (() => void) => {
  listeners.add(listener);
  listener(canInstall);
  return () => {
    listeners.delete(listener);
  };
};

export const promptInstall = async (): Promise<boolean> => {
  if (!deferredPrompt) {
    return false;
  }

  await deferredPrompt.prompt();
  const choice = await deferredPrompt.userChoice;
  deferredPrompt = null;
  setCanInstall(false);
  return choice.outcome === "accepted";
};

