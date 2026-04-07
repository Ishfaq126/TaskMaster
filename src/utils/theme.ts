export const Colors = {
  primary: '#6366F1',
  primaryDark: '#4F46E5',
  primaryLight: '#A5B4FC',
  primaryBg: '#EEF2FF',

  secondary: '#F59E0B',
  secondaryDark: '#D97706',
  secondaryBg: '#FFFBEB',

  success: '#10B981',
  successBg: '#ECFDF5',
  warning: '#F59E0B',
  warningBg: '#FFFBEB',
  error: '#EF4444',
  errorBg: '#FEF2F2',
  info: '#3B82F6',
  infoBg: '#EFF6FF',

  dark: '#111827',
  gray900: '#111827',
  gray800: '#1F2937',
  gray700: '#374151',
  gray600: '#4B5563',
  gray500: '#6B7280',
  gray400: '#9CA3AF',
  gray300: '#D1D5DB',
  gray200: '#E5E7EB',
  gray100: '#F3F4F6',
  gray50: '#F9FAFB',
  white: '#FFFFFF',

  background: '#F9FAFB',
  surface: '#FFFFFF',
  border: '#E5E7EB',
  text: '#111827',
  textSecondary: '#6B7280',
  textMuted: '#9CA3AF',

  // Status
  pending: '#F59E0B',
  pendingBg: '#FFFBEB',
  inProgress: '#3B82F6',
  inProgressBg: '#EFF6FF',
  done: '#10B981',
  doneBg: '#ECFDF5',
  cancelled: '#EF4444',
  cancelledBg: '#FEF2F2',

  // Priority
  low: '#10B981',
  lowBg: '#ECFDF5',
  medium: '#3B82F6',
  mediumBg: '#EFF6FF',
  high: '#F59E0B',
  highBg: '#FFFBEB',
  urgent: '#EF4444',
  urgentBg: '#FEF2F2',
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
};

export const FontSize = {
  xs: 11,
  sm: 12,
  md: 14,
  base: 15,
  lg: 16,
  xl: 18,
  xxl: 20,
  xxxl: 24,
  display: 28,
};

export const Radius = {
  sm: 6,
  md: 10,
  lg: 14,
  xl: 18,
  full: 9999,
};

export const Shadow = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 6,
  },
};

export const statusConfig = {
  PENDING: { label: 'Pending', color: Colors.pending, bg: Colors.pendingBg, icon: 'time-outline' },
  IN_PROGRESS: { label: 'In Progress', color: Colors.inProgress, bg: Colors.inProgressBg, icon: 'refresh-outline' },
  DONE: { label: 'Done', color: Colors.done, bg: Colors.doneBg, icon: 'checkmark-circle-outline' },
  CANCELLED: { label: 'Cancelled', color: Colors.cancelled, bg: Colors.cancelledBg, icon: 'close-circle-outline' },
};

export const priorityConfig = {
  LOW: { label: 'Low', color: Colors.low, bg: Colors.lowBg, icon: 'arrow-down' },
  MEDIUM: { label: 'Medium', color: Colors.medium, bg: Colors.mediumBg, icon: 'remove' },
  HIGH: { label: 'High', color: Colors.high, bg: Colors.highBg, icon: 'arrow-up' },
  URGENT: { label: 'Urgent', color: Colors.urgent, bg: Colors.urgentBg, icon: 'alert' },
};
