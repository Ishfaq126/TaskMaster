import React from 'react';
import {
  View, Text, TouchableOpacity, ActivityIndicator,
  StyleSheet, ViewStyle, TextStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, FontSize, Radius, Shadow } from '../utils/theme';

// ─── Button ───────────────────────────────────────────────────────────────────
interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  disabled?: boolean;
  icon?: string;
  style?: ViewStyle;
  fullWidth?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  title, onPress, variant = 'primary', size = 'md',
  loading, disabled, icon, style, fullWidth,
}) => {
  const variantStyles = {
    primary: { bg: Colors.primary, text: Colors.white, border: Colors.primary },
    secondary: { bg: Colors.secondary, text: Colors.white, border: Colors.secondary },
    outline: { bg: 'transparent', text: Colors.primary, border: Colors.primary },
    danger: { bg: Colors.error, text: Colors.white, border: Colors.error },
    ghost: { bg: 'transparent', text: Colors.primary, border: 'transparent' },
  }[variant];

  const sizeStyles = {
    sm: { paddingH: 12, paddingV: 7, fontSize: FontSize.sm, radius: Radius.sm },
    md: { paddingH: 16, paddingV: 10, fontSize: FontSize.md, radius: Radius.md },
    lg: { paddingH: 20, paddingV: 14, fontSize: FontSize.lg, radius: Radius.md },
  }[size];

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
      style={[
        {
          backgroundColor: variantStyles.bg,
          borderColor: variantStyles.border,
          borderWidth: 1.5,
          borderRadius: sizeStyles.radius,
          paddingHorizontal: sizeStyles.paddingH,
          paddingVertical: sizeStyles.paddingV,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          opacity: disabled ? 0.5 : 1,
          alignSelf: fullWidth ? undefined : 'flex-start',
          width: fullWidth ? '100%' : undefined,
        },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator size="small" color={variantStyles.text} />
      ) : (
        <>
          {icon && (
            <Ionicons
              name={icon as any}
              size={sizeStyles.fontSize + 2}
              color={variantStyles.text}
              style={{ marginRight: 6 }}
            />
          )}
          <Text style={{ color: variantStyles.text, fontSize: sizeStyles.fontSize, fontWeight: '600' }}>
            {title}
          </Text>
        </>
      )}
    </TouchableOpacity>
  );
};

// ─── Badge ────────────────────────────────────────────────────────────────────
interface BadgeProps {
  label: string;
  color: string;
  bg: string;
  size?: 'sm' | 'md';
}

export const Badge: React.FC<BadgeProps> = ({ label, color, bg, size = 'md' }) => (
  <View style={{
    backgroundColor: bg,
    paddingHorizontal: size === 'sm' ? 7 : 10,
    paddingVertical: size === 'sm' ? 2 : 4,
    borderRadius: Radius.full,
    alignSelf: 'flex-start',
  }}>
    <Text style={{ color, fontSize: size === 'sm' ? FontSize.xs : FontSize.sm, fontWeight: '600' }}>
      {label}
    </Text>
  </View>
);

// ─── Card ─────────────────────────────────────────────────────────────────────
interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  onPress?: () => void;
  noPad?: boolean;
}

export const Card: React.FC<CardProps> = ({ children, style, onPress, noPad }) => {
  const cardStyle = [
    {
      backgroundColor: Colors.surface,
      borderRadius: Radius.lg,
      padding: noPad ? 0 : Spacing.lg,
      ...Shadow.md,
    },
    style,
  ];
  if (onPress) {
    return (
      <TouchableOpacity onPress={onPress} activeOpacity={0.95} style={cardStyle}>
        {children}
      </TouchableOpacity>
    );
  }
  return <View style={cardStyle}>{children}</View>;
};

// ─── Avatar ───────────────────────────────────────────────────────────────────
interface AvatarProps {
  name: string;
  size?: number;
  uri?: string;
}

