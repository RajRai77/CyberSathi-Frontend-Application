import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors } from '../theme/colors';

type Props = {
  status: 'SAFE' | 'SUSPICIOUS' | 'HIGH_THREAT' | 'CRITICAL_THREAT';
};

export default function StatusBadge({ status }: Props) {
  const bg =
    status === 'SAFE'
      ? colors.success
      : status === 'SUSPICIOUS'
      ? colors.warning
      : status === 'HIGH_THREAT'
      ? '#FF8A3D'
      : colors.danger;

  return (
    <View style={[styles.badge, { backgroundColor: bg }]}>
      <Text style={styles.text}>{status.replace('_', ' ')}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 7,
    alignSelf: 'flex-start',
  },
  text: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 12,
  },
});