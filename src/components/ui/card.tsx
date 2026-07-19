import { View, type ViewProps } from 'react-native';

export function Card({ className, ...props }: ViewProps) {
  return (
    <View
      className={`rounded-3xl bg-white shadow-sm dark:bg-neutral-900 ${className ?? ''}`}
      {...props}
    />
  );
}
