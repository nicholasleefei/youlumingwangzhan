-- Support adding series as inquiry items (avoid expanding to all models)

begin;

alter table public.inquiry_items
add column if not exists item_type text not null default 'model';

alter table public.inquiry_items
add column if not exists series_id uuid;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'inquiry_items_item_type_check'
  ) then
    alter table public.inquiry_items
    add constraint inquiry_items_item_type_check
    check (item_type in ('model', 'series'));
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'inquiry_items_single_target_check'
  ) then
    alter table public.inquiry_items
    add constraint inquiry_items_single_target_check
    check (not (model_id is not null and series_id is not null));
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'inquiry_items_series_id_fkey'
  ) then
    alter table public.inquiry_items
    add constraint inquiry_items_series_id_fkey
    foreign key (series_id) references public.series(id) on delete set null;
  end if;
end $$;

create index if not exists idx_inquiry_items_series_id on public.inquiry_items(series_id);

commit;
