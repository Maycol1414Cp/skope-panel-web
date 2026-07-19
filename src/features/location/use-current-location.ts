import * as Location from 'expo-location';
import { useCallback, useState } from 'react';
import { Alert, Linking } from 'react-native';

export function useCurrentLocation() {
  const [loading, setLoading] = useState(false);

  const getCurrentLngLat = useCallback(async (): Promise<[number, number] | null> => {
    setLoading(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Falta el permiso de ubicación', 'Habilitalo desde los ajustes del sistema.', [
          { text: 'Cancelar', style: 'cancel' },
          { text: 'Abrir ajustes', onPress: () => Linking.openSettings() },
        ]);
        return null;
      }
      const position = await Location.getCurrentPositionAsync({});
      return [position.coords.longitude, position.coords.latitude];
    } finally {
      setLoading(false);
    }
  }, []);

  return { getCurrentLngLat, loading };
}
