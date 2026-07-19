# Expo HAS CHANGED

Read the exact versioned docs at https://docs.expo.dev/versions/v57.0.0/ before writing any code.

# Reglas del proyecto (Skope)

Definidas el 2026-07-18. Aplican a todo el código de este repo.

## Stack y herramientas
- **App**: Expo SDK 57 (React Native 0.86, React 19), Expo Router (file-based, incluye `expo-router/ui` para el tab bar custom), TypeScript estricto.
- **Estilos**: NativeWind v4 (Tailwind para RN) — única fuente de temas/colores, ver "Theming".
- **Mapa**: `@maplibre/maplibre-react-native` + estilo OpenFreeMap "liberty" (basemap OSM gratis) — ver "Mapa y ubicación".
- **Datos de servidor**: TanStack Query (`@tanstack/react-query`), preparado para Supabase (`@supabase/supabase-js` ya instalado, cliente todavía no creado — ver "Estado actual y planes a futuro").
- **Ubicación/geocoding**: `expo-location` (GPS, forward/reverse geocoding nativo) + Photon (`photon.komoot.io`, autocompletado de búsqueda con nombres, gratis, sin key).
- **Listas pesadas**: `@shopify/flash-list`.
- **Fotos**: `expo-image-picker` + `expo-image`.
- **Notificaciones**: `expo-notifications` (permisos ya integrados en Ajustes; push real todavía no está conectado a ningún backend).
- **Íconos**: `@react-native-vector-icons/material-icons` (ver "Íconos" para el porqué).
- **Persistencia local**: `@react-native-async-storage/async-storage` (hoy solo se usa para la preferencia de tema).
- Ver `package.json` para versiones exactas.

## Theming
- **NativeWind es la única fuente de verdad para color/tema.** Usar variantes `dark:` y tokens definidos en `tailwind.config.js`. Nada de un sistema de theming paralelo con Context/StyleSheet.
- Eliminar la capa de theming del template por defecto de Expo (`src/constants/theme.ts`, `src/hooks/use-theme.ts`, `themed-text.tsx`, `themed-view.tsx`) una vez que los tokens de NativeWind la reemplacen — no mantener las dos.
- Toggle manual de tema (2026-07-18, se pidió): Sistema/Claro/Oscuro en Ajustes → Apariencia. Usa `colorScheme`/`useColorScheme` de `nativewind` (no el de `react-native`) para poder overridear el SO, persistido en `AsyncStorage` vía `src/features/settings/theme-preference.ts` y aplicado al boot en `src/app/_layout.tsx`. El `ThemeProvider` de `expo-router` (chrome nativo) también debe leer el `useColorScheme` de `nativewind`, no el de `react-native`, para no desincronizarse del override manual.

## Estilo visual
- Cards redondeadas y elevadas, estilo feed/post (tipo Nextdoor/Citizen), no flat ni utilitario.
- Escala de border-radius por defecto: `rounded-2xl`/`rounded-3xl` en cards y sheets, `rounded-xl` en botones/inputs.
- Sombras/elevación sutiles para separar cards. Sin `expo-glass-effect` / liquid-glass por ahora.
- Paleta: base neutral (fondos, texto, bordes) + un solo color de acento para acciones/estados activos. Acento: `primary` = `#004AC6` (token en `tailwind.config.js`).
- Tipografía: solo fuente del sistema (SF en iOS, Roboto en Android, system-ui en web). Nada de carga de fuentes custom.

## Colores
- **Prohibido hardcodear colores** (`#fff`, `rgb(...)`, `"white"`, etc.) directo en componentes. Todo color sale de los tokens definidos en `tailwind.config.js` (clases `bg-*`, `text-*`, `border-*`).
- Si aparece un color que no existe como token, se agrega el token primero (en `theme.extend.colors`) y después se usa — no se pega el hex suelto en el JSX.
- Esto incluye estilos inline (`style={{ color: '#...' }}`) y valores pasados a componentes de terceros (ej. iconos, MapLibre) — ahí sí es inevitable pasar un valor de color en JS, pero ese valor debe importarse desde un único archivo de tokens (no repetir el hex en cada lugar donde se necesite).

