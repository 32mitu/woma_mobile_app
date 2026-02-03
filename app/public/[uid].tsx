import React, { useState, useEffect } from 'react';
import { View, ScrollView, StyleSheet, ActivityIndicator, Text, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { doc, getDoc } from 'firebase/firestore';
import { db, auth } from '../../firebaseConfig';
import { ActivityLog } from '../../src/features/profile/components/ActivityLog';
import { Ionicons } from '@expo/vector-icons';
import { useSocial, useFollowStatus } from '../../src/features/social/hooks/useSocial';
import { useSafety } from '../../src/hooks/useSafety';

// 共通コンポーネント
import { Avatar } from '../../src/ui/Avatar';
import { Button } from '../../src/ui/Button';
import { IconButton } from '../../src/ui/IconButton';

export default function PublicProfileScreen() {
  const { uid } = useLocalSearchParams();
  const router = useRouter();

  const [profileData, setProfileData] = useState<any>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);

  const targetUserId = Array.isArray(uid) ? uid[0] : uid;
  const currentUserId = auth.currentUser?.uid;

  const { followUser, unfollowUser, loading: actionLoading } = useSocial();
  const { isFollowing, isMutual } = useFollowStatus(targetUserId);

  const { reportContent, blockUser } = useSafety();

  useEffect(() => {
    if (!targetUserId) return;
    fetchProfile();
  }, [targetUserId]);

  const fetchProfile = async () => {
    try {
      const docRef = doc(db, 'users', targetUserId);
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        setProfileData(snap.data());
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingProfile(false);
    }
  };

  const handleFollowToggle = async () => {
    if (!currentUserId) return Alert.alert("エラー", "ログインが必要です");
    if (isFollowing) {
      await unfollowUser(targetUserId);
    } else {
      await followUser(targetUserId);
    }
  };

  const handleMessagePress = () => {
    if (!targetUserId) {
      console.error("❌ [Error] 相手のIDが不明です。");
      return;
    }
    router.push(`/dm/${targetUserId}`);
  };

  const handleOptions = () => {
    if (!currentUserId || !targetUserId) return;

    Alert.alert(
      'メニュー',
      `${profileData?.username || 'このユーザー'}に対する操作`,
      [
        {
          text: '通報する',
          style: 'destructive',
          onPress: () => reportContent(targetUserId, 'user', '不適切なユーザープロフィール')
        },
        {
          text: 'ブロックする',
          style: 'destructive',
          onPress: async () => {
            await blockUser(targetUserId);
            router.back();
          }
        },
        { text: 'キャンセル', style: 'cancel' }
      ]
    );
  };

  if (loadingProfile) return (
    <View style={styles.center}>
      <ActivityIndicator size="large" color="#3B82F6" />
    </View>
  );

  if (!profileData) return (
    <View style={styles.center}>
      <Text>ユーザーが見つかりません</Text>
    </View>
  );

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        {/* 戻るボタン */}
        <IconButton
          name="arrow-back"
          size={24}
          color="#333"
          onPress={() => router.back()}
          style={styles.backButton}
        />

        {/* メニューボタン */}
        {currentUserId !== targetUserId && (
          <IconButton
            name="ellipsis-horizontal"
            size={24}
            color="#333"
            onPress={handleOptions}
            style={styles.menuButton}
          />
        )}

        <Avatar
          uri={profileData.profileImageUrl}
          size="xl" // 大きめ
          style={styles.avatar}
        />

        <Text style={styles.username}>
          {profileData.username || profileData.displayName || '名無しさん'}
        </Text>
        <Text style={styles.bio}>
          {profileData.bio || '自己紹介がありません'}
        </Text>

        {currentUserId !== targetUserId && (
          <View style={styles.actionButtons}>
            <Button
              title={actionLoading ? '...' : (isFollowing ? 'フォロー中' : 'フォローする')}
              variant={isFollowing ? 'outline' : 'primary'}
              onPress={handleFollowToggle}
              disabled={actionLoading}
              style={{ minWidth: 120 }}
            />

            {/* 相互フォローの場合のみDMボタンを表示 */}
            {isMutual && (
              <Button
                title="メッセージ"
                variant="secondary"
                icon={<Ionicons name="chatbubble-ellipses" size={18} color="#3B82F6" />}
                onPress={handleMessagePress}
                style={{ marginLeft: 12 }}
              />
            )}
          </View>
        )}
      </View>

      <View style={styles.content}>
        <ActivityLog userId={targetUserId} />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    backgroundColor: 'white',
    padding: 24,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    position: 'relative'
  },

  // ボタン位置調整 (IconButton自体にpaddingがあるためtop/left/rightを微調整)
  backButton: { position: 'absolute', top: 12, left: 12, zIndex: 10 },
  menuButton: { position: 'absolute', top: 12, right: 12, zIndex: 10 },

  avatar: { marginBottom: 16, marginTop: 12 },
  username: { fontSize: 22, fontWeight: 'bold', color: '#333', marginBottom: 8 },
  bio: { fontSize: 14, color: '#666', marginBottom: 20, textAlign: 'center', lineHeight: 20 },

  actionButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8
  },
  content: { padding: 16 },
});