-- OuWork W1 (RW2.1): the board palette goes from 10 to 8 colours.
-- 'terracotta' and 'moss' are dropped; rows that used them (none in a new
-- database) move to the closest remaining colour.

update public.spheres set color = 'coral' where color = 'terracotta';
update public.spheres set color = 'sage' where color = 'moss';

alter table public.spheres drop constraint spheres_color_palette;
alter table public.spheres add constraint spheres_color_palette check (
  color in ('coral', 'amber', 'sage', 'teal', 'sky', 'lavender', 'rose', 'plum')
);

-- same function as before, with the new palette in its validation
create or replace function public.complete_galaxy_setup(_galaxy_id uuid, _answers jsonb, _spheres jsonb)
returns setof public.spheres
language plpgsql security definer set search_path = ''
as $$
declare
  _uid uuid := auth.uid();
  _g public.galaxies;
  _el jsonb;
  _name text;
  _emoji text;
  _color text;
  _x double precision;
  _y double precision;
  _row public.spheres;
begin
  if _uid is null then
    raise exception 'not authenticated' using errcode = '42501';
  end if;

  -- the row lock serialises two concurrent calls
  select * into _g from public.galaxies g where g.id = _galaxy_id for update;

  -- same answer for "does not exist" and "not yours"
  if not found or _g.owner_id <> _uid then
    raise exception 'only the owner can set up this galaxy' using errcode = '42501';
  end if;
  if _g.setup_completed_at is not null then
    raise exception 'setup_already_completed' using errcode = 'P0001';
  end if;

  _answers := coalesce(_answers, '{}'::jsonb);
  if jsonb_typeof(_answers) <> 'object' or pg_column_size(_answers) > 8192 then
    raise exception 'invalid answers' using errcode = '22023';
  end if;

  _spheres := coalesce(_spheres, '[]'::jsonb);
  if jsonb_typeof(_spheres) <> 'array' then
    raise exception 'spheres must be an array' using errcode = '22023';
  end if;
  if jsonb_array_length(_spheres) > 10 then
    raise exception 'at most 10 spheres can be created at setup' using errcode = '22023';
  end if;

  for _el in select value from jsonb_array_elements(_spheres) with ordinality order by ordinality loop
    if jsonb_typeof(_el) <> 'object' then
      raise exception 'invalid sphere' using errcode = '22023';
    end if;

    _name := btrim(coalesce(_el ->> 'name', ''));
    _emoji := btrim(coalesce(_el ->> 'emoji', ''));
    _color := _el ->> 'color';

    if char_length(_name) not between 1 and 40 then
      raise exception 'invalid sphere name' using errcode = '22023';
    end if;
    if char_length(_emoji) not between 1 and 16 then
      raise exception 'invalid sphere emoji' using errcode = '22023';
    end if;
    -- same palette as spheres_color_palette (src/lib/tokens.ts)
    if _color is null or _color not in (
      'coral', 'amber', 'sage', 'teal', 'sky', 'lavender', 'rose', 'plum'
    ) then
      raise exception 'invalid sphere colour' using errcode = '22023';
    end if;
    if coalesce(jsonb_typeof(_el -> 'x'), 'number') <> 'number'
       or coalesce(jsonb_typeof(_el -> 'y'), 'number') <> 'number' then
      raise exception 'invalid sphere position' using errcode = '22023';
    end if;
    _x := coalesce((_el ->> 'x')::double precision, 0);
    _y := coalesce((_el ->> 'y')::double precision, 0);
    if abs(_x) > 20000 or abs(_y) > 20000 then
      raise exception 'invalid sphere position' using errcode = '22023';
    end if;

    insert into public.spheres (galaxy_id, name, color, emoji, x, y, created_by)
    values (_galaxy_id, _name, _color, _emoji, _x, _y, _uid)
    returning * into _row;
    return next _row;
  end loop;

  update public.galaxies
  set setup_completed_at = now(), setup_answers = _answers
  where id = _galaxy_id;

  return;
end;
$$;

