import type { CameraRef } from '@maplibre/maplibre-react-native';
import * as Location from 'expo-location';
import { router } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Card } from '@/components/ui/card';
import { Chip } from '@/components/ui/chip';
import { Icon } from '@/components/ui/icon';
import { StatusBadge } from '@/components/ui/status-badge';
import { TAB_BAR_CLEARANCE } from '@/components/ui/tab-bar';
import { FALLBACK_CENTER, ReportsMap } from '@/features/map/reports-map';
import { searchPlaces, type PlaceSuggestion } from '@/features/location/geocode';
import { useCurrentLocation } from '@/features/location/use-current-location';
import { REPORT_CATEGORIES } from '@/features/reports/constants';
import { STATUS_CONFIG } from '@/features/reports/status';
import type { Report } from '@/features/reports/types';
import { useReports } from '@/features/reports/use-reports';

const FILTERS = ['Todos', ...REPORT_CATEGORIES] as const;

function NearbyCard({ report }: { report: Report }) {
  return (
    <Card className="mr-3 w-64 flex-row gap-3 p-3">
      <View className="h-16 w-16 items-center justify-center rounded-xl bg-neutral-100 dark:bg-neutral-800">
        <Icon name="image-not-supported" size={20} color="#A3A3A3" />
      </View>
      <View className="flex-1 justify-center gap-1">
        <Text className="text-xs font-semibold text-status-pending">{report.categoria}</Text>
        <Text className="text-sm font-semibold text-black dark:text-white" numberOfLines={1}>
          {report.titulo}
        </Text>
        <Text className="text-xs text-neutral-500 dark:text-neutral-400">{report.distancia}</Text>
      </View>
    </Card>
  );
}

function FeedCard({ report }: { report: Report }) {
  return (
    <Card className="mb-4 gap-3 overflow-hidden">
      <View className="h-40 w-full items-center justify-center bg-neutral-100 dark:bg-neutral-800">
        <Icon name="image-not-supported" size={28} color="#A3A3A3" />
      </View>
      <View className="gap-2 p-4 pt-0">
        <StatusBadge {...STATUS_CONFIG[report.estado]} />
        <Text className="text-lg font-semibold text-black dark:text-white">{report.titulo}</Text>
        <Text className="text-sm text-neutral-500 dark:text-neutral-400" numberOfLines={2}>
          {report.descripcion}
        </Text>
        <View className="flex-row items-center gap-1">
          <Icon name="location-on" size={14} />
          <Text className="text-xs text-neutral-500 dark:text-neutral-400">
            {report.ubicacion} • {report.distancia}
          </Text>
        </View>
        <View className="mt-1 flex-row gap-2">
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Validar"
            className="flex-1 flex-row items-center justify-center gap-2 rounded-xl bg-status-resolved/10 py-3 active:opacity-80">
            <Icon name="check-circle" color="#006C49" size={18} />
            <Text className="text-sm font-semibold text-status-resolved">
              Validar ({report.votos})
            </Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="No es real"
            className="flex-1 flex-row items-center justify-center gap-2 rounded-xl bg-status-pending/10 py-3 active:opacity-80">
            <Icon name="cancel" color="#BA1A1A" size={18} />
            <Text className="text-sm font-semibold text-status-pending">No es real</Text>
          </Pressable>
        </View>
      </View>
    </Card>
  );
}

