import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { useSocialCounts } from '../../social/hooks/useSocial';
import { Avatar } from '../../../ui/Avatar';
import { Button } from '../../../ui/Button';

type Props = {
  userProfile: any;
  onLogout: () => void;
};

export const ProfileHeader = ({ userProfile, onLogout }: Props) => {
  const router = useRouter();
  const { following, followers } = useSocialCounts(userProfile?.uid);

  if (!userProfile) return null;

  return (
    <View style={styles.container}>
      <View style={styles.topSection}>
        {/* 共通Avatarコンポーネントを使用 */}
        <Avatar
          uri={userProfile.profileImageUrl || userProfile.photoURL}
          size="xl"
          style={styles.avatar}
        />

        <View style={styles.infoContainer}>
          <Text style={styles.name}>
            {userProfile.username || userProfile.displayName || '名無しさん'}
          </Text>

          {/* 編集ボタンを共通Buttonに変更 */}
          <Button
            title="プロフィール編集"
            variant="outline"
            onPress={() => router.push('/profile/edit')}
            style={styles.editButton}
            textStyle={styles.editButtonText}
          />
        </View>
      </View>

      {userProfile.bio ? (
        <Text style={styles.bio}>{userProfile.bio}</Text>
      ) : null}

      <View style={styles.statsContainer}>
        <TouchableOpacity
          style={styles.statItem}
          onPress={() => router.push({ pathname: '/friends', params: { type: 'following' } })}
        >
          <Text style={styles.statNumber}>{following}</Text>
          <Text style={styles.statLabel}>フォロー中</Text>
        </TouchableOpacity>

        <View style={styles.divider} />

        <TouchableOpacity
          style={styles.statItem}
          onPress={() => router.push({ pathname: '/friends', params: { type: 'followers' } })}
        >
          <Text style={styles.statNumber}>{followers}</Text>
          <Text style={styles.statLabel}>フォロワー</Text>
        </TouchableOpacity>
      </View>

      {/* ログアウトボタン */}
      <Button
        title="ログアウト"
        variant="ghost"
        onPress={onLogout}
        textStyle={{ color: '#EF4444', fontSize: 12 }}
        style={{ alignSelf: 'flex-start', marginTop: 8, paddingHorizontal: 0 }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  topSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16
  },
  avatar: {
    marginRight: 16
  },
  infoContainer: {
    flex: 1,
    justifyContent: 'center'
  },
  name: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8
  },
  editButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    alignSelf: 'flex-start',
    height: 'auto', // Buttonのデフォルト高さを上書きしてコンパクトに
    borderRadius: 20,
  },
  editButtonText: {
    fontSize: 12,
  },
  bio: {
    color: '#4B5563',
    marginBottom: 20,
    lineHeight: 20,
  },
  statsContainer: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    paddingTop: 16
  },
  statItem: {
    flex: 1,
    alignItems: 'center'
  },
  divider: {
    width: 1,
    backgroundColor: '#F3F4F6'
  },
  statNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333'
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4
  },
});