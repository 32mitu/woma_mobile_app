import { Stack } from 'expo-router';

export default function RootLayout() {
  return (
    <Stack>
      {/* タブ画面: ここではヘッダーを隠す (タブ側のヘッダーを使うため) */}
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      
      {/* 検索画面: タブの上に重なって表示される */}
      <Stack.Screen 
        name="search" 
        options={{ 
          title: 'ユーザー検索',
          headerBackTitle: '戻る' // iOS用
        }} 
      />
    </Stack>
  );
}