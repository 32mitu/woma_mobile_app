import React, { useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity, Text, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { Timeline } from '../../src/features/timeline/components/Timeline';
import { useAuth } from '../../src/features/auth/useAuth';
import { usePushNotifications } from '../../src/hooks/usePushNotifications';
import { useHealthKit } from '../../src/hooks/useHealthKit';
import { useUnreadCount } from '../../src/features/dm/hooks/useUnreadCount';
import { useTranslation } from 'react-i18next';

export default function HomeScreen() {
  const router = useRouter();
  const { userProfile } = useAuth();

  const { scheduleDailyReminder } = usePushNotifications(userProfile?.uid);
  // requestAccess をここで受け取る
  const { dailySteps, isAvailable, requestAccess } = useHealthKit();
  const unreadCount = useUnreadCount();
  const { t } = useTranslation();

  useEffect(() => {
    if (userProfile?.uid) {
      scheduleDailyReminder();
    }
  }, [userProfile]);

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <Text style={styles.title}>WOMA</Text>

        <View style={styles.headerRight}>
          <TouchableOpacity onPress={() => router.push('/groups')} style={styles.iconButton}>
            <Ionicons name="people" size={24} color="#333" />
          </TouchableOpacity>

          <TouchableOpacity onPress={() => router.push('/dm')} style={styles.iconButton}>
            <Ionicons name="chatbubbles-outline" size={24} color="#333" />
            {unreadCount > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>
                  {unreadCount > 99 ? '99+' : unreadCount}
                </Text>
              </View>
            )}
          </TouchableOpacity>

          <TouchableOpacity onPress={() => router.push('/search')} style={styles.iconButton}>
            <Ionicons name="search" size={24} color="#333" />
          </TouchableOpacity>
        </View>
      </View>

      {/* ▼ ヘルスケアカードの表示ロジック修正 ▼ */}
      {isAvailable ? (
        // パターンA: 連携済み（通常表示）
        <View style={styles.stepCard}>
          <View style={styles.stepInfo}>
            <View style={styles.iconBadge}>
              <Ionicons name="footsteps" size={20} color="#3B82F6" />
            </View>
            <View>
              <Text style={styles.stepLabel}>{t('home.todaySteps')}</Text>
              <Text style={styles.stepCount}>{dailySteps.toLocaleString()}{t('home.stepsUnit')}</Text>
            </View>
          </View>

          <TouchableOpacity
            style={styles.recordButton}
            onPress={() => {
              Alert.alert(t('home.alertTitle'), t('home.alertMessage'));
              router.push('/(tabs)/record');
            }}
          >
            <Text style={styles.recordButtonText}>{t('home.record')}</Text>
            <Ionicons name="chevron-forward" size={16} color="#3B82F6" />
          </TouchableOpacity>
        </View>
      ) : (
        // パターンB: 未連携（連携ボタンを表示）
        <View style={styles.stepCard}>
          <View style={styles.stepInfo}>
            <View style={[styles.iconBadge, { backgroundColor: '#F3F4F6' }]}>
              <Ionicons name="fitness" size={20} color="#6B7280" />
            </View>
            <View>
              <Text style={styles.stepLabel}>{t('home.healthNotLinked')}</Text>
              <Text style={[styles.stepCount, { fontSize: 14 }]}>{t('home.healthLinkDesc')}</Text>
            </View>
          </View>

          <TouchableOpacity
            style={[styles.recordButton, { backgroundColor: '#3B82F6' }]}
            onPress={requestAccess}
          >
            <Text style={[styles.recordButtonText, { color: 'white' }]}>{t('home.linkHealth')}</Text>
            <Ionicons name="arrow-forward" size={16} color="white" />
          </TouchableOpacity>
        </View>
      )}
      {/* ▲ 修正ここまで ▲ */}

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
    backgroundColor: '#F3F4F6',
    borderRadius: 20,
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: '#EF4444',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'white',
    zIndex: 10,
  },
  badgeText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
  stepCard: {
    backgroundColor: 'white',
    margin: 16,
    marginBottom: 8,
    padding: 16,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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