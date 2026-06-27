import { supabase } from './supabaseClient';

const DEFAULT_SOURCE = 'perfil_publico';
const VALID_STATUSES = new Set(['novo', 'contatado', 'arquivado']);

function normalizeLeadInput(input = {}) {
  return {
    name: String(input.name || '').trim(),
    objective: String(input.objective || '').trim(),
  };
}

export async function getTrainerLeads(trainerId) {
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
