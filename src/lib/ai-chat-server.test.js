/* global process */

import assert from 'node:assert/strict';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import handler, { buildGroqMessages } from '../../api/ai/chat.js';

function listSourceFiles(dir) {
  return readdirSync(dir).flatMap((entry) => {
    const fullPath = join(dir, entry);
    if (statSync(fullPath).isDirectory()) return listSourceFiles(fullPath);
    return /\.(js|jsx|ts|tsx)$/.test(entry) ? [fullPath] : [];
  });
}

const forbiddenFrontendSecret = 'VITE_' + 'GROQ_API_KEY';
const filesWithFrontendGroqSecret = listSourceFiles(join(process.cwd(), 'src'))
  .filter((filePath) => readFileSync(filePath, 'utf8').includes(forbiddenFrontendSecret));

assert.deepEqual(filesWithFrontendGroqSecret, []);

function createResponse() {
  return {
    statusCode: 200,
    body: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.body = payload;
      return this;
    },
  };
}

const messages = buildGroqMessages({
  systemPrompt: 'Prompt do sistema',
  chatHistory: [
    { role: 'user', content: 'Mensagem anterior' },
    { role: 'assistant', content: 'Resposta anterior' },
    { role: 'system', content: 'ignorar' },
  ],
});

assert.equal(messages[0].role, 'system');
assert.match(messages[0].content, /Não forneça diagnóstico médico/);
assert.match(messages[0].content, /Contexto do aplicativo:\nPrompt do sistema/);
assert.deepEqual(messages.slice(1), [
  { role: 'user', content: 'Mensagem anterior' },
  { role: 'assistant', content: 'Resposta anterior' },
]);

const messagesWithExplicitUserMessage = buildGroqMessages({
  systemPrompt: 'Prompt do sistema',
  message: 'Mensagem atual',
  chatHistory: [{ role: 'assistant', content: 'Resposta anterior' }],
});

assert.deepEqual(messagesWithExplicitUserMessage.slice(1), [
  { role: 'assistant', content: 'Resposta anterior' },
  { role: 'user', content: 'Mensagem atual' },
]);

const messagesWithoutDuplicatedUserMessage = buildGroqMessages({
  systemPrompt: 'Prompt do sistema',
  message: 'Mensagem atual',
  chatHistory: [{ role: 'user', content: 'Mensagem atual' }],
});

assert.deepEqual(messagesWithoutDuplicatedUserMessage.slice(1), [
  { role: 'user', content: 'Mensagem atual' },
]);

const originalKey = process.env.GROQ_API_KEY;
const originalSupabaseUrl = process.env.SUPABASE_URL;
const originalSupabaseAnonKey = process.env.SUPABASE_ANON_KEY;
delete process.env.GROQ_API_KEY;

const missingKeyResponse = createResponse();
await handler({ method: 'POST', body: { systemPrompt: 'Prompt', chatHistory: [] } }, missingKeyResponse);
assert.equal(missingKeyResponse.statusCode, 503);
assert.equal(missingKeyResponse.body.ok, false);
assert.equal(missingKeyResponse.body.errorCode, 'AI_SERVER_NOT_CONFIGURED');

if (originalKey === undefined) delete process.env.GROQ_API_KEY;
else process.env.GROQ_API_KEY = originalKey;

const originalFetch = globalThis.fetch;
process.env.GROQ_API_KEY = 'server-secret';
process.env.SUPABASE_URL = 'https://powerfit-test.supabase.co';
process.env.SUPABASE_ANON_KEY = 'test-anon-key';
globalThis.fetch = async () => ({
  ok: true,
  async json() {
    return { id: 'authenticated-user-id' };
  },
});

const unauthenticatedResponse = createResponse();
await handler({ method: 'POST', body: { message: 'Oi' } }, unauthenticatedResponse);
assert.equal(unauthenticatedResponse.statusCode, 401);
assert.deepEqual(unauthenticatedResponse.body, { ok: false, errorCode: 'AUTH_REQUIRED' });

const originalConsoleError = console.error;
const originalConsoleWarn = console.warn;
const originalConsoleLog = console.log;
const consoleMessages = [];
console.error = (...args) => consoleMessages.push(args.join(' '));
console.warn = (...args) => consoleMessages.push(args.join(' '));
console.log = (...args) => consoleMessages.push(args.join(' '));

const invalidJsonResponse = createResponse();
let invalidJsonThrown = false;
try {
  await handler({
    method: 'POST',
    headers: { authorization: 'Bearer valid-test-token' },
    get body() {
      throw new Error('Invalid JSON');
    },
  }, invalidJsonResponse);
} catch {
  invalidJsonThrown = true;
}

assert.equal(invalidJsonThrown, false);
assert.equal(invalidJsonResponse.statusCode, 400);
assert.deepEqual(invalidJsonResponse.body, { ok: false, errorCode: 'INVALID_JSON' });
assert.equal(consoleMessages.some((message) => message.includes('server-secret')), false);

const invalidJsonStringResponse = createResponse();
await handler({ method: 'POST', headers: { authorization: 'Bearer valid-test-token' }, body: '{invalid-json' }, invalidJsonStringResponse);
assert.equal(invalidJsonStringResponse.statusCode, 400);
assert.deepEqual(invalidJsonStringResponse.body, { ok: false, errorCode: 'INVALID_JSON' });

console.error = originalConsoleError;
console.warn = originalConsoleWarn;
console.log = originalConsoleLog;

let upstreamRequest = null;
globalThis.fetch = async (url, options) => {
  if (url === 'https://powerfit-test.supabase.co/auth/v1/user') {
    return {
      ok: true,
      async json() {
        return { id: 'authenticated-user-id' };
      },
    };
  }
  upstreamRequest = { url, options };
  return {
    ok: true,
    async json() {
      return { choices: [{ message: { content: 'Resposta do servidor' } }] };
    },
  };
};

const successResponse = createResponse();
await handler({ method: 'POST', headers: { authorization: 'Bearer valid-test-token' }, body: { systemPrompt: 'Prompt', chatHistory: [{ role: 'user', content: 'Oi' }] } }, successResponse);

assert.equal(successResponse.statusCode, 200);
assert.equal(successResponse.body.ok, true);
assert.equal(successResponse.body.message, 'Resposta do servidor');
assert.equal(upstreamRequest.url, 'https://api.groq.com/openai/v1/chat/completions');
assert.equal(upstreamRequest.options.headers.Authorization, 'Bearer server-secret');

const validJsonStringResponse = createResponse();
await handler({ method: 'POST', headers: { authorization: 'Bearer valid-test-token' }, body: JSON.stringify({ systemPrompt: 'Prompt', message: 'Oi' }) }, validJsonStringResponse);
assert.equal(validJsonStringResponse.statusCode, 200);
assert.equal(validJsonStringResponse.body.ok, true);
assert.equal(validJsonStringResponse.body.message, 'Resposta do servidor');

globalThis.fetch = originalFetch;
if (originalKey === undefined) delete process.env.GROQ_API_KEY;
else process.env.GROQ_API_KEY = originalKey;
if (originalSupabaseUrl === undefined) delete process.env.SUPABASE_URL;
else process.env.SUPABASE_URL = originalSupabaseUrl;
if (originalSupabaseAnonKey === undefined) delete process.env.SUPABASE_ANON_KEY;
else process.env.SUPABASE_ANON_KEY = originalSupabaseAnonKey;
