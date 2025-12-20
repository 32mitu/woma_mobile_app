import React, { useState } from 'react';
import { View, ScrollView, StyleSheet, RefreshControl, SafeAreaView, Alert, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
// deleteAccount を追加で取得
import { useAuth } from '../../src/features/auth/useAuth';
import { Ionicons } from '@expo/vector-icons';

// コンポーネントのインポート
import { ProfileHeader } from '../../src/features/profile/components/ProfileHeader';
import { HealthChart } from '../../src/features/profile/components/HealthChart';
import { CalendarView } from '../../src/features/calendar/components/CalendarView';
import { ActivityLog } from '../../src/features/calendar/components/ActivityLog';

export default function ProfileScreen() {
  const router = useRouter();
  // ★ deleteAccount をここで取得
  const { userProfile, signOut, deleteAccount } = useAuth();
  
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(new Date()); 
  const [isDeleting, setIsDeleting] = useState(false); // 削除処理中のフラグ

  // 引っ張って更新
  const onRefresh = async () => {
    setRefreshing(true);
    setLastUpdate(new Date()); 
    setTimeout(() => setRefreshing(false), 1000);
  };

  // ログアウト処理
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

  // ★追加: アカウント削除処理
  const handleDeleteAccount = () => {
    Alert.alert(
      "アカウント削除 (退会)",
      "この操作は取り消せません。\n全てのデータ（記録、投稿、設定）が永久に削除されます。\n本当に実行しますか？",
      [
        { text: "キャンセル", style: "cancel" },
        { 
          text: "削除する", 
          style: "destructive",
          onPress: async () => {
            performDelete();
          }
        }
      ]
    );
  };

  const performDelete = async () => {
    setIsDeleting(true);
    try {
      await deleteAccount();
      Alert.alert("削除完了", "アカウントを削除しました。", [
        { text: "OK", onPress: () => router.replace('/') }
      ]);
    } catch (error: any) {
      Alert.alert("エラー", error.message || "削除に失敗しました。");
    } finally {
      setIsDeleting(false);
    }
  };

  if (!userProfile) {
    return <View style={styles.container} />; 
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#3B82F6" />
        }
      >
        {/* 1. ヘッダー (ログアウトボタン含む) */}
        <ProfileHeader 
          userProfile={userProfile} 
          onLogout={handleLogout} 
        />

        {/* 2. 健康・カロリー分析 */}
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

        {/* 3. カレンダー */}
        <CalendarView />

        {/* 4. 最近の活動ログ */}
        <ActivityLog userId={userProfile.uid} />
        
        {/* 5. ★追加: アカウント削除エリア (Danger Zone) */}
        <View style={styles.dangerZone}>
          <Text style={styles.dangerTitle}>アカウント管理</Text>
          <TouchableOpacity 
            style={[styles.deleteButton, isDeleting && styles.disabledButton]} 
            onPress={handleDeleteAccount}
            disabled={isDeleting}
          >
            {isDeleting ? (
              <ActivityIndicator color="#EF4444" />
            ) : (
              <>
                <Ionicons name="trash-outline" size={20} color="#EF4444" />
                <Text style={styles.deleteText}>アカウントを削除する (退会)</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
        
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
  },
  // ★追加スタイリング
  dangerZone: {
    marginTop: 24,
    padding: 16,
    // borderTopWidth: 1,
    // borderTopColor: '#E5E7EB',
  },
  dangerTitle: {
    fontSize: 14,
    color: '#9CA3AF',
    marginBottom: 8,
    marginLeft: 4,
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FEF2F2', // 薄い赤
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FCA5A5',
    gap: 8,
  },
  disabledButton: {
    opacity: 0.6,
  },
  deleteText: {
    color: '#EF4444', // 赤文字
    fontWeight: 'bold',
    fontSize: 15,
  }
});