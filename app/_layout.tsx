import { useEffect, useRef, useState } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { View } from 'react-native';
import * as SplashScreen from 'expo-splash-screen';
import * as Notifications from 'expo-notifications';
import { useAuthStore } from '../src/store/authStore';
import { authEventEmitter } from '../src/services/api';
import {
  registerForPushNotifications,
  savePushToken,
  setupNotificationListeners,
} from '../src/services/notifications';
import { Colors } from '../src/utils/theme';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const { user, isAuthenticated, isLoading, loadUser, logout } = useAuthStore();
  const router = useRouter();
  const segments = useSegments();
  const [appReady, setAppReady] = useState(false);

  // Bootstrap: load user from stored token
  useEffect(() => {
    const init = async () => {
      await loadUser();
      setAppReady(true);
      await SplashScreen.hideAsync();
    };
    init();
  }, []);

  // Auth routing guard
  useEffect(() => {
    if (!appReady || isLoading) return;
    const inAuthGroup = segments[0] === '(auth)';
    if (!isAuthenticated && !inAuthGroup) {
      router.replace('/(auth)/login');
    } else if (isAuthenticated && inAuthGroup) {
      router.replace('/(tabs)');
    }
  }, [isAuthenticated, appReady, segments]);

  // Listen for forced logout (token refresh fail)
  useEffect(() => {
    const handler = () => logout();
    authEventEmitter.on('logout', handler);
    return () => authEventEmitter.off('logout', handler);
  }, []);

  // Register push token when logged in
  useEffect(() => {
    if (!isAuthenticated) return;
    const setup = async () => {
      const token = await registerForPushNotifications();
      if (token) await savePushToken(token);
    };
    setup();
  }, [isAuthenticated]);

  // Push notification listeners
  useEffect(() => {
    if (!isAuthenticated) return;
    const cleanup = setupNotificationListeners(
      (notification) => {
        // Notification received while app is open — could show in-app banner
        console.log('Notification received:', notification);
      },
      (response) => {
        // User tapped notification
        const data = response.notification.request.content.data;
        if (data?.taskId) {
          router.push(`/task/${data.taskId}`);
        } else if (data?.screen === 'notifications') {
          router.push('/(tabs)/notifications');
        }
      }
    );
    return cleanup;
  }, [isAuthenticated]);

  if (!appReady) return <View style={{ flex: 1, backgroundColor: Colors.primary }} />;

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="task/[id]" options={{ presentation: 'card' }} />
      <Stack.Screen name="create-task" options={{ presentation: 'modal' }} />
      <Stack.Screen name="edit-task/[id]" options={{ presentation: 'modal' }} />
    </Stack>
  );
}
