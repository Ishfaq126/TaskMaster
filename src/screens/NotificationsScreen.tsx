import React, { useState, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity,
  StyleSheet, RefreshControl, Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { formatDistanceToNow } from 'date-fns';
import { notificationsAPI } from '../services/api';
import { Colors, Spacing, FontSize, Radius, Shadow } from '../utils/theme';
import { EmptyState, LoadingScreen } from '../components/ui';

const notifIcons: Record<string, { icon: string; color: string; bg: string }> = {
  TASK_ASSIGNED: { icon: 'person-add-outline', color: Colors.primary, bg: Colors.primaryBg },
  TASK_REASSIGNED: { icon: 'swap-horizontal-outline', color: Colors.secondary, bg: Colors.secondaryBg },
  TASK_COMPLETED: { icon: 'checkmark-circle-outline', color: Colors.success, bg: Colors.successBg },
  TASK_OVERDUE: { icon: 'alert-circle-outline', color: Colors.error, bg: Colors.errorBg },
  TASK_DUE_SOON: { icon: 'time-outline', color: Colors.warning, bg: Colors.warningBg },
  COMMENT_ADDED: { icon: 'chatbubble-outline', color: Colors.info, bg: Colors.infoBg },
  STATUS_CHANGED: { icon: 'refresh-outline', color: Colors.primary, bg: Colors.primaryBg },
  TASK_DELETED: { icon: 'trash-outline', color: Colors.error, bg: Colors.errorBg },
};

export default function NotificationsScreen() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchNotifications = async () => {
    try {
      const { data } = await notificationsAPI.getAll({ limit: 50 });
      setNotifications(data.notifications);
      setUnreadCount(data.unreadCount);
    } catch {}
    finally { setLoading(false); setRefreshing(false); }
  };

  useFocusEffect(useCallback(() => { fetchNotifications(); }, []));

  const markRead = async (id: number) => {
    await notificationsAPI.markRead(id);
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  const markAllRead = async () => {
    await notificationsAPI.markAllRead();
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    setUnreadCount(0);
  };

  const deleteNotif = async (id: number) => {
    await notificationsAPI.delete(id);
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const handlePress = (notif: any) => {
    if (!notif.read) markRead(notif.id);
    const taskId = notif.data?.taskId;
    if (taskId) router.push(`/task/${taskId}`);
  };

  if (loading) return <LoadingScreen message="Loading notifications..." />;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Notifications</Text>
        {unreadCount > 0 && (
          <View style={styles.headerRight}>
            <View style={styles.unreadBadge}>
              <Text style={styles.unreadBadgeText}>{unreadCount}</Text>
            </View>
            <TouchableOpacity onPress={markAllRead} style={styles.markAllBtn}>
              <Text style={styles.markAllText}>Mark all read</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      <FlatList
        data={notifications}
        keyExtractor={item => String(item.id)}
        renderItem={({ item }) => {
          const iconCfg = notifIcons[item.type] || notifIcons.STATUS_CHANGED;
          return (
            <TouchableOpacity
              style={[styles.notifItem, !item.read && styles.notifUnread]}
              onPress={() => handlePress(item)}
              activeOpacity={0.85}
            >
              <View style={[styles.iconCircle, { backgroundColor: iconCfg.bg }]}>
                <Ionicons name={iconCfg.icon as any} size={20} color={iconCfg.color} />
              </View>
              <View style={styles.notifContent}>
                <Text style={styles.notifTitle}>{item.title}</Text>
                <Text style={styles.notifBody}>{item.body}</Text>
                <Text style={styles.notifTime}>
                  {formatDistanceToNow(new Date(item.createdAt), { addSuffix: true })}
                </Text>
              </View>
              <View style={styles.notifActions}>
                {!item.read && <View style={styles.unreadDot} />}
                <TouchableOpacity
                  onPress={() => deleteNotif(item.id)}
                  style={styles.deleteBtn}
                  hitSlop={{ top: 8, right: 8, bottom: 8, left: 8 }}
                >
                  <Ionicons name="close" size={16} color={Colors.gray400} />
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          );
        }}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => { setRefreshing(true); fetchNotifications(); }}
            tintColor={Colors.primary}
          />
        }
        ListEmptyComponent={
          <EmptyState
            icon="notifications-off-outline"
            title="No notifications"
            subtitle="You're all caught up!"
          />
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Spacing.xl, paddingVertical: 14,
    backgroundColor: Colors.surface, ...Shadow.sm,
  },
  headerTitle: { fontSize: FontSize.xl, fontWeight: '800', color: Colors.gray900 },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  unreadBadge: {
    backgroundColor: Colors.error, borderRadius: Radius.full,
    paddingHorizontal: 8, paddingVertical: 2,
  },
  unreadBadgeText: { fontSize: FontSize.xs, color: Colors.white, fontWeight: '700' },
  markAllBtn: { paddingVertical: 4 },
  markAllText: { fontSize: FontSize.sm, color: Colors.primary, fontWeight: '600' },
  list: { paddingBottom: 100 },
  notifItem: {
    flexDirection: 'row', alignItems: 'flex-start',
    padding: Spacing.lg, backgroundColor: Colors.surface, gap: 12,
  },
  notifUnread: { backgroundColor: Colors.primaryBg },
  iconCircle: {
    width: 44, height: 44, borderRadius: 14,
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  notifContent: { flex: 1 },
  notifTitle: { fontSize: FontSize.md, fontWeight: '700', color: Colors.gray900 },
  notifBody: { fontSize: FontSize.sm, color: Colors.textSecondary, marginTop: 2, lineHeight: 18 },
  notifTime: { fontSize: FontSize.xs, color: Colors.textMuted, marginTop: 4 },
  notifActions: { alignItems: 'center', gap: 8, paddingTop: 2 },
  unreadDot: {
    width: 8, height: 8, borderRadius: 4,
    backgroundColor: Colors.primary,
  },
  deleteBtn: { padding: 2 },
  separator: { height: 1, backgroundColor: Colors.border, marginLeft: 72 },
});
