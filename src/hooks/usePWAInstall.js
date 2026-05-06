import { useCallback, useEffect, useState } from 'react';

export default function usePWAInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isInstalled, setIsInstalled] = useState(() =>
    window.matchMedia?.('(display-mode: standalone)').matches ||
    window.navigator.standalone === true
  );
  const [isInstalling, setIsInstalling] = useState(false);

  useEffect(() => {
    const handleBeforeInstallPrompt = (event) => {
      event.preventDefault();
      setDeferredPrompt(event);
      setIsInstalled(false);
    };

    const handleAppInstalled = () => {
      setDeferredPrompt(null);
      setIsInstalled(true);
      setIsInstalling(false);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const installApp = useCallback(async () => {
    if (!deferredPrompt || isInstalling) return false;

    setIsInstalling(true);
    deferredPrompt.prompt();

    const { outcome } = await deferredPrompt.userChoice;
    const accepted = outcome === 'accepted';

    setDeferredPrompt(null);
    setIsInstalling(false);
    setIsInstalled(accepted);

    return accepted;
  }, [deferredPrompt, isInstalling]);

  return {
    canInstall: Boolean(deferredPrompt) && !isInstalled,
    installApp,
    isInstalled,
    isInstalling,
  };
}
