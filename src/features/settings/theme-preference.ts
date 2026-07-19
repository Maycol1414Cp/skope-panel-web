import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = 'skope.theme-preference';

export type ThemePreference = 'light' | 'dark' | 'system';

export async function getStoredThemePreference(): Promise<ThemePreference> {
  const value = await AsyncStorage.getItem(STORAGE_KEY);
  return value === 'light' || value === 'dark' || value === 'system' ? value : 'system';
}

export async function setStoredThemePreference(value: ThemePreference): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, value);
}
