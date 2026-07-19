import { useSyncExternalStore } from 'react';
import { Appearance } from 'react-native';

function subscribe(onChange: () => void) {
  const subscription = Appearance.addChangeListener(onChange);
  return () => subscription.remove();
}

/**
 * To support static rendering, this value needs to be re-calculated on the client side for web.
 * useSyncExternalStore's getServerSnapshot returns 'light' during SSR and the real value once hydrated.
 */
export function useColorScheme() {
  return useSyncExternalStore(
    subscribe,
    () => Appearance.getColorScheme() ?? 'light',
    () => 'light'
  );
}
