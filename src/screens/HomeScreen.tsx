import React from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {colors} from '../theme/colors';
import {spacing} from '../theme/spacing';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';
import type {RootStackParamList} from '../navigation/AppNavigator';

type Props = NativeStackScreenProps<RootStackParamList, 'Home'>;

function DashboardCard({
  title,
  subtitle,
  badge,
  onPress,
  featured = false,
}: {
  title: string;
  subtitle: string;
  badge?: string;
  onPress?: () => void;
  featured?: boolean;
}) {
  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={onPress}
      style={[
        styles.card,
        featured ? styles.featuredCard : styles.normalCard,
      ]}>
      {badge ? <Text style={styles.badge}>{badge}</Text> : null}
      <Text style={[styles.cardTitle, featured && styles.cardTitleFeatured]}>
        {title}
      </Text>
      <Text
        style={[
          styles.cardSubtitle,
          featured && styles.cardSubtitleFeatured,
        ]}>
        {subtitle}
      </Text>
    </TouchableOpacity>
  );
}

export default function HomeScreen({navigation}: Props) {
  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Hello, Ayush</Text>
            <Text style={styles.subGreeting}>
              Your call safety dashboard is ready.
            </Text>
          </View>

          <View style={styles.profileCircle}>
            <Text style={styles.profileText}>A</Text>
          </View>
        </View>

        <View style={styles.hero}>
          <Text style={styles.heroLabel}>AI PROTECTION ACTIVE</Text>
          <Text style={styles.heroTitle}>Detect scam calls in real time.</Text>
          <Text style={styles.heroSubtitle}>
            Start live analysis, monitor suspicious conversations, and protect users with instant on-screen guidance.
          </Text>
        </View>

        <DashboardCard
          title="Live Call Analysis"
          subtitle="Start real-time monitoring for calls and video calls."
          badge="Primary"
          featured
          onPress={() => navigation.navigate('LiveAnalysis')}
        />

        <View style={styles.grid}>
          <View style={styles.gridItem}>
            <DashboardCard
              title="Link Checker"
              subtitle="Detect risky links before opening."
              badge="Soon"
            />
          </View>

          <View style={styles.gridItem}>
            <DashboardCard
              title="Document Verifier"
              subtitle="Scan fake notices and suspicious files."
              badge="Soon"
            />
          </View>

          <View style={styles.gridItem}>
            <DashboardCard
              title="Scam History"
              subtitle="Review recent alerts and sessions."
              badge="Soon"
            />
          </View>

          <View style={styles.gridItem}>
            <DashboardCard
              title="Safety Tips"
              subtitle="Quick anti-scam guidance for users."
              badge="Soon"
            />
          </View>
        </View>
      </ScrollView>

      <View style={styles.bottomNav}>
        <TouchableOpacity style={[styles.navItem, styles.navItemActive]}>
          <Text style={styles.navTextActive}>Home</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem}>
          <Text style={styles.navText}>Monitor</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem}>
          <Text style={styles.navText}>Profile</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F6FBF8',
  },
  content: {
    padding: spacing.lg,
    paddingBottom: 120,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  greeting: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.primary,
  },
  subGreeting: {
    marginTop: 6,
    fontSize: 14,
    color: colors.textSecondary,
  },
  profileCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#DDF2E6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileText: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.primary,
  },
  hero: {
    marginTop: spacing.xl,
    marginBottom: spacing.lg,
    backgroundColor: '#EAF6EE',
    borderRadius: 28,
    padding: spacing.xl,
    borderWidth: 1,
    borderColor: '#D5ECDD',
  },
  heroLabel: {
    fontSize: 12,
    fontWeight: '800',
    color: '#2E7D5A',
    letterSpacing: 1,
    marginBottom: 10,
  },
  heroTitle: {
    fontSize: 28,
    lineHeight: 36,
    fontWeight: '800',
    color: colors.primary,
    marginBottom: 10,
  },
  heroSubtitle: {
    fontSize: 15,
    lineHeight: 23,
    color: colors.textSecondary,
  },
  card: {
    borderRadius: 24,
    padding: spacing.lg,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 12,
    shadowOffset: {width: 0, height: 5},
    elevation: 3,
  },
  featuredCard: {
    backgroundColor: colors.primary,
    borderColor: '#254E72',
    marginBottom: spacing.lg,
  },
  normalCard: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
  },
  badge: {
    alignSelf: 'flex-start',
    backgroundColor: '#D9F1E2',
    color: '#236A49',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    fontSize: 12,
    fontWeight: '800',
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.textPrimary,
    marginBottom: 8,
  },
  cardTitleFeatured: {
    color: '#fff',
  },
  cardSubtitle: {
    fontSize: 14,
    lineHeight: 21,
    color: colors.textSecondary,
  },
  cardSubtitleFeatured: {
    color: '#D8E7F3',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  gridItem: {
    width: '48.5%',
    marginBottom: spacing.md,
  },
  bottomNav: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 18,
    shadowOffset: {width: 0, height: 6},
    elevation: 5,
  },
  navItem: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 18,
    alignItems: 'center',
  },
  navItemActive: {
    backgroundColor: '#EAF6EE',
  },
  navText: {
    color: colors.textSecondary,
    fontSize: 14,
    fontWeight: '700',
  },
  navTextActive: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: '800',
  },
});