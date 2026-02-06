import 'react-native-get-random-values';
import '../src/i18n'; // 1. ★重要: 翻訳設定の読み込み
import '../global.css'; // Tailwind CSSなどのスタイル適用

import { Stack } from 'expo-router';
import { useEffect } from 'react';
import { LogBox } from 'react-native';
import Toast from 'react-native-toast-message'; // 追加: トースト通知
import { GlobalErrorBoundary } from '../src/ui/GlobalErrorBoundary'; // 追加: エラーハンドリング

import { useAuth } from '../src/features/auth/useAuth';
import { usePushNotifications } from '../src/hooks/usePushNotifications';

// 開発中の不要なログを無視する場合（任意）
LogBox.ignoreLogs(['@firebase/auth']);

export default function RootLayout() {
  // 認証状態の監視（初期化のため呼び出し）
  const { user } = useAuth();

  // プッシュ通知設定用のフック
  const { registerForPushNotificationsAsync, scheduleDailyReminder } = usePushNotifications();

  useEffect(() => {
    console.log("🚀 [RootLayout] アプリが起動しました");

    const setup = async () => {
      // 2. ★ここで通知設定を実行
      await registerForPushNotificationsAsync();
      await scheduleDailyReminder();
    };
    setup();

  }, []);

  return (
    // 3. アプリ全体を GlobalErrorBoundary で囲むことで、クラッシュ時に赤い画面ではなくカスタム画面を表示
    <GlobalErrorBoundary>
      <Stack screenOptions={{ headerShown: false }}>
        {/* ログイン・登録画面 (index) */}
        <Stack.Screen name="index" />

        {/* タブ画面 (メイン) */}
        <Stack.Screen name="(tabs)" />

        {/* 各種詳細画面 */}
        <Stack.Screen name="search" />
        <Stack.Screen name="public/[uid]" />
        <Stack.Screen name="dm" />
        <Stack.Screen name="friends" />
        <Stack.Screen name="groups" />
        <Stack.Screen name="profile" />
      </Stack>

      {/* 4. Toast コンポーネントを最下部に配置 (全画面の上に表示させるため) */}
      <Toast />
    </GlobalErrorBoundary>
  );
}