import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { useAuth } from '../../auth/useAuth';
import { useSocial } from '../hooks/useSocial';

type Props = {
  user: any;
};

// ★修正: export default function に変更
export default function UserCard({ user }: Props) {
  const { userProfile } = useAuth();
  const { followUser, unfollowUser, loading } = useSocial();

  // フォロー状態の初期値チェック
  const isInitiallyFollowing = (userProfile as any)?.following?.includes(user.uid) || false;
  
  // ★追加: ボタンを押した瞬間に色を変えるためのローカルステート
  const [isFollowing, setIsFollowing] = useState(isInitiallyFollowing);

  const isMe = userProfile?.uid === user.uid;

  // プロフィールが再読込されたらステートも同期
  useEffect(() => {
    setIsFollowing(isInitiallyFollowing);
  }, [isInitiallyFollowing]);

  const handlePress = async () => {
    // 1. まず見た目だけすぐに変える (UI体験の向上)
    const nextState = !isFollowing;
    setIsFollowing(nextState);

    // 2. 裏側でAPIを叩く
    if (nextState) {
      await followUser(user.uid);
    } else {
      await unfollowUser(user.uid);
    }
  };

  return (
    <View style={styles.card}>
      <Image 
        source={{ uri: user.profileImageUrl || user.photoURL || 'https://via.placeholder.com/50' }} 
        style={styles.avatar} 
      />
      
      <View style={styles.info}>
        {/* ログで確認した username フィールドを優先表示 */}
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
          onPress={handlePress}
          disabled={loading}
        >
          <Text style={[styles.buttonText, isFollowing ? styles.followingText : styles.followText]}>
            {loading ? '...' : (isFollowing ? 'フォロー中' : 'フォロー')}
          </Text>
        </TouchableOpacity>
      )}
    </View>
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