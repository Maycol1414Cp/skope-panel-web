-- ============================================================
-- extensión necesaria para geography(Point) + ST_DWithin/ST_Distance
-- ============================================================
create extension if not exists postgis;

-- ============================================================
-- roles
-- ============================================================
create table public.roles (
  id smallint primary key,
  nombre_rol varchar not null unique, -- ciudadano, monitor, admin
  descripcion text
);

insert into public.roles (id, nombre_rol, descripcion) values
  (1, 'ciudadano', 'Reporta problemas y vota reportes de otros vecinos'),
  (2, 'monitor', 'Da seguimiento y modera reportes'),
  (3, 'admin', 'Gestión general de la plataforma');

-- ============================================================
-- usuarios
-- ============================================================
create table public.usuarios (
  id uuid primary key references auth.users (id) on delete cascade,
  nombre varchar not null,
  apellido varchar not null,
  email varchar not null,
  carnet_unico varchar unique, -- PII sensible, nunca exponer a otros usuarios
  fecha_nacimiento date, -- PII sensible
  direccion text,
  ubicacion_referencia geography (point, 4326), -- geocodificado desde direccion
  rol_id smallint not null default 1 references public.roles (id), -- 1 = ciudadano
  creado_en timestamptz not null default now(),
  actualizado_en timestamptz not null default now()
);

create index usuarios_ubicacion_idx on public.usuarios using gist (ubicacion_referencia);

alter table public.usuarios enable row level security;

-- Función SECURITY DEFINER: centraliza "cuál es el rol del usuario logueado" en un solo lugar.
-- Bypassa el RLS de usuarios/roles al ejecutarse (dueña de la función = postgres), así se puede
-- llamar tranquilamente desde dentro de una policy de la propia tabla usuarios sin recursión.
-- Si el día de mañana cambia cómo se guarda el rol, este es el único lugar que hay que tocar —
-- el resto de las políticas siguen comparando contra el nombre ('admin', 'monitor') igual que antes.
create function public.rol_actual()
returns varchar
language sql stable security definer set search_path = public as $$
  select r.nombre_rol
  from usuarios u
  join roles r on r.id = u.rol_id
  where u.id = auth.uid ();
$$;

-- El dueño ve/edita su propio perfil completo (incluye carnet/fecha_nacimiento). Admin ve todo.
create policy "usuarios_select_propio_o_admin" on public.usuarios
  for select to authenticated
  using (auth.uid () = id or public.rol_actual () = 'admin');

create policy "usuarios_insert_propio" on public.usuarios
  for insert to authenticated
  with check (auth.uid () = id);

create policy "usuarios_update_propio" on public.usuarios
  for update to authenticated
  using (auth.uid () = id);

-- Función SECURITY DEFINER aparte: expone SOLO nombre + inicial de apellido, nunca carnet/
-- fecha_nacimiento/direccion. Es lo que consume el feed para mostrar "Carlos R." sin filtrar
-- datos sensibles de otros usuarios (una vista normal heredaría el RLS restrictivo de arriba
-- y no serviría para esto).
create function public.usuario_publico(usuario_id uuid)
returns table (id uuid, nombre varchar, apellido_inicial varchar)
language sql security definer set search_path = public as $$
  select id, nombre, left(apellido, 1) from usuarios where id = usuario_id;
$$;

-- ============================================================
-- categorias
-- ============================================================
create table public.categorias (
  id bigint generated always as identity primary key,
  nombre_categoria varchar not null unique,
  descripcion text
);

alter table public.categorias enable row level security;

create policy "categorias_select_todos" on public.categorias
  for select to authenticated using (true);

create policy "categorias_admin_escribe" on public.categorias
  for all to authenticated
  using (public.rol_actual () = 'admin');

insert into public.categorias (nombre_categoria) values
  ('Luminaria'), ('Vialidad'), ('Limpieza'), ('Seguridad'), ('Otros');

-- ============================================================
-- niveles_fiabilidad — umbrales de distancia reportero↔reporte, en metros.
-- Tabla en vez de CASE hardcodeado: mismo criterio que "roles", se ajusta con un
-- UPDATE en vez de una migración. `orden` también sirve para que el panel de
-- moderación priorice: revision_manual primero.
-- ============================================================
create table public.niveles_fiabilidad (
  nombre varchar primary key,
  distancia_max_m numeric, -- null = sin límite (catch-all)
  orden smallint not null unique
);

insert into public.niveles_fiabilidad (nombre, distancia_max_m, orden) values
  ('sin_verificar', null, 0), -- no se pudo capturar el GPS del reportero
  ('confiable', 100, 1),
  ('semi_confiable', 500, 2),
  ('dudoso', 2000, 3),
  ('revision_manual', null, 4);

