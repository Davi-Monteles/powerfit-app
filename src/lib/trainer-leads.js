import { supabase } from './supabaseClient';

const DEFAULT_SOURCE = 'perfil_publico';
const VALID_STATUSES = new Set(['novo', 'contatado', 'arquivado']);
const DEMO_LEADS_KEY = 'powerfit_demo_leads';

function isDemoModeEnabled() {
  return globalThis.localStorage?.getItem('powerfit_demo_mode') === 'enabled';
}

function getDemoLeads() {
  try {
    const leads = JSON.parse(globalThis.localStorage?.getItem(DEMO_LEADS_KEY) || '[]');
    return Array.isArray(leads) ? leads : [];
  } catch {
    return [];
  }
}

function setDemoLeads(leads) {
  globalThis.localStorage?.setItem(DEMO_LEADS_KEY, JSON.stringify(leads));
}

function normalizeLeadInput(input = {}) {
  return {
    name: String(input.name || '').trim(),
    objective: String(input.objective || '').trim(),
  };
}

export async function getTrainerLeads(trainerId) {
  if (isDemoModeEnabled()) {
    return getDemoLeads().filter(lead => lead.trainer_id === trainerId);
  }

  const { data, error } = await supabase
    .from('leads')
    .select('*')
    .eq('trainer_id', trainerId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function saveTrainerLead(input = {}, trainerId) {
  const lead = normalizeLeadInput(input);
  if (isDemoModeEnabled()) {
    const now = new Date().toISOString();
    const record = {
      id: globalThis.crypto?.randomUUID?.() || `demo-lead-${Date.now()}`,
      trainer_id: trainerId,
      name: lead.name,
      objective: lead.objective,
      source: DEFAULT_SOURCE,
      status: 'novo',
      created_at: now,
      updated_at: now,
    };
    setDemoLeads([record, ...getDemoLeads()]);
    return record;
  }

  const { data, error } = await supabase
    .from('leads')
    .insert({
      trainer_id: trainerId,
      name: lead.name,
      objective: lead.objective,
      source: DEFAULT_SOURCE,
      status: 'novo',
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateTrainerLeadStatus(leadId, status, trainerId) {
  if (!VALID_STATUSES.has(status)) throw new Error('Status invalido');

  if (isDemoModeEnabled()) {
    let updatedLead = null;
    const leads = getDemoLeads().map(lead => {
      if (lead.id !== leadId || lead.trainer_id !== trainerId) return lead;
      updatedLead = { ...lead, status, updated_at: new Date().toISOString() };
      return updatedLead;
    });
    if (!updatedLead) throw new Error('Lead nao encontrado');
    setDemoLeads(leads);
    return updatedLead;
  }

  const { data, error } = await supabase
    .from('leads')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', leadId)
    .eq('trainer_id', trainerId)
    .select()
    .single();

  if (error) throw error;
  return data;
}
