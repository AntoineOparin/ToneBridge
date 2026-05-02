alter table public.users
  add column if not exists profile_complete boolean not null default false;

create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.users (id, username, email, profile_complete)
  values (
    new.id,
    new.email,
    new.email,
    true
  )
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer;

create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
