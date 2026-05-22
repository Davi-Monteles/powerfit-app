/* global process */

const GROQ_MODEL = 'llama-3.3-70b-versatile';
const GROQ_CHAT_URL = 'https://api.groq.com/openai/v1/chat/completions';

function getBody(req) {
  let body;
  try {
    body = req?.body;
  } catch {
    return { invalidJson: true };
  }

  if (!body) return { value: {} };
  if (typeof body === 'string') {
    try {
      return { value: JSON.parse(body) };
    } catch {
      return { invalidJson: true };
    }
  }
  return { value: body };
}

function safeText(value, maxLength) {
  return String(value || '').trim().slice(0, maxLength);
}

export function buildGroqMessages({ systemPrompt = '', message = '', chatHistory = [] } = {}) {
  const historyMessages = chatHistory
    .filter((historyMessage) => historyMessage?.role === 'user' || historyMessage?.role === 'assistant')
    .map((historyMessage) => ({
      role: historyMessage.role,
      content: safeText(historyMessage.content, 2000),
    }))
    .filter((historyMessage) => historyMessage.content);

  const currentUserMessage = safeText(message, 2000);
  const lastHistoryMessage = historyMessages[historyMessages.length - 1];
  if (currentUserMessage && !(lastHistoryMessage?.role === 'user' && lastHistoryMessage.content === currentUserMessage)) {
    historyMessages.push({ role: 'user', content: currentUserMessage });
  }

  const messages = [
    { role: 'system', content: safeText(systemPrompt, 12000) },
    ...historyMessages,
  ];

  return messages.filter((message) => message.content);
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, errorCode: 'METHOD_NOT_ALLOWED' });
  }

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    return res.status(503).json({ ok: false, errorCode: 'AI_SERVER_NOT_CONFIGURED' });
  }

  const parsedBody = getBody(req);
  if (parsedBody.invalidJson) {
    return res.status(400).json({ ok: false, errorCode: 'INVALID_JSON' });
  }

  const body = parsedBody.value;
  const messages = buildGroqMessages(body);

  if (messages.length === 0) {
    return res.status(400).json({ ok: false, errorCode: 'AI_INVALID_REQUEST' });
  }

  try {
    const response = await fetch(GROQ_CHAT_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: GROQ_MODEL,
        messages,
        temperature: 0.7,
        max_tokens: 1024,
      }),
    });

    if (!response.ok) {
      return res.status(502).json({ ok: false, errorCode: 'AI_PROVIDER_UNAVAILABLE' });
    }

    const data = await response.json();
    const message = data?.choices?.[0]?.message?.content;

    if (!message) {
      return res.status(502).json({ ok: false, errorCode: 'AI_EMPTY_RESPONSE' });
    }

    return res.status(200).json({ ok: true, type: 'chat', message });
  } catch {
    return res.status(502).json({ ok: false, errorCode: 'AI_PROVIDER_UNAVAILABLE' });
  }
}
