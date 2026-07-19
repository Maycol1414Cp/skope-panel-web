import { Camera, type CameraRef, Map, Marker, UserLocation } from '@maplibre/maplibre-react-native';
import { forwardRef, memo } from 'react';
import { View } from 'react-native';

import { Icon } from '@/components/ui/icon';
import { CATEGORY_COLORS, CATEGORY_ICONS } from '@/features/reports/category-icons';
import type { Report } from '@/features/reports/types';

// OpenFreeMap "liberty": basemap completo (calles, edificios, POIs, etiquetas) generado
// 100% desde datos de OSM, gratis y sin API key. Si más adelante necesitamos SLA propio,
// se reemplaza por un style URL propio (MapTiler/Stadia/self-hosted) sin tocar el resto.
const MAP_STYLE = 'https://tiles.openfreemap.org/styles/liberty';
// Solo se usa si el usuario nunca dio permiso de ubicación — nunca es el centro "normal".
export const FALLBACK_CENTER: [number, number] = [-99.1332, 19.4326];

type ReportsMapProps = {
  reports: Report[];
  pickedPoint?: [number, number] | null;
  searchMarker?: [number, number] | null;
  onLongPress?: (lngLat: [number, number]) => void;
  initialCenter: [number, number];
};

// memo: sin esto, cada tecla tipeada en el buscador (estado en el padre) re-renderizaba
// el mapa entero — era la causa real de la lentitud percibida, no el mapa en sí.
export const ReportsMap = memo(
  forwardRef<CameraRef, ReportsMapProps>(
    ({ reports, pickedPoint, searchMarker, onLongPress, initialCenter }, cameraRef) => {
      return (
        <Map
          mapStyle={MAP_STYLE}
          style={{ flex: 1 }}
          onLongPress={(event) => onLongPress?.(event.nativeEvent.lngLat)}>
          <Camera ref={cameraRef} initialViewState={{ zoom: 14, center: initialCenter }} />
          <UserLocation animated accuracy />

          {reports.map((report) => (
            <Marker key={report.id} lngLat={report.lngLat} anchor="bottom">
              <View
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 16,
                  backgroundColor: CATEGORY_COLORS[report.categoria],
                  borderWidth: 2,
                  borderColor: '#fff',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                <Icon name={CATEGORY_ICONS[report.categoria]} size={16} color="#fff" />
              </View>
            </Marker>
          ))}

          {pickedPoint && (
            <Marker lngLat={pickedPoint} anchor="bottom">
              <View
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 18,
                  backgroundColor: '#004AC6',
                  borderWidth: 3,
                  borderColor: '#fff',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                <Icon name="location-on" size={18} color="#fff" />
              </View>
            </Marker>
          )}

          {searchMarker && (
            <Marker lngLat={searchMarker} anchor="bottom">
              <View
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 18,
                  backgroundColor: '#191B23',
                  borderWidth: 3,
                  borderColor: '#fff',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                <Icon name="place" size={18} color="#fff" />
              </View>
            </Marker>
          )}
        </Map>
      );
    }
  )
);
ReportsMap.displayName = 'ReportsMap';
