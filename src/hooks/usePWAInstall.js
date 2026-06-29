import { createElement, useCallback, useEffect, useState } from 'react';
import { PWAInstallContext, usePWAInstallContext } from '../lib/app-context';

function getIsInstalled() {
  if (typeof window === 'undefined') return false;

  return window.matchMedia?.('(display-mode: standalone)').matches || window.navigator?.standalone === true;
}

export function PWAInstallProvider({ children }) {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isInstalled, setIsInstalled] = useState(getIsInstalled);
  const [isInstalling, setIsInstalling] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;

    const handleBeforeInstallPrompt = (event) => {
      event.preventDefault();
      setDeferredPrompt(event);
      setIsInstalled(getIsInstalled());
    };

    const handleAppInstalled = () => {
      setDeferredPrompt(null);
      setIsInstalled(true);
      setIsInstalling(false);
    };

    const displayMode = window.matchMedia?.('(display-mode: standalone)');
    const handleDisplayModeChange = () => {
      const installed = getIsInstalled();
      setIsInstalled(installed);
      if (installed) setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    if (displayMode?.addEventListener) {
      displayMode.addEventListener('change', handleDisplayModeChange);
    } else {
      displayMode?.addListener?.(handleDisplayModeChange);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);

      if (displayMode?.removeEventListener) {
        displayMode.removeEventListener('change', handleDisplayModeChange);
      } else {
        displayMode?.removeListener?.(handleDisplayModeChange);
      }
    };
  }, []);

  const installApp = useCallback(async () => {
    if (!deferredPrompt || isInstalling) return false;

    setIsInstalling(true);

    try {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      const accepted = outcome === 'accepted';

      setDeferredPrompt(null);
      setIsInstalled(accepted || getIsInstalled());
      return accepted;
    } catch {
      return false;
    } finally {
      setIsInstalling(false);
    }
  }, [deferredPrompt, isInstalling]);

  return createElement(PWAInstallContext.Provider, {
    value: {
      canInstall: Boolean(deferredPrompt) && !isInstalled,
      installApp,
      isInstalled,
      isInstalling,
    },
  }, children);
}

export default function usePWAInstall() {
  return usePWAInstallContext() || {
    canInstall: false,
    installApp: async () => false,
    isInstalled: false,
    isInstalling: false,
  };
}
