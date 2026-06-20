import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const landingSource = readFileSync(resolve(__dirname, '../pages/Landing.jsx'), 'utf8');

assert.match(
  landingSource,
  /@media \(max-width: 620px\)[\s\S]*\.pf-hero\s*\{[\s\S]*background:/,
  'mobile landing must use a CSS fallback hero background',
);

assert.match(
  landingSource,
  /@media \(max-width: 620px\)[\s\S]*\.pf-hero-image\s*\{[\s\S]*display:\s*none;/,
  'mobile landing must not render the heavy filtered hero image',
);

assert.match(
  landingSource,
  /@media \(max-width: 620px\)[\s\S]*\.pf-status-row\s*\{[\s\S]*display:\s*grid;/,
  'mobile status chips must use explicit vertical grid layout',
);

assert.match(
  landingSource,
  /@media \(max-width: 620px\)[\s\S]*\.pf-status-row span\s*\{[\s\S]*white-space:\s*normal;/,
  'mobile status chips must allow normal wrapping without overlap',
);

assert.match(
  landingSource,
  /@media \(max-width: 620px\)[\s\S]*\.pf-status-row span\s*\{[\s\S]*height:\s*auto;/,
  'mobile status chips must grow vertically instead of clipping wrapped text',
);

assert.match(
  landingSource,
  /@media \(max-width: 620px\)[\s\S]*\.pf-status-row span\s*\{[\s\S]*line-height:\s*1\.35;/,
  'mobile status chips must keep wrapped lines readable',
);
