const TRAINER_LEADS_KEY = 'powerfit_trainer_leads';
const DEFAULT_SOURCE = 'perfil_publico_marcio';
const VALID_STATUSES = new Set(['novo', 'contatado', 'arquivado']);

function canUseLocalStorage() {
  return typeof localStorage !== 'undefined';
}

function readLeads() {
  if (!canUseLocalStorage()) return [];

  try {
    const parsed = JSON.parse(localStorage.getItem(TRAINER_LEADS_KEY) || '[]');
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeLeads(leads) {
  if (!canUseLocalStorage()) return;
  localStorage.setItem(TRAINER_LEADS_KEY, JSON.stringify(leads));
}

function createLeadId() {
  if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID();
  return `lead-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function getTrainerLeads() {
  return readLeads();
}

export function saveTrainerLead(input = {}, options = {}) {
  const lead = {
    id: options.id?.() || createLeadId(),
    name: String(input.name || '').trim(),
    objective: String(input.objective || '').trim(),
    source: DEFAULT_SOURCE,
    date: options.now?.() || new Date().toISOString(),
    status: 'novo',
  };

  const leads = [lead, ...readLeads()];
  writeLeads(leads);
  return lead;
}

export function updateTrainerLeadStatus(id, status) {
  if (!VALID_STATUSES.has(status)) throw new Error('Status invalido');

  let updatedLead = null;
  const leads = readLeads().map(lead => {
    if (lead.id !== id) return lead;
    updatedLead = { ...lead, status };
    return updatedLead;
  });

  if (updatedLead) writeLeads(leads);
  return updatedLead;
}

export { TRAINER_LEADS_KEY };
