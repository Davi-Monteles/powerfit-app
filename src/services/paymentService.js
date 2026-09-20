// PowerFit - Mercado Pago Payment Service
// Payments are intentionally disabled in the frontend until the server flow is enabled.

/**
 * Returns the disabled-payment fallback while Mercado Pago is not enabled.
 * @returns {Promise<{ init_point: string, id: string }>}
 */
export async function createMercadoPagoPreference() {
  throw new Error('Pagamentos ainda não estão habilitados neste piloto.');
}