## Queries y performance
- Nada de queries O(n) o N+1 contra Supabase/Postgres: evitar loops que hacen un `select` por cada elemento (ej. traer reportes y después, por cada uno, pedir su usuario o sus votos en una query aparte). Usar joins/`select` anidados de PostgREST o una sola query con agregaciones.
- Toda query geoespacial (radio de vecinos, feed por cercanía, heatmap) debe apoyarse en índices GIST de PostGIS (`ST_DWithin`, `ST_Distance` sobre columnas `geography`), no traer todos los registros y filtrar distancia en el cliente.
- Paginar/limitar listados (feed, resultados de mapa) en vez de traer todo de una — usar `range()`/`limit()` de supabase-js.
- Si una query necesita procesar datos en el cliente después de traerlos (filtrar, agrupar), preferir hacerlo en la query (SQL) antes que iterar arrays grandes en JS cuando la alternativa SQL es razonable.

## Estilo de código
- Respetar el estilo y las convenciones ya establecidas en el archivo que se está tocando (naming, orden de imports, forma de los componentes) antes que imponer un estilo distinto.
- Correr `expo lint` antes de dar por terminado un cambio; no dejar warnings nuevos.
- Nombres de archivos y componentes en `kebab-case` para archivos (como ya está en `src/components/`), `PascalCase` para componentes React, `camelCase` para funciones/variables — igual que el resto del repo.

## Estructura de código (`src/`)
- `src/app/` — solo rutas de Expo Router, sin lógica de negocio.
- `src/features/<dominio>/` — hooks, queries y componentes específicos de un dominio. Los hooks de TanStack Query viven junto a la feature dueña de esos datos. Dominios que ya existen: `reports`, `map`, `location`, `settings`. Todavía no existen (se crean cuando haga falta, no antes): `votes`, `auth`, `profile`, `notifications`.
- `src/components/ui/` — solo primitivos compartidos (Button, Card, Badge, etc.), sin lógica de dominio.
- `src/lib/` — clientes/config transversales (cliente de Supabase — pendiente, cliente de TanStack Query, archivo de tokens de color).

Árbol actual (`find src -type f`), para ubicarse rápido:

```
src/
├── app/                          # rutas (Expo Router) — sin lógica, solo composición
│   ├── _layout.tsx               # providers raíz: QueryClient, GestureHandler, theming, Stack
│   ├── report.tsx                # modal "Nuevo Reporte"
│   └── (tabs)/
│       ├── _layout.tsx           # bottom tab bar custom (expo-router/ui, no NativeTabs)
│       ├── index.tsx             # Mapa (+ toggle Feed adentro)
│       ├── mis-reportes.tsx
│       └── ajustes.tsx
├── components/ui/                # primitivos compartidos, sin lógica de dominio
│   ├── button.tsx, card.tsx, chip.tsx, icon.tsx, status-badge.tsx
│   └── tab-bar.tsx                # exporta TAB_BAR_CLEARANCE (padding que reservan las screens)
├── features/
│   ├── reports/                  # categorías, estado, fiabilidad, mock data, useReports()
│   ├── map/                      # ReportsMap (mapa interactivo) y LocationPreviewMap (mapa chico de solo lectura)
│   ├── location/                 # distance.ts (Haversine), geocode.ts (Photon), use-current-location.ts
│   └── settings/                 # theme-preference.ts (persistencia del tema)
├── hooks/                        # use-color-scheme (RN core, no NativeWind — ver "Theming")
├── lib/                          # colors.ts (tokens para JS), query-client.ts
└── global.css                    # @tailwind directives
```

## Capa de datos
- **TanStack Query** sobre `@supabase/supabase-js` para todo el estado de servidor (reportes, votos, queries con realtime). No armar cache/invalidación a mano con `useState`/`useEffect`.

## Íconos
- `expo-symbols` (SF Symbols) en iOS. En Android/Web usar `@react-native-vector-icons/*` (scoped packages) — **no** `@expo/vector-icons`, que la doc oficial de Expo marca como deprecado en favor de `@react-native-vector-icons` (menor bundle size, más sets de íconos disponibles).

