import React, { useState, useCallback } from 'react';
import {
  View, Text, ScrollView, StyleSheet,
  RefreshControl, TouchableOpacity,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { dashboardAPI } from '../services/api';
import { useAuthStore } from '../store/authStore';
import { Colors, Spacing, FontSize, Radius, Shadow } from '../utils/theme';
import { Card, StatCard, SectionHeader, Avatar, Badge, LoadingScreen } from '../components/ui';
import { statusConfig, priorityConfig } from '../utils/theme';
import { format } from 'date-fns';

// Simple bar chart component
const MiniBarChart: React.FC<{ data: { label: string; value: number; color: string }[] }> = ({ data }) => {
  const max = Math.max(...data.map(d => d.value), 1);
  return (
    <View style={chart.container}>
      {data.map((item) => (
        <View key={item.label} style={chart.barGroup}>
          <Text style={chart.barValue}>{item.value}</Text>
          <View style={chart.barTrack}>
            <View style={[chart.barFill, {
              height: `${(item.value / max) * 100}%`,
              backgroundColor: item.color,
            }]} />
          </View>
          <Text style={chart.barLabel}>{item.label}</Text>
        </View>
      ))}
    </View>
  );
};

const chart = StyleSheet.create({
  container: { flexDirection: 'row', alignItems: 'flex-end', height: 100, gap: 8 },
  barGroup: { flex: 1, alignItems: 'center' },
  barValue: { fontSize: FontSize.xs, fontWeight: '700', color: Colors.gray700, marginBottom: 2 },
  barTrack: { flex: 1, width: '100%', backgroundColor: Colors.gray100, borderRadius: 4, justifyContent: 'flex-end' },
  barFill: { width: '100%', borderRadius: 4, minHeight: 4 },
  barLabel: { fontSize: 9, color: Colors.textSecondary, marginTop: 4, textAlign: 'center' },
});

// Donut / progress ring (simplified as segmented bar)
const ProgressRing: React.FC<{ percent: number; color: string; size?: number }> = ({ percent, color, size = 80 }) => (
  <View style={{ width: size, height: size, position: 'relative', alignItems: 'center', justifyContent: 'center' }}>
    <View style={{
      width: size, height: size, borderRadius: size / 2,
      borderWidth: 8, borderColor: Colors.gray100,
    }} />
    <View style={{
      position: 'absolute', width: size, height: size,
      borderRadius: size / 2, borderWidth: 8, borderColor: 'transparent',
      borderTopColor: percent > 0 ? color : 'transparent',
      transform: [{ rotate: `${(percent / 100) * 360 - 90}deg` }],
    }} />
    <Text style={{
      position: 'absolute', fontSize: FontSize.xl,
      fontWeight: '800', color: Colors.gray900,
    }}>{percent}%</Text>
  </View>
);

export default function DashboardScreen() {
  const { user } = useAuthStore();
  const router = useRouter();
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const isAdmin = user?.role === 'ADMIN';

  const fetchStats = async () => {
    try {
      const { data } = await dashboardAPI.getStats();
      setStats(data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); setRefreshing(false); }
  };

  useFocusEffect(useCallback(() => { fetchStats(); }, []));

  if (loading) return <LoadingScreen message="Loading dashboard..." />;
  if (!stats) return null;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchStats(); }} tintColor={Colors.primary} />
      }
    >
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Dashboard</Text>
          <Text style={styles.headerSub}>{isAdmin ? 'System Overview' : 'My Performance'}</Text>
        </View>
        <View style={[styles.roleTag, { backgroundColor: isAdmin ? Colors.urgentBg : Colors.primaryBg }]}>
          <Ionicons name={isAdmin ? 'shield-checkmark' : 'person'} size={14} color={isAdmin ? Colors.urgent : Colors.primary} />
          <Text style={[styles.roleTagText, { color: isAdmin ? Colors.urgent : Colors.primary }]}>
            {isAdmin ? 'Admin' : 'User'}
          </Text>
        </View>
      </View>

      {isAdmin ? <AdminDashboard stats={stats} router={router} /> : <UserDashboard stats={stats} router={router} />}
    </ScrollView>
  );
}

