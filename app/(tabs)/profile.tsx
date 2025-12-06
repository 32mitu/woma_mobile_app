import React, { useState, useEffect } from 'react';
import { View, ScrollView, StyleSheet, RefreshControl, SafeAreaView, Alert, Text } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../../src/features/auth/useAuth';
// コンポーネントのインポート
import { ProfileHeader } from '../../src/features/profile/components/ProfileHeader';
import { HealthChart } from '../../src/features/profile/components/HealthChart';
import { CalendarView } from '../../src/features/calendar/components/CalendarView'; // ★追加: カレンダー
import { ActivityLog } from '../../src/features/calendar/components/ActivityLog';

export default function ProfileScreen() {
  const router = useRouter();
  const { userProfile, signOut } = useAuth();
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(new Date()); // リフレッシュ用トリガー

  // 引っ張って更新
  const onRefresh = async () => {
    setRefreshing(true);
    setLastUpdate(new Date()); // 各コンポーネントに再取得を促す
    setTimeout(() => setRefreshing(false), 1000);
  };

  const handleLogout = async () => {
    Alert.alert("ログアウト", "本当にログアウトしますか？", [
      { text: "キャンセル", style: "cancel" },
      { 
        text: "ログアウト", 
        style: "destructive",
        onPress: async () => {
          await signOut();
          router.replace('/'); 
        }
      }
    ]);
  };

  if (!userProfile) {
    return <View style={styles.container} />; // ロード中
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#3B82F6" />
        }
      >
        {/* 1. ヘッダー (アイコン・フォロー数など) */}
        <ProfileHeader 
          userProfile={userProfile} 
          onLogout={handleLogout} 
        />

        {/* 2. 健康・カロリー分析 (2軸グラフ) */}
        {userProfile.weight ? (
          <HealthChart 
            userId={userProfile.uid} 
            userWeight={userProfile.weight} 
            refreshTrigger={lastUpdate}
          />
        ) : (
          <View style={styles.noticeContainer}>
            <Text style={styles.noticeText}>
              プロフィール設定で「体重」を入力すると、{"\n"}詳細な分析グラフが表示されます。
            </Text>
          </View>
        )}

        {/* 3. カレンダー (★ここに追加) */}
        <CalendarView />

        {/* 4. 最近の活動ログ */}
        <ActivityLog userId={userProfile.uid} />
        
        {/* 下部の余白 */}
        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  scrollContent: {
    padding: 16,
  },
  noticeContainer: {
    padding: 20,
    backgroundColor: 'white',
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 16,
  },
  noticeText: {
    color: '#666',
    textAlign: 'center',
    fontSize: 13,
    lineHeight: 20,
  }
});