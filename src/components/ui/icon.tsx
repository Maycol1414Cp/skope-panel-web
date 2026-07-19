import MaterialIcons from '@react-native-vector-icons/material-icons';
import type { ComponentProps } from 'react';
import { useColorScheme } from 'react-native';

export type IconName = ComponentProps<typeof MaterialIcons>['name'];

type IconProps = {
  // ponytail: MaterialIcons on every platform for now (one icon set, one name table).
  // Upgrade path: swap to expo-symbols on iOS once we have real SF Symbol names for this list.
  name: IconName;
  size?: number;
  color?: string;
};

export function Icon({ name, size = 24, color }: IconProps) {
  const scheme = useColorScheme();
  const resolvedColor = color ?? (scheme === 'dark' ? '#E5E5E5' : '#191B23');
  return <MaterialIcons name={name} size={size} color={resolvedColor} />;
}
