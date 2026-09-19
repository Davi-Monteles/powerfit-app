export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, errorCode: 'METHOD_NOT_ALLOWED' });
  }

  return res.status(503).json({
    ok: false,
    errorCode: 'PAYMENTS_DISABLED',
    message: 'Pagamentos ainda não estão habilitados neste piloto.',
  });
}