const AdminDashboard: React.FC<{ stats: any; router: any }> = ({ stats }) => {
  const statusBarData = stats.tasksByStatus?.map((s: any) => ({
    label: s.status === 'IN_PROGRESS' ? 'In Prog.' : s.status.charAt(0) + s.status.slice(1).toLowerCase(),
    value: s.count,
    color: statusConfig[s.status as keyof typeof statusConfig]?.color || Colors.gray400,
  })) || [];

  return (
    <>
      {/* Overview stats */}
      <View style={styles.statsGrid}>
        <StatCard
          label="Total Tasks"
          value={stats.overview.totalTasks}
          icon="list-outline"
          color={Colors.primary}
          bg={Colors.primaryBg}
        />
        <StatCard
          label="Total Users"
          value={stats.overview.totalUsers}
          icon="people-outline"
          color={Colors.info}
          bg={Colors.infoBg}
        />
      </View>
      <View style={styles.statsGrid}>
        <StatCard
          label="Completion Rate"
          value={`${stats.overview.completionRate}%`}
          icon="trending-up-outline"
          color={Colors.success}
          bg={Colors.successBg}
        />
        <StatCard
          label="Overdue Tasks"
          value={stats.overview.overdueCount}
          icon="alert-circle-outline"
          color={Colors.error}
          bg={Colors.errorBg}
        />
      </View>

      {/* Tasks by status */}
      <Card style={styles.chartCard}>
        <SectionHeader title="Tasks by Status" />
        <MiniBarChart data={statusBarData} />
      </Card>

      {/* Top assignees */}
      {stats.topAssignees?.length > 0 && (
        <Card style={styles.chartCard}>
          <SectionHeader title="Top Assignees" />
          {stats.topAssignees.map((a: any, i: number) => (
            <View key={i} style={styles.assigneeRow}>
              <Text style={styles.assigneeRank}>#{i + 1}</Text>
              <Avatar name={a.user?.name || '?'} size={32} />
              <View style={styles.assigneeInfo}>
                <Text style={styles.assigneeName}>{a.user?.name}</Text>
                <View style={styles.taskBarTrack}>
                  <View style={[styles.taskBarFill, {
                    width: `${(a.taskCount / stats.topAssignees[0].taskCount) * 100}%`,
                  }]} />
                </View>
              </View>
              <Text style={styles.assigneeCount}>{a.taskCount}</Text>
            </View>
          ))}
        </Card>
      )}

      {/* Recent tasks */}
      {stats.recentTasks?.length > 0 && (
        <Card style={{ ...styles.chartCard, padding: 0 }} noPad>
          <View style={{ padding: Spacing.lg }}>
            <SectionHeader title="Recent Tasks" />
          </View>
          {stats.recentTasks.slice(0, 5).map((task: any) => {
            const sCfg = statusConfig[task.status as keyof typeof statusConfig];
            return (
              <View key={task.id} style={styles.recentTask}>
                <View style={[styles.recentDot, { backgroundColor: sCfg?.color }]} />
                <View style={styles.recentInfo}>
                  <Text style={styles.recentTitle} numberOfLines={1}>{task.title}</Text>
                  <Text style={styles.recentMeta}>{task.assignedTo.name}</Text>
                </View>
                <Badge label={sCfg?.label} color={sCfg?.color} bg={sCfg?.bg} size="sm" />
              </View>
            );
          })}
        </Card>
      )}
    </>
  );
};