## APIs/componentes nativos — usar la versión actual, no la vieja
Verificado contra la doc de https://docs.expo.dev/versions/v57.0.0/ (2026-07-18):
- **`Pressable`**, no `TouchableOpacity`/`TouchableHighlight` — API unificada, expone estados `pressed`/`hovered`/`focused` y ripple nativo en Android.
- **`FlashList` (`@shopify/flash-list`)**, no `FlatList`, para cualquier lista pesada o con imágenes (feed de reportes, resultados de búsqueda). Ya instalado.
- **`react-native-reanimated`** para animaciones que no pueden trabarse si el JS thread está ocupado (transiciones del feed, marcadores del mapa). Para algo simple y puntual, la `Animated` de RN core sigue siendo válida — no hace falta migrar todo a Reanimated por regla.
- **`react-native-gesture-handler`**, no `PanResponder`, para cualquier gesto (swipes, interacción con el mapa).
- **`@react-native-async-storage/async-storage`** — el `AsyncStorage` de RN core fue removido, no usarlo.
- **Permisos por módulo**: cada API expone su propio `requestPermissionsAsync` (`expo-location`, `expo-camera`, etc.). No existe ni se instala `expo-permissions` (deprecado).
- **`expo-video` / `expo-audio`**, no `expo-av` (removido en SDK 55). No aplica todavía porque el spec solo pide foto en los reportes, pero si se agrega video a futuro es la ruta correcta.
- Solo function components + hooks, nada de `React.createClass` ni class components.

## Repos
- La app móvil (este repo) y el panel de moderación en Next.js son **repos separados**. Los tipos de Supabase se generan de forma independiente en cada uno con el CLI de Supabase — sin paquete compartido por ahora.

## Seguridad y RLS
- **Ninguna tabla se crea sin política RLS.** La política va en la misma migración que crea la tabla, no se agrega "después".
- La `service_role` key nunca se usa desde la app móvil — solo desde Edge Functions o backend. El cliente móvil usa siempre la `anon` key con RLS activo.
- La política de cada tabla se documenta con un comentario corto junto a la migración (qué puede hacer cada rol: ciudadano, monitor, admin).

## Testing
- Solo se testean funciones puras no triviales con riesgo de romperse en silencio: cálculo de distancia (Haversine/PostGIS), lógica de umbrales de coherencia geográfica, parseo/normalización de datos.
- Un test mínimo por función de ese tipo (assert-based, sin framework pesado) alcanza — no se testean componentes de UI ni se arma e2e por ahora.

## Imágenes
- Toda foto de reporte se resizea/comprime en el cliente antes de subir a Supabase Storage (`expo-image-picker` + `expo-image`), y se convierte a **WebP** para ahorrar espacio y ancho de banda.
- Definir un ancho máximo razonable (ej. ~1600px) y calidad de compresión al implementar el formulario de reporte.

## Variables de entorno
- `app.json` se reemplaza por `app.config.ts`, que lee la URL y `anon key` de Supabase desde variables de entorno: `.env` local en desarrollo, EAS secrets en builds (dev/staging/prod).
- Nada de claves ni URLs de Supabase hardcodeadas en el código o commiteadas en el repo.

## Accesibilidad
- Contraste mínimo AA entre texto y fondo (la paleta neutral + un solo acento ya está pensada para esto).
- Touch targets de al menos 44x44.
- Todo botón/ícono sin texto visible lleva `accessibilityLabel` (ej. íconos de la tab bar, botón de votar, botón de cámara).

## Estados de carga / error / vacío
- Componentes genéricos en `src/components/ui/` (`LoadingState`, `ErrorState`, `EmptyState`) reusados por cualquier feature. TanStack Query ya expone `isLoading`/`isError`/`data` — no armar loading/error a mano por pantalla.

## Git
- Commits en formato **Conventional Commits** (`feat:`, `fix:`, `chore:`, `refactor:`, etc.).
- Ramas cortas y descriptivas: `feature/<algo>`, `fix/<algo>`.

## Permisos y conexión
- Si falta un permiso necesario (ubicación para reportar, cámara para foto), se muestra un estado explícito con acción para abrir la configuración del sistema (`Linking.openSettings()`) — nunca un formulario roto en silencio.
- Si se pierde la conexión al enviar un reporte, se muestra error y se permite reintentar manualmente. Sin cola offline automática por ahora (se reevalúa si se vuelve un problema real en campo).

## Categorías de reporte
Lista fija para la tabla `categorias` — usar siempre estos nombres (formulario, chips de filtro, texto de cards), sin sinónimos:
- Luminaria
- Vialidad
- Limpieza
- Seguridad
- Otros

