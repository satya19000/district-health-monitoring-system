import { insforge, DEFAULT_ROLE } from '../lib/insforge';
import type { Profile, UploadedFile, AnalysisReport, MetricRow } from '../types';

/**
 * Thin helpers over the InsForge database. Table and column names are kept in
 * one place so you can align them with your exact schema in one edit.
 */
export const TABLES = {
  roles: 'roles',
  profiles: 'users_profile',
  districts: 'districts',
  mandals: 'mandals',
  facilities: 'facilities',
  programmes: 'programmes',
  uploads: 'uploaded_files',
  reports: 'ai_analysis_reports',
  metrics: 'dashboard_metrics',
} as const;

/* ----------------------------- Profiles ----------------------------- */

export async function fetchProfile(userId: string): Promise<Profile | null> {
  const { data, error } = await insforge.database
    .from(TABLES.profiles)
    .select('*')
    .eq('user_id', userId)
    .limit(1);
  if (error) { console.warn('fetchProfile', error.message); return null; }
  return (Array.isArray(data) && data[0]) ? (data[0] as Profile) : null;
}

/** Create a profile row on first login if one does not yet exist. */
export async function ensureProfile(
  userId: string,
  opts: { full_name?: string; role?: string }
): Promise<Profile | null> {
  const existing = await fetchProfile(userId);
  if (existing) return existing;
  const payload: Profile = {
    user_id: userId,
    full_name: opts.full_name ?? '',
    role: opts.role ?? DEFAULT_ROLE,
  };
  const { data, error } = await insforge.database.from(TABLES.profiles).insert([payload]).select();
  if (error) { console.warn('ensureProfile', error.message); return payload; }
  return (Array.isArray(data) && data[0]) ? (data[0] as Profile) : payload;
}

export async function updateProfileRole(userId: string, role: string) {
  return insforge.database.from(TABLES.profiles).update({ role }).eq('user_id', userId);
}

export async function listProfiles(): Promise<Profile[]> {
  const { data, error } = await insforge.database.from(TABLES.profiles).select('*').limit(500);
  if (error) { console.warn('listProfiles', error.message); return []; }
  return (data as Profile[]) ?? [];
}

/* ----------------------------- Uploads ----------------------------- */

export async function recordUpload(file: UploadedFile): Promise<UploadedFile | null> {
  const { data, error } = await insforge.database.from(TABLES.uploads).insert([file]).select();
  if (error) { console.warn('recordUpload', error.message); return null; }
  return (Array.isArray(data) && data[0]) ? (data[0] as UploadedFile) : null;
}

export async function listUploads(limit = 100): Promise<UploadedFile[]> {
  const { data, error } = await insforge.database
    .from(TABLES.uploads).select('*').order('created_at', { ascending: false }).limit(limit);
  if (error) { console.warn('listUploads', error.message); return []; }
  return (data as UploadedFile[]) ?? [];
}

export async function setUploadStatus(id: string, status: string) {
  return insforge.database.from(TABLES.uploads).update({ status }).eq('id', id);
}

/* ----------------------------- Reports ----------------------------- */

export async function saveReport(report: AnalysisReport): Promise<AnalysisReport | null> {
  const payload = {
    file_id: report.file_id ?? null,
    file_name: report.file_name ?? null,
    model: report.model ?? null,
    summary: report.summary ?? '',
    findings: report.findings ?? [],
    poor_indicators: report.poor_indicators ?? [],
    best_indicators: report.best_indicators ?? [],
    recommendations: report.recommendations ?? [],
    action_plan: report.action_plan ?? [],
    raw: report.raw ?? null,
    created_by: report.created_by ?? null,
  };
  const { data, error } = await insforge.database.from(TABLES.reports).insert([payload]).select();
  if (error) { console.warn('saveReport', error.message); return null; }
  return (Array.isArray(data) && data[0]) ? (data[0] as AnalysisReport) : null;
}

export async function listReports(limit = 100): Promise<AnalysisReport[]> {
  const { data, error } = await insforge.database
    .from(TABLES.reports).select('*').order('created_at', { ascending: false }).limit(limit);
  if (error) { console.warn('listReports', error.message); return []; }
  return (data as AnalysisReport[]) ?? [];
}

/* ----------------------------- Metrics ----------------------------- */

export async function fetchMetrics(scope?: string): Promise<MetricRow[]> {
  let q = insforge.database.from(TABLES.metrics).select('*').limit(1000);
  if (scope) q = q.eq('scope', scope);
  const { data, error } = await q;
  if (error) { console.warn('fetchMetrics', error.message); return []; }
  return (data as MetricRow[]) ?? [];
}

/* ----------------------------- Reference data ----------------------------- */

export async function listDistricts(): Promise<any[]> {
  const { data, error } = await insforge.database.from(TABLES.districts).select('*').limit(500);
  if (error) { console.warn('listDistricts', error.message); return []; }
  return data ?? [];
}
