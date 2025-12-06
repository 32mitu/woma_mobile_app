import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons'; // アイコンセット

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#3B82F6', // 選択されたときの色 (青)
        tabBarInactiveTintColor: 'gray',  // 選択されていないときの色
        headerShown: false,               // 上のヘッダーは各画面で管理するので隠す
      }}
    >
      {/* ホームタブ */}
      <Tabs.Screen
        name="home"
        options={{
          title: 'ホーム',
          tabBarIcon: ({ color }) => <Ionicons name="home" size={24} color={color} />,
        }}
      />
      {/* 記録タブ */}
      <Tabs.Screen
        name="record"
        options={{
          title: '記録',
          tabBarIcon: ({ color }) => <Ionicons name="add-circle" size={32} color={color} />,
        }}
      />
      {/* プロフィールタブ */}
      <Tabs.Screen
        name="profile"
        options={{
          title: 'マイページ',
          tabBarIcon: ({ color }) => <Ionicons name="person" size={24} color={color} />,
        }}
      />
    </Tabs>
  );
}