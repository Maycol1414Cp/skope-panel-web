import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Linking,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Icon } from '@/components/ui/icon';
import { LocationPreviewMap } from '@/features/map/location-preview-map';
import { CATEGORY_ICONS } from '@/features/reports/category-icons';
import { REPORT_CATEGORIES, type ReportCategory } from '@/features/reports/constants';
import { getReliabilityLevel, RELIABILITY_CONFIG } from '@/features/reports/reliability';
import { haversineDistanceKm } from '@/features/location/distance';
import { useCurrentLocation } from '@/features/location/use-current-location';

const MAX_PHOTOS = 3;

function formatAddress(addr: Location.LocationGeocodedAddress): string {
  const line1 = [addr.street, addr.streetNumber].filter(Boolean).join(' ');
  const line2 = [addr.district, addr.city].filter(Boolean).join(', ');
  return [line1, line2].filter(Boolean).join(', ') || 'Ubicación seleccionada';
}

async function pickPhoto(onPicked: (uri: string) => void) {
  const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!permission.granted) {
    Alert.alert('Falta el permiso de fotos', 'Habilitalo desde los ajustes del sistema.', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Abrir ajustes', onPress: () => Linking.openSettings() },
    ]);
    return;
  }
  // TODO(supabase): comprimir/resize + convertir a WebP antes de subir a Storage.
  const result = await ImagePicker.launchImageLibraryAsync({ quality: 0.7 });
  if (!result.canceled && result.assets[0]) {
    onPicked(result.assets[0].uri);
  }
}

