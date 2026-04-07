import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View, Text, FlatList, RefreshControl, TextInput,
  TouchableOpacity, StyleSheet, Animated, Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { tasksAPI } from '../services/api';
import { useAuthStore } from '../store/authStore';
import { Colors, Spacing, FontSize, Radius, Shadow } from '../utils/theme';
import { TaskCard } from '../components/TaskCard';
import { EmptyState, LoadingScreen } from '../components/ui';

const TABS = [
  { key: 'assigned', label: 'Assigned to Me', icon: 'person-outline' },
  { key: 'created', label: 'Created by Me', icon: 'create-outline' },
  { key: 'all', label: 'All', icon: 'list-outline' },
];

const STATUS_FILTERS = ['All', 'PENDING', 'IN_PROGRESS', 'DONE', 'CANCELLED'];
const PRIORITY_FILTERS = ['All', 'URGENT', 'HIGH', 'MEDIUM', 'LOW'];

export default function HomeScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState('assigned');
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [priorityFilter, setPriorityFilter] = useState('All');
  const [showFilters, setShowFilters] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const searchTimeout = useRef<any>(null);

  const fetchTasks = useCallback(async (reset = false) => {
    try {
      const params: any = { page: reset ? 1 : page, limit: 20 };
      if (activeTab === 'assigned') params.assignedToMe = true;
      if (activeTab === 'created') params.createdByMe = true;
      if (statusFilter !== 'All') params.status = statusFilter;
      if (priorityFilter !== 'All') params.priority = priorityFilter;
      if (search.trim()) params.search = search.trim();

      const { data } = await tasksAPI.getAll(params);
      if (reset) {
        setTasks(data.tasks);
        setPage(2);
      } else {
        setTasks(prev => [...prev, ...data.tasks]);
        setPage(prev => prev + 1);
      }
      setHasMore(data.pagination.page < data.pagination.pages);
      setTotalCount(data.pagination.total);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [activeTab, statusFilter, priorityFilter, search, page]);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      fetchTasks(true);
    }, [activeTab, statusFilter, priorityFilter])
  );

  // Debounced search
  useEffect(() => {
    clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(() => {
      setLoading(true);
      fetchTasks(true);
    }, 400);
    return () => clearTimeout(searchTimeout.current);
  }, [search]);

  const handleStatusChange = async (taskId: number, status: string) => {
    try {
      await tasksAPI.updateStatus(taskId, status);
      setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status } : t));
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to update status');
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchTasks(true);
  };

  const loadMore = () => {
    if (!hasMore || loading) return;
    fetchTasks(false);
  };

  const activeFilters = (statusFilter !== 'All' ? 1 : 0) + (priorityFilter !== 'All' ? 1 : 0);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Hello, {user?.name?.split(' ')[0]} 👋</Text>
          <Text style={styles.subtitle}>{totalCount} task{totalCount !== 1 ? 's' : ''} total</Text>
        </View>
        <TouchableOpacity
          style={styles.createBtn}
          onPress={() => router.push('/create-task')}
          activeOpacity={0.85}
        >
          <Ionicons name="add" size={22} color={Colors.white} />
        </TouchableOpacity>
      </View>

      {/* Search bar */}
      <View style={styles.searchRow}>
        <View style={styles.searchBox}>
          <Ionicons name="search" size={18} color={Colors.gray400} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search tasks..."
            placeholderTextColor={Colors.gray400}
            value={search}
            onChangeText={setSearch}
          />
          {search ? (
            <TouchableOpacity onPress={() => setSearch('')}>
              <Ionicons name="close-circle" size={18} color={Colors.gray400} />
            </TouchableOpacity>
          ) : null}
        </View>
        <TouchableOpacity
          style={[styles.filterBtn, activeFilters > 0 && styles.filterBtnActive]}
          onPress={() => setShowFilters(!showFilters)}
        >
          <Ionicons
            name="options-outline"
            size={20}
            color={activeFilters > 0 ? Colors.white : Colors.gray600}
          />
          {activeFilters > 0 && (
            <View style={styles.filterBadge}>
              <Text style={styles.filterBadgeText}>{activeFilters}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* Filters panel */}
      {showFilters && (
        <View style={styles.filtersPanel}>
          <Text style={styles.filterLabel}>Status</Text>
          <View style={styles.filterRow}>
            {STATUS_FILTERS.map(f => (
              <TouchableOpacity
                key={f}
                style={[styles.filterChip, statusFilter === f && styles.filterChipActive]}
                onPress={() => setStatusFilter(f)}
              >
                <Text style={[styles.filterChipText, statusFilter === f && styles.filterChipTextActive]}>
                  {f === 'IN_PROGRESS' ? 'In Progress' : f === 'All' ? 'All' : f.charAt(0) + f.slice(1).toLowerCase()}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          <Text style={[styles.filterLabel, { marginTop: 10 }]}>Priority</Text>
          <View style={styles.filterRow}>
            {PRIORITY_FILTERS.map(f => (
              <TouchableOpacity
                key={f}
                style={[styles.filterChip, priorityFilter === f && styles.filterChipActive]}
                onPress={() => setPriorityFilter(f)}
              >
                <Text style={[styles.filterChipText, priorityFilter === f && styles.filterChipTextActive]}>
                  {f === 'All' ? 'All' : f.charAt(0) + f.slice(1).toLowerCase()}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      {/* Tabs */}
      <View style={styles.tabs}>
        {TABS.map(tab => (
          <TouchableOpacity
            key={tab.key}
            style={[styles.tabItem, activeTab === tab.key && styles.tabItemActive]}
            onPress={() => setActiveTab(tab.key)}
          >
            <Ionicons
              name={tab.icon as any}
              size={14}
              color={activeTab === tab.key ? Colors.primary : Colors.textSecondary}
            />
            <Text style={[styles.tabLabel, activeTab === tab.key && styles.tabLabelActive]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Task list */}
      {loading && tasks.length === 0 ? (
        <LoadingScreen message="Loading tasks..." />
      ) : (
        <FlatList
          data={tasks}
          keyExtractor={item => String(item.id)}
          renderItem={({ item }) => (
            <TaskCard
              task={item}
              onPress={() => router.push(`/task/${item.id}`)}
              currentUserId={user!.id}
              onStatusChange={(status) => handleStatusChange(item.id, status)}
            />
          )}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={Colors.primary}
              colors={[Colors.primary]}
            />
          }
          onEndReached={loadMore}
          onEndReachedThreshold={0.3}
          ListEmptyComponent={
            <EmptyState
              icon="clipboard-outline"
              title="No tasks found"
              subtitle={search ? 'Try a different search term' : "You're all caught up!"}
              action={!search ? { title: 'Create Task', onPress: () => router.push('/create-task') } : undefined}
            />
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: Spacing.xl, paddingTop: 16, paddingBottom: 12,
    backgroundColor: Colors.surface, ...Shadow.sm,
  },
  greeting: { fontSize: FontSize.xl, fontWeight: '800', color: Colors.gray900 },
  subtitle: { fontSize: FontSize.sm, color: Colors.textSecondary, marginTop: 2 },
  createBtn: {
    width: 42, height: 42, borderRadius: 14,
    backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center',
    ...Shadow.md,
  },
  searchRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: Spacing.xl, paddingVertical: 12,
    backgroundColor: Colors.surface, gap: 10,
  },
  searchBox: {
    flex: 1, flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.gray100, borderRadius: Radius.md,
    paddingHorizontal: 12, paddingVertical: 9, gap: 8,
  },
  searchInput: { flex: 1, fontSize: FontSize.md, color: Colors.gray900 },
  filterBtn: {
    width: 42, height: 42, borderRadius: Radius.md,
    backgroundColor: Colors.gray100, alignItems: 'center', justifyContent: 'center',
  },
  filterBtnActive: { backgroundColor: Colors.primary },
  filterBadge: {
    position: 'absolute', top: -4, right: -4,
    width: 16, height: 16, borderRadius: 8,
    backgroundColor: Colors.error, alignItems: 'center', justifyContent: 'center',
  },
  filterBadgeText: { fontSize: 9, color: Colors.white, fontWeight: '700' },
  filtersPanel: {
    backgroundColor: Colors.surface, paddingHorizontal: Spacing.xl, paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  filterLabel: { fontSize: FontSize.sm, fontWeight: '700', color: Colors.gray600, marginBottom: 8 },
  filterRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  filterChip: {
    paddingHorizontal: 12, paddingVertical: 6,
    borderRadius: Radius.full, backgroundColor: Colors.gray100,
    borderWidth: 1.5, borderColor: Colors.border,
  },
  filterChipActive: { backgroundColor: Colors.primaryBg, borderColor: Colors.primary },
  filterChipText: { fontSize: FontSize.sm, color: Colors.textSecondary, fontWeight: '600' },
  filterChipTextActive: { color: Colors.primary },
  tabs: {
    flexDirection: 'row', backgroundColor: Colors.surface,
    paddingHorizontal: Spacing.xl, borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  tabItem: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingVertical: 12, paddingHorizontal: 10, marginRight: 4,
    borderBottomWidth: 2, borderBottomColor: 'transparent',
  },
  tabItemActive: { borderBottomColor: Colors.primary },
  tabLabel: { fontSize: FontSize.sm, color: Colors.textSecondary, fontWeight: '600' },
  tabLabelActive: { color: Colors.primary },
  list: { padding: Spacing.xl, paddingBottom: 100 },
});
