import { DownloadCloud, Smartphone } from 'lucide-react';
import usePWAInstall from '../hooks/usePWAInstall';

export default function PwaInstallHint() {
  const { canInstall, installApp, isInstalled, isInstalling } = usePWAInstall();

  if (isInstalled || !canInstall) return null;

  return (
    <div className="pwa-install-hint" aria-label="Instalação do PowerFit">
      <Smartphone size={17} className="pwa-install-hint-icon" aria-hidden="true" />
      <div>
        <strong>Instale o PowerFit na tela inicial do celular</strong>
        <span>App instalável/PWA para abrir com experiência de aplicativo.</span>
      </div>
      <button type="button" onClick={installApp} disabled={isInstalling}>
        <DownloadCloud size={14} aria-hidden="true" />
        {isInstalling ? 'Abrindo...' : 'Instalar app'}
      </button>
      <PwaInstallHintStyles />
    </div>
  );
}

function PwaInstallHintStyles() {
  return (
    <style>{`
      .pwa-install-hint {
        display: grid;
        grid-template-columns: auto 1fr auto;
        align-items: center;
        gap: 10px;
        margin: 0 0 16px;
        padding: 10px 12px;
        border: 1px solid rgba(255,107,53,0.22);
        border-radius: var(--radius-md);
        background: linear-gradient(135deg, rgba(255,107,53,0.09), rgba(59,130,246,0.06));
      }

      .pwa-install-hint-icon {
        color: var(--primary);
        flex-shrink: 0;
      }

      .pwa-install-hint strong {
        display: block;
        color: var(--text-primary);
        font-size: 0.78rem;
        line-height: 1.25;
      }

      .pwa-install-hint span {
        display: block;
        color: var(--text-muted);
        font-size: 0.72rem;
        line-height: 1.3;
        margin-top: 2px;
      }

      .pwa-install-hint button {
        display: inline-flex;
        align-items: center;
        gap: 5px;
        border: 0;
        border-radius: 8px;
        padding: 7px 9px;
        background: var(--gradient-primary);
        color: white;
        font: inherit;
        font-size: 0.72rem;
        font-weight: 700;
        cursor: pointer;
        white-space: nowrap;
      }

      .pwa-install-hint button:disabled {
        opacity: 0.7;
        cursor: wait;
      }

      @media (max-width: 420px) {
        .pwa-install-hint {
          grid-template-columns: auto 1fr;
        }

        .pwa-install-hint button {
          grid-column: 1 / -1;
          justify-content: center;
          width: 100%;
        }
      }
    `}</style>
  );
}
