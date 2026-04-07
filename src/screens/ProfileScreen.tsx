import React, { useState } from 'react';
import {
  View, Text, ScrollView, TextInput, TouchableOpacity,
  StyleSheet, Alert, Switch,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../store/authStore';
import { authAPI } from '../services/api';
import { Colors, Spacing, FontSize, Radius, Shadow } from '../utils/theme';
import { Avatar, Button, Card, Divider } from '../components/ui';

export default function ProfileScreen() {
  const { user, logout, updateUser } = useAuthStore();
  const [editingProfile, setEditingProfile] = useState(false);
  const [name, setName] = useState(user?.name || '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassSection, setShowPassSection] = useState(false);
  const [notifEnabled, setNotifEnabled] = useState(true);

  const handleSaveProfile = async () => {
    if (!name.trim()) { Alert.alert('Error', 'Name is required'); return; }
    setLoading(true);
    try {
      const payload: any = { name: name.trim() };
      if (showPassSection) {
        if (!currentPassword || !newPassword) {
          Alert.alert('Error', 'Fill in all password fields'); setLoading(false); return;
        }
        if (newPassword !== confirmPassword) {
          Alert.alert('Error', 'New passwords do not match'); setLoading(false); return;
        }
        if (newPassword.length < 6) {
          Alert.alert('Error', 'Password must be at least 6 characters'); setLoading(false); return;
        }
        payload.currentPassword = currentPassword;
        payload.newPassword = newPassword;
      }
      const { data } = await authAPI.updateProfile(payload);
      updateUser(data.user);
      setEditingProfile(false);
      setShowPassSection(false);
      setCurrentPassword(''); setNewPassword(''); setConfirmPassword('');
      Alert.alert('Success', 'Profile updated!');
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.message || 'Update failed');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    Alert.alert('Log Out', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Log Out', style: 'destructive', onPress: logout },
    ]);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Hero section */}
      <View style={styles.hero}>
        <View style={styles.avatarWrapper}>
          <Avatar name={user?.name || 'U'} size={80} />
          <View style={[styles.roleDot,
            { backgroundColor: user?.role === 'ADMIN' ? Colors.urgent : Colors.primary }
          ]}>
            <Ionicons name={user?.role === 'ADMIN' ? 'shield-checkmark' : 'person'} size={10} color={Colors.white} />
          </View>
        </View>
        <Text style={styles.heroName}>{user?.name}</Text>
        <Text style={styles.heroEmail}>{user?.email}</Text>
        <View style={[styles.roleTag, { backgroundColor: user?.role === 'ADMIN' ? Colors.urgentBg : Colors.primaryBg }]}>
          <Text style={[styles.roleTagText, { color: user?.role === 'ADMIN' ? Colors.urgent : Colors.primary }]}>
            {user?.role === 'ADMIN' ? '🛡️ Administrator' : '👤 Team Member'}
          </Text>
        </View>
      </View>

      {/* Edit Profile */}
      <Card style={styles.section}>
        <View style={styles.sectionHeader}>
          <Ionicons name="person-outline" size={18} color={Colors.primary} />
          <Text style={styles.sectionTitle}>Profile Info</Text>
          <TouchableOpacity onPress={() => setEditingProfile(!editingProfile)} style={styles.editBtn}>
            <Ionicons name={editingProfile ? 'close-outline' : 'pencil-outline'} size={18} color={Colors.primary} />
          </TouchableOpacity>
        </View>

        <Divider style={{ marginVertical: 12 }} />

        {editingProfile ? (
          <View style={styles.editForm}>
            <View style={styles.field}>
              <Text style={styles.fieldLabel}>Full Name</Text>
              <TextInput
                style={styles.input}
                value={name}
                onChangeText={setName}
                placeholder="Your name"
                placeholderTextColor={Colors.gray400}
              />
            </View>

            <TouchableOpacity
              style={styles.passToggle}
              onPress={() => setShowPassSection(!showPassSection)}
            >
              <Ionicons name={showPassSection ? 'chevron-up' : 'chevron-down'} size={16} color={Colors.primary} />
              <Text style={styles.passToggleText}>
                {showPassSection ? 'Hide password change' : 'Change password'}
              </Text>
            </TouchableOpacity>

            {showPassSection && (
              <>
                <View style={styles.field}>
                  <Text style={styles.fieldLabel}>Current Password</Text>
                  <TextInput
                    style={styles.input}
                    value={currentPassword}
                    onChangeText={setCurrentPassword}
                    secureTextEntry
                    placeholder="Current password"
                    placeholderTextColor={Colors.gray400}
                  />
                </View>
                <View style={styles.field}>
                  <Text style={styles.fieldLabel}>New Password</Text>
                  <TextInput
                    style={styles.input}
                    value={newPassword}
                    onChangeText={setNewPassword}
                    secureTextEntry
                    placeholder="Min. 6 characters"
                    placeholderTextColor={Colors.gray400}
                  />
                </View>
                <View style={styles.field}>
                  <Text style={styles.fieldLabel}>Confirm New Password</Text>
                  <TextInput
                    style={styles.input}
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    secureTextEntry
                    placeholder="Repeat new password"
                    placeholderTextColor={Colors.gray400}
                  />
                </View>
              </>
            )}

            <Button title="Save Changes" onPress={handleSaveProfile} loading={loading} fullWidth />
          </View>
        ) : (
          <View style={styles.profileInfo}>
            <InfoRow label="Name" value={user?.name || ''} icon="person-outline" />
            <Divider style={{ marginVertical: 10 }} />
            <InfoRow label="Email" value={user?.email || ''} icon="mail-outline" />
            <Divider style={{ marginVertical: 10 }} />
            <InfoRow label="Role" value={user?.role === 'ADMIN' ? 'Administrator' : 'Team Member'} icon="shield-outline" />
          </View>
        )}
      </Card>

      {/* Preferences */}
      <Card style={styles.section}>
        <View style={styles.sectionHeader}>
          <Ionicons name="settings-outline" size={18} color={Colors.primary} />
          <Text style={styles.sectionTitle}>Preferences</Text>
        </View>
        <Divider style={{ marginVertical: 12 }} />
        <View style={styles.prefRow}>
          <View style={styles.prefLabel}>
            <Ionicons name="notifications-outline" size={18} color={Colors.gray600} />
            <Text style={styles.prefLabelText}>Push Notifications</Text>
          </View>
          <Switch
            value={notifEnabled}
            onValueChange={setNotifEnabled}
            trackColor={{ false: Colors.gray200, true: Colors.primaryLight }}
            thumbColor={notifEnabled ? Colors.primary : Colors.gray400}
          />
        </View>
      </Card>

      {/* Danger zone */}
      <Card style={[styles.section, styles.dangerCard]}>
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={20} color={Colors.error} />
          <Text style={styles.logoutText}>Log Out</Text>
        </TouchableOpacity>
      </Card>

      <Text style={styles.version}>TaskMaster v1.0.0</Text>
    </ScrollView>
  );
}

