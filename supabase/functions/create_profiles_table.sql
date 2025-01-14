create or replace function create_profiles_table()
returns void as $$
begin
  create table if not exists public.profiles (
    id uuid references auth.users not null primary key,
    is_admin boolean not null default false,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
  );

  create policy "Public profiles are viewable by everyone."
    on profiles for select
    using ( true );

  create policy "Users can insert their own profile."
    on profiles for insert
    with check ( auth.uid() = id );

  create policy "Users can update own profile."
    on profiles for update
    using ( auth.uid() = id );
end;
$$ language plpgsql security definer;