export default function MapScreen() {
  const { data: reports = [] } = useReports();
  const [mode, setMode] = useState<'map' | 'feed'>('map');
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>('Todos');
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState<PlaceSuggestion[]>([]);
  const [searching, setSearching] = useState(false);
  const [searchMarker, setSearchMarker] = useState<[number, number] | null>(null);
  const [pickedPoint, setPickedPoint] = useState<[number, number] | null>(null);
  const [mapCenter, setMapCenter] = useState<[number, number] | null>(null);
  const cameraRef = useRef<CameraRef>(null);
  const { getCurrentLngLat, loading: locating } = useCurrentLocation();

  // Centrar el mapa en el área del usuario en vez de un default fijo (México).
  // Primero la última posición conocida (instantánea) para no bloquear el primer
  // render del mapa esperando un fix GPS fresco — es solo para centrar, no para
  // nada que necesite precisión (eso sigue usando getCurrentLngLat).
  // TODO(supabase): una vez haya perfil, preferir usuarios.ubicacion_referencia.
  useEffect(() => {
    (async () => {
      const last = await Location.getLastKnownPositionAsync();
      if (last) {
        setMapCenter([last.coords.longitude, last.coords.latitude]);
        return;
      }
      const lngLat = await getCurrentLngLat();
      setMapCenter(lngLat ?? FALLBACK_CENTER);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- solo al montar
  }, []);

  // Sugerencias con debounce mientras se tipea, priorizadas por cercanía (Photon
  // recibe lat/lon y ordena por distancia server-side, no hace falta re-ordenar acá).
  useEffect(() => {
    const timeout = setTimeout(async () => {
      setSearching(true);
      // searchPlaces ya devuelve [] sin pegarle a la red si el query está vacío.
      const results = await searchPlaces(searchQuery, mapCenter);
      setSuggestions(results);
      setSearching(false);
    }, 350);
    return () => clearTimeout(timeout);
  }, [searchQuery, mapCenter]);

  const handleSelectSuggestion = (place: PlaceSuggestion) => {
    setSearchQuery(place.label);
    setSuggestions([]);
    setSearchMarker(place.lngLat);
    setPickedPoint(null);
    cameraRef.current?.flyTo({ center: place.lngLat, zoom: 16, duration: 1000 });
  };

  // useCallback acá es necesario, no cosmético: ReportsMap está memoizado y esta
  // función se pasa como prop — sin esto, memo() no serviría de nada (referencia
  // nueva en cada render de MapScreen = re-render del mapa igual).
  const handleMapLongPress = useCallback((lngLat: [number, number]) => {
    setPickedPoint(lngLat);
    setSearchMarker(null);
  }, []);

  const handleLocateMe = async () => {
    const lngLat = await getCurrentLngLat();
    if (lngLat) cameraRef.current?.flyTo({ center: lngLat, zoom: 15, duration: 1000 });
  };

  const handleReportHere = () => {
    if (!pickedPoint) return;
    router.push({
      pathname: '/report',
      params: { lng: String(pickedPoint[0]), lat: String(pickedPoint[1]) },
    });
    setPickedPoint(null);
  };

  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-neutral-950" edges={['top']}>
      <View className="gap-4 px-5 pt-3">
        <View className="flex-row items-center justify-center">
          <Text className="text-2xl font-bold text-primary">Skope</Text>
        </View>

        <View className="relative z-10">
          <View className="flex-row items-center gap-2 rounded-2xl bg-neutral-100 px-4 py-3 dark:bg-neutral-800">
            <Icon name="search" size={20} />
            <TextInput
              value={searchQuery}
              onChangeText={setSearchQuery}
              onSubmitEditing={() => suggestions[0] && handleSelectSuggestion(suggestions[0])}
              returnKeyType="search"
              placeholder="Buscar calles, reportes..."
              placeholderTextColor="#A3A3A3"
              className="flex-1 text-base text-black dark:text-white"
            />
            {searching && <ActivityIndicator size="small" />}
            {!!searchQuery && !searching && (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Limpiar búsqueda"
                onPress={() => {
                  setSearchQuery('');
                  setSuggestions([]);
                  setSearchMarker(null);
                }}>
                <Icon name="close" size={18} />
              </Pressable>
            )}
          </View>

          {suggestions.length > 0 && (
            <View className="absolute left-0 right-0 top-full mt-2 gap-1 rounded-2xl bg-white p-2 shadow-lg dark:bg-neutral-800">
              {suggestions.map((place) => (
                <Pressable
                  key={place.id}
                  accessibilityRole="button"
                  accessibilityLabel={place.label}
                  onPress={() => handleSelectSuggestion(place)}
                  className="flex-row items-center gap-3 rounded-xl px-3 py-2.5 active:bg-neutral-100 dark:active:bg-neutral-700">
                  <Icon name="place" size={18} color="#9CA3AF" />
                  <View className="flex-1">
                    <Text
                      className="text-sm font-semibold text-black dark:text-white"
                      numberOfLines={1}>
                      {place.label}
                    </Text>
                    {!!place.sublabel && (
                      <Text
                        className="text-xs text-neutral-500 dark:text-neutral-400"
                        numberOfLines={1}>
                        {place.sublabel}
                      </Text>
                    )}
                  </View>
                </Pressable>
              ))}
            </View>
          )}
        </View>

        <View className="flex-row self-center rounded-full bg-neutral-100 p-1 dark:bg-neutral-800">
          {(['map', 'feed'] as const).map((item) => (
            <Pressable
              key={item}
              accessibilityRole="button"
              accessibilityLabel={item === 'map' ? 'Mapa' : 'Feed'}
              onPress={() => setMode(item)}
              className={`rounded-full px-6 py-1.5 ${mode === item ? 'bg-primary' : ''}`}>
              <Text
                className={`text-xs font-semibold ${
                  mode === item ? 'text-white' : 'text-neutral-500 dark:text-neutral-400'
                }`}>
                {item === 'map' ? 'Mapa' : 'Feed'}
              </Text>
            </Pressable>
          ))}
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View className="flex-row gap-2 pb-1">
            {FILTERS.map((item) => (
              <Chip key={item} label={item} selected={filter === item} onPress={() => setFilter(item)} />
            ))}
          </View>
        </ScrollView>
      </View>

      {mode === 'map' ? (
        // Columna normal (mapa + fila inferior), con el padding de abajo reservado
        // para el tabbar flotante — así el mapa nunca queda debajo de él.
        <View className="flex-1" style={{ paddingBottom: TAB_BAR_CLEARANCE }}>
          <View className="mx-5 mt-4 flex-1 overflow-hidden rounded-3xl bg-neutral-100 dark:bg-neutral-900">
            {mapCenter ? (
              <ReportsMap
                ref={cameraRef}
                reports={reports}
                pickedPoint={pickedPoint}
                searchMarker={searchMarker}
                onLongPress={handleMapLongPress}
                initialCenter={mapCenter}
              />
            ) : (
              <View className="flex-1 items-center justify-center gap-2">
                <ActivityIndicator />
                <Text className="text-sm text-neutral-500 dark:text-neutral-400">
                  Obteniendo tu ubicación...
                </Text>
              </View>
            )}

            {mapCenter && !pickedPoint && (
              <View className="absolute left-0 right-0 top-3 items-center">
                <View className="flex-row items-center gap-1 rounded-full bg-black/60 px-3 py-1.5">
                  <Icon name="touch-app" size={14} color="#fff" />
                  <Text className="text-xs font-semibold text-white">
                    Mantené presionado un punto para reportarlo
                  </Text>
                </View>
              </View>
            )}

            {mapCenter && (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Ubicarme"
                onPress={handleLocateMe}
                disabled={locating}
                className="absolute bottom-3 right-3 h-11 w-11 items-center justify-center rounded-full bg-white shadow-md dark:bg-neutral-800">
                {locating ? (
                  <ActivityIndicator size="small" />
                ) : (
                  <Icon name="my-location" size={20} color="#004AC6" />
                )}
              </Pressable>
            )}
          </View>

          <View className="h-24 justify-center px-5">
            {pickedPoint ? (
              <View className="flex-row items-center gap-3 rounded-2xl bg-white p-3 shadow-lg dark:bg-neutral-900">
                <View className="h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                  <Icon name="location-on" color="#004AC6" size={20} />
                </View>
                <Text className="flex-1 text-sm text-black dark:text-white">
                  Reportar un problema en este punto
                </Text>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Cancelar"
                  onPress={() => setPickedPoint(null)}
                  className="h-8 w-8 items-center justify-center rounded-full active:bg-neutral-100 dark:active:bg-neutral-800">
                  <Icon name="close" size={18} />
                </Pressable>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Reportar aquí"
                  onPress={handleReportHere}
                  className="rounded-full bg-primary px-4 py-2 active:opacity-90">
                  <Text className="text-sm font-semibold text-white">Reportar</Text>
                </Pressable>
              </View>
            ) : (
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {reports.map((report) => (
                  <NearbyCard key={report.id} report={report} />
                ))}
              </ScrollView>
            )}
          </View>
        </View>
      ) : (
        <ScrollView
          className="flex-1 px-5"
          contentContainerClassName="gap-4 pt-4"
          contentContainerStyle={{ paddingBottom: TAB_BAR_CLEARANCE + 24 }}
          showsVerticalScrollIndicator={false}>
          {reports.map((report) => (
            <FeedCard key={report.id} report={report} />
          ))}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}
