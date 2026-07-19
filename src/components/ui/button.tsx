import { forwardRef } from 'react';
import {
  ActivityIndicator,
  Pressable,
  Text,
  type PressableProps,
  type View as RNView,
} from 'react-native';

type ButtonVariant = 'primary' | 'secondary' | 'ghost';

type ButtonProps = Omit<PressableProps, 'children'> & {
  label: string;
  variant?: ButtonVariant;
  loading?: boolean;
};

const VARIANT_CLASSES: Record<ButtonVariant, { container: string; label: string }> = {
  primary: { container: 'bg-primary active:opacity-90', label: 'text-white' },
  secondary: {
    container: 'bg-neutral-100 dark:bg-neutral-800 active:opacity-80',
    label: 'text-black dark:text-white',
  },
  ghost: {
    container: 'active:bg-neutral-100 dark:active:bg-neutral-800',
    label: 'text-primary',
  },
};

export const Button = forwardRef<RNView, ButtonProps>(
  ({ label, variant = 'primary', loading, disabled, className, ...props }, ref) => {
    const { container, label: labelClass } = VARIANT_CLASSES[variant];
    return (
      <Pressable
        ref={ref}
        accessibilityRole="button"
        accessibilityLabel={label}
        disabled={disabled || loading}
        className={`flex-row items-center justify-center gap-2 rounded-xl px-6 py-4 ${container} ${
          disabled ? 'opacity-50' : ''
        } ${className ?? ''}`}
        {...props}>
        {loading ? (
          <ActivityIndicator color={variant === 'primary' ? '#fff' : '#004AC6'} />
        ) : (
          <Text className={`text-base font-semibold ${labelClass}`}>{label}</Text>
        )}
      </Pressable>
    );
  }
);
Button.displayName = 'Button';
