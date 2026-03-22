export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  try {
    const { accessToken, title, price, email, successUrl } = req.body;

    if (!accessToken) {
      return res.status(400).json({ message: 'O Personal Trainer ainda não configurou o Token do Mercado Pago.' });
    }

    const preference = {
      items: [
        {
          title: title || 'Plano Premium PowerFit',
          quantity: 1,
          currency_id: 'BRL',
          unit_price: Number(price) || 24.90
        }
      ],
      payer: {
        email: email || 'aluno@exemplo.com'
      },
      back_urls: {
        success: successUrl || 'https://powerfit-app.vercel.app/aluno?payment=success',
        failure: successUrl ? successUrl.replace('success', 'failure') : 'https://powerfit-app.vercel.app/aluno?payment=failure',
        pending: successUrl ? successUrl.replace('success', 'pending') : 'https://powerfit-app.vercel.app/aluno?payment=pending'
      },
      auto_return: 'approved'
    };

    const response = await fetch('https://api.mercadopago.com/checkout/preferences', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(preference)
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Erro ao comunicar com Mercado Pago');
    }

    return res.status(200).json({ init_point: data.init_point });
  } catch (error) {
    return res.status(500).json({ message: error.message || 'Erro interno do servidor' });
  }
}