const InfoRow: React.FC<{ label: string; value: string; icon: string }> = ({ label, value, icon }) => (
  <View style={styles.infoRow}>
    <View style={styles.infoLabel}>
      <Ionicons name={icon as any} size={14} color={Colors.gray400} />
      <Text style={styles.infoLabelText}>{label}</Text>
    </View>
    <Text style={styles.infoValue}>{value}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: Spacing.xl, paddingBottom: 100, gap: 16 },
  hero: { alignItems: 'center', paddingVertical: Spacing.xxl },
  avatarWrapper: { position: 'relative', marginBottom: 12 },
  roleDot: {
    position: 'absolute', bottom: 0, right: 0,
    width: 22, height: 22, borderRadius: 11,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: Colors.white,
  },
  heroName: { fontSize: FontSize.xxl, fontWeight: '800', color: Colors.gray900 },
  heroEmail: { fontSize: FontSize.md, color: Colors.textSecondary, marginTop: 4 },
  roleTag: { marginTop: 10, paddingHorizontal: 14, paddingVertical: 6, borderRadius: Radius.full },
  roleTagText: { fontSize: FontSize.sm, fontWeight: '700' },
  section: {},
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  sectionTitle: { flex: 1, fontSize: FontSize.lg, fontWeight: '700', color: Colors.gray900 },
  editBtn: { padding: 4 },
  editForm: { gap: 12 },
  field: { gap: 6 },
  fieldLabel: { fontSize: FontSize.sm, fontWeight: '600', color: Colors.gray700 },
  input: {
    backgroundColor: Colors.gray100, borderRadius: Radius.md,
    borderWidth: 1.5, borderColor: Colors.border,
    paddingHorizontal: 14, paddingVertical: 12,
    fontSize: FontSize.base, color: Colors.gray900,
  },
  passToggle: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 4 },
  passToggleText: { fontSize: FontSize.sm, color: Colors.primary, fontWeight: '600' },
  profileInfo: {},
  infoRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  infoLabel: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  infoLabelText: { fontSize: FontSize.sm, color: Colors.textSecondary },
  infoValue: { fontSize: FontSize.sm, fontWeight: '700', color: Colors.gray900 },
  prefRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  prefLabel: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  prefLabelText: { fontSize: FontSize.md, color: Colors.gray800 },
  dangerCard: { borderWidth: 1, borderColor: Colors.errorBg },
  logoutBtn: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  logoutText: { fontSize: FontSize.lg, color: Colors.error, fontWeight: '700' },
  version: { textAlign: 'center', fontSize: FontSize.sm, color: Colors.textMuted, marginTop: 8 },
});
