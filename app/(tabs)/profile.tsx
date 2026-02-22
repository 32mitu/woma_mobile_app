import React, { useState, useCallback } from 'react';
import { View, ScrollView, StyleSheet, RefreshControl, Alert, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

// Hooks
import { useAuth } from '../../src/features/auth/useAuth';
import { useTranslation } from 'react-i18next';
// PFC機能一時停止: エラー回避のためコメントアウト
// import { useDailyNutrition } from '../../src/features/record/components/Meal/useDailyNutrition';

// Components
import { ProfileHeader } from '../../src/features/profile/components/ProfileHeader';
import { HealthChart } from '../../src/features/profile/components/HealthChart';
import { CalendarView } from '../../src/features/calendar/components/CalendarView';
import { ActivityLog } from '../../src/features/calendar/components/ActivityLog';
// PFC機能一時停止: エラー回避のためコメントアウト
// import { NutritionChart } from '../../src/features/record/components/Meal/NutritionChart';

export default function ProfileScreen() {
  const router = useRouter();
  const { userProfile, signOut, deleteAccount } = useAuth();
  const { t } = useTranslation();

  // PFCデータの取得フック (一時停止)
  // const { nutrition, loading: nutritionLoading, refetch: refetchNutrition } = useDailyNutrition();

  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(new Date());
  const [isDeleting, setIsDeleting] = useState(false);

  // 引っ張って更新
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    setLastUpdate(new Date());

    // PFCデータも再取得 (一時停止)
    // await refetchNutrition();

    setTimeout(() => setRefreshing(false), 1000);
  }, []); // 依存配列から refetchNutrition を削除

  // ログアウト処理
  const handleLogout = async () => {
    Alert.alert(t('auth.logoutConfirmTitle'), t('auth.logoutConfirmMessage'), [
      { text: t('common.cancel'), style: "cancel" },
      {
        text: t('auth.logoutConfirm'),
        style: "destructive",
        onPress: async () => {
          await signOut();
          router.replace('/');
        }
      }
    ]);
  };

  // アカウント削除処理
  const handleDeleteAccount = () => {
    Alert.alert(
      t('auth.deleteAccount'),
      t('auth.deleteAccountMessage'),
      [
        { text: t('common.cancel'), style: "cancel" },
        {
          text: t('auth.deleteAccountConfirm'),
          style: "destructive",
          onPress: () => performDelete()
        }
      ]
    );
  };

  const performDelete = async () => {
    setIsDeleting(true);
    try {
      await deleteAccount();
      Alert.alert(t('auth.deleteAccountSuccess'), t('auth.deleteAccountSuccessMessage'), [
        { text: t('common.ok'), onPress: () => router.replace('/') }
      ]);
    } catch (error: any) {
      console.error(error);
      Alert.alert(t('common.error'), error.message || t('auth.deleteAccountFailed'));
      setIsDeleting(false);
    }
  };

  if (!userProfile) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#3B82F6" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
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

        {/* 2. 今日の栄養バランス (PFC) - 一時停止中 */}
        {/* <View style={styles.sectionContainer}>
           <NutritionChart data={nutrition} />
        </View> */}

        {/* 3. 健康・カロリー分析 (体重チャートなど) */}
        <View style={styles.sectionContainer}>
          {userProfile.weight ? (
            <HealthChart
              userId={userProfile.uid}
              userWeight={userProfile.weight}
              refreshTrigger={lastUpdate}
            />
          ) : (
            <View style={styles.noticeContainer}>
              <Text style={styles.noticeText}>
                {t('profile.inputWeightHint')}
              </Text>
            </View>
          )}
        </View>

        {/* 4. カレンダー */}
        <View style={styles.sectionContainer}>
          <CalendarView />
        </View>

        {/* 5. 最近の活動ログ */}
        <View style={styles.sectionContainer}>
          <ActivityLog userId={userProfile.uid} />
        </View>

        {/* 6. アカウント削除エリア (Danger Zone) */}
        <View style={styles.dangerZone}>
          <Text style={styles.dangerTitle}>{t('profile.accountManagement')}</Text>
          <TouchableOpacity
            style={[styles.deleteButton, isDeleting && styles.disabledButton]}
            onPress={handleDeleteAccount}
            disabled={isDeleting}
          >
            {isDeleting ? (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <ActivityIndicator color="#EF4444" size="small" />
                <Text style={styles.deleteText}>{t('common.processing')}</Text>
              </View>
            ) : (
              <>
                <Ionicons name="trash-outline" size={20} color="#EF4444" />
                <Text style={styles.deleteText}>{t('profile.deleteAccount')}</Text>
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
    paddingBottom: 40,
  },
  sectionContainer: {
    marginBottom: 16,
  },
  noticeContainer: {
    padding: 20,
    backgroundColor: 'white',
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  noticeText: {
    color: '#666',
    textAlign: 'center',
    fontSize: 13,
    lineHeight: 20,
  },
  // Danger Zone Styles
  dangerZone: {
    marginTop: 24,
    paddingHorizontal: 4,
  },
  dangerTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 8,
    marginLeft: 4,
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FEF2F2', // 薄い赤背景
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FCA5A5', // 赤いボーダー
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