## Color por estado del reporte
Un solo color por `estado`, igual en toda la app (feed, mapa, "Mis Reportes") — tokens reales en `tailwind.config.js`, mapeo en `src/features/reports/status.ts`:
- **Pendiente** → rojo (`status-pending`, `#BA1A1A`)
- **En revisión** → azul (`status-review`, `#004AC6`)
- **Resuelto** → verde (`status-resolved`, `#006C49`)

Aparte existe `warning` (`#996100`, ámbar) para avisos que no son ni error ni éxito — ej. el badge de fiabilidad "dudoso" en el formulario de reporte.

## Navegación
- Bottom nav con 4 tabs: Map, Report, Mis Reportes, Ajustes. "Report" abre el formulario de nuevo reporte.
- Sin FAB flotante para reportar — un solo punto de entrada (el tab), no duplicar la acción.
- El mapa incluye un toggle interno Map/Feed (no son tabs separados de la bottom nav).
- Sin widget de clima en el header del mapa — no está en el spec, no se implementa.

## Mapa y ubicación
- Estilo de mapa: **OpenFreeMap "liberty"** (`https://tiles.openfreemap.org/styles/liberty`) — basemap completo (calles, edificios, POIs) generado desde OSM, gratis, sin API key. Reemplazar por un proveedor propio (MapTiler/Stadia/self-hosted) antes de producción si se necesita SLA.
- **Búsqueda con sugerencias**: `Photon` (`photon.komoot.io/api`, `src/features/location/geocode.ts`) — geocoder OSM gratis con autocompletado real (devuelve nombre + calle/ciudad) y bias por cercanía nativo (parámetros `lat`/`lon`, no hace falta reordenar en el cliente). `expo-location.geocodeAsync` **no sirve para esto**: solo devuelve coordenadas, sin nombre, no hay forma de armar una lista de sugerencias con eso.
- **Reverse-geocoding** (dirección legible de un punto ya elegido): sí usa `expo-location.reverseGeocodeAsync` (geocoder nativo de la plataforma, sin red externa, sin rate-limit).
- Elegir el punto de un reporte: mantener presionado (`onLongPress`) un punto del mapa. El punto viaja a `/report` como query params (`lat`/`lng`) — si el usuario entra a `/report` sin params (desde el tab "Report"), se usa su ubicación GPS actual como fallback.
- Botón "ubicarme": centra la cámara (`cameraRef.flyTo`) en la posición GPS actual, vía `expo-location`.
- Centro inicial del mapa: `Location.getLastKnownPositionAsync()` primero (instantáneo) para no bloquear el primer render esperando un fix GPS fresco; si no hay nada cacheado, recién ahí `getCurrentPositionAsync`.
- **`ReportsMap` está memoizado (`React.memo`)** — sin esto, cualquier cambio de estado no relacionado en la pantalla del mapa (tipear en el buscador, cambiar de filtro) re-renderizaba el mapa nativo completo y se sentía lento. Cualquier función que se le pase como prop (`onLongPress`, etc.) tiene que ir envuelta en `useCallback`, si no el memo no sirve de nada.

## Validación de coherencia geográfica (resuelto)
- Modelo de **4 niveles** (no binario), según distancia entre `ubicacion` (el problema) y `ubicacion_reportero` (GPS del usuario al reportar): `confiable` (≤100m), `semi_confiable` (≤500m), `dudoso` (≤2000m), `revision_manual` (más lejos). `sin_verificar` si no hubo GPS disponible.
- Umbrales en metros, en una tabla (`niveles_fiabilidad`), no hardcodeados en un `CASE` — se ajustan con un `UPDATE`, no con una migración. Mismo criterio que la tabla `roles`.
- La base calcula esto solo (trigger `calcular_fiabilidad_reporte` en `reportes`, usa `ST_Distance` sobre `geography` → metros directo). El cliente (`src/features/reports/reliability.ts`) replica los mismos umbrales SOLO para la vista previa antes de publicar (todavía no hay fila en `reportes` para que dispare el trigger) — mantener ambos en sync a mano si cambian los umbrales.
- No bloquea el envío del reporte en ningún caso — solo el nivel que se guarda y que después prioriza al panel de moderación (`revision_manual` primero, vía `niveles_fiabilidad.orden`).
- Implementado en `src/features/location/distance.ts` (Haversine, con self-check en `distance.test.ts`).

