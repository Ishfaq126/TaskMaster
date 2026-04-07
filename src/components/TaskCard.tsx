import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { formatDistanceToNow, isPast, isToday, isTomorrow, format } from 'date-fns';
import { Colors, Spacing, FontSize, Radius, Shadow } from '../utils/theme';
import { Avatar, Badge } from './ui';
import { statusConfig, priorityConfig } from '../utils/theme';

interface Task {
  id: number;
  title: string;
  description?: string;
  status: keyof typeof statusConfig;
  priority: keyof typeof priorityConfig;
  dueDate?: string;
  createdBy: { id: number; name: string; avatar?: string };
  assignedTo: { id: number; name: string; avatar?: string };
  _count?: { comments: number };
}

interface TaskCardProps {
  task: Task;
  onPress: () => void;
  currentUserId: number;
  onStatusChange?: (status: string) => void;
  showCreator?: boolean;
}

export const TaskCard: React.FC<TaskCardProps> = ({
  task, onPress, currentUserId, onStatusChange, showCreator = false,
}) => {
  const status = statusConfig[task.status];
  const priority = priorityConfig[task.priority];
  const isAssignee = task.assignedTo.id === currentUserId;
  const isCreator = task.createdBy.id === currentUserId;
  const isDone = task.status === 'DONE';
  const isCancelled = task.status === 'CANCELLED';

  const dueDateLabel = () => {
    if (!task.dueDate) return null;
    const date = new Date(task.dueDate);
    if (isDone) return null;
    if (isPast(date)) return { text: 'Overdue', color: Colors.error };
    if (isToday(date)) return { text: 'Due today', color: Colors.warning };
    if (isTomorrow(date)) return { text: 'Due tomorrow', color: Colors.secondary };
    return { text: format(date, 'MMM d'), color: Colors.textSecondary };
  };

  const due = dueDateLabel();

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.92}
      style={[
        styles.card,
        isDone && styles.doneCard,
        isCancelled && styles.cancelledCard,
      ]}
    >
      {/* Priority strip */}
      <View style={[styles.priorityStrip, { backgroundColor: priority.color }]} />

      <View style={styles.body}>
        {/* Header row */}
        <View style={styles.headerRow}>
          <View style={styles.badges}>
            <Badge label={status.label} color={status.color} bg={status.bg} size="sm" />
            <View style={{ width: 6 }} />
            <Badge label={priority.label} color={priority.color} bg={priority.bg} size="sm" />
          </View>
          {isAssignee && !isCreator && (
            <View style={styles.assignedToMe}>
              <Ionicons name="person" size={10} color={Colors.primary} />
              <Text style={styles.assignedToMeText}>Assigned to me</Text>
            </View>
          )}
        </View>

        {/* Title */}
        <Text
          style={[styles.title, (isDone || isCancelled) && styles.strikethrough]}
          numberOfLines={2}
        >
          {task.title}
        </Text>

        {task.description && (
          <Text style={styles.description} numberOfLines={1}>
            {task.description}
          </Text>
        )}

        {/* Footer */}
        <View style={styles.footer}>
          <View style={styles.footerLeft}>
            <Avatar name={task.assignedTo.name} size={24} />
            <Text style={styles.assigneeName} numberOfLines={1}>
              {isAssignee ? 'You' : task.assignedTo.name}
            </Text>
          </View>

          <View style={styles.footerRight}>
            {task._count?.comments ? (
              <View style={styles.commentBadge}>
                <Ionicons name="chatbubble-outline" size={12} color={Colors.textSecondary} />
                <Text style={styles.commentCount}>{task._count.comments}</Text>
              </View>
            ) : null}

            {due && (
              <View style={styles.dueDateRow}>
                <Ionicons
                  name={due.color === Colors.error ? 'alert-circle' : 'time-outline'}
                  size={12}
                  color={due.color}
                />
                <Text style={[styles.dueText, { color: due.color }]}>{due.text}</Text>
              </View>
            )}
          </View>
        </View>

        {/* Quick actions for assignee/creator */}
        {onStatusChange && !isDone && !isCancelled && (isAssignee || isCreator) && (
          <View style={styles.quickActions}>
            {task.status === 'PENDING' && (
              <TouchableOpacity
                style={[styles.quickBtn, { backgroundColor: Colors.inProgressBg }]}
                onPress={() => onStatusChange('IN_PROGRESS')}
              >
                <Ionicons name="play" size={11} color={Colors.inProgress} />
                <Text style={[styles.quickBtnText, { color: Colors.inProgress }]}>Start</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={[styles.quickBtn, { backgroundColor: Colors.doneBg }]}
              onPress={() => onStatusChange('DONE')}
            >
              <Ionicons name="checkmark" size={11} color={Colors.done} />
              <Text style={[styles.quickBtnText, { color: Colors.done }]}>Done</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    marginBottom: Spacing.md,
    flexDirection: 'row',
    overflow: 'hidden',
    ...Shadow.md,
  },
  doneCard: { opacity: 0.7 },
  cancelledCard: { opacity: 0.5 },
  priorityStrip: { width: 4 },
  body: { flex: 1, padding: Spacing.md },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.sm,
  },
  badges: { flexDirection: 'row', alignItems: 'center' },
  assignedToMe: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primaryBg,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: Radius.full,
  },
  assignedToMeText: { fontSize: 9, color: Colors.primary, fontWeight: '600', marginLeft: 2 },
  title: { fontSize: FontSize.base, fontWeight: '700', color: Colors.gray900, marginBottom: 4 },
  strikethrough: { textDecorationLine: 'line-through', color: Colors.textSecondary },
  description: { fontSize: FontSize.sm, color: Colors.textSecondary, marginBottom: Spacing.sm },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 6,
  },
  footerLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  assigneeName: { fontSize: FontSize.sm, color: Colors.textSecondary, marginLeft: 6, flex: 1 },
  footerRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  commentBadge: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  commentCount: { fontSize: FontSize.xs, color: Colors.textSecondary },
  dueDateRow: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  dueText: { fontSize: FontSize.xs, fontWeight: '600' },
  quickActions: { flexDirection: 'row', gap: 8, marginTop: 8 },
  quickBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 10, paddingVertical: 5, borderRadius: Radius.full,
  },
  quickBtnText: { fontSize: FontSize.xs, fontWeight: '700' },
});
