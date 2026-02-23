import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../../auth/useAuth';
import { useSocial, useIsFollowing } from '../hooks/useSocial';
import { useTranslation } from 'react-i18next';

// 共通コンポーネント
import { Card } from '../../../ui/Card';
import { Avatar } from '../../../ui/Avatar';
import { Button } from '../../../ui/Button';

type Props = {
  user: any;
};

export const UserCard = ({ user }: Props) => {
  const router = useRouter();
  const { userProfile } = useAuth();
  const { followUser, unfollowUser, loading } = useSocial();
  const { t } = useTranslation();

  // リアルタイムなフォロー状態を取得
  const isFollowing = useIsFollowing(user.uid);
  const isMe = userProfile?.uid === user.uid;

  const handleFollowPress = async () => {
    if (isFollowing) {
      await unfollowUser(user.uid);
    } else {
      await followUser(user.uid);
    }
  };

  return (
    <Card padding="none" style={styles.card}>
      <TouchableOpacity
        style={styles.row}
        onPress={() => router.push(`/public/${user.uid}`)}
        activeOpacity={0.7}
      >
        {/* アバター */}
        <View style={styles.avatarContainer}>
          <Avatar
            uri={user.profileImageUrl || user.photoURL}
            size="md"
          />
        </View>

        {/* ユーザー情報 */}
        <View style={styles.info}>
          <Text style={styles.username} numberOfLines={1}>
            {user.username || user.displayName || t('social.noName')}
          </Text>
          {user.bio ? (
            <Text style={styles.bio} numberOfLines={1}>{user.bio}</Text>
          ) : null}
        </View>

        {/* フォローボタン：TouchableOpacityのネスト問題を避けるためonPress内で伝播を止める */}
        {!isMe && (
          <View>
            <Button
              title={loading ? '...' : (isFollowing ? t('social.following') : t('social.follow'))}
              variant={isFollowing ? 'outline' : 'primary'}
              onPress={(e) => {
                e.stopPropagation?.();
                handleFollowPress();
              }}
              disabled={loading}
              style={styles.followButton}
              textStyle={styles.followButtonText}
            />
          </View>
        )}
      </TouchableOpacity>
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    marginBottom: 8,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#FFFFFF',
  },
  avatarContainer: {
    marginRight: 12,
  },
  info: {
    flex: 1,
    justifyContent: 'center',
  },
  username: {
    fontSize: 16,
    color: '#1F2937',
    fontWeight: '500',
  },
  bio: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 2,
  },
  followButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    minHeight: 32,
    borderRadius: 16,
    height: 'auto',
  },
  followButtonText: {
    fontSize: 12,
  },
});
