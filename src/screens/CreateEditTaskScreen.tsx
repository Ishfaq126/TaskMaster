import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, ScrollView, TouchableOpacity,
  StyleSheet, Alert, Platform, Modal, FlatList,
  KeyboardAvoidingView,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';
import { tasksAPI, usersAPI } from '../services/api';
import { useAuthStore } from '../store/authStore';
import { Colors, Spacing, FontSize, Radius, Shadow } from '../utils/theme';
import { priorityConfig, statusConfig } from '../utils/theme';
import { Button, Avatar, Badge, LoadingScreen } from '../components/ui';

const PRIORITIES = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'] as const;
const STATUSES = ['PENDING', 'IN_PROGRESS', 'DONE'] as const;

export default function CreateEditTaskScreen() {
  const { id } = useLocalSearchParams(); // present when editing
  const router = useRouter();
  const { user } = useAuthStore();
  const isEditing = !!id;

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [assigneeId, setAssigneeId] = useState<number | null>(null);
  const [assigneeName, setAssigneeName] = useState('');
  const [dueDate, setDueDate] = useState<Date | null>(null);
  const [priority, setPriority] = useState<string>('MEDIUM');
  const [status, setStatus] = useState<string>('PENDING');
  const [users, setUsers] = useState<any[]>([]);
  const [showUserPicker, setShowUserPicker] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [userSearch, setUserSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [initLoading, setInitLoading] = useState(isEditing);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    const fetchUsers = async () => {
      const { data } = await usersAPI.getAll();
      setUsers(data.users);
    };
    fetchUsers();

    if (isEditing) {
      const fetchTask = async () => {
        try {
          const { data } = await tasksAPI.getOne(parseInt(id as string));
          const t = data.task;
          setTitle(t.title);
          setDescription(t.description || '');
          setAssigneeId(t.assignedTo.id);
          setAssigneeName(t.assignedTo.name);
          setPriority(t.priority);
          setStatus(t.status);
          if (t.dueDate) setDueDate(new Date(t.dueDate));
        } catch { router.back(); }
        finally { setInitLoading(false); }
      };
      fetchTask();
    }
  }, []);

  const validate = () => {
    const e: Record<string, string> = {};
    if (!title.trim()) e.title = 'Title is required';
    if (title.trim().length > 100) e.title = 'Title must be under 100 characters';
    if (!assigneeId) e.assignee = 'Please select an assignee';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      const payload = {
        title: title.trim(),
        description: description.trim() || undefined,
        assignedToId: assigneeId,
        dueDate: dueDate?.toISOString() || null,
        priority,
        ...(isEditing ? { status } : {}),
      };

      if (isEditing) {
        await tasksAPI.update(parseInt(id as string), payload);
        router.back();
      } else {
        const { data } = await tasksAPI.create(payload);
        router.replace(`/task/${data.task.id}`);
      }
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to save task');
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = users.filter(u =>
    u.name.toLowerCase().includes(userSearch.toLowerCase()) ||
    u.email.toLowerCase().includes(userSearch.toLowerCase())
  );

  const quickDates = [
    { label: 'Today', value: new Date() },
    { label: 'Tomorrow', value: new Date(Date.now() + 86400000) },
    { label: 'In 3 days', value: new Date(Date.now() + 3 * 86400000) },
    { label: 'Next week', value: new Date(Date.now() + 7 * 86400000) },
    { label: 'In 2 weeks', value: new Date(Date.now() + 14 * 86400000) },
    { label: 'Next month', value: new Date(Date.now() + 30 * 86400000) },
  ];

  if (initLoading) return <LoadingScreen />;

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="close" size={22} color={Colors.gray700} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{isEditing ? 'Edit Task' : 'New Task'}</Text>
          <Button
            title={isEditing ? 'Save' : 'Create'}
            onPress={handleSubmit}
            loading={loading}
            size="sm"
          />
        </View>

        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          {/* Title */}
          <Field label="Title *" error={errors.title}>
            <TextInput
              style={[styles.textInput, errors.title && styles.inputError]}
              placeholder="What needs to be done?"
              placeholderTextColor={Colors.gray400}
              value={title}
              onChangeText={t => { setTitle(t); setErrors(e => ({ ...e, title: '' })); }}
              maxLength={100}
              autoFocus={!isEditing}
            />
            <Text style={styles.charCount}>{title.length}/100</Text>
          </Field>

          {/* Description */}
          <Field label="Description">
            <TextInput
              style={[styles.textInput, styles.textArea]}
              placeholder="Add details (optional)"
              placeholderTextColor={Colors.gray400}
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={3}
              maxLength={500}
            />
          </Field>

          {/* Assignee */}
          <Field label="Assignee *" error={errors.assignee}>
            <TouchableOpacity
              style={[styles.selector, errors.assignee && styles.inputError]}
              onPress={() => setShowUserPicker(true)}
            >
              {assigneeId ? (
                <View style={styles.selectedUser}>
                  <Avatar name={assigneeName} size={28} />
                  <Text style={styles.selectedUserName}>{assigneeName}</Text>
                </View>
              ) : (
                <>
                  <Ionicons name="person-add-outline" size={18} color={Colors.gray400} />
                  <Text style={styles.selectorPlaceholder}>Select assignee</Text>
                </>
              )}
              <Ionicons name="chevron-down" size={16} color={Colors.gray400} />
            </TouchableOpacity>
          </Field>

          {/* Due Date */}
          <Field label="Due Date">
            <TouchableOpacity
              style={styles.selector}
              onPress={() => setShowDatePicker(true)}
            >
              <Ionicons name="calendar-outline" size={18} color={Colors.gray400} />
              <Text style={[styles.selectorPlaceholder, dueDate && styles.selectorValue]}>
                {dueDate ? format(dueDate, 'MMM d, yyyy') : 'Set due date (optional)'}
              </Text>
              {dueDate ? (
                <TouchableOpacity onPress={() => setDueDate(null)}>
                  <Ionicons name="close-circle" size={18} color={Colors.gray400} />
                </TouchableOpacity>
              ) : (
                <Ionicons name="chevron-down" size={16} color={Colors.gray400} />
              )}
            </TouchableOpacity>
          </Field>

          {/* Priority */}
          <Field label="Priority">
            <View style={styles.chipRow}>
              {PRIORITIES.map(p => {
                const cfg = priorityConfig[p];
                const active = priority === p;
                return (
                  <TouchableOpacity
                    key={p}
                    style={[styles.chip, active && { backgroundColor: cfg.bg, borderColor: cfg.color }]}
                    onPress={() => setPriority(p)}
                  >
                    <Text style={[styles.chipText, active && { color: cfg.color }]}>
                      {cfg.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </Field>

          {/* Status (edit only) */}
          {isEditing && (
            <Field label="Status">
              <View style={styles.chipRow}>
                {STATUSES.map(s => {
                  const cfg = statusConfig[s];
                  const active = status === s;
                  return (
                    <TouchableOpacity
                      key={s}
                      style={[styles.chip, active && { backgroundColor: cfg.bg, borderColor: cfg.color }]}
                      onPress={() => setStatus(s)}
                    >
                      <Text style={[styles.chipText, active && { color: cfg.color }]}>
                        {cfg.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </Field>
          )}
        </ScrollView>

        {/* User Picker Modal */}
        <Modal visible={showUserPicker} animationType="slide" presentationStyle="pageSheet">
          <View style={styles.modal}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Assignee</Text>
              <TouchableOpacity onPress={() => setShowUserPicker(false)}>
                <Ionicons name="close" size={24} color={Colors.gray700} />
              </TouchableOpacity>
            </View>
            <View style={styles.modalSearch}>
              <Ionicons name="search" size={16} color={Colors.gray400} />
              <TextInput
                style={styles.modalSearchInput}
                placeholder="Search users..."
                value={userSearch}
                onChangeText={setUserSearch}
                autoFocus
              />
            </View>
            <FlatList
              data={filteredUsers}
              keyExtractor={u => String(u.id)}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[styles.userItem, assigneeId === item.id && styles.userItemActive]}
                  onPress={() => {
                    setAssigneeId(item.id);
                    setAssigneeName(item.name);
                    setErrors(e => ({ ...e, assignee: '' }));
                    setShowUserPicker(false);
                  }}
                >
                  <Avatar name={item.name} size={36} />
                  <View style={styles.userInfo}>
                    <Text style={styles.userName}>{item.name}</Text>
                    <Text style={styles.userEmail}>{item.email}</Text>
                  </View>
                  {assigneeId === item.id && (
                    <Ionicons name="checkmark-circle" size={22} color={Colors.primary} />
                  )}
                </TouchableOpacity>
              )}
            />
          </View>
        </Modal>

        {/* Date Picker Modal */}
        <Modal visible={showDatePicker} animationType="slide" presentationStyle="pageSheet">
          <View style={styles.modal}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Set Due Date</Text>
              <TouchableOpacity onPress={() => setShowDatePicker(false)}>
                <Ionicons name="close" size={24} color={Colors.gray700} />
              </TouchableOpacity>
            </View>
            <ScrollView contentContainerStyle={{ padding: Spacing.xl }}>
              <Text style={styles.datePickerLabel}>Quick Select</Text>
              <View style={styles.quickDateGrid}>
                {quickDates.map(qd => (
                  <TouchableOpacity
                    key={qd.label}
                    style={[styles.quickDate,
                      dueDate?.toDateString() === qd.value.toDateString() && styles.quickDateActive]}
                    onPress={() => { setDueDate(qd.value); setShowDatePicker(false); }}
                  >
                    <Text style={[styles.quickDateLabel,
                      dueDate?.toDateString() === qd.value.toDateString() && styles.quickDateLabelActive]}>
                      {qd.label}
                    </Text>
                    <Text style={[styles.quickDateSub,
                      dueDate?.toDateString() === qd.value.toDateString() && { color: Colors.primary }]}>
                      {format(qd.value, 'MMM d')}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
          </View>
        </Modal>
      </View>
    </KeyboardAvoidingView>
  );
}

const Field: React.FC<{ label: string; children: React.ReactNode; error?: string }> = ({ label, children, error }) => (
  <View style={styles.field}>
    <Text style={styles.fieldLabel}>{label}</Text>
    {children}
    {error && <Text style={styles.errorText}>{error}</Text>}
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: Spacing.lg, paddingVertical: 12,
    backgroundColor: Colors.surface, gap: 10, ...Shadow.sm,
  },
  backBtn: { padding: 4 },
  headerTitle: { flex: 1, fontSize: FontSize.xl, fontWeight: '700', color: Colors.gray900 },
  content: { padding: Spacing.xl, gap: 4 },
  field: { marginBottom: Spacing.lg },
  fieldLabel: { fontSize: FontSize.sm, fontWeight: '700', color: Colors.gray700, marginBottom: 8 },
  textInput: {
    backgroundColor: Colors.white, borderRadius: Radius.md,
    borderWidth: 1.5, borderColor: Colors.border,
    paddingHorizontal: 14, paddingVertical: 12,
    fontSize: FontSize.base, color: Colors.gray900, ...Shadow.sm,
  },
  textArea: { minHeight: 80, textAlignVertical: 'top' },
  inputError: { borderColor: Colors.error },
  charCount: { fontSize: FontSize.xs, color: Colors.textMuted, textAlign: 'right', marginTop: 4 },
  errorText: { fontSize: FontSize.sm, color: Colors.error, marginTop: 4 },
  selector: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.white, borderRadius: Radius.md,
    borderWidth: 1.5, borderColor: Colors.border,
    paddingHorizontal: 14, paddingVertical: 12, gap: 10, ...Shadow.sm,
  },
  selectorPlaceholder: { flex: 1, fontSize: FontSize.base, color: Colors.gray400 },
  selectorValue: { color: Colors.gray900 },
  selectedUser: { flexDirection: 'row', alignItems: 'center', flex: 1, gap: 10 },
  selectedUserName: { fontSize: FontSize.base, fontWeight: '600', color: Colors.gray900 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    paddingHorizontal: 14, paddingVertical: 8,
    borderRadius: Radius.full, backgroundColor: Colors.gray100,
    borderWidth: 1.5, borderColor: Colors.border,
  },
  chipText: { fontSize: FontSize.sm, color: Colors.textSecondary, fontWeight: '600' },
  modal: { flex: 1, backgroundColor: Colors.background },
  modalHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    padding: Spacing.xl, backgroundColor: Colors.surface, ...Shadow.sm,
  },
  modalTitle: { fontSize: FontSize.xl, fontWeight: '700', color: Colors.gray900 },
  modalSearch: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    margin: Spacing.lg, backgroundColor: Colors.white,
    borderRadius: Radius.md, borderWidth: 1, borderColor: Colors.border,
    paddingHorizontal: 14, paddingVertical: 10,
  },
  modalSearchInput: { flex: 1, fontSize: FontSize.base, color: Colors.gray900 },
  userItem: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    padding: Spacing.lg, borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  userItemActive: { backgroundColor: Colors.primaryBg },
  userInfo: { flex: 1 },
  userName: { fontSize: FontSize.base, fontWeight: '700', color: Colors.gray900 },
  userEmail: { fontSize: FontSize.sm, color: Colors.textSecondary },
  datePickerLabel: { fontSize: FontSize.md, fontWeight: '700', color: Colors.gray700, marginBottom: 16 },
  quickDateGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  quickDate: {
    width: '47%', padding: Spacing.md, borderRadius: Radius.md,
    backgroundColor: Colors.white, borderWidth: 1.5, borderColor: Colors.border,
    alignItems: 'center', ...Shadow.sm,
  },
  quickDateActive: { backgroundColor: Colors.primaryBg, borderColor: Colors.primary },
  quickDateLabel: { fontSize: FontSize.md, fontWeight: '700', color: Colors.gray800 },
  quickDateLabelActive: { color: Colors.primary },
  quickDateSub: { fontSize: FontSize.sm, color: Colors.textSecondary, marginTop: 4 },
});
