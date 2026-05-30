/**
 * Role-Based Access Control.
 *
 * The six roles map to the `roles` table in InsForge. We key everything off a
 * stable string `key` (stored on the user's profile) rather than a numeric id,
 * so the frontend stays decoupled from row ids. Adjust ROLE_KEYS to match the
 * exact values stored in your `roles` table if they differ.
 */

export type RoleKey =
  | 'STATE_ADMIN'
  | 'DISTRICT_ADMIN'
  | 'PROGRAMME_OFFICER'
  | 'MEDICAL_OFFICER'
  | 'ANM'
  | 'ASHA';

export interface RoleDef {
  key: RoleKey;
  label: string;
  /** Higher = more privileged. Used for "at least this level" checks. */
  level: number;
  description: string;
  /** Dashboards this role lands on / can access. */
  dashboards: DashboardScope[];
}

export type DashboardScope = 'state' | 'district' | 'programme' | 'facility' | 'anm';

export const ROLES: Record<RoleKey, RoleDef> = {
  STATE_ADMIN: {
    key: 'STATE_ADMIN',
    label: 'State Admin',
    level: 60,
    description: 'Full statewide oversight, user & role management.',
    dashboards: ['state', 'district', 'programme', 'facility', 'anm'],
  },
  DISTRICT_ADMIN: {
    key: 'DISTRICT_ADMIN',
    label: 'District Admin',
    level: 50,
    description: 'Manages all programmes and facilities within a district.',
    dashboards: ['district', 'programme', 'facility', 'anm'],
  },
  PROGRAMME_OFFICER: {
    key: 'PROGRAMME_OFFICER',
    label: 'Programme Officer',
    level: 40,
    description: 'Owns one or more health programmes across facilities.',
    dashboards: ['programme', 'facility', 'anm'],
  },
  MEDICAL_OFFICER: {
    key: 'MEDICAL_OFFICER',
    label: 'Medical Officer',
    level: 30,
    description: 'Responsible for a facility (PHC/CHC) and its field staff.',
    dashboards: ['facility', 'anm'],
  },
  ANM: {
    key: 'ANM',
    label: 'ANM',
    level: 20,
    description: 'Auxiliary Nurse Midwife — sub-centre level data & uploads.',
    dashboards: ['anm'],
  },
  ASHA: {
    key: 'ASHA',
    label: 'ASHA',
    level: 10,
    description: 'Accredited Social Health Activist — community field worker.',
    dashboards: ['anm'],
  },
};

export const ROLE_LIST: RoleDef[] = Object.values(ROLES).sort((a, b) => b.level - a.level);

/** Capabilities gate specific UI actions independent of dashboards. */
export type Capability =
  | 'manage_users'
  | 'manage_roles'
  | 'upload_files'
  | 'run_ai_analysis'
  | 'export_reports'
  | 'view_state'
  | 'view_district';

const CAPABILITY_MIN_LEVEL: Record<Capability, number> = {
  manage_users: 60,
  manage_roles: 60,
  view_state: 60,
  view_district: 50,
  export_reports: 30,
  run_ai_analysis: 20,
  upload_files: 10,
};

export function can(roleKey: RoleKey | undefined, cap: Capability): boolean {
  if (!roleKey) return false;
  const def = ROLES[roleKey];
  if (!def) return false;
  return def.level >= CAPABILITY_MIN_LEVEL[cap];
}

export function canAccessDashboard(roleKey: RoleKey | undefined, scope: DashboardScope): boolean {
  if (!roleKey) return false;
  return ROLES[roleKey]?.dashboards.includes(scope) ?? false;
}

export function defaultDashboard(roleKey: RoleKey | undefined): DashboardScope {
  if (!roleKey) return 'anm';
  return ROLES[roleKey]?.dashboards[0] ?? 'anm';
}

/** Normalise an arbitrary stored role string into a known RoleKey. */
export function normalizeRole(raw: string | null | undefined): RoleKey {
  if (!raw) return 'ASHA';
  const upper = raw.toUpperCase().replace(/[\s-]+/g, '_');
  if (upper in ROLES) return upper as RoleKey;
  // Tolerate label-style values e.g. "State Admin"
  const byLabel = ROLE_LIST.find((r) => r.label.toLowerCase() === raw.toLowerCase());
  return byLabel?.key ?? 'ASHA';
}