export default function ReportScreen() {
  const params = useLocalSearchParams<{ lat?: string; lng?: string }>();
  const { getCurrentLngLat } = useCurrentLocation();

  const [titulo, setTitulo] = useState('');
  const [category, setCategory] = useState<ReportCategory | null>(null);
  const [description, setDescription] = useState('');
  const [photos, setPhotos] = useState<string[]>([]);

  const [reportLocation, setReportLocation] = useState<[number, number] | null>(null);
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [address, setAddress] = useState<string | null>(null);
  const [locating, setLocating] = useState(true);

  useEffect(() => {
    const paramPoint: [number, number] | null =
      params.lat && params.lng ? [Number(params.lng), Number(params.lat)] : null;

    let cancelled = false;
    (async () => {
      const live = await getCurrentLngLat();
      if (cancelled) return;
      setUserLocation(live);

      const point = paramPoint ?? live;
      setReportLocation(point);
      if (point) {
        const results = await Location.reverseGeocodeAsync({
          latitude: point[1],
          longitude: point[0],
        });
        if (!cancelled && results[0]) setAddress(formatAddress(results[0]));
      }
      if (!cancelled) setLocating(false);
    })();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- solo al montar, los params no cambian en esta pantalla
  }, []);

  const distanceKm = useMemo(
    () => (reportLocation && userLocation ? haversineDistanceKm(reportLocation, userLocation) : null),
    [reportLocation, userLocation]
  );
  const reliability = getReliabilityLevel(distanceKm);
  const reliabilityInfo = RELIABILITY_CONFIG[reliability];

  const canSubmit =
    titulo.trim().length > 0 &&
    category !== null &&
    description.trim().length > 0 &&
    reportLocation !== null;

  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-neutral-950">
      <View className="flex-row items-center justify-between px-4 py-3">
        <Pressable
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel="Cerrar"
          className="h-10 w-10 items-center justify-center">
          <Icon name="close" />
        </Pressable>
        <Text className="text-lg font-bold text-black dark:text-white">Nuevo Reporte</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        className="flex-1 px-5"
        contentContainerClassName="gap-5 pb-8 pt-2"
        showsVerticalScrollIndicator={false}>
        <Card className="gap-3 p-4">
          <View className="flex-row items-center justify-between">
            <Text className="text-lg font-semibold text-black dark:text-white">Ubicación</Text>
            <View className="rounded-full bg-neutral-100 px-2 py-0.5 dark:bg-neutral-800">
              <Text className="text-[10px] font-semibold text-neutral-500 dark:text-neutral-400">
                AUTOMÁTICO
              </Text>
            </View>
          </View>
          {locating ? (
            <View className="flex-row items-center gap-2 py-2">
              <ActivityIndicator size="small" />
              <Text className="text-sm text-neutral-500 dark:text-neutral-400">
                Obteniendo ubicación...
              </Text>
            </View>
          ) : (
            <>
              {reportLocation && <LocationPreviewMap point={reportLocation} />}

              <View className="flex-row items-center gap-3">
                <View className="h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                  <Icon name="location-on" color="#004AC6" size={20} />
                </View>
                <Text className="flex-1 text-sm text-black dark:text-white">
                  {address ?? 'No pudimos determinar tu ubicación'}
                </Text>
              </View>

              <View className={`flex-row items-center gap-2 rounded-xl px-3 py-2 ${reliabilityInfo.bg}`}>
                <Icon name={reliabilityInfo.icon} size={16} color={reliabilityInfo.color} />
                <Text className={`flex-1 text-xs font-medium ${reliabilityInfo.text}`}>
                  {reliabilityInfo.label}
                  {distanceKm !== null && ` (a ${(distanceKm * 1000).toFixed(0)}m de tu posición)`}
                </Text>
              </View>
            </>
          )}
        </Card>

        <Card className="gap-3 p-4">
          <Text className="text-lg font-semibold text-black dark:text-white">Título</Text>
          <TextInput
            value={titulo}
            onChangeText={setTitulo}
            placeholder="Ej: Bache profundo en Av. Reforma"
            placeholderTextColor="#A3A3A3"
            maxLength={80}
            className="rounded-xl bg-neutral-100 p-3 text-base text-black dark:bg-neutral-800 dark:text-white"
          />
        </Card>

        <Card className="gap-3 p-4">
          <Text className="text-lg font-semibold text-black dark:text-white">Categoría</Text>
          <View className="flex-row flex-wrap gap-3">
            {REPORT_CATEGORIES.map((item) => {
              const selected = category === item;
              return (
                <Pressable
                  key={item}
                  accessibilityRole="button"
                  accessibilityLabel={item}
                  accessibilityState={{ selected }}
                  onPress={() => setCategory(item)}
                  className={`w-[30%] items-center gap-1 rounded-2xl py-3 ${
                    selected ? 'bg-primary/10' : 'bg-neutral-100 dark:bg-neutral-800'
                  }`}>
                  <Icon name={CATEGORY_ICONS[item]} color={selected ? '#004AC6' : undefined} />
                  <Text
                    className={`text-xs font-semibold ${
                      selected ? 'text-primary' : 'text-black dark:text-white'
                    }`}>
                    {item}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </Card>

        <Card className="gap-3 p-4">
          <Text className="text-lg font-semibold text-black dark:text-white">
            Descripción del problema
          </Text>
          <TextInput
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={4}
            placeholder="Describe brevemente lo que está sucediendo..."
            placeholderTextColor="#A3A3A3"
            className="min-h-24 rounded-xl bg-neutral-100 p-3 text-base text-black dark:bg-neutral-800 dark:text-white"
            textAlignVertical="top"
          />
        </Card>

        <Card className="gap-3 p-4">
          <View className="flex-row items-center justify-between">
            <Text className="text-lg font-semibold text-black dark:text-white">
              Evidencia fotográfica
            </Text>
            <Text className="text-sm text-neutral-500 dark:text-neutral-400">
              {photos.length}/{MAX_PHOTOS}
            </Text>
          </View>
          <View className="flex-row gap-3">
            {Array.from({ length: MAX_PHOTOS }).map((_, index) => {
              const uri = photos[index];
              return (
                <Pressable
                  key={index}
                  accessibilityRole="button"
                  accessibilityLabel="Agregar foto"
                  disabled={!!uri}
                  onPress={() => pickPhoto((newUri) => setPhotos((prev) => [...prev, newUri]))}
                  className="aspect-square flex-1 items-center justify-center overflow-hidden rounded-2xl bg-neutral-100 dark:bg-neutral-800">
                  {uri ? (
                    <Image source={{ uri }} style={{ width: '100%', height: '100%' }} />
                  ) : (
                    <Icon name="add-a-photo" color="#004AC6" />
                  )}
                </Pressable>
              );
            })}
          </View>
        </Card>

        <Button
          label="Publicar reporte"
          onPress={() => {
            // TODO(supabase): insertar en reportes (titulo, descripcion, categoria_id,
            // ubicacion=reportLocation, ubicacion_reportero=userLocation). nivel_fiabilidad
            // y distancia_reportero_m los calcula el trigger de la base, no hace falta mandarlos.
            // + subir fotos a Storage y guardar fotos_urls.
          }}
          disabled={!canSubmit}
        />
      </ScrollView>
    </SafeAreaView>
  );
}
