import { Stack, usePathname } from 'expo-router';
import { useEffect } from 'react';

export default function DMLayout() {
  const pathname = usePathname();

  useEffect(() => {
    // これがログに出れば、フォルダ構成は正解です
    console.log(`📂 [DMLayout] DMフォルダに入りました。現在のパス: ${pathname}`);
  }, [pathname]);

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
          title: 'チャット', // 詳細は画面内でsetOptionsする
          headerBackTitle: '一覧' 
        }} 
      />
    </Stack>
  );
}