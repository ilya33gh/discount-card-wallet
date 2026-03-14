type PwaUpdateListener = (isReady: boolean) => void;

let waitingWorker: ServiceWorker | null = null;
let updateReady = false;
const listeners = new Set<PwaUpdateListener>();

const notify = (): void => {
  for (const listener of listeners) {
    listener(updateReady);
  }
};

const setUpdateReady = (worker: ServiceWorker | null): void => {
  waitingWorker = worker;
  updateReady = Boolean(worker);
  notify();
};

const wireRegistration = (registration: ServiceWorkerRegistration): void => {
  if (registration.waiting) {
    setUpdateReady(registration.waiting);
  }

  registration.addEventListener("updatefound", () => {
    const newWorker = registration.installing;
    if (!newWorker) {
      return;
    }

    newWorker.addEventListener("statechange", () => {
      if (newWorker.state === "installed" && navigator.serviceWorker.controller) {
        setUpdateReady(newWorker);
      }
    });
  });
};

export const subscribePwaUpdate = (listener: PwaUpdateListener): (() => void) => {
  listeners.add(listener);
  listener(updateReady);
  return () => {
    listeners.delete(listener);
  };
};

export const applyPwaUpdate = (): void => {
  if (waitingWorker) {
    waitingWorker.postMessage({ type: "SKIP_WAITING" });
  }
};

export const registerServiceWorker = (): void => {
  if (!("serviceWorker" in navigator)) {
    return;
  }

  window.addEventListener("load", async () => {
    try {
      const registration = await navigator.serviceWorker.register("/sw.js");
      wireRegistration(registration);

      navigator.serviceWorker.addEventListener("controllerchange", () => {
        if (updateReady) {
          window.location.reload();
        }
      });
    } catch (error) {
      console.error("Service worker registration failed", error);
    }
  });
};