const UserDashboard: React.FC<{ stats: any; router: any }> = ({ stats, router }) => {
  const assignedBarData = [
    { label: 'Pending', value: stats.assigned.pending, color: Colors.pending },
    { label: 'In Progress', value: stats.assigned.inProgress, color: Colors.inProgress },
    { label: 'Done', value: stats.assigned.done, color: Colors.done },
  ];

  return (
    <>
      {/* Completion ring */}
      <Card style={styles.completionCard}>
        <View style={styles.completionRow}>
          <ProgressRing percent={stats.completionRate} color={Colors.success} size={90} />
          <View style={styles.completionInfo}>
            <Text style={styles.completionTitle}>Completion Rate</Text>
            <Text style={styles.completionSub}>
              {stats.assigned.done} of {stats.assigned.total} assigned tasks done
            </Text>
            {stats.overdueCount > 0 && (
              <View style={styles.overdueTag}>
                <Ionicons name="alert-circle" size={12} color={Colors.error} />
                <Text style={styles.overdueText}>{stats.overdueCount} overdue</Text>
              </View>
            )}
          </View>
        </View>
      </Card>

      {/* Assigned stats */}
      <View style={styles.statsGrid}>
        <StatCard label="Assigned to Me" value={stats.assigned.total} icon="person-outline" color={Colors.primary} bg={Colors.primaryBg} />
        <StatCard label="Created by Me" value={stats.created.total} icon="create-outline" color={Colors.secondary} bg={Colors.secondaryBg} />
      </View>

      {/* Bar chart */}
      <Card style={styles.chartCard}>
        <SectionHeader title="My Assigned Tasks" />
        <MiniBarChart data={assignedBarData} />
      </Card>

      {/* Upcoming */}
      {stats.upcomingTasks?.length > 0 && (
        <Card style={{ ...styles.chartCard, padding: 0 }} noPad>
          <View style={{ padding: Spacing.lg, paddingBottom: 0 }}>
            <SectionHeader title="Due This Week" />
          </View>
          {stats.upcomingTasks.map((task: any) => {
            const sCfg = statusConfig[task.status as keyof typeof statusConfig];
            return (
              <TouchableOpacity
                key={task.id}
                style={styles.recentTask}
                onPress={() => router.push(`/task/${task.id}`)}
              >
                <View style={[styles.recentDot, { backgroundColor: sCfg?.color }]} />
                <View style={styles.recentInfo}>
                  <Text style={styles.recentTitle} numberOfLines={1}>{task.title}</Text>
                  <Text style={styles.recentMeta}>
                    {task.dueDate ? format(new Date(task.dueDate), 'MMM d') : 'No due date'}
                  </Text>
                </View>
                <Badge label={sCfg?.label} color={sCfg?.color} bg={sCfg?.bg} size="sm" />
              </TouchableOpacity>
            );
          })}
        </Card>
      )}

      {/* Quick create */}
      <TouchableOpacity
        style={styles.createBtn}
        onPress={() => router.push('/create-task')}
      >
        <Ionicons name="add-circle-outline" size={20} color={Colors.white} />
        <Text style={styles.createBtnText}>Create New Task</Text>
      </TouchableOpacity>
    </>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: Spacing.xl, paddingBottom: 100, gap: 16 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  headerTitle: { fontSize: FontSize.xxl, fontWeight: '800', color: Colors.gray900 },
  headerSub: { fontSize: FontSize.sm, color: Colors.textSecondary },
  roleTag: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 5, borderRadius: Radius.full },
  roleTagText: { fontSize: FontSize.sm, fontWeight: '700' },
  statsGrid: { flexDirection: 'row', gap: 12 },
  chartCard: { gap: 16 },
  assigneeRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  assigneeRank: { fontSize: FontSize.sm, fontWeight: '700', color: Colors.textMuted, width: 20 },
  assigneeInfo: { flex: 1 },
  assigneeName: { fontSize: FontSize.sm, fontWeight: '700', color: Colors.gray800, marginBottom: 4 },
  taskBarTrack: { height: 4, backgroundColor: Colors.gray100, borderRadius: 2 },
  taskBarFill: { height: 4, backgroundColor: Colors.primary, borderRadius: 2 },
  assigneeCount: { fontSize: FontSize.sm, fontWeight: '700', color: Colors.primary },
  recentTask: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: Spacing.md, paddingHorizontal: Spacing.lg, borderTopWidth: 1, borderTopColor: Colors.border },
  recentDot: { width: 8, height: 8, borderRadius: 4 },
  recentInfo: { flex: 1 },
  recentTitle: { fontSize: FontSize.sm, fontWeight: '700', color: Colors.gray900 },
  recentMeta: { fontSize: FontSize.xs, color: Colors.textSecondary },
  completionCard: {},
  completionRow: { flexDirection: 'row', alignItems: 'center', gap: 20 },
  completionInfo: { flex: 1 },
  completionTitle: { fontSize: FontSize.lg, fontWeight: '700', color: Colors.gray900 },
  completionSub: { fontSize: FontSize.sm, color: Colors.textSecondary, marginTop: 4 },
  overdueTag: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 8 },
  overdueText: { fontSize: FontSize.sm, color: Colors.error, fontWeight: '600' },
  createBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: Colors.primary, borderRadius: Radius.md,
    padding: Spacing.lg, gap: 8, ...Shadow.md,
  },
  createBtnText: { fontSize: FontSize.lg, color: Colors.white, fontWeight: '700' },
});
