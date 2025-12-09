import React from 'react'; // useState, useEffectは不要になるため削除可能ですが、残してもOK
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { useAuth } from '../../auth/useAuth';
import { useSocial, useIsFollowing } from '../hooks/useSocial'; // ★追加
import { useRouter } from 'expo-router';

type Props = {
  user: any;
};

export default function UserCard({ user }: Props) {
  const router = useRouter();
  const { userProfile } = useAuth();
  const { followUser, unfollowUser, loading } = useSocial();
  
  // ★修正: データベースのリアルタイムな状態を取得
  const isFollowing = useIsFollowing(user.uid);
  
  const isMe = userProfile?.uid === user.uid;

  const handleFollowPress = async () => {
    // 現在の状態に応じて切り替え
    if (isFollowing) {
      await unfollowUser(user.uid);
    } else {
      await followUser(user.uid);
    }
  };

  const handleCardPress = () => {
    router.push(`/public/${user.uid}`);
  };

  return (
    <TouchableOpacity style={styles.card} onPress={handleCardPress}>
      <Image 
        source={{ uri: user.profileImageUrl || user.photoURL || 'https://via.placeholder.com/50' }} 
        style={styles.avatar} 
      />
      
      <View style={styles.info}>
        <Text style={styles.name}>
          {user.username || user.displayName || user.name || '名無しさん'}
        </Text>
        <Text style={styles.bio} numberOfLines={1}>
          {user.bio || '自己紹介はまだありません'}
        </Text>
      </View>

      {!isMe && (
        <TouchableOpacity
          style={[styles.button, isFollowing ? styles.followingButton : styles.followButton]}
          onPress={handleFollowPress}
          disabled={loading}
        >
          <Text style={[styles.buttonText, isFollowing ? styles.followingText : styles.followText]}>
            {/* loading中は ... を表示、それ以外はDBの状態に基づいて表示 */}
            {loading ? '...' : (isFollowing ? 'フォロー中' : 'フォロー')}
          </Text>
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: 'white',
    borderRadius: 12,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#eee',
  },
  info: {
    flex: 1,
    marginLeft: 12,
  },
  name: {
    fontWeight: 'bold',
    fontSize: 16,
    color: '#333',
  },
  bio: {
    color: '#666',
    fontSize: 12,
    marginTop: 2,
  },
  button: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    minWidth: 80,
    alignItems: 'center',
  },
  followButton: {
    backgroundColor: '#3B82F6',
  },
  followingButton: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#ccc',
  },
  buttonText: {
    fontSize: 12,
    fontWeight: '600',
  },
  followText: {
    color: 'white',
  },
  followingText: {
    color: '#666',
  },
});