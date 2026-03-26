import React from 'react';
import {
  ActivityIndicator,
  GestureResponderEvent,
  Pressable,
  StyleProp,
  StyleSheet,
  Text,
  ViewStyle,
} from 'react-native';
import {colors} from '../theme/colors';

type Props = {
  title: string;
  onPress: (event: GestureResponderEvent) => void;
  variant?: 'primary' | 'secondary' | 'danger';
  disabled?: boolean;
  loading?: boolean;
  style?: StyleProp<ViewStyle>;
};

export default function AppButton({
  title,
  onPress,
  variant = 'primary',
  disabled = false,
  loading = false,
  style,
}: Props) {
  const buttonStyle = [
    styles.base,
    variant === 'primary' && styles.primary,
    variant === 'secondary' && styles.secondary,
    variant === 'danger' && styles.danger,
    disabled && styles.disabled,
    style,
  ];

  const textStyle = [
    styles.text,
    variant === 'secondary' && styles.secondaryText,
    disabled && styles.disabledText,
  ];

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      style={({pressed}) => [
        buttonStyle,
        pressed && !disabled && {transform: [{scale: 0.985}], opacity: 0.95},
      ]}>
      {loading ? (
        <ActivityIndicator color={variant === 'secondary' ? colors.primary : '#fff'} />
      ) : (
        <Text style={textStyle}>{title}</Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: 60,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 18,
    borderWidth: 1,
  },
  primary: {
    backgroundColor: '#163F69',
    borderColor: '#163F69',
    shadowColor: '#163F69',
    shadowOpacity: 0.18,
    shadowRadius: 14,
    shadowOffset: {width: 0, height: 6},
    elevation: 6,
  },
  secondary: {
    backgroundColor: '#F4FAF6',
    borderColor: '#A8D8B9',
  },
  danger: {
    backgroundColor: '#A83030',
    borderColor: '#A83030',
    shadowColor: '#A83030',
    shadowOpacity: 0.18,
    shadowRadius: 14,
    shadowOffset: {width: 0, height: 6},
    elevation: 6,
  },
  disabled: {
    opacity: 0.55,
  },
  text: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  secondaryText: {
    color: '#163F69',
  },
  disabledText: {
    opacity: 0.9,
  },
});