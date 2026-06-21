import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const landingSource = readFileSync(resolve(__dirname, '../pages/Landing.jsx'), 'utf8');
const mobileSource = landingSource.slice(landingSource.indexOf('@media (max-width: 620px)'));

function cssRule(source, selector) {
  const escapedSelector = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const match = source.match(new RegExp(`${escapedSelector}\\s*\\{([^}]*)\\}`));
  assert.ok(match, `${selector} rule must exist`);
  return match[1];
}

const mobileHeroImageRule = cssRule(mobileSource, '.pf-hero-image');
const mobileHeroImageImgRule = cssRule(mobileSource, '.pf-hero-image img');

assert.match(
  landingSource,
  /@media \(max-width: 620px\)[\s\S]*\.pf-hero\s*\{[\s\S]*background:/,
  'mobile landing must use a CSS fallback hero background',
);

assert.doesNotMatch(
  mobileHeroImageRule,
  /display:\s*none;/,
  'mobile landing must render the hero image instead of hiding it',
);

assert.match(
  mobileHeroImageRule,
  /overflow:\s*hidden;/,
  'mobile hero image wrapper must clip image overflow',
);

assert.match(
  mobileHeroImageImgRule,
  /height:\s*100%;[\s\S]*object-fit:\s*cover;/,
  'mobile hero image must use bounded cover sizing',
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
