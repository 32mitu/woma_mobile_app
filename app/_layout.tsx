import 'react-native-get-random-values';
import { Stack } from 'expo-router';
import { useEffect } from 'react';
import { useAuth } from '../src/features/auth/useAuth'; // パスは環境に合わせて調整してください
import { usePushNotifications } from '../src/hooks/usePushNotifications'; // 修正したファイルのパス

export default function RootLayout() {
  const { user } = useAuth();


  useEffect(() => {
    console.log("🚀 [RootLayout] アプリが起動しました");
  }, []);

  return (
    <Stack>
      {/* タブ画面 */}
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />

      {/* 検索画面 */}
      <Stack.Screen
        name="search"
        options={{
          headerShown: false
        }}
      />

      {/* 公開プロフィール */}
      <Stack.Screen
        name="public/[uid]"
        options={{ headerShown: false }}
      />

      {/* DM機能 */}
      <Stack.Screen
        name="dm"
        options={{
          headerShown: false
        }}
      />

      {/* 友達リスト */}
      <Stack.Screen
        name="friends"
        options={{
          headerShown: false
        }}
      />

      {/* グループ機能 */}
      <Stack.Screen
        name="groups"
        options={{
          headerShown: false
        }}
      />

      {/* プロフィール編集など */}
      <Stack.Screen
        name="profile"
        options={{
          headerShown: false
        }}
      />
    </Stack>
  );
}