## Trabajando con mockups de Stitch
- Los nombres de pantalla que pone Stitch en el export no siempre coinciden con el contenido real — verificar el contenido de cada bloque antes de asumir qué pantalla es.
- Las imágenes `lh3.googleusercontent.com/aida-public/...` son previews generadas por Stitch/Gemini, no son assets propios — no usar en producción, reemplazar por imágenes reales o placeholders propios.
- Es HTML + Tailwind CDN (web), no NativeWind/RN: `grid-cols-*`, `hover:`, `<a>`/`<textarea>`, `onclick`+DOM no portan directo — se traduce a flexbox, `Pressable` y estado de React al implementar.

## Estado actual y planes a futuro

### Ya construido
Toda la app corre hoy sobre **datos mock** (`src/features/reports/mock-data.ts`) — ninguna pantalla habla con una base de datos real todavía. Lo que sí está listo:
- Las 4 pantallas (Mapa, Nuevo Reporte, Mis Reportes, Ajustes) con navegación, mapa interactivo (MapLibre + OSM), búsqueda con sugerencias, picker de ubicación por long-press, formulario de reporte completo (título, categoría, descripción, hasta 3 fotos, ubicación con vista previa y nivel de fiabilidad calculado en el cliente), tema Sistema/Claro/Oscuro persistido, y permisos de ubicación/fotos/notificaciones ya integrados.
- El schema completo de base de datos, revisado y con RLS, en **`schema-propuesto.sql`** (raíz del repo) — **todavía no aplicado a ningún proyecto de Supabase real**, es el punto de partida para cuando se conecte.

### Supabase — próximo paso grande, en este orden
1. Crear el proyecto de Supabase (falta autenticar el MCP de Supabase en este entorno, o hacerlo manual desde supabase.com).
2. Aplicar `schema-propuesto.sql` como primera migración (extensión PostGIS, tablas `roles`/`usuarios`/`categorias`/`reportes`/`niveles_fiabilidad`/`votos_vecinos`/`monitoreo_alertas`, RLS, triggers).
3. Reemplazar `app.json` por `app.config.ts` leyendo `EXPO_PUBLIC_SUPABASE_URL`/`EXPO_PUBLIC_SUPABASE_ANON_KEY` desde `.env` (ver regla "Variables de entorno" más arriba) — crear `.env.example` en el mismo commit.
4. Crear `src/lib/supabase.ts` (cliente) — recién ahí `src/features/reports/use-reports.ts` deja de devolver `MOCK_REPORTS` y pasa a hacer `supabase.from('reportes').select(...)` (el hook ya está armado como `useQuery`, el cambio es literal una línea dentro del `queryFn`, no toca ningún componente).
5. Auth: falta decidir el flujo (email+password, magic link, OAuth) y construir las pantallas de login/registro — hoy no existen. El registro tiene que pedir los campos nuevos de `usuarios` (`apellido`, `carnet_unico`, `fecha_nacimiento`, `direccion` → geocodificar a `ubicacion_referencia`).
6. Conectar de verdad: subida de fotos a Storage (con el resize/WebP que ya está pendiente, ver "Imágenes"), inserts reales del formulario de reporte, votos, notificaciones push disparadas por Edge Function al crear un reporte (spec original, sección 3.2 — todavía no arrancado).

### Otros pendientes conocidos
- Umbrales de votos que cambian el `estado` de un reporte automáticamente, y si el voto de alguien lejano pesa menos que el de un vecino cercano.
- Si los umbrales de `niveles_fiabilidad` (100/500/2000m) deberían variar por categoría (ej. un bache es más "local" que un problema de alumbrado en una avenida larga).
- Priorización por `nivel_fiabilidad` en el panel de moderación (Next.js, repo aparte) — la columna `orden` ya está pensada para eso, falta construir el panel en sí.
- Estados de carga/error/vacío genéricos (`LoadingState`/`ErrorState`/`EmptyState` en `src/components/ui/`) — la regla ya está definida más arriba pero todavía no se crearon los componentes; por ahora cada pantalla resuelve `isLoading` a mano.
- Sin tests de integración ni CI configurado todavía (solo el self-check de `distance.test.ts`, ver "Testing").
