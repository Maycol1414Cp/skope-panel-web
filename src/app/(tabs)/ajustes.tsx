import Constants from 'expo-constants';
import * as Notifications from 'expo-notifications';
import { useColorScheme } from 'nativewind';
import { useEffect, useState } from 'react';
import { Alert, Linking, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Card } from '@/components/ui/card';
import { Icon, type IconName } from '@/components/ui/icon';
import { TAB_BAR_CLEARANCE } from '@/components/ui/tab-bar';
import {
  getStoredThemePreference,
  setStoredThemePreference,
  type ThemePreference,
} from '@/features/settings/theme-preference';

const THEME_OPTIONS: { value: ThemePreference; label: string; icon: IconName }[] = [
  { value: 'system', label: 'Sistema', icon: 'smartphone' },
  { value: 'light', label: 'Claro', icon: 'light-mode' },
  { value: 'dark', label: 'Oscuro', icon: 'dark-mode' },
];

function SettingsRow({
  label,
  value,
  onPress,
}: {
  label: string;
  value?: string;
  onPress?: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      className="flex-row items-center justify-between rounded-xl px-3 py-3 active:bg-neutral-100 dark:active:bg-neutral-800">
      <Text className="text-base text-black dark:text-white">{label}</Text>
      <View className="flex-row items-center gap-1">
        {value && <Text className="text-sm text-neutral-500 dark:text-neutral-400">{value}</Text>}
        <Icon name="chevron-right" size={20} />
      </View>
    </Pressable>
  );
}

function SettingsSection({
  title,
  icon,
  children,
}: {
  title: string;
  icon: IconName;
  children: React.ReactNode;
}) {
  return (
    <Card className="p-4">
      <View className="mb-2 flex-row items-center gap-3">
        <Icon name={icon} color="#004AC6" />
        <Text className="text-lg font-semibold text-black dark:text-white">{title}</Text>
      </View>
      <View className="gap-1">{children}</View>
    </Card>
  );
}

function ThemePicker() {
  const { setColorScheme } = useColorScheme();
  const [preference, setPreference] = useState<ThemePreference>('system');

  useEffect(() => {
    getStoredThemePreference().then(setPreference);
  }, []);

  const choose = async (value: ThemePreference) => {
    setPreference(value);
    setColorScheme(value);
    await setStoredThemePreference(value);
  };

  return (
    <View className="flex-row gap-2 py-1">
      {THEME_OPTIONS.map((opt) => {
        const selected = preference === opt.value;
        return (
          <Pressable
            key={opt.value}
            accessibilityRole="button"
            accessibilityLabel={opt.label}
            accessibilityState={{ selected }}
            onPress={() => choose(opt.value)}
            className={`flex-1 items-center gap-1 rounded-2xl py-3 ${
              selected ? 'bg-primary/10' : 'bg-neutral-100 dark:bg-neutral-800'
            }`}>
            <Icon name={opt.icon} color={selected ? '#004AC6' : undefined} />
            <Text
              className={`text-xs font-semibold ${
                selected ? 'text-primary' : 'text-black dark:text-white'
              }`}>
              {opt.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

function notReady(label: string) {
  Alert.alert(label, 'Vamos a habilitarlo apenas conectemos tu cuenta.');
}

export default function AjustesScreen() {
  const [notifStatus, setNotifStatus] = useState<Notifications.PermissionStatus | null>(null);

  useEffect(() => {
    Notifications.getPermissionsAsync().then((result) => setNotifStatus(result.status));
  }, []);

  const handleNotifications = async () => {
    if (notifStatus === 'granted') {
      Linking.openSettings();
      return;
    }
    const result = await Notifications.requestPermissionsAsync();
    setNotifStatus(result.status);
    if (result.status !== 'granted') {
      Alert.alert(
        'Notificaciones desactivadas',
        'Podés activarlas más tarde desde los ajustes del sistema.'
      );
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-neutral-950" edges={['top']}>
      <ScrollView
        className="flex-1 px-5"
        contentContainerClassName="gap-5 pt-6"
        contentContainerStyle={{ paddingBottom: TAB_BAR_CLEARANCE + 24 }}
        showsVerticalScrollIndicator={false}>
        <Text className="text-3xl font-bold text-black dark:text-white">Ajustes</Text>

        <SettingsSection title="Cuenta" icon="person">
          <SettingsRow label="Perfil" onPress={() => notReady('Perfil')} />
          <View className="h-px bg-neutral-200 dark:bg-neutral-800" />
          <SettingsRow
            label="Idioma"
            value="Español"
            onPress={() => Alert.alert('Idioma', 'Por ahora Skope solo está disponible en Español.')}
          />
        </SettingsSection>

        <SettingsSection title="Apariencia" icon="palette">
          <ThemePicker />
        </SettingsSection>

        <SettingsSection title="Preferencias" icon="tune">
          <SettingsRow
            label="Notificaciones"
            value={
              notifStatus === 'granted'
                ? 'Activadas'
                : notifStatus === 'denied'
                  ? 'Desactivadas'
                  : '...'
            }
            onPress={handleNotifications}
          />
        </SettingsSection>

        <SettingsSection title="Seguridad" icon="lock">
          <SettingsRow label="Contraseña" onPress={() => notReady('Contraseña')} />
          <View className="h-px bg-neutral-200 dark:bg-neutral-800" />
          <SettingsRow label="Privacidad" onPress={() => notReady('Privacidad')} />
        </SettingsSection>

        <SettingsSection title="Información" icon="info">
          <SettingsRow label="Ayuda" onPress={() => notReady('Ayuda')} />
          <View className="h-px bg-neutral-200 dark:bg-neutral-800" />
          <SettingsRow label="Legal" onPress={() => notReady('Legal')} />
          <View className="h-px bg-neutral-200 dark:bg-neutral-800" />
          <SettingsRow
            label="Acerca de"
            onPress={() =>
              Alert.alert('Skope', `Versión ${Constants.expoConfig?.version ?? '1.0.0'}`)
            }
          />
        </SettingsSection>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Cerrar sesión"
          onPress={() => Alert.alert('Sin sesión activa', 'Todavía no hay un sistema de cuentas conectado.')}
          className="flex-row items-center justify-center gap-2 rounded-xl py-4 active:bg-status-pending/10">
          <Icon name="logout" color="#BA1A1A" size={20} />
          <Text className="text-base font-semibold text-status-pending">Cerrar sesión</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}
