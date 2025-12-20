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
          title: 'ユーザー検索',
          headerBackTitle: '戻る'
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
    </Stack>
  );
}