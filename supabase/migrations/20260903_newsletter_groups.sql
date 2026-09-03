-- Groupes de destinataires newsletter (appliqué en production le 03/09/2026)
create table if not exists newsletter_groups (
  id serial primary key, name text not null unique, description text,
  extra_emails text[] not null default '{}',
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table if not exists newsletter_group_members (
  group_id int not null references newsletter_groups(id) on delete cascade,
  member_id uuid not null references member_profiles(id) on delete cascade,
  added_at timestamptz not null default now(), primary key (group_id, member_id)
);
alter table newsletter_groups enable row level security;
alter table newsletter_group_members enable row level security;
create policy "admins manage newsletter_groups" on newsletter_groups for all using (private.is_admin()) with check (private.is_admin());
create policy "admins manage newsletter_group_members" on newsletter_group_members for all using (private.is_admin()) with check (private.is_admin());
alter table newsletters add column if not exists audience text not null default 'all';
alter table newsletters add column if not exists sent_count int;
update member_profiles set newsletter_subscribed = true where newsletter_subscribed is distinct from true;
alter table member_profiles alter column newsletter_subscribed set default true;
insert into newsletter_groups (name, description) values ('Bureau', 'Membres du bureau du club') on conflict do nothing;
