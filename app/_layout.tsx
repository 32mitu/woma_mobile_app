import 'react-native-get-random-values';
import '../src/i18n'; // 1. ★重要: これがないと翻訳が動きません
import { Stack } from 'expo-router';
import { useEffect } from 'react';
import { useAuth } from '../src/features/auth/useAuth';
import { usePushNotifications } from '../src/hooks/usePushNotifications';

export default function RootLayout() {
  const { user } = useAuth();
  // フックから関数を取得
  const { registerForPushNotificationsAsync, scheduleDailyReminder } = usePushNotifications();

  useEffect(() => {
    console.log("🚀 [RootLayout] アプリが起動しました");

    const setup = async () => {
      // 2. ★ここで通知設定を実行 (useEffectの中なので無限ループしません)
      await registerForPushNotificationsAsync();
      await scheduleDailyReminder();
    };
    setup();

  }, []); // 空の配列 [] があるので、起動時に1回だけ実行されます

  return (
    <Stack screenOptions={{ headerShown: false }}>
      {/* タブ画面 */}
      <Stack.Screen name="(tabs)" />

      {/* 検索画面 */}
      <Stack.Screen name="search" />

      {/* 公開プロフィール */}
      <Stack.Screen name="public/[uid]" />

      {/* DM機能 */}
      <Stack.Screen name="dm" />

      {/* 友達リスト */}
      <Stack.Screen name="friends" />

      {/* グループ機能 */}
      <Stack.Screen name="groups" />

      {/* プロフィール編集など */}
      <Stack.Screen name="profile" />
    </Stack>
  );
}