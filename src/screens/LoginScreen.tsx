import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, KeyboardAvoidingView, Platform,
  ScrollView, Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../store/authStore';
import { Colors, FontSize, Spacing, Radius, Shadow } from '../utils/theme';
import { Button } from '../components/ui';

export default function LoginScreen() {
  const router = useRouter();
  const { login, isLoading, error, clearError } = useAuthStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');
  const [name, setName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [confirmPass, setConfirmPass] = useState('');
  const { register } = useAuthStore();

  const handleLogin = async () => {
    if (!email.trim() || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }
    try {
      await login(email.trim().toLowerCase(), password);
    } catch {
      // error shown from store
    }
  };

  const handleRegister = async () => {
    if (!name.trim() || !regEmail.trim() || !regPassword) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }
    if (regPassword !== confirmPass) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }
    if (regPassword.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters');
      return;
    }
    try {
      await register(regEmail.trim().toLowerCase(), name.trim(), regPassword);
    } catch {
      // error shown from store
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        {/* Logo */}
        <View style={styles.logoSection}>
          <View style={styles.logoCircle}>
            <Ionicons name="checkmark-done" size={40} color={Colors.white} />
          </View>
          <Text style={styles.appName}>TaskMaster</Text>
          <Text style={styles.appTagline}>Manage tasks. Stay organized.</Text>
        </View>

        {/* Tab switcher */}
        <View style={styles.tabRow}>
          {(['login', 'register'] as const).map(tab => (
            <TouchableOpacity
              key={tab}
              style={[styles.tab, activeTab === tab && styles.tabActive]}
              onPress={() => { setActiveTab(tab); clearError(); }}
            >
              <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
                {tab === 'login' ? 'Sign In' : 'Sign Up'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Error */}
        {error && (
          <View style={styles.errorBox}>
            <Ionicons name="alert-circle" size={16} color={Colors.error} />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {/* Form */}
        <View style={styles.form}>
          {activeTab === 'login' ? (
            <>
              <InputField
                label="Email"
                value={email}
                onChangeText={setEmail}
                placeholder="you@example.com"
                keyboardType="email-address"
                autoCapitalize="none"
                icon="mail-outline"
              />
              <InputField
                label="Password"
                value={password}
                onChangeText={setPassword}
                placeholder="Your password"
                secureTextEntry={!showPass}
                icon="lock-closed-outline"
                rightIcon={showPass ? 'eye-off-outline' : 'eye-outline'}
                onRightIconPress={() => setShowPass(!showPass)}
              />
              <Button
                title="Sign In"
                onPress={handleLogin}
                loading={isLoading}
                fullWidth
                size="lg"
                style={{ marginTop: 8 }}
              />
            </>
          ) : (
            <>
              <InputField
                label="Full Name"
                value={name}
                onChangeText={setName}
                placeholder="John Doe"
                icon="person-outline"
              />
              <InputField
                label="Email"
                value={regEmail}
                onChangeText={setRegEmail}
                placeholder="you@example.com"
                keyboardType="email-address"
                autoCapitalize="none"
                icon="mail-outline"
              />
              <InputField
                label="Password"
                value={regPassword}
                onChangeText={setRegPassword}
                placeholder="Min. 6 characters"
                secureTextEntry={!showPass}
                icon="lock-closed-outline"
                rightIcon={showPass ? 'eye-off-outline' : 'eye-outline'}
                onRightIconPress={() => setShowPass(!showPass)}
              />
              <InputField
                label="Confirm Password"
                value={confirmPass}
                onChangeText={setConfirmPass}
                placeholder="Repeat password"
                secureTextEntry={!showPass}
                icon="lock-closed-outline"
              />
              <Button
                title="Create Account"
                onPress={handleRegister}
                loading={isLoading}
                fullWidth
                size="lg"
                style={{ marginTop: 8 }}
              />
            </>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

interface InputFieldProps {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  placeholder?: string;
  secureTextEntry?: boolean;
  keyboardType?: any;
  autoCapitalize?: any;
  icon?: string;
  rightIcon?: string;
  onRightIconPress?: () => void;
}

const InputField: React.FC<InputFieldProps> = ({
  label, value, onChangeText, placeholder, secureTextEntry,
  keyboardType, autoCapitalize, icon, rightIcon, onRightIconPress,
}) => (
  <View style={styles.inputGroup}>
    <Text style={styles.label}>{label}</Text>
    <View style={styles.inputWrapper}>
      {icon && <Ionicons name={icon as any} size={18} color={Colors.gray400} style={styles.inputIcon} />}
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={Colors.gray400}
        secureTextEntry={secureTextEntry}
        keyboardType={keyboardType || 'default'}
        autoCapitalize={autoCapitalize || 'sentences'}
        autoCorrect={false}
      />
      {rightIcon && (
        <TouchableOpacity onPress={onRightIconPress} style={styles.rightIcon}>
          <Ionicons name={rightIcon as any} size={18} color={Colors.gray400} />
        </TouchableOpacity>
      )}
    </View>
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scroll: { flexGrow: 1, padding: Spacing.xl, justifyContent: 'center' },
  logoSection: { alignItems: 'center', marginBottom: Spacing.xxxl },
  logoCircle: {
    width: 80, height: 80, borderRadius: 24,
    backgroundColor: Colors.primary, alignItems: 'center',
    justifyContent: 'center', marginBottom: 16, ...Shadow.lg,
  },
  appName: { fontSize: FontSize.display, fontWeight: '800', color: Colors.gray900 },
  appTagline: { fontSize: FontSize.md, color: Colors.textSecondary, marginTop: 4 },
  tabRow: {
    flexDirection: 'row', backgroundColor: Colors.gray100,
    borderRadius: Radius.md, padding: 4, marginBottom: Spacing.xl,
  },
  tab: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: Radius.sm },
  tabActive: { backgroundColor: Colors.white, ...Shadow.sm },
  tabText: { fontSize: FontSize.md, color: Colors.textSecondary, fontWeight: '600' },
  tabTextActive: { color: Colors.primary },
  errorBox: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.errorBg,
    padding: 12, borderRadius: Radius.md, marginBottom: 16, gap: 8,
  },
  errorText: { color: Colors.error, fontSize: FontSize.sm, flex: 1 },
  form: { gap: 12 },
  inputGroup: { gap: 6 },
  label: { fontSize: FontSize.sm, fontWeight: '600', color: Colors.gray700 },
  inputWrapper: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.white, borderRadius: Radius.md,
    borderWidth: 1.5, borderColor: Colors.border, paddingHorizontal: 12,
    ...Shadow.sm,
  },
  inputIcon: { marginRight: 8 },
  input: { flex: 1, paddingVertical: 13, fontSize: FontSize.base, color: Colors.gray900 },
  rightIcon: { padding: 4 },
  demo: { marginTop: Spacing.xl, alignItems: 'center' },
  demoText: { fontSize: FontSize.sm, color: Colors.textMuted, fontStyle: 'italic' },
});
