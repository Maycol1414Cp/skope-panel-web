import { router } from 'expo-router';
import { TabList, TabSlot, TabTrigger, Tabs } from 'expo-router/ui';
import { forwardRef } from 'react';
import {
  Pressable,
  Text,
  View,
  useColorScheme,
  type PressableProps,
  type View as RNView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Icon, type IconName } from './icon';

// Height of the floating pill + its bottom offset, so screens can reserve
// enough scroll padding to never sit behind it.
export const TAB_BAR_CLEARANCE = 100;

type TabButtonProps = PressableProps & {
  isFocused?: boolean;
  label: string;
  icon: IconName;
};

// ponytail: layout forced via `style` (not className) on every level here —
// TabTrigger's asChild cloning was colliding with className-driven flex-col,
// collapsing icon+label onto one row. Inline style always wins, no ambiguity.
const TabButton = forwardRef<RNView, TabButtonProps>(
  ({ isFocused, label, icon, ...props }, ref) => {
    const scheme = useColorScheme();
    const inactiveColor = scheme === 'dark' ? '#71717A' : '#9CA3AF';
    return (
      <Pressable
        ref={ref}
        {...props}
        accessibilityRole="button"
        accessibilityLabel={label}
        accessibilityState={{ selected: !!isFocused }}
        style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 8 }}>
        <View style={{ alignItems: 'center', justifyContent: 'center', gap: 2 }}>
          <View
            className={`items-center justify-center rounded-full px-3 py-1 ${
              isFocused ? 'bg-primary/10' : ''
            }`}>
            <Icon name={icon} size={22} color={isFocused ? '#004AC6' : inactiveColor} />
          </View>
          <Text
            numberOfLines={1}
            className={`text-[10px] font-semibold ${
              isFocused ? 'text-primary' : 'text-neutral-400 dark:text-neutral-500'
            }`}>
            {label}
          </Text>
        </View>
      </Pressable>
    );
  }
);
TabButton.displayName = 'TabButton';

export function AppTabs() {
  const insets = useSafeAreaInsets();

  return (
    <Tabs>
      <TabSlot />

      <TabList style={{ display: 'none' }}>
        <TabTrigger name="map" href="/" />
        <TabTrigger name="mis-reportes" href="/mis-reportes" />
        <TabTrigger name="ajustes" href="/ajustes" />
      </TabList>

      <View
        className="absolute left-4 right-4 flex-row items-center rounded-full bg-white shadow-xl shadow-black/10 dark:bg-neutral-900"
        style={{ bottom: insets.bottom + 12 }}>
        <TabTrigger name="map" asChild>
          <TabButton label="Mapa" icon="map" />
        </TabTrigger>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Reportar"
          onPress={() => router.push('/report')}
          style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 8 }}>
          <View style={{ alignItems: 'center', justifyContent: 'center', gap: 2 }}>
            <View className="items-center justify-center rounded-full bg-primary p-2 shadow-md shadow-primary/40">
              <Icon name="add" size={22} color="#FFFFFF" />
            </View>
            <Text
              numberOfLines={1}
              className="text-[10px] font-semibold text-neutral-400 dark:text-neutral-500">
              Reportar
            </Text>
          </View>
        </Pressable>

        <TabTrigger name="mis-reportes" asChild>
          <TabButton label="Reportes" icon="history" />
        </TabTrigger>

        <TabTrigger name="ajustes" asChild>
          <TabButton label="Ajustes" icon="settings" />
        </TabTrigger>
      </View>
    </Tabs>
  );
}
