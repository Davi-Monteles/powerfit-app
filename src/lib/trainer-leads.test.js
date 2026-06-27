import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const AsyncFunction = Object.getPrototypeOf(async function () {}).constructor;

const trainerLeadsSource = readFileSync(new URL('./trainer-leads.js', import.meta.url), 'utf8')
  .replace("import { supabase } from './supabaseClient';", '')
  .replaceAll('export ', '');

const loadTrainerLeads = new AsyncFunction(
  'supabase',
  `${trainerLeadsSource}
return { getTrainerLeads, saveTrainerLead, updateTrainerLeadStatus };`
);

function createSupabaseMock(responses) {
  const calls = [];

  function nextResponse() {
    if (responses.length === 0) return { data: null, error: null };
    return responses.shift();
  }

  function createBuilder(table) {
    const builder = {
      insert(payload) {
        calls.push({ method: 'insert', table, payload });
        return builder;
      },
      select(columns = '*') {
        calls.push({ method: 'select', table, columns });
        return builder;
      },
      single() {
        calls.push({ method: 'single', table });
        return Promise.resolve(nextResponse());
      },
      eq(column, value) {
        calls.push({ method: 'eq', table, column, value });
        return builder;
      },
      order(column, options) {
        calls.push({ method: 'order', table, column, options });
        return Promise.resolve(nextResponse());
      },
      update(payload) {
        calls.push({ method: 'update', table, payload });
        return builder;
      },
    };

    return builder;
  }

  return {
    calls,
    supabase: {
      from(table) {
        calls.push({ method: 'from', table });
        return createBuilder(table);
      },
    },
  };
}

const trainerId = '2bc16827-bee6-4b71-b9aa-11cfa46db189';
const savedLead = {
  id: 'lead-1',
  trainer_id: trainerId,
  name: 'Ana',
  objective: 'Hipertrofia',
  source: 'perfil_publico',
  status: 'novo',
  created_at: '2026-06-17T10:00:00.000Z',
  updated_at: '2026-06-17T10:00:00.000Z',
};

{
  const { calls, supabase } = createSupabaseMock([{ data: savedLead, error: null }]);
  const { saveTrainerLead } = await loadTrainerLeads(supabase);

  const result = await saveTrainerLead({ name: '  Ana  ', objective: '  Hipertrofia  ' }, trainerId);

  assert.deepEqual(result, savedLead);
  assert.deepEqual(calls, [
    { method: 'from', table: 'leads' },
    {
      method: 'insert',
      table: 'leads',
      payload: {
        trainer_id: trainerId,
        name: 'Ana',
        objective: 'Hipertrofia',
        source: 'perfil_publico',
        status: 'novo',
      },
    },
    { method: 'select', table: 'leads', columns: '*' },
    { method: 'single', table: 'leads' },
  ]);
}

{
  const { calls, supabase } = createSupabaseMock([{ data: [savedLead], error: null }]);
  const { getTrainerLeads } = await loadTrainerLeads(supabase);

  assert.deepEqual(await getTrainerLeads(trainerId), [savedLead]);
  assert.deepEqual(calls, [
    { method: 'from', table: 'leads' },
    { method: 'select', table: 'leads', columns: '*' },
    { method: 'eq', table: 'leads', column: 'trainer_id', value: trainerId },
    { method: 'order', table: 'leads', column: 'created_at', options: { ascending: false } },
  ]);
}

{
  const updatedLead = { ...savedLead, status: 'contatado', updated_at: '2026-06-17T11:00:00.000Z' };
  const { calls, supabase } = createSupabaseMock([{ data: updatedLead, error: null }]);
  const { updateTrainerLeadStatus } = await loadTrainerLeads(supabase);

  const result = await updateTrainerLeadStatus('lead-1', 'contatado', trainerId);

  assert.deepEqual(result, updatedLead);
  assert.deepEqual(calls.slice(0, 7), [
    { method: 'from', table: 'leads' },
    { method: 'update', table: 'leads', payload: { status: 'contatado', updated_at: calls[1].payload.updated_at } },
    { method: 'eq', table: 'leads', column: 'id', value: 'lead-1' },
    { method: 'eq', table: 'leads', column: 'trainer_id', value: trainerId },
    { method: 'select', table: 'leads', columns: '*' },
    { method: 'single', table: 'leads' },
  ]);
  assert.match(calls[1].payload.updated_at, /^\d{4}-\d{2}-\d{2}T/);
}

{
  const { supabase } = createSupabaseMock([{ data: null, error: new Error('network') }]);
  const { saveTrainerLead, updateTrainerLeadStatus } = await loadTrainerLeads(supabase);

  await assert.rejects(() => saveTrainerLead({ name: 'Ana' }, trainerId), /network/);
  await assert.rejects(() => updateTrainerLeadStatus('lead-1', 'vendido', trainerId), /Status invalido/);
}
