import type { RoleKey } from '../lib/roles';

export interface AppUser {
  id: string;
  email: string;
  emailVerified: boolean;
  name?: string;
}

export interface Profile {
  id?: string;
  user_id?: string;
  full_name?: string;
  role?: string; // raw role value from DB
  district_id?: string | null;
  facility_id?: string | null;
  phone?: string | null;
  [k: string]: unknown;
}

export interface SessionUser extends AppUser {
  role: RoleKey;
  profile: Profile | null;
}

export interface UploadedFile {
  id?: string;
  name: string;
  bucket: string;
  object_key: string;
  url: string;
  size: number;
  mime_type: string;
  category: string; // excel | csv | pdf | docx | image | zip | other
  uploaded_by?: string;
  district_id?: string | null;
  status?: string; // uploaded | analyzing | analyzed | failed
  created_at?: string;
}

export interface AnalysisResult {
  summary: string;
  findings: string[];
  poor_indicators: { indicator: string; value?: string; note: string }[];
  best_indicators: { indicator: string; value?: string; note: string }[];
  recommendations: string[];
  action_plan: { action: string; owner?: string; timeframe?: string }[];
}

export interface AnalysisReport extends Partial<AnalysisResult> {
  id?: string;
  file_id?: string;
  file_name?: string;
  model?: string;
  raw?: string;
  created_by?: string;
  created_at?: string;
}

export interface MetricRow {
  id?: string;
  scope?: string; // state | district | programme | facility | anm
  indicator: string;
  value: number;
  period?: string; // e.g. 2025-Q1 or 2025-03
  district_id?: string | null;
  facility_id?: string | null;
  programme_id?: string | null;
  [k: string]: unknown;
}
