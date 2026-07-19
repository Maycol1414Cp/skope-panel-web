import { Camera, Map, Marker } from '@maplibre/maplibre-react-native';
import { View } from 'react-native';

import { Icon } from '@/components/ui/icon';

// Mismo style que ReportsMap — ver ese archivo para el motivo de la elección.
const MAP_STYLE = 'https://tiles.openfreemap.org/styles/liberty';

export function LocationPreviewMap({ point }: { point: [number, number] }) {
  return (
    <View className="h-40 w-full overflow-hidden rounded-2xl">
      <Map mapStyle={MAP_STYLE} style={{ flex: 1 }} touchRotate={false} touchPitch={false}>
        <Camera initialViewState={{ center: point, zoom: 16 }} />
        <Marker lngLat={point} anchor="bottom">
          <View
            style={{
              width: 32,
              height: 32,
              borderRadius: 16,
              backgroundColor: '#004AC6',
              borderWidth: 3,
              borderColor: '#fff',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
            <Icon name="location-on" size={16} color="#fff" />
          </View>
        </Marker>
      </Map>
    </View>
  );
}
