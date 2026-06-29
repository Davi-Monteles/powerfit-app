import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const landingSource = readFileSync(resolve(__dirname, '../pages/Landing.jsx'), 'utf8');
const publicInfoSource = readFileSync(resolve(__dirname, '../pages/PublicInfoPages.jsx'), 'utf8');
const appSource = readFileSync(resolve(__dirname, '../App.jsx'), 'utf8');
const dashboardSource = readFileSync(resolve(__dirname, '../pages/Dashboard.jsx'), 'utf8');
const personalMarcioSource = readFileSync(resolve(__dirname, '../pages/PersonalMarcio.jsx'), 'utf8');

const expectedFooterContracts = [
  "{ label: 'Produto', href: '#produto' }",
  "{ label: 'Recursos', href: '#recursos' }",
  "{ label: 'Para Personal', href: '#personal' }",
  "{ label: 'Para Aluno', href: '#alunos' }",
  "{ label: 'Atualizações', to: '/atualizacoes' }",
  "{ label: 'Sobre nós', to: '/sobre' }",
  "{ label: 'Contato', href: 'https://wa.me/5598988666810', external: true }",
  "{ label: 'Termos', to: '/termos' }",
  "{ label: 'Privacidade', to: '/privacidade' }",
  "{ label: 'Segurança', to: '/seguranca' }",
];

for (const contract of expectedFooterContracts) {
  assert.ok(landingSource.includes(contract), `Footer contract missing: ${contract}`);
}

assert.ok(!landingSource.includes("label: 'Blog'"), 'Blog footer link must stay hidden');

for (const id of ['produto', 'recursos', 'personal', 'alunos']) {
  assert.ok(landingSource.includes(`id="${id}"`), `Landing anchor missing: #${id}`);
}

assert.ok(
  landingSource.includes('function handleSectionLinkClick') && landingSource.includes('scrollIntoView'),
  'Landing hash links must use explicit scroll handling',
);

assert.ok(
  landingSource.includes('to="/personal/marcio"') && landingSource.includes('Conhecer personal'),
  'Landing must expose a visible link to /personal/marcio',
);

assert.ok(
  dashboardSource.includes("path: '/personal/marcio'") && dashboardSource.includes('Compartilhar minha página'),
  'Dashboard quick actions must expose the public personal page',
);

assert.ok(
  personalMarcioSource.includes('marcio.thaylson@gmail.com') && personalMarcioSource.includes('Márcio Carneiro'),
  'Public Marcio page must render real Marcio data for the logged-in real account',
);

for (const route of ['/sobre', '/atualizacoes', '/termos', '/privacidade', '/seguranca']) {
  assert.ok(appSource.includes(`path="${route}"`), `Public route missing: ${route}`);
}

const expectedUpdates = [
  'Captura automática de interessados na página pública do personal',
  'IA gera rascunho de treino personalizado a partir da anamnese do aluno',
  'Publicação de treino do personal para o aluno',
  'Aluno marca exercício e treino como concluído; personal acompanha adesão',
  'Vídeo do YouTube e imagem por exercício',
  'Exclusão segura de treinos gerados por IA',
  'Correções de performance e visual no mobile',
];

for (const item of expectedUpdates) {
  assert.ok(publicInfoSource.includes(`'${item}'`), `Changelog item missing or changed: ${item}`);
}

assert.ok(
  publicInfoSource.includes('PowerFit é uma ferramenta criada para personal trainers acompanharem alunos e treinos de forma mais prática.'),
  'About page must keep short honest draft copy',
);

assert.ok(
  publicInfoSource.includes('Rascunho-base para revisão. Este texto não substitui revisão jurídica.'),
  'Legal pages must show draft-base legal review note',
);

for (const title of ['Termos de uso', 'Privacidade', 'Segurança']) {
  assert.ok(publicInfoSource.includes(`title="${title}"`), `${title} page missing`);
}

assert.match(publicInfoSource, /Dados coletados|dados coletados/i, 'Legal copy must mention collected data');
assert.match(publicInfoSource, /Supabase/, 'Legal copy must mention Supabase backend');
assert.match(publicInfoSource, /fase piloto/, 'Legal copy must mention pilot phase');
assert.match(publicInfoSource, /WhatsApp informado no site/, 'Legal copy must mention contact channel');
