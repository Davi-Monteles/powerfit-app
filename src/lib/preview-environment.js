const PREVIEW_NOTICE = 'Ambiente demo/preview - nao use dados reais.';

export function getPreviewDemoNotice(hostname = globalThis.location?.hostname || '') {
  const normalizedHost = String(hostname).toLowerCase();
  return normalizedHost.endsWith('.vercel.app') ? PREVIEW_NOTICE : '';
}
