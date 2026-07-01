import { supabase } from './supabaseClient';

const TABLE_NAME = 'interviews';

function normalizeInterview(record) {
  return {
    id: record.id,
    candidate_name: record.candidate_name || 'Candidate',
    email: record.email || '',
    role: record.role || 'Unknown',
    experience: record.experience || 'Unknown',
    interview_date: record.interview_date || record.created_at || new Date().toISOString(),
    duration: record.duration || 0,
    overall_score: record.overall_score || 0,
    communication_score: record.communication_score || 0,
    technical_score: record.technical_score || 0,
    confidence_score: record.confidence_score || 0,
    eye_contact: record.eye_contact || 0,
    engagement: record.engagement || 0,
    smile_score: record.smile_score || 0,
    grammar_score: record.grammar_score || 0,
    fluency_score: record.fluency_score || 0,
    filler_words: record.filler_words || 0,
    status: record.status || 'completed',
    transcript: record.transcript || '',
    resume_summary: record.resume_summary || '',
    created_at: record.created_at || new Date().toISOString(),
  };
}

export async function saveInterview(payload) {
  if (!supabase) return { data: null, error: { message: 'Supabase not configured' } };

  const normalized = {
    candidate_name: payload.candidateName || 'Candidate',
    email: payload.email || '',
    role: payload.role || 'Unknown',
    experience: payload.experience || 'Unknown',
    interview_date: payload.interviewDate || new Date().toISOString(),
    duration: payload.duration || 0,
    overall_score: payload.overallScore || 0,
    communication_score: payload.communicationScore || 0,
    technical_score: payload.technicalScore || 0,
    confidence_score: payload.confidenceScore || 0,
    eye_contact: payload.eyeContact || 0,
    engagement: payload.engagement || 0,
    smile_score: payload.smileScore || 0,
    grammar_score: payload.grammarScore || 0,
    fluency_score: payload.fluencyScore || 0,
    filler_words: payload.fillerWords || 0,
    status: payload.status || 'completed',
    transcript: payload.transcript || '',
    resume_summary: payload.resumeSummary || '',
  };

  return supabase.from(TABLE_NAME).insert(normalized).select().single();
}

export async function getAllInterviews() {
  if (!supabase) return { data: [], error: { message: 'Supabase not configured' } };
  const { data, error } = await supabase.from(TABLE_NAME).select('*').order('created_at', { ascending: false });
  return { data: (data || []).map(normalizeInterview), error };
}

export async function getInterviewById(id) {
  if (!supabase) return { data: null, error: { message: 'Supabase not configured' } };
  const { data, error } = await supabase.from(TABLE_NAME).select('*').eq('id', id).single();
  return { data: data ? normalizeInterview(data) : null, error };
}

export async function getDashboardStats() {
  if (!supabase) return { data: null, error: { message: 'Supabase not configured' } };
  const { data, error } = await supabase.from(TABLE_NAME).select('*');
  if (error) return { data: null, error };

  const items = (data || []).map(normalizeInterview);
  const completed = items.filter((item) => item.status === 'completed').length;
  const total = items.length;
  const averageScore = total ? Math.round(items.reduce((sum, item) => sum + (item.overall_score || 0), 0) / total) : 0;
  const avgTechnical = total ? Math.round(items.reduce((sum, item) => sum + (item.technical_score || 0), 0) / total) : 0;
  const avgCommunication = total ? Math.round(items.reduce((sum, item) => sum + (item.communication_score || 0), 0) / total) : 0;
  const avgConfidence = total ? Math.round(items.reduce((sum, item) => sum + (item.confidence_score || 0), 0) / total) : 0;
  const avgEyeContact = total ? Math.round(items.reduce((sum, item) => sum + (item.eye_contact || 0), 0) / total) : 0;
  const avgEngagement = total ? Math.round(items.reduce((sum, item) => sum + (item.engagement || 0), 0) / total) : 0;
  const todayCount = items.filter((item) => {
    const createdAt = new Date(item.created_at || item.interview_date || '');
    const now = new Date();
    return createdAt.toDateString() === now.toDateString();
  }).length;

  return {
    data: {
      totalInterviews: total,
      completedInterviews: completed,
      averageScore,
      averageTechnicalScore: avgTechnical,
      averageCommunicationScore: avgCommunication,
      averageConfidence: avgConfidence,
      averageEyeContact: avgEyeContact,
      averageEngagement: avgEngagement,
      todayInterviews: todayCount,
      interviews: items,
    },
    error: null,
  };
}

export async function deleteInterview(id) {
  if (!supabase) return { error: { message: 'Supabase not configured' } };
  return supabase.from(TABLE_NAME).delete().eq('id', id);
}

export async function updateInterviewStatus(id, status) {
  if (!supabase) return { error: { message: 'Supabase not configured' } };
  return supabase.from(TABLE_NAME).update({ status }).eq('id', id);
}

export async function canAccessAdminRoute() {
  if (!supabase) return false;
  const { data } = await supabase.auth.getSession();
  const user = data?.session?.user;
  const role = user?.user_metadata?.role || user?.app_metadata?.role;
  return role === 'admin';
}