-- ============================================================
-- reportes
-- ============================================================
create table public.reportes (
  id uuid primary key default gen_random_uuid (),
  titulo varchar not null,
  descripcion text not null,
  categoria_id bigint not null references public.categorias (id),
  creador_id uuid not null references public.usuarios (id),
  ubicacion geography (point, 4326) not null, -- dónde está el problema
  ubicacion_reportero geography (point, 4326), -- dónde estaba el usuario al reportar (GPS)
  distancia_reportero_m numeric, -- calculado por trigger, en metros (ST_Distance ya da metros)
  nivel_fiabilidad varchar not null default 'sin_verificar' references public.niveles_fiabilidad (nombre),
  fotos_urls text[] not null default '{}',
  estado varchar not null default 'pendiente'
    check (estado in ('pendiente', 'en_revision', 'resuelto')),
  creado_en timestamptz not null default now(),
  actualizado_en timestamptz not null default now()
);

create index reportes_ubicacion_idx on public.reportes using gist (ubicacion);
create index reportes_categoria_idx on public.reportes (categoria_id);
create index reportes_estado_idx on public.reportes (estado);
create index reportes_nivel_fiabilidad_idx on public.reportes (nivel_fiabilidad);

-- Calcula distancia_reportero_m y nivel_fiabilidad automáticamente al insertar/actualizar.
-- ST_Distance sobre geography ya devuelve metros directo (spheroid), sin conversión.
create function public.calcular_fiabilidad_reporte()
returns trigger
language plpgsql as $$
begin
  if new.ubicacion_reportero is null then
    new.distancia_reportero_m := null;
    new.nivel_fiabilidad := 'sin_verificar';
    return new;
  end if;

  new.distancia_reportero_m := ST_Distance(new.ubicacion, new.ubicacion_reportero);

  -- excluye 'sin_verificar' acá: tiene distancia_max_m null también, y si no lo
  -- sacamos explícitamente, matchea "distancia_max_m is null" para CUALQUIER
  -- distancia y gana por tener el orden más bajo (0) — bug, no el catch-all que queremos.
  select nombre into new.nivel_fiabilidad
  from public.niveles_fiabilidad
  where nombre <> 'sin_verificar'
    and (distancia_max_m is null or new.distancia_reportero_m <= distancia_max_m)
  order by orden asc
  limit 1;

  return new;
end;
$$;

create trigger trg_calcular_fiabilidad
  before insert or update on public.reportes
  for each row execute function public.calcular_fiabilidad_reporte();

alter table public.reportes enable row level security;

-- Feed público entre usuarios logueados.
create policy "reportes_select_todos" on public.reportes
  for select to authenticated using (true);

create policy "reportes_insert_propio" on public.reportes
  for insert to authenticated
  with check (auth.uid () = creador_id);

-- El creador NO puede editar después de publicar (evita manipular evidencia ya votada).
-- Solo monitor/admin puede actualizar (cambiar estado, moderar).
create policy "reportes_update_moderador" on public.reportes
  for update to authenticated
  using (public.rol_actual () in ('monitor', 'admin'));

-- Conteo de votos: NO se guarda en reportes, se calcula on-demand con COUNT() sobre votos_vecinos
-- (índice en reporte_id lo hace barato, y nunca se desincroniza).

-- ============================================================
-- votos_vecinos
-- ============================================================
create table public.votos_vecinos (
  id uuid primary key default gen_random_uuid (),
  reporte_id uuid not null references public.reportes (id) on delete cascade,
  usuario_id uuid not null references public.usuarios (id) on delete cascade,
  tipo_voto varchar not null check (tipo_voto in ('positivo', 'negativo')),
  creado_en timestamptz not null default now(),
  unique (reporte_id, usuario_id) -- un voto por usuario por reporte
);

create index votos_reporte_idx on public.votos_vecinos (reporte_id);

alter table public.votos_vecinos enable row level security;

create policy "votos_select_todos" on public.votos_vecinos
  for select to authenticated using (true);

create policy "votos_insert_propio" on public.votos_vecinos
  for insert to authenticated
  with check (auth.uid () = usuario_id);

create policy "votos_update_propio" on public.votos_vecinos
  for update to authenticated
  using (auth.uid () = usuario_id);

create policy "votos_delete_propio" on public.votos_vecinos
  for delete to authenticated
  using (auth.uid () = usuario_id);

-- ============================================================
-- monitoreo_alertas
-- ============================================================
create table public.monitoreo_alertas (
  id uuid primary key default gen_random_uuid (),
  reporte_id uuid not null references public.reportes (id) on delete cascade,
  monitor_id uuid not null references public.usuarios (id),
  acciones_tomadas text,
  asignado_en timestamptz not null default now(),
  resuelto_en timestamptz
);

alter table public.monitoreo_alertas enable row level security;

create policy "monitoreo_moderadores" on public.monitoreo_alertas
  for all to authenticated
  using (public.rol_actual () in ('monitor', 'admin'));
