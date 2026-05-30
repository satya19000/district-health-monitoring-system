create table if not exists profiles (
  id uuid primary key default gen_random_uuid(),
  user_id text unique,
  full_name text,
  role text default 'field',
  scope text default 'anm',
  created_at timestamp with time zone default now()
);

create table if not exists dashboard_metrics (
  id uuid primary key default gen_random_uuid(),
  scope text not null default 'anm',
  metric_key text not null,
  metric_name text not null,
  metric_value numeric,
  unit text,
  target_value numeric,
  target_operator text default '>=',
  period text default 'current',
  status text default 'no_data',
  created_at timestamp with time zone default now()
);

create table if not exists file_uploads (
  id uuid primary key default gen_random_uuid(),
  user_id text,
  file_name text not null,
  file_type text,
  file_size bigint,
  storage_bucket text default 'uploads',
  storage_path text,
  upload_status text default 'uploaded',
  created_at timestamp with time zone default now()
);

create table if not exists analysis_results (
  id uuid primary key default gen_random_uuid(),
  upload_id uuid,
  scope text default 'anm',
  summary text,
  poor_performance jsonb,
  best_performance jsonb,
  advice text,
  conclusion text,
  action_plan jsonb,
  created_at timestamp with time zone default now()
);

create table if not exists reports (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  scope text default 'anm',
  report_type text,
  report_data jsonb,
  created_by text,
  created_at timestamp with time zone default now()
);

create index if not exists idx_dashboard_metrics_scope on dashboard_metrics(scope);
create index if not exists idx_file_uploads_user_id on file_uploads(user_id);
create index if not exists idx_analysis_results_scope on analysis_results(scope);

insert into dashboard_metrics
(scope, metric_key, metric_name, metric_value, unit, target_value, target_operator, period, status)
values
('anm', 'mmr', 'Maternal Mortality Ratio', 62, 'per 100k', 70, '<=', 'current', 'good'),
('anm', 'imr', 'Infant Mortality Rate', 24, 'per 1k', 28, '<=', 'current', 'good'),
('anm', 'u5mr', 'Under-5 Mortality Rate', 21, 'per 1k', 25, '<=', 'current', 'good'),
('anm', 'anc', 'Antenatal Care Coverage', 96, '%', 95, '>=', 'current', 'good'),
('anm', 'pnc', 'Postnatal Care Coverage', 91, '%', 90, '>=', 'current', 'good'),
('anm', 'immunization', 'Full Immunization Coverage', 92, '%', 90, '>=', 'current', 'good'),
('anm', 'tb', 'TB Treatment Success Rate', 88, '%', 90, '>=', 'current', 'needs_attention'),
('anm', 'ncd', 'NCD Screening Coverage', 76, '%', 80, '>=', 'current', 'needs_attention'),
('anm', 'idsp', 'IDSP Reporting Completeness', 94, '%', 90, '>=', 'current', 'good'),
('anm', 'maternal_health', 'Maternal Health Composite Index', 84, 'index', 80, '>=', 'current', 'good'),
('anm', 'child_health', 'Child Health Composite Index', 82, 'index', 80, '>=', 'current', 'good');
