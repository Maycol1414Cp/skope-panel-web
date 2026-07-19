# Skope

App social de reportes urbanos — los ciudadanos reportan problemas de infraestructura pública (luminarias, baches, fugas, basura, seguridad) con foto, descripción y ubicación. Los reportes se ven en un mapa y en un feed a los vecinos cercanos, quienes pueden validarlos.

Stack: **Expo SDK 57 + React Native + NativeWind + MapLibre (OSM) + Supabase** (pendiente de conectar — ver `AGENTS.md`).

Las reglas técnicas del proyecto (estructura de carpetas, convenciones, stack completo, decisiones de diseño y los planes a futuro con Supabase) están en **[`AGENTS.md`](./AGENTS.md)**. Esta guía es solo para levantar el proyecto y correrlo en un celular.

## Requisitos

- **Node.js 22+** (el proyecto usa sintaxis moderna; `node --version` para chequear).
- **Un celular Android o iOS** en la misma red WiFi que tu compu (o USB), con [Expo Go](https://expo.dev/go) instalado — **solo sirve para una primera revisión rápida**, ver la sección de abajo sobre por qué.
- Para compilar de verdad (lo que vas a necesitar la mayoría del tiempo):
  - **Android**: [Android Studio](https://developer.android.com/studio) instalado (trae el SDK y un JDK propio que podés usar sin instalar Java aparte).
  - **iOS**: una Mac con Xcode instalado.

## Instalación

```bash
git clone https://github.com/iTzManix/skope.git
cd skope
npm install
```

## Corriendo la app en tu celular

### Opción rápida: Expo Go (limitada)

El proyecto usa **MapLibre**, un módulo nativo que Expo Go no trae incluido. Con Expo Go vas a poder ver y navegar toda la app **excepto la pantalla del Mapa**, que va a fallar ahí. Sirve para revisar rápido pantallas como Ajustes o el formulario de reporte sin compilar nada:

```bash
npx expo start --go
```

Escaneá el QR con la cámara (iOS) o la app de Expo Go (Android).

### Opción real: development build (necesaria para el Mapa)

Esto compila un APK/IPA propio del proyecto (con MapLibre adentro) y lo instala en tu celular. **La primera vez tarda bastante** (puede ser 20-40 minutos, compila código nativo C++). Las siguientes veces que cambies algo nativo (agregás una librería, tocás `app.json`) es mucho más rápido porque queda cacheado (~1-2 min).

1. Conectá el celular por USB (o [wireless debugging](https://developer.android.com/tools/wireless-adb)) y confirmá que lo ve:

   ```bash
   adb devices
   ```

   Tiene que aparecer como `device` (no `unauthorized` — si dice eso, desbloqueá el celular y aceptá el diálogo de "permitir depuración USB").

2. Compilá e instalá:

   ```bash
   npx expo run:android
   # o
   npx expo run:ios
   ```

3. Una vez instalada, para las próximas veces que quieras levantar el server sin recompilar (si no tocaste nada nativo):

   ```bash
   npx expo start
   ```

   Y abrí la app **Skope** ya instalada en tu celular (no hace falta reinstalar cada vez).

### Problemas comunes (nos pasaron todos armando el proyecto)

**`Error: JAVA_HOME is not set` al correr `expo run:android`**
Android Studio trae su propio JDK. Corré el build apuntando ahí en vez de instalar Java aparte:

```bash
JAVA_HOME=/opt/android-studio/jbr npx expo run:android   # Linux
# En Mac suele ser: JAVA_HOME=/Applications/Android\ Studio.app/Contents/jbr/Contents/Home
```

**`INSTALL_FAILED_USER_RESTRICTED: Install canceled by user`**
Android te pide confirmar la instalación *en el propio celular* y nadie lo tocó a tiempo. Desbloqueá el teléfono, fijate si hay un diálogo pidiendo confirmar instalación por USB, y aceptalo. Si no aparece nada, revisá en **Ajustes → Opciones de desarrollador** que **"Instalar vía USB"** esté activado.

**El celular se queda "cargando" al conectar con el servidor y después falla**
Casi seguro es un firewall en tu compu bloqueando el puerto 8081 (Metro) para otros dispositivos de tu red — `ping` a tu compu funciona porque eso no lo bloquea, pero la conexión TCP sí. Si usás `ufw`:

```bash
sudo ufw allow 8081/tcp
```

**No me deja elegir Expo Go, siempre intenta abrir el development build**
El CLI, al detectar `expo-dev-client` instalado, apunta por defecto al dev build. Forzalo con `npx expo start --go`, o si ya tenés `expo start` corriendo, apretá `s` en esa misma terminal para alternar.

**Verificá que el celular y la compu estén en la misma red WiFi.** Si no podés ponerlos en la misma red (ej. redes corporativas con aislamiento de clientes), usá `npx expo start --tunnel` como alternativa (más lento, pasa por internet).

## Scripts

| Comando | Qué hace |
|---|---|
| `npm start` | Levanta el servidor de Metro |
| `npm run android` | Compila e instala el development build en Android |
| `npm run ios` | Compila e instala el development build en iOS |
| `npm run web` | Corre la app en el navegador |
| `npm run lint` | ESLint (correr antes de dar un cambio por terminado) |

## Variables de entorno

Todavía no hay ninguna configurada (Supabase está pendiente de conectar, ver `AGENTS.md` → "Pendiente / planes a futuro"). Cuando se agregue, va a documentarse acá y en un `.env.example`.
