import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';

type Props = {
  title: string;
  subtitle: string;
  tag?: string;
  onPress?: () => void;
};

export default function FeatureCard({ title, subtitle, tag, onPress }: Props) {
  return (
    <Pressable style={styles.card} onPress={onPress}>
      <View style={styles.row}>
        <Text style={styles.title}>{title}</Text>
        {tag ? <Text style={styles.tag}>{tag}</Text> : null}
      </View>
      <Text style={styles.subtitle}>{subtitle}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: spacing.lg,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 5 },
    elevation: 3,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    color: colors.textPrimary,
    fontSize: 18,
    fontWeight: '700',
  },
  subtitle: {
    color: colors.textSecondary,
    marginTop: 8,
    fontSize: 14,
    lineHeight: 20,
  },
  tag: {
    color: colors.primary,
    backgroundColor: colors.primarySoft,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    fontSize: 12,
    fontWeight: '700',
  },
});