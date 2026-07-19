import { Text, View } from 'react-native';

type StatusBadgeProps = {
  label: string;
  bgClassName: string;
  textClassName: string;
};

export function StatusBadge({ label, bgClassName, textClassName }: StatusBadgeProps) {
  return (
    <View className={`self-start rounded-full px-3 py-1 ${bgClassName}`}>
      <Text className={`text-[10px] font-bold uppercase tracking-wider ${textClassName}`}>
        {label}
      </Text>
    </View>
  );
}