export const Avatar: React.FC<AvatarProps> = ({ name, size = 36, uri }) => {
  const initials = name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  const colors = ['#6366F1', '#F59E0B', '#10B981', '#3B82F6', '#EC4899', '#8B5CF6'];
  const color = colors[name.charCodeAt(0) % colors.length];

  return (
    <View style={{
      width: size, height: size, borderRadius: size / 2,
      backgroundColor: color, alignItems: 'center', justifyContent: 'center',
    }}>
      <Text style={{ color: '#fff', fontSize: size * 0.38, fontWeight: '700' }}>
        {initials}
      </Text>
    </View>
  );
};

// ─── Empty State ──────────────────────────────────────────────────────────────
interface EmptyStateProps {
  icon?: string;
  title: string;
  subtitle?: string;
  action?: { title: string; onPress: () => void };
}

export const EmptyState: React.FC<EmptyStateProps> = ({ icon, title, subtitle, action }) => (
  <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: Spacing.xxxl }}>
    {icon && (
      <View style={{
        width: 80, height: 80, borderRadius: 40,
        backgroundColor: Colors.primaryBg, alignItems: 'center',
        justifyContent: 'center', marginBottom: Spacing.lg,
      }}>
        <Ionicons name={icon as any} size={40} color={Colors.primary} />
      </View>
    )}
    <Text style={{ fontSize: FontSize.xl, fontWeight: '700', color: Colors.gray800, textAlign: 'center' }}>
      {title}
    </Text>
    {subtitle && (
      <Text style={{ fontSize: FontSize.md, color: Colors.textSecondary, textAlign: 'center', marginTop: 8 }}>
        {subtitle}
      </Text>
    )}
    {action && (
      <View style={{ marginTop: Spacing.xl }}>
        <Button title={action.title} onPress={action.onPress} />
      </View>
    )}
  </View>
);

// ─── Loading ──────────────────────────────────────────────────────────────────
export const LoadingScreen: React.FC<{ message?: string }> = ({ message }) => (
  <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.background }}>
    <ActivityIndicator size="large" color={Colors.primary} />
    {message && (
      <Text style={{ marginTop: 12, color: Colors.textSecondary, fontSize: FontSize.md }}>{message}</Text>
    )}
  </View>
);

// ─── Divider ─────────────────────────────────────────────────────────────────
export const Divider: React.FC<{ style?: ViewStyle }> = ({ style }) => (
  <View style={[{ height: 1, backgroundColor: Colors.border }, style]} />
);

// ─── Section Header ───────────────────────────────────────────────────────────
interface SectionHeaderProps {
  title: string;
  action?: { label: string; onPress: () => void };
}
export const SectionHeader: React.FC<SectionHeaderProps> = ({ title, action }) => (
  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: Spacing.sm }}>
    <Text style={{ fontSize: FontSize.lg, fontWeight: '700', color: Colors.gray800 }}>{title}</Text>
    {action && (
      <TouchableOpacity onPress={action.onPress}>
        <Text style={{ fontSize: FontSize.sm, color: Colors.primary, fontWeight: '600' }}>{action.label}</Text>
      </TouchableOpacity>
    )}
  </View>
);

// ─── Stat Card ────────────────────────────────────────────────────────────────
interface StatCardProps {
  label: string;
  value: string | number;
  icon: string;
  color: string;
  bg: string;
  change?: string;
}
export const StatCard: React.FC<StatCardProps> = ({ label, value, icon, color, bg, change }) => (
  <Card style={{ flex: 1, minWidth: 140 }}>
    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
      <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: bg, alignItems: 'center', justifyContent: 'center' }}>
        <Ionicons name={icon as any} size={18} color={color} />
      </View>
    </View>
    <Text style={{ fontSize: FontSize.xxl, fontWeight: '800', color: Colors.gray900 }}>{value}</Text>
    <Text style={{ fontSize: FontSize.sm, color: Colors.textSecondary, marginTop: 2 }}>{label}</Text>
    {change && (
      <Text style={{ fontSize: FontSize.xs, color: Colors.success, marginTop: 4, fontWeight: '600' }}>{change}</Text>
    )}
  </Card>
);
