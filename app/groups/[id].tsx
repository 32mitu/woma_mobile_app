import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Alert, ScrollView } from 'react-native';
import { useLocalSearchParams, useRouter, useNavigation } from 'expo-router'; // useNavigationを追加
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { collection, query, where, getDocs, documentId } from 'firebase/firestore';
import { db, auth } from '../../firebaseConfig';

import { useGroupDetail } from '../../src/features/groups/hooks/useGroupDetail';
import { useAuth } from '../../src/features/auth/useAuth';
// ★修正: Timeline ではなく GroupTimeline をインポート
import { GroupTimeline } from '../../src/features/groups/components/GroupTimeline';

// 共通コンポーネント & 型定義
import { Button } from '../../src/ui/Button';
import { IconButton } from '../../src/ui/IconButton';
import { Card } from '../../src/ui/Card';
import { ChallengeProgress } from '../../src/features/groups/components/ChallengeProgress';
import { User } from '../../src/types';
import { useTranslation } from 'react-i18next';

export default function GroupDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const navigation = useNavigation(); // ナビゲーション制御用
  const { userProfile } = useAuth();
  const groupId = Array.isArray(id) ? id[0] : id;

  const { group, isMember, loading, toggleJoin, deleteGroup } = useGroupDetail(groupId, userProfile?.uid) as any;
  const { t } = useTranslation();

  // オーナー判定
  const currentUserId = userProfile?.uid || auth.currentUser?.uid;
  const isOwner = group?.ownerId && currentUserId && group.ownerId === currentUserId;

  const hasActiveChallenge = group?.challenge && group.challenge.isActive;

  // チャレンジ集計用のState
  const [totalProgress, setTotalProgress] = useState(0);
  const [calculating, setCalculating] = useState(false);

  // メンバーのStatsを集計する処理
  useEffect(() => {
    if (!group?.memberIds || !hasActiveChallenge || group.memberIds.length === 0) return;

    const calculateStats = async () => {
      setCalculating(true);
      try {
        const chunks = [];
        const ids = group.memberIds;
        const chunkSize = 10;

        for (let i = 0; i < ids.length; i += chunkSize) {
          chunks.push(ids.slice(i, i + chunkSize));
        }

        let sum = 0;
        const type = group.challenge.type;
        const startDate = group.challenge.startDate;
        const endDate = group.challenge.endDate;

        await Promise.all(chunks.map(async (chunkIds) => {
          const q = query(
            collection(db, 'exerciseRecords'),
            where('userId', 'in', chunkIds),
            where('createdAt', '>=', startDate),
            where('createdAt', '<=', endDate)
          );

          const snapshot = await getDocs(q);

          snapshot.forEach(doc => {
            const data = doc.data();
            if (type === 'steps') sum += (data.totalSteps || 0);
            else if (type === 'calories') sum += (data.totalCalories || 0);
            else if (type === 'distance') sum += (data.totalDistance || 0);
          });
        }));

        setTotalProgress(sum);
      } catch (error: any) {
        console.error("集計エラー:", error);
        if (error.code === 'failed-precondition') {
          console.log("⚠️ インデックスが必要です。コンソールのリンクから作成してください。");
        }
      } finally {
        setCalculating(false);
      }
    };

    calculateStats();
  }, [group, hasActiveChallenge]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#3B82F6" />
      </View>
    );
  }

  if (!group) {
    return (
      <View style={styles.center}>
        <Text>{t('group.notFound')}</Text>
      </View>
    );
  }

  // ヘッダー部分
  const GroupHeader = () => (
    <View>
      <View style={styles.coverPlaceholder}>
        <Ionicons name="people" size={48} color="#9CA3AF" />
      </View>

      <View style={styles.infoSection}>
        <Text style={styles.groupName}>{group.name}</Text>
        <Text style={styles.memberCount}>{t('group.memberCount', { count: group.memberIds?.length || 0 })}</Text>
        <Text style={styles.description}>{group.description}</Text>

        {hasActiveChallenge && (
          <View style={styles.challengeSection}>
            {calculating ? (
              <ActivityIndicator size="small" color="#3B82F6" />
            ) : (
              <ChallengeProgress
                challenge={group.challenge}
                currentValue={totalProgress}
              />
            )}
          </View>
        )}

        {isOwner ? (
          <View style={{ marginBottom: 24 }}>
            <Card padding="medium" style={styles.createChallengeCard}>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                <Text style={{ fontSize: 20, marginRight: 8 }}>🎯</Text>
                <Text style={styles.createChallengeTitle}>
                  {t('group.challengeTitle')}
                </Text>
              </View>
              <Text style={styles.createChallengeDesc}>
                {hasActiveChallenge
                  ? t('group.challengeDescActive')
                  : t('group.challengeDescNew')}
              </Text>
              <Button
                title={hasActiveChallenge ? t('group.challengeEdit') : t('group.challengeCreate')}
                variant={hasActiveChallenge ? "outline" : "primary"}
                onPress={() => {
                  router.push({
                    pathname: '/groups/challenge/create',
                    params: { groupId: group.id }
                  });
                }}
              />
            </Card>
          </View>
        ) : null}

        {isOwner ? (
          <Button
            title={t('group.deleteButton')}
            variant="outline"
            onPress={() => {
              Alert.alert(
                t('group.deleteTitle'),
                t('group.deleteMessage'),
                [
                  { text: t('common.cancel'), style: "cancel" },
                  {
                    text: t('group.deleteConfirm'),
                    style: "destructive",
                    onPress: async () => {
                      if (deleteGroup) {
                        try {
                          await deleteGroup();
                          Alert.alert(t('group.deleteSuccess'), t('group.deleteSuccessMessage'), [
                            { text: t('common.ok'), onPress: () => router.replace('/(tabs)/profile') }
                          ]);
                        } catch (e) {
                          Alert.alert(t('common.error'), t('group.deleteFailed'));
                        }
                      } else {
                        Alert.alert(t('common.error'), t('group.deleteNotImplemented'));
                      }
                    }
                  }
                ]
              );
            }}
            style={{ borderColor: '#EF4444', marginTop: 12 }}
            textStyle={{ color: '#EF4444' }}
          />
        ) : (
          <Button
            title={isMember ? t('group.leave') : t('group.join')}
            variant={isMember ? "outline" : "primary"}
            onPress={() => {
              if (isMember) {
                Alert.alert(t('group.leaveConfirmTitle'), t('group.leaveConfirmMessage'), [
                  { text: t('common.cancel'), style: "cancel" },
                  { text: t('group.leaveConfirm'), style: "destructive", onPress: toggleJoin }
                ]);
              } else {
                toggleJoin();
              }
            }}
            style={isMember ? { borderColor: '#EF4444' } : undefined}
            textStyle={isMember ? { color: '#EF4444' } : undefined}
          />
        )}
      </View>

      <View style={styles.timelineSection}>
        <Text style={styles.sectionTitle}>{t('group.timeline')}</Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <IconButton
          name="arrow-back"
          size={24}
          color="#333"
          onPress={() => {
            if (navigation.canGoBack()) {
              navigation.goBack();
            } else {
              router.replace('/(tabs)/home');
            }
          }}
        />
        <Text style={styles.title} numberOfLines={1}>{group.name}</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* ★修正: メンバー限定タイムラインを表示 */}
      <GroupTimeline
        memberIds={group?.memberIds || []}
        ListHeaderComponent={<GroupHeader />}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'white' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee'
  },
  title: { fontSize: 16, fontWeight: 'bold', maxWidth: '70%' },

  coverPlaceholder: {
    height: 150,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center'
  },
  infoSection: { padding: 20 },
  groupName: { fontSize: 24, fontWeight: 'bold', color: '#333', marginBottom: 8 },
  memberCount: { fontSize: 14, color: '#6B7280', marginBottom: 16 },
  description: { fontSize: 15, color: '#4B5563', lineHeight: 22, marginBottom: 24 },

  challengeSection: {
    marginBottom: 24,
  },

  createChallengeCard: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowOpacity: 0,
  },
  createChallengeTitle: {
    fontWeight: 'bold',
    color: '#374151',
    fontSize: 16,
  },
  createChallengeDesc: {
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 16,
    marginLeft: 4,
  },

  timelineSection: {
    paddingHorizontal: 20,
    paddingBottom: 10,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    marginTop: 10,
    paddingTop: 20
  },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#333' },
});