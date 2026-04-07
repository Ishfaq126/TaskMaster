import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, ScrollView, TextInput, TouchableOpacity,
  StyleSheet, Alert, KeyboardAvoidingView, Platform,
  ActionSheetIOS, ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { format, formatDistanceToNow } from 'date-fns';
import { tasksAPI, commentsAPI } from '../services/api';
import { useAuthStore } from '../store/authStore';
import { Colors, Spacing, FontSize, Radius, Shadow } from '../utils/theme';
import { statusConfig, priorityConfig } from '../utils/theme';
import { Badge, Avatar, Button, Card, LoadingScreen, Divider } from '../components/ui';

export default function TaskDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { user } = useAuthStore();
  const [task, setTask] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [editingComment, setEditingComment] = useState<any>(null);
  const scrollRef = useRef<ScrollView>(null);

  const taskId = parseInt(id as string);
  const isAdmin = user?.role === 'ADMIN';
  const isCreator = task?.createdBy?.id === user?.id;
  const isAssignee = task?.assignedTo?.id === user?.id;
  const canEdit = isAdmin || isCreator;
  const canChangeStatus = isAdmin || isCreator || isAssignee;

  const fetchTask = useCallback(async () => {
    try {
      const { data } = await tasksAPI.getOne(taskId);
      setTask(data.task);
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to load task');
      router.back();
    } finally {
      setLoading(false);
    }
  }, [taskId]);

  useEffect(() => { fetchTask(); }, [fetchTask]);

  const handleStatusChange = async (newStatus: string) => {
    try {
      await tasksAPI.updateStatus(taskId, newStatus);
      setTask((prev: any) => ({ ...prev, status: newStatus }));
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to update status');
    }
  };

  const showStatusPicker = () => {
    const options = ['Cancel', 'Pending', 'In Progress', 'Done'];
    const statuses = ['', 'PENDING', 'IN_PROGRESS', 'DONE'];
    if (isAdmin) { options.push('Cancelled'); statuses.push('CANCELLED'); }

    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        { options, cancelButtonIndex: 0, title: 'Change Status' },
        (idx) => { if (idx > 0) handleStatusChange(statuses[idx]); }
      );
    } else {
      Alert.alert('Change Status', '', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Pending', onPress: () => handleStatusChange('PENDING') },
        { text: 'In Progress', onPress: () => handleStatusChange('IN_PROGRESS') },
        { text: 'Done', onPress: () => handleStatusChange('DONE') },
        ...(isAdmin ? [{ text: 'Cancelled', onPress: () => handleStatusChange('CANCELLED') }] : []),
      ]);
    }
  };

  const handleDelete = () => {
    Alert.alert('Delete Task', 'Are you sure? This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive',
        onPress: async () => {
          try {
            await tasksAPI.delete(taskId);
            router.back();
          } catch (err: any) {
            Alert.alert('Error', err.response?.data?.message || 'Failed to delete');
          }
        },
      },
    ]);
  };

  const submitComment = async () => {
    if (!comment.trim()) return;
    setSubmitting(true);
    try {
      if (editingComment) {
        const { data } = await commentsAPI.update(editingComment.id, comment.trim());
        setTask((prev: any) => ({
          ...prev,
          comments: prev.comments.map((c: any) =>
            c.id === editingComment.id ? data.comment : c
          ),
        }));
        setEditingComment(null);
      } else {
        const { data } = await commentsAPI.add(taskId, comment.trim());
        setTask((prev: any) => ({
          ...prev,
          comments: [...(prev.comments || []), data.comment],
        }));
        setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
      }
      setComment('');
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to submit comment');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteComment = (commentId: number) => {
    Alert.alert('Delete Comment', 'Delete this comment?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive',
        onPress: async () => {
          try {
            await commentsAPI.delete(commentId);
            setTask((prev: any) => ({
              ...prev,
              comments: prev.comments.filter((c: any) => c.id !== commentId),
            }));
          } catch { Alert.alert('Error', 'Failed to delete comment'); }
        },
      },
    ]);
  };

  if (loading) return <LoadingScreen message="Loading task..." />;
  if (!task) return null;

  const status = statusConfig[task.status as keyof typeof statusConfig];
  const priority = priorityConfig[task.priority as keyof typeof priorityConfig];

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={90}
    >
      <View style={styles.container}>
        {/* Top bar */}
        <View style={styles.topBar}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={22} color={Colors.gray700} />
          </TouchableOpacity>
          <Text style={styles.topTitle} numberOfLines={1}>Task Detail</Text>
          <View style={styles.topActions}>
            {canEdit && (
              <TouchableOpacity
                style={styles.iconBtn}
                onPress={() => router.push(`/edit-task/${taskId}`)}
              >
                <Ionicons name="pencil-outline" size={20} color={Colors.gray700} />
              </TouchableOpacity>
            )}
            {canEdit && (
              <TouchableOpacity style={[styles.iconBtn, { backgroundColor: Colors.errorBg }]} onPress={handleDelete}>
                <Ionicons name="trash-outline" size={20} color={Colors.error} />
              </TouchableOpacity>
            )}
          </View>
        </View>

        <ScrollView
          ref={scrollRef}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Title + badges */}
          <View style={styles.titleSection}>
            <View style={styles.badgeRow}>
              <Badge label={status.label} color={status.color} bg={status.bg} />
              <View style={{ width: 8 }} />
              <Badge label={priority.label} color={priority.color} bg={priority.bg} />
            </View>
            <Text style={styles.title}>{task.title}</Text>
            {task.description && (
              <Text style={styles.description}>{task.description}</Text>
            )}
          </View>

          {/* Meta card */}
          <Card style={styles.metaCard}>
            <MetaRow icon="person-outline" label="Creator">
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Avatar name={task.createdBy.name} size={24} />
                <Text style={styles.metaValue}>{task.createdBy.name}</Text>
              </View>
            </MetaRow>
            <Divider style={{ marginVertical: 10 }} />
            <MetaRow icon="person-circle-outline" label="Assignee">
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Avatar name={task.assignedTo.name} size={24} />
                <Text style={styles.metaValue}>{task.assignedTo.name}</Text>
              </View>
            </MetaRow>
            {task.dueDate && (
              <>
                <Divider style={{ marginVertical: 10 }} />
                <MetaRow icon="calendar-outline" label="Due Date">
                  <Text style={styles.metaValue}>{format(new Date(task.dueDate), 'PPP')}</Text>
                </MetaRow>
              </>
            )}
            {task.completedAt && (
              <>
                <Divider style={{ marginVertical: 10 }} />
                <MetaRow icon="checkmark-circle-outline" label="Completed">
                  <Text style={[styles.metaValue, { color: Colors.success }]}>
                    {format(new Date(task.completedAt), 'PPP')}
                  </Text>
                </MetaRow>
              </>
            )}
            <Divider style={{ marginVertical: 10 }} />
            <MetaRow icon="time-outline" label="Created">
              <Text style={styles.metaValue}>
                {formatDistanceToNow(new Date(task.createdAt), { addSuffix: true })}
              </Text>
            </MetaRow>
          </Card>

          {/* Status action */}
          {canChangeStatus && task.status !== 'DONE' && task.status !== 'CANCELLED' && (
            <View style={styles.actionRow}>
              {task.status !== 'IN_PROGRESS' && (
                <Button
                  title="Start Task"
                  icon="play-outline"
                  variant="outline"
                  onPress={() => handleStatusChange('IN_PROGRESS')}
                  style={{ flex: 1 }}
                />
              )}
              <Button
                title="Mark Done"
                icon="checkmark-circle-outline"
                onPress={() => handleStatusChange('DONE')}
                style={{ flex: 1 }}
              />
            </View>
          )}

          {canChangeStatus && (
            <TouchableOpacity style={styles.changeStatusBtn} onPress={showStatusPicker}>
              <Ionicons name="swap-horizontal-outline" size={16} color={Colors.primary} />
              <Text style={styles.changeStatusText}>Change Status</Text>
            </TouchableOpacity>
          )}

          {/* Comments */}
          <View style={styles.commentsSection}>
            <View style={styles.commentHeader}>
              <Ionicons name="chatbubbles-outline" size={18} color={Colors.gray700} />
              <Text style={styles.commentsTitle}>
                Comments ({task.comments?.length || 0})
              </Text>
            </View>

            {task.comments?.length === 0 && (
              <View style={styles.noComments}>
                <Text style={styles.noCommentsText}>No comments yet. Be the first!</Text>
              </View>
            )}

            {task.comments?.map((c: any) => (
              <CommentItem
                key={c.id}
                comment={c}
                isOwn={c.user.id === user?.id}
                isAdmin={isAdmin}
                onEdit={() => {
                  setEditingComment(c);
                  setComment(c.content);
                }}
                onDelete={() => handleDeleteComment(c.id)}
              />
            ))}
          </View>
        </ScrollView>

        {/* Comment input */}
        <View style={styles.commentInput}>
          {editingComment && (
            <View style={styles.editingBanner}>
              <Ionicons name="pencil" size={14} color={Colors.primary} />
              <Text style={styles.editingText}>Editing comment</Text>
              <TouchableOpacity onPress={() => { setEditingComment(null); setComment(''); }}>
                <Ionicons name="close" size={16} color={Colors.gray500} />
              </TouchableOpacity>
            </View>
          )}
          <View style={styles.inputRow}>
            <Avatar name={user?.name || 'U'} size={32} />
            <TextInput
              style={styles.commentBox}
              placeholder="Add a comment..."
              placeholderTextColor={Colors.gray400}
              value={comment}
              onChangeText={setComment}
              multiline
              maxLength={500}
            />
            <TouchableOpacity
              style={[styles.sendBtn, (!comment.trim() || submitting) && styles.sendBtnDisabled]}
              onPress={submitComment}
              disabled={!comment.trim() || submitting}
            >
              {submitting
                ? <ActivityIndicator size="small" color={Colors.white} />
                : <Ionicons name="send" size={16} color={Colors.white} />
              }
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const MetaRow: React.FC<{ icon: string; label: string; children: React.ReactNode }> = ({ icon, label, children }) => (
  <View style={styles.metaRow}>
    <View style={styles.metaLabel}>
      <Ionicons name={icon as any} size={14} color={Colors.gray500} />
      <Text style={styles.metaLabelText}>{label}</Text>
    </View>
    {children}
  </View>
);

