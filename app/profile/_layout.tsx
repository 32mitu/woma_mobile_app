// app/profile/_layout.tsx
import { Stack } from 'expo-router';

export default function ProfileLayout() {
    return (
        <Stack screenOptions={{ headerShown: false }}>
            {/* プロフィールタブ内で遷移する画面（編集画面や設定画面など）があれば、
        ここに Stack.Screen として追加していきます。
      */}
            <Stack.Screen name="index" />
            <Stack.Screen name="edit" />
            <Stack.Screen name="setting" />
        </Stack>
    );
}