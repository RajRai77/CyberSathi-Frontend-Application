import React, {useState} from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import AppButton from '../components/AppButton';
import {colors} from '../theme/colors';
import {spacing} from '../theme/spacing';
import {useLiveAnalysisStore} from '../store/liveAnalysisStore';

const DEMO_EMAIL = 'ayush@cybersaathi.app';
const DEMO_PASSWORD = 'Cyber@123';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const setLoggedIn = useLiveAnalysisStore(state => state.setLoggedIn);

  const handleLogin = () => {
    if (
      email.trim().toLowerCase() === DEMO_EMAIL &&
      password === DEMO_PASSWORD
    ) {
      setLoggedIn(true);
      return;
    }

    Alert.alert(
      'Invalid Login',
      'Use the demo credentials:\nEmail: ayush@cybersaathi.app\nPassword: Cyber@123',
    );
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={styles.topGlow} />
      <View style={styles.card}>
        <Text style={styles.brand}>Cyberसाथी</Text>
        <Text style={styles.title}>Protect every call, before it becomes a scam.</Text>
        <Text style={styles.subtitle}>
          AI-assisted live scam detection for calls and video calls.
        </Text>

        <Text style={styles.label}>Email</Text>
        <TextInput
          placeholder="Enter your email"
          placeholderTextColor={colors.textSecondary}
          value={email}
          onChangeText={setEmail}
          style={styles.input}
          keyboardType="email-address"
          autoCapitalize="none"
        />

        <Text style={styles.label}>Password</Text>
        <TextInput
          placeholder="Enter your password"
          placeholderTextColor={colors.textSecondary}
          value={password}
          onChangeText={setPassword}
          style={styles.input}
          secureTextEntry
        />

        <AppButton title="Login" onPress={handleLogin} />

        <View style={styles.demoBox}>
          <Text style={styles.demoTitle}>Demo Credentials</Text>
          <Text style={styles.demoText}>Email: ayush@cybersaathi.app</Text>
          <Text style={styles.demoText}>Password: Cyber@123</Text>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5FBF8',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  topGlow: {
    position: 'absolute',
    top: -40,
    left: -20,
    right: -20,
    height: 220,
    backgroundColor: '#DDF6E6',
    borderBottomLeftRadius: 80,
    borderBottomRightRadius: 80,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 28,
    padding: spacing.xl,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 18,
    shadowOffset: {width: 0, height: 8},
    elevation: 4,
  },
  brand: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.primary,
    marginBottom: 12,
    letterSpacing: 0.4,
  },
  title: {
    fontSize: 30,
    lineHeight: 38,
    fontWeight: '800',
    color: colors.primary,
    marginBottom: 10,
  },
  subtitle: {
    color: colors.textSecondary,
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: '#fff',
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 15,
    fontSize: 15,
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  demoBox: {
    marginTop: spacing.lg,
    padding: spacing.md,
    borderRadius: 18,
    backgroundColor: '#F3F8FD',
    borderWidth: 1,
    borderColor: '#DCE8F4',
  },
  demoTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.primary,
    marginBottom: 6,
  },
  demoText: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 20,
  },
});