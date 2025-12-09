import 'react-native-get-random-values';
import { Stack } from 'expo-router';
import * as Notifications from 'expo-notifications';
import { useEffect } from 'react';

// ★修正: 詳細ログ出力と、警告が出ない新しい設定
Notifications.setNotificationHandler({
  handleNotification: async () => {
    console.log("🔔 [Notification] 通知を受信しました (Handler Active)");
    return {
      shouldShowBanner: true, // ✅ iOS 14+ (Alertの代わり)
      shouldShowList: true,   // ✅ 通知センターに表示
      shouldPlaySound: false,
      shouldSetBadge: false,
    };
  },
});

export default function RootLayout() {
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

      {/* ★重要: DM機能のルート定義 */}
      <Stack.Screen 
        name="dm" 
        options={{ 
          headerShown: false // ヘッダーは dm/_layout.tsx に任せる
        }} 
      />
    </Stack>
  );
}