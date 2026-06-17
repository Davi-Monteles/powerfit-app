import assert from 'node:assert/strict';
import {
  getTrainerLeads,
  saveTrainerLead,
  updateTrainerLeadStatus,
} from './trainer-leads.js';

const storage = new Map();

globalThis.localStorage = {
  getItem: key => storage.get(key) ?? null,
  setItem: (key, value) => storage.set(key, String(value)),
  removeItem: key => storage.delete(key),
  clear: () => storage.clear(),
};

localStorage.clear();

assert.deepEqual(getTrainerLeads(), []);

const saved = saveTrainerLead(
  { name: '  Ana  ', objective: '  Hipertrofia  ' },
  { now: () => '2026-06-17T10:00:00.000Z', id: () => 'lead-1' },
);

assert.deepEqual(saved, {
  id: 'lead-1',
  name: 'Ana',
  objective: 'Hipertrofia',
  source: 'perfil_publico_marcio',
  date: '2026-06-17T10:00:00.000Z',
  status: 'novo',
});
assert.deepEqual(getTrainerLeads(), [saved]);

const optionalFields = saveTrainerLead({}, { now: () => '2026-06-17T11:00:00.000Z', id: () => 'lead-2' });
assert.equal(optionalFields.name, '');
assert.equal(optionalFields.objective, '');
assert.equal(optionalFields.source, 'perfil_publico_marcio');
assert.equal(optionalFields.status, 'novo');
assert.equal(getTrainerLeads().length, 2);

const updated = updateTrainerLeadStatus('lead-1', 'contatado');
assert.equal(updated.status, 'contatado');
assert.equal(getTrainerLeads().find(lead => lead.id === 'lead-1').status, 'contatado');

assert.throws(() => updateTrainerLeadStatus('lead-1', 'vendido'), /Status invalido/);
assert.equal(updateTrainerLeadStatus('missing', 'arquivado'), null);
