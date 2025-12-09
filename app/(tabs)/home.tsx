import React, { useEffect } from 'react';
import { View, StyleSheet, SafeAreaView, TouchableOpacity, Text, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

// コンポーネント・フックのインポート
import { Timeline } from '../../src/features/timeline/components/Timeline';
import { useAuth } from '../../src/features/auth/useAuth';
// ★ Push通知とHealthKitのフック
// (ファイルが存在しない場合は、以前作成した hooks フォルダ内のファイルを復元してください)
import { usePushNotifications } from '../../src/hooks/usePushNotifications';
import { useHealthKit } from '../../src/hooks/useHealthKit';

export default function HomeScreen() {
  const router = useRouter();
  const { userProfile } = useAuth();
  
  // 1. プッシュ通知のセットアップ (ログイン中のみ)
  const { scheduleDailyReminder } = usePushNotifications(userProfile?.uid);

  // 2. ヘルスケア連携 (歩数取得)
  const { dailySteps, isAvailable } = useHealthKit();

  // ユーザー情報が読み込まれたら、リマインダー(毎日20時)をセットする
  useEffect(() => {
    if (userProfile?.uid) {
      scheduleDailyReminder();
    }
  }, [userProfile]);

  return (
    <SafeAreaView style={styles.container}>
      {/* ヘッダー */}
      <View style={styles.header}>
        <Text style={styles.title}>WOMA</Text>
        
        <View style={styles.headerRight}>
          {/* グループボタン */}
          <TouchableOpacity onPress={() => router.push('/groups')} style={styles.iconButton}>
            <Ionicons name="people" size={24} color="#333" />
          </TouchableOpacity>

          {/* ★DM一覧ボタン (追加機能) */}
          <TouchableOpacity onPress={() => router.push('/dm')} style={styles.iconButton}>
            <Ionicons name="chatbubbles-outline" size={24} color="#333" />
          </TouchableOpacity>
          
          {/* 検索ボタン */}
          <TouchableOpacity onPress={() => router.push('/search')} style={styles.iconButton}>
            <Ionicons name="search" size={24} color="#333" />
          </TouchableOpacity>
        </View>
      </View>

      {/* ★歩数サジェストカード (HealthKit有効 & 100歩以上で表示) */}
      {isAvailable && dailySteps > 100 && (
        <View style={styles.stepCard}>
          <View style={styles.stepInfo}>
            <View style={styles.iconBadge}>
              <Ionicons name="footsteps" size={20} color="#3B82F6" />
            </View>
            <View>
              <Text style={styles.stepLabel}>今日の歩数</Text>
              <Text style={styles.stepCount}>{dailySteps.toLocaleString()} 歩</Text>
            </View>
          </View>
          
          <TouchableOpacity 
            style={styles.recordButton}
            onPress={() => {
              Alert.alert("えらい！", "その調子で記録して、みんなに自慢しましょう！");
              router.push('/(tabs)/record');
            }}
          >
            <Text style={styles.recordButtonText}>記録して肯定される</Text>
            <Ionicons name="chevron-forward" size={16} color="#3B82F6" />
          </TouchableOpacity>
        </View>
      )}

      {/* タイムライン表示 */}
      <Timeline />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f0f2f5' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  title: {
    fontSize: 24,
    fontWeight: '900',
    color: '#3B82F6',
    letterSpacing: 1,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12, 
  },
  iconButton: {
    padding: 8,
    backgroundColor: '#F3F4F6', // 薄いグレーの背景を追加してタップしやすく
    borderRadius: 20,
  },
  
  // 歩数カードのスタイル
  stepCard: {
    backgroundColor: 'white',
    margin: 16,
    marginBottom: 8,
    padding: 16,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    // 影をつけて浮かせる
    shadowColor: '#3B82F6',
    shadowOpacity: 0.1,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
    borderWidth: 1,
    borderColor: '#EFF6FF',
  },
  stepInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconBadge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepLabel: {
    fontSize: 11,
    color: '#6B7280',
    fontWeight: '600',
  },
  stepCount: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  recordButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    gap: 4,
  },
  recordButtonText: {
    color: '#3B82F6',
    fontWeight: 'bold',
    fontSize: 12,
  },
});