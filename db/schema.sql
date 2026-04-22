create table if not exists videos (
  id text primary key,
  source_url text not null,
  title text not null,
  duration_seconds integer not null default 0,
  niche text not null default 'wealth',
  created_at timestamptz not null default now()
);

create table if not exists transcript_segments (
  id bigserial primary key,
  video_id text not null references videos(id) on delete cascade,
  start_second integer not null,
  end_second integer not null,
  text text not null,
  speaker text,
  confidence numeric(4,3)
);

create table if not exists clip_candidates (
  id text primary key,
  video_id text not null references videos(id) on delete cascade,
  start_second integer not null,
  end_second integer not null,
  viral_score integer not null,
  title text not null,
  hook text not null,
  caption text not null,
  emotion text not null,
  rationale text not null,
  status text not null default 'pending',
  created_at timestamptz not null default now()
);

create table if not exists exports (
  id bigserial primary key,
  video_id text not null references videos(id) on delete cascade,
  approved_count integer not null,
  payload jsonb not null,
  exported_at timestamptz not null default now()
);

create table if not exists render_jobs (
  id text primary key,
  status text not null,
  urls jsonb not null,
  results jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  completed_at timestamptz
);
