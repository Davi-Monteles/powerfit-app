import { DownloadCloud, Smartphone } from 'lucide-react';
import usePWAInstall from '../hooks/usePWAInstall';

export default function PwaInstallHint() {
  const { canInstall, installApp, isInstalled, isInstalling } = usePWAInstall();

  if (isInstalled) return null;

  return (
    <div className="pwa-install-hint" aria-label="Instalação do PowerFit">
      <Smartphone size={17} className="pwa-install-hint-icon" aria-hidden="true" />
      <div>
        <strong>Instale o PowerFit na tela inicial do celular</strong>
        <span>App instalável/PWA para abrir com experiência de aplicativo.</span>
      </div>
      {canInstall && (
        <button type="button" onClick={installApp} disabled={isInstalling}>
          <DownloadCloud size={14} aria-hidden="true" />
          {isInstalling ? 'Abrindo...' : 'Instalar'}
        </button>
      )}
    </div>
  );
}