const CommentItem: React.FC<{
  comment: any; isOwn: boolean; isAdmin: boolean;
  onEdit: () => void; onDelete: () => void;
}> = ({ comment, isOwn, isAdmin, onEdit, onDelete }) => {
  const canEdit = isOwn && (Date.now() - new Date(comment.createdAt).getTime() < 5 * 60 * 1000);

  return (
    <View style={styles.comment}>
      <Avatar name={comment.user.name} size={32} />
      <View style={styles.commentContent}>
        <View style={styles.commentMeta}>
          <Text style={styles.commenterName}>{comment.user.name}</Text>
          <Text style={styles.commentTime}>
            {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
          </Text>
          {comment.editedAt && <Text style={styles.editedTag}>edited</Text>}
        </View>
        <View style={styles.commentBubble}>
          <Text style={styles.commentText}>{comment.content}</Text>
        </View>
        {(canEdit || isAdmin || isOwn) && (
          <View style={styles.commentActions}>
            {canEdit && (
              <TouchableOpacity onPress={onEdit}>
                <Text style={styles.commentActionText}>Edit</Text>
              </TouchableOpacity>
            )}
            {(isAdmin || isOwn) && (
              <TouchableOpacity onPress={onDelete}>
                <Text style={[styles.commentActionText, { color: Colors.error }]}>Delete</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  topBar: {
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.lg,
    paddingVertical: 12, backgroundColor: Colors.surface, ...Shadow.sm,
    gap: 10,
  },
  backBtn: { padding: 4 },
  topTitle: { flex: 1, fontSize: FontSize.lg, fontWeight: '700', color: Colors.gray900 },
  topActions: { flexDirection: 'row', gap: 8 },
  iconBtn: {
    width: 36, height: 36, borderRadius: Radius.md,
    backgroundColor: Colors.gray100, alignItems: 'center', justifyContent: 'center',
  },
  content: { padding: Spacing.xl, paddingBottom: 20 },
  titleSection: { marginBottom: Spacing.lg },
  badgeRow: { flexDirection: 'row', marginBottom: Spacing.sm },
  title: { fontSize: FontSize.xxl, fontWeight: '800', color: Colors.gray900, lineHeight: 28 },
  description: { fontSize: FontSize.base, color: Colors.gray600, marginTop: 8, lineHeight: 22 },
  metaCard: { marginBottom: Spacing.lg },
  metaRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  metaLabel: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  metaLabelText: { fontSize: FontSize.sm, color: Colors.textSecondary, fontWeight: '600' },
  metaValue: { fontSize: FontSize.sm, color: Colors.gray800, fontWeight: '600' },
  actionRow: {
    flexDirection: 'row', gap: 10, marginBottom: 10,
  },
  changeStatusBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, paddingVertical: 10, marginBottom: Spacing.lg,
  },
  changeStatusText: { fontSize: FontSize.sm, color: Colors.primary, fontWeight: '600' },
  commentsSection: { marginTop: 4 },
  commentHeader: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    marginBottom: Spacing.md,
  },
  commentsTitle: { fontSize: FontSize.lg, fontWeight: '700', color: Colors.gray800 },
  noComments: { alignItems: 'center', padding: Spacing.xl },
  noCommentsText: { color: Colors.textMuted, fontSize: FontSize.md },
  comment: { flexDirection: 'row', marginBottom: 16, gap: 10 },
  commentContent: { flex: 1 },
  commentMeta: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 5 },
  commenterName: { fontSize: FontSize.sm, fontWeight: '700', color: Colors.gray800 },
  commentTime: { fontSize: FontSize.xs, color: Colors.textMuted },
  editedTag: { fontSize: FontSize.xs, color: Colors.textMuted, fontStyle: 'italic' },
  commentBubble: {
    backgroundColor: Colors.gray100, borderRadius: Radius.md,
    padding: Spacing.md, borderTopLeftRadius: 4,
  },
  commentText: { fontSize: FontSize.md, color: Colors.gray800, lineHeight: 20 },
  commentActions: { flexDirection: 'row', gap: 12, marginTop: 5 },
  commentActionText: { fontSize: FontSize.xs, color: Colors.primary, fontWeight: '600' },
  commentInput: {
    backgroundColor: Colors.surface, borderTopWidth: 1,
    borderTopColor: Colors.border, padding: Spacing.md,
  },
  editingBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: Colors.primaryBg, padding: 8,
    borderRadius: Radius.sm, marginBottom: 8,
  },
  editingText: { flex: 1, fontSize: FontSize.sm, color: Colors.primary, fontWeight: '600' },
  inputRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 10 },
  commentBox: {
    flex: 1, backgroundColor: Colors.gray100,
    borderRadius: Radius.md, paddingHorizontal: 14,
    paddingVertical: 10, fontSize: FontSize.md,
    color: Colors.gray900, maxHeight: 100,
  },
  sendBtn: {
    width: 38, height: 38, borderRadius: Radius.md,
    backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center',
  },
  sendBtnDisabled: { opacity: 0.4 },
});
