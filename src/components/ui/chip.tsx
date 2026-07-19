import { Pressable, Text } from 'react-native';

type ChipProps = {
  label: string;
  selected?: boolean;
  onPress?: () => void;
};

export function Chip({ label, selected, onPress }: ChipProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ selected: !!selected }}
      onPress={onPress}
      className={`shrink-0 rounded-full px-4 py-2 ${
        selected ? 'bg-primary' : 'bg-neutral-100 dark:bg-neutral-800'
      }`}>
      <Text
        className={`text-xs font-semibold ${
          selected ? 'text-white' : 'text-neutral-600 dark:text-neutral-300'
        }`}>
        {label}
      </Text>
    </Pressable>
  );
}
