import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const TARGETS = ['src', 'public', 'index.html'];
const ALLOWED_EXTENSIONS = new Set(['.js', '.jsx', '.css', '.html']);
const SUSPICIOUS_PATTERN = /Ã|Â|â(?:€|„|€¦|€œ|€™|€”|€“)|ð[\u0080-\u00FF]|ï¿½|�/;
const BADNESS_PATTERN = /Ã|Â|â(?:€|„|€¦|€œ|€™|€”|€“)|ð[\u0080-\u00FF]|ï¿½|�/g;

const cp1252ReverseMap = new Map([
  ['€', 0x80],
  ['‚', 0x82],
  ['ƒ', 0x83],
  ['„', 0x84],
  ['…', 0x85],
  ['†', 0x86],
  ['‡', 0x87],
  ['ˆ', 0x88],
  ['‰', 0x89],
  ['Š', 0x8A],
  ['‹', 0x8B],
  ['Œ', 0x8C],
  ['Ž', 0x8E],
  ['‘', 0x91],
  ['’', 0x92],
  ['“', 0x93],
  ['”', 0x94],
  ['•', 0x95],
  ['–', 0x96],
  ['—', 0x97],
  ['˜', 0x98],
  ['™', 0x99],
  ['š', 0x9A],
  ['›', 0x9B],
  ['œ', 0x9C],
  ['ž', 0x9E],
  ['Ÿ', 0x9F],
]);

const manualFixes = new Map([
  ['ï¿½ï¿½ Bíceps', '💪 Bíceps'],
  ['�� Bíceps', '💪 Bíceps'],
  ['VIS�O', 'VISÃO'],
]);

function collectFiles(targetPath) {
  const absolutePath = path.resolve(ROOT, targetPath);
  if (!fs.existsSync(absolutePath)) return [];

  const stat = fs.statSync(absolutePath);
  if (stat.isFile()) {
    return ALLOWED_EXTENSIONS.has(path.extname(absolutePath)) ? [absolutePath] : [];
  }

  return fs.readdirSync(absolutePath, { withFileTypes: true }).flatMap((entry) => {
    const entryPath = path.join(absolutePath, entry.name);
    if (entry.isDirectory()) return collectFiles(entryPath);
    return ALLOWED_EXTENSIONS.has(path.extname(entry.name)) ? [entryPath] : [];
  });
}

function scoreBadness(text) {
  return (text.match(BADNESS_PATTERN) || []).length;
}

function encodeAsCp1252Bytes(text) {
  const bytes = [];

  for (const char of text) {
    if (cp1252ReverseMap.has(char)) {
      bytes.push(cp1252ReverseMap.get(char));
      continue;
    }

    const codePoint = char.codePointAt(0);
    if (codePoint <= 0xFF) {
      bytes.push(codePoint);
      continue;
    }

    bytes.push(...Buffer.from(char));
  }

  return Buffer.from(bytes);
}

function repairText(text) {
  let current = text;

  for (let pass = 0; pass < 3; pass += 1) {
    if (!SUSPICIOUS_PATTERN.test(current)) break;

    const repaired = encodeAsCp1252Bytes(current).toString('utf8');
    if (repaired === current) break;
    if (scoreBadness(repaired) > scoreBadness(current)) break;

    current = repaired;
  }

  for (const [from, to] of manualFixes.entries()) {
    current = current.replaceAll(from, to);
  }

  return current;
}

function readTextFile(filePath) {
  const raw = fs.readFileSync(filePath);

  if (raw.length >= 2 && raw[0] === 0xFF && raw[1] === 0xFE) {
    return { text: raw.slice(2).toString('utf16le'), sourceEncoding: 'utf16le' };
  }

  if (raw.length >= 2 && raw[0] === 0xFE && raw[1] === 0xFF) {
    const swapped = Buffer.allocUnsafe(raw.length - 2);
    for (let i = 2; i < raw.length; i += 2) {
      swapped[i - 2] = raw[i + 1];
      swapped[i - 1] = raw[i];
    }
    return { text: swapped.toString('utf16le'), sourceEncoding: 'utf16be' };
  }

  return { text: raw.toString('utf8'), sourceEncoding: 'utf8' };
}

function processFile(filePath) {
  const { text: original, sourceEncoding } = readTextFile(filePath);
  const eol = original.includes('\r\n') ? '\r\n' : '\n';
  const repaired = original
    .split(/\r?\n/)
    .map((line) => repairText(line))
    .join(eol);

  if (repaired === original && sourceEncoding === 'utf8') return null;

  fs.writeFileSync(filePath, repaired, 'utf8');
  return {
    filePath,
    before: scoreBadness(original),
    after: scoreBadness(repaired),
    sourceEncoding,
  };
}

const files = TARGETS.flatMap((target) => collectFiles(target));
const updates = files.map(processFile).filter(Boolean);

console.log(`Scanned ${files.length} files.`);

if (updates.length === 0) {
  console.log('No encoding fixes were needed.');
  process.exit(0);
}

console.log(`Updated ${updates.length} files:`);
for (const update of updates) {
  console.log(`- ${path.relative(ROOT, update.filePath)} [${update.sourceEncoding}] (${update.before} -> ${update.after})`);
}
