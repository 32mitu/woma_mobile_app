import React from 'react';
import { StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../../auth/useAuth';
import { useSocial, useIsFollowing } from '../hooks/useSocial';
import { useTranslation } from 'react-i18next';

// 共通コンポーネント
import { Card } from '../../../ui/Card';
import { ListItem } from '../../../ui/ListItem';
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
      <ListItem
        title={user.username || user.displayName || t('social.noName')}
        subtitle={user.bio}
        leftElement={
          <Avatar
            uri={user.profileImageUrl || user.photoURL}
            size="md"
          />
        }
        rightElement={
          !isMe ? (
            <Button
              title={loading ? '...' : (isFollowing ? t('social.following') : t('social.follow'))}
              variant={isFollowing ? 'outline' : 'primary'}
              onPress={handleFollowPress}
              disabled={loading}
              // ボタンサイズを小さく調整
              style={styles.followButton}
              textStyle={styles.followButtonText}
            />
          ) : undefined
        }
        onPress={() => router.push(`/public/${user.uid}`)}
      />
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    marginBottom: 8,
    overflow: 'hidden',
  },
  followButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    minHeight: 32,
    borderRadius: 16,
    height: 'auto', // Buttonのデフォルト高さを解除
  },
  followButtonText: {
    fontSize: 12,
  },
});