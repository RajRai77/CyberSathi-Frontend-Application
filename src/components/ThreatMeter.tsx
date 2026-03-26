import React from 'react';
// 1. Import DimensionValue here
import { StyleSheet, Text, View, DimensionValue } from 'react-native'; 
import { colors } from '../theme/colors';

type Props = {
  score: number;
};

export default function ThreatMeter({ score }: Props) {
  // 2. Add "as DimensionValue" at the end to satisfy TypeScript
  const width = `${Math.max(4, Math.min(score, 100))}%` as DimensionValue;

  const barColor =
    score < 25
      ? colors.success
      : score < 60
      ? colors.warning
      : score < 85
      ? '#FF8A3D'
      : colors.danger;

  return (
    <View>
      <Text style={styles.label}>Risk Score: {score}</Text>
      <View style={styles.track}>
        <View style={[styles.fill, { width, backgroundColor: barColor }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  label: {
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  track: {
    height: 12,
    backgroundColor: '#EAF0F4',
    borderRadius: 999,
    overflow: 'hidden',
  },
  fill: {
    height: 12,
    borderRadius: 999,
  },
});