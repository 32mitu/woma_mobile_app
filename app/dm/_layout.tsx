import { Stack } from 'expo-router';
import { useEffect } from 'react';
import { LogBox } from 'react-native';

export default function DMLayout() {
  
  // ★追加: ライブラリ起因の特定のエラーログを無視する設定
  useEffect(() => {
    LogBox.ignoreLogs([
      'A props object containing a "key" prop is being spread into JSX',
    ]);
    
    // 念のためコンソールエラーも抑制（念入りな対策）
    const originalConsoleError = console.error;
    console.error = (...args) => {
      if (typeof args[0] === 'string' && args[0].includes('A props object containing a "key" prop')) {
        return;
      }
      originalConsoleError(...args);
    };
  }, []);

  return (
    <Stack>
      {/* メッセージ一覧 (app/dm/index.tsx) */}
      <Stack.Screen 
        name="index" 
        options={{ 
          title: 'メッセージ',
          headerBackTitle: '戻る'
        }} 
      />
      
      {/* チャット詳細 (app/dm/[id].tsx) */}
      <Stack.Screen 
        name="[id]" 
        options={{ 
          title: 'チャット', 
          headerBackTitle: '一覧' 
        }} 
      />
    </Stack>
  );